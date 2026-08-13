import { spawn } from 'node:child_process'
import { lstat, mkdir, readFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { sha256Hex, validateReleaseDirectory } from './guardian-card-art'

const { values } = parseArgs({
  options: {
    manifest: { type: 'string' },
    output: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

if (values.help) {
  console.log(`Usage:
  bun run guardian-cards:package-art-release --manifest <release-directory/manifest.json> --output <guardian-card-art-release.tar.gz>`)
  process.exit(0)
}

if (!values.manifest || !values.output) {
  throw new Error('--manifest and --output are required')
}

const manifestPath = resolve(values.manifest)
const archivePath = resolve(values.output)
if (basename(archivePath) !== 'guardian-card-art-release.tar.gz') {
  throw new Error('release archive filename must be guardian-card-art-release.tar.gz')
}
if (await exists(archivePath)) {
  throw new Error(`release archive already exists: ${archivePath}`)
}

const { manifest } = await validateReleaseDirectory(manifestPath)
const entries = ['manifest.json', ...manifest.assets.map((asset) => `${asset.editionId}.webp`)]
await mkdir(dirname(archivePath), { recursive: true })

const create = await run('tar', [
  '--create',
  '--gzip',
  '--file',
  archivePath,
  '--directory',
  dirname(manifestPath),
  ...entries,
])
if (create.code !== 0) {
  throw new Error(`could not create release archive\n${create.stderr}`)
}

const list = await run('tar', ['--list', '--gzip', '--file', archivePath])
if (list.code !== 0) {
  throw new Error(`could not inspect release archive\n${list.stderr}`)
}
const archivedEntries = list.stdout.trim().split('\n').filter(Boolean)
if (JSON.stringify(archivedEntries) !== JSON.stringify(entries)) {
  throw new Error('release archive entries do not match the validated WebP release directory')
}

const archive = await readFile(archivePath)
console.log(
  `packaged: ${manifest.assetCount} WebP assets in ${archivePath} (${archive.byteLength.toLocaleString()} bytes, sha256 ${sha256Hex(archive)})`,
)

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path)
    return true
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return false
    }
    throw error
  }
}

async function run(
  command: string,
  args: readonly string[],
): Promise<{ code: number; stdout: string; stderr: string }> {
  return await new Promise((resolveResult, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', (code) => resolveResult({ code: code ?? 1, stdout, stderr }))
  })
}
