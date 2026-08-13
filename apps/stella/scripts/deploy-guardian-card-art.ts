import { spawn } from 'node:child_process'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { sha256Hex, validateReleaseDirectory } from './guardian-card-art'

const { values } = parseArgs({
  options: {
    manifest: { type: 'string' },
    bucket: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

if (values.help) {
  console.log(`Usage:
  bun run scripts/deploy-guardian-card-art.ts --manifest <manifest.json> --bucket <R2-bucket>`)
  process.exit(0)
}

if (!values.manifest || !values.bucket) {
  throw new Error('--manifest and --bucket are required')
}
if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(values.bucket)) {
  throw new Error('invalid R2 bucket name')
}

const manifestPath = resolve(values.manifest)
const releaseDirectory = dirname(manifestPath)
const { manifest } = await validateReleaseDirectory(manifestPath)
const verificationDirectory = join(tmpdir(), `stella-guardian-r2-${process.pid}`)
await mkdir(verificationDirectory, { recursive: true })

let uploaded = 0
let unchanged = 0
try {
  for (const asset of manifest.assets) {
    const localPath = join(releaseDirectory, `${asset.editionId}.webp`)
    const remotePath = `${values.bucket}/${asset.objectKey}`
    const downloadedPath = join(verificationDirectory, basename(asset.objectKey))

    const existing = await runWrangler(['r2', 'object', 'get', remotePath, '--remote', '--file', downloadedPath])
    if (existing.code === 0) {
      const existingHash = sha256Hex(await readFile(downloadedPath))
      if (existingHash !== asset.deliveryArtworkSha256) {
        throw new Error(`${asset.editionId}: R2 object already exists with a different sha256; create a new edition ID`)
      }
      unchanged += 1
      continue
    }
    if (!existing.stderr.toLowerCase().includes('specified key does not exist')) {
      throw new Error(`${asset.editionId}: could not inspect existing R2 object\n${existing.stderr}`)
    }

    const put = await runWrangler([
      'r2',
      'object',
      'put',
      remotePath,
      '--remote',
      '--file',
      localPath,
      '--content-type',
      manifest.contentType,
      '--cache-control',
      manifest.cacheControl,
      '--storage-class',
      'Standard',
    ])
    if (put.code !== 0) {
      throw new Error(`${asset.editionId}: R2 upload failed\n${put.stderr}`)
    }

    const verify = await runWrangler(['r2', 'object', 'get', remotePath, '--remote', '--file', downloadedPath])
    if (verify.code !== 0) {
      throw new Error(`${asset.editionId}: R2 verification download failed\n${verify.stderr}`)
    }
    const uploadedHash = sha256Hex(await readFile(downloadedPath))
    if (uploadedHash !== asset.deliveryArtworkSha256) {
      throw new Error(`${asset.editionId}: uploaded R2 object sha256 mismatch`)
    }
    uploaded += 1
  }
} finally {
  await rm(verificationDirectory, { recursive: true, force: true })
}

console.log(`deployed: ${uploaded} uploaded, ${unchanged} already identical, ${manifest.assetCount} total`)

async function runWrangler(args: readonly string[]): Promise<{ code: number; stderr: string }> {
  return await new Promise((resolveResult, reject) => {
    const child = spawn('bunx', ['wrangler', ...args], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      env: { ...process.env, CI: 'true', NO_COLOR: '1', WRANGLER_WRITE_LOGS: 'false' },
      stdio: ['ignore', 'inherit', 'pipe'],
    })
    let stderr = ''
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', (code) => resolveResult({ code: code ?? 1, stderr }))
  })
}
