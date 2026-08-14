import { spawn } from 'node:child_process'
import { createReadStream, createWriteStream } from 'node:fs'
import { type FileHandle, lstat, mkdir, mkdtemp, open, readFile, rename, rm } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { parseArgs } from 'node:util'
import { constants, createGzip } from 'node:zlib'
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
const packagingDirectory = await mkdtemp(join(dirname(archivePath), '.guardian-art-package-'))
const tarPath = join(packagingDirectory, 'guardian-card-art-release.tar')
const packagedArchivePath = join(packagingDirectory, 'guardian-card-art-release.tar.gz')
try {
  await writeUstarArchive(tarPath, dirname(manifestPath), entries)
  await pipeline(
    createReadStream(tarPath),
    createGzip({ level: constants.Z_BEST_COMPRESSION }),
    createWriteStream(packagedArchivePath, { flags: 'wx' }),
  )

  const list = await run('tar', ['--list', '--gzip', '--file', packagedArchivePath])
  if (list.code !== 0) {
    throw new Error(`could not inspect release archive\n${list.stderr}`)
  }
  const archivedEntries = list.stdout.trim().split('\n').filter(Boolean)
  if (JSON.stringify(archivedEntries) !== JSON.stringify(entries)) {
    throw new Error('release archive entries do not match the validated WebP release directory')
  }

  const archive = await readFile(packagedArchivePath)
  if (archive.subarray(4, 8).some((byte) => byte !== 0)) {
    throw new Error('release gzip header must use a deterministic zero timestamp')
  }
  await rename(packagedArchivePath, archivePath)
  console.log(
    `packaged: ${manifest.assetCount} WebP assets in ${archivePath} (${archive.byteLength.toLocaleString()} bytes, sha256 ${sha256Hex(archive)})`,
  )
} finally {
  await rm(packagingDirectory, { recursive: true, force: true })
}

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

async function writeUstarArchive(path: string, directory: string, entries: readonly string[]): Promise<void> {
  const archive = await open(path, 'wx')
  try {
    for (const entry of entries) {
      const body = await readFile(join(directory, entry))
      await writeAll(archive, createUstarHeader(entry, body.byteLength))
      await writeAll(archive, body)
      const paddingLength = (512 - (body.byteLength % 512)) % 512
      if (paddingLength > 0) {
        await writeAll(archive, Buffer.alloc(paddingLength))
      }
    }
    await writeAll(archive, Buffer.alloc(1024))
  } finally {
    await archive.close()
  }
}

function createUstarHeader(name: string, size: number): Buffer {
  if (!/^[\x20-\x7e]+$/.test(name) || Buffer.byteLength(name) > 100) {
    throw new Error(`release archive entry is not a portable ustar name: ${name}`)
  }

  const header = Buffer.alloc(512)
  writeString(header, 0, 100, name)
  writeOctal(header, 100, 8, 0o644)
  writeOctal(header, 108, 8, 0)
  writeOctal(header, 116, 8, 0)
  writeOctal(header, 124, 12, size)
  writeOctal(header, 136, 12, 0)
  header.fill(0x20, 148, 156)
  header[156] = 0x30
  writeString(header, 257, 6, 'ustar')
  writeString(header, 263, 2, '00')
  writeString(header, 265, 32, 'root')
  writeString(header, 297, 32, 'root')
  writeOctal(header, 329, 8, 0)
  writeOctal(header, 337, 8, 0)

  const checksum = header.reduce((sum, byte) => sum + byte, 0)
  const checksumText = `${checksum.toString(8).padStart(6, '0')}\0 `
  Buffer.from(checksumText, 'ascii').copy(header, 148)
  return header
}

function writeString(target: Buffer, offset: number, length: number, value: string): void {
  const encoded = Buffer.from(value, 'ascii')
  if (encoded.byteLength > length) {
    throw new Error(`ustar field is too long: ${value}`)
  }
  encoded.copy(target, offset)
}

function writeOctal(target: Buffer, offset: number, length: number, value: number): void {
  const encoded = `${value.toString(8).padStart(length - 1, '0')}\0`
  writeString(target, offset, length, encoded)
}

async function writeAll(file: FileHandle, value: Uint8Array): Promise<void> {
  let offset = 0
  while (offset < value.byteLength) {
    const { bytesWritten } = await file.write(value, offset, value.byteLength - offset)
    if (bytesWritten === 0) {
      throw new Error('could not finish writing release archive')
    }
    offset += bytesWritten
  }
}

async function run(
  command: string,
  args: readonly string[],
): Promise<{ code: number; stdout: string; stderr: string }> {
  return await new Promise((resolveResult, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, COPYFILE_DISABLE: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
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
