import { createHash } from 'node:crypto'
import { unlink } from 'node:fs/promises'
import { CIVIL_ARTIFACT_MAX_BYTES } from '../../src/domain/artifact'

const port = Number(process.env.PORT ?? 8080)
const CLAM_SCAN_TIMEOUT_MS = 10 * 60 * 1000

async function commandOutput(command: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const process = Bun.spawn(command, {
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: CLAM_SCAN_TIMEOUT_MS,
    maxBuffer: 128 * 1024,
  })
  const [exitCode, stdout, stderr] = await Promise.all([
    process.exited,
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ])
  return { exitCode, stdout, stderr }
}

async function storeAndHash(
  body: ReadableStream<Uint8Array>,
  path: string,
): Promise<{ byteSize: number; sha256: string }> {
  const hash = createHash('sha256')
  const writer = Bun.file(path).writer({ highWaterMark: 1024 * 1024 })
  let byteSize = 0
  try {
    for await (const chunk of body) {
      byteSize += chunk.byteLength
      if (byteSize > CIVIL_ARTIFACT_MAX_BYTES) throw new Error('artifact exceeds maximum byte size')
      hash.update(chunk)
      await writer.write(chunk)
    }
    await writer.end()
  } catch (error) {
    await writer.end(error instanceof Error ? error : new Error('artifact stream failed'))
    throw error
  }
  return { byteSize, sha256: hash.digest('hex') }
}

function rejectionCode(output: string): 'malware-detected' | 'encrypted-content' | 'scan-limit-exceeded' {
  const normalized = output.toLowerCase()
  if (normalized.includes('encrypted')) return 'encrypted-content'
  if (normalized.includes('limit') || normalized.includes('exceeded')) return 'scan-limit-exceeded'
  return 'malware-detected'
}

async function inspectArtifact(request: Request): Promise<Response> {
  const expectedByteSize = Number(request.headers.get('content-length'))
  const artifactId = request.headers.get('x-artifact-id')
  if (
    !artifactId ||
    !request.body ||
    !Number.isSafeInteger(expectedByteSize) ||
    expectedByteSize < 1 ||
    expectedByteSize > CIVIL_ARTIFACT_MAX_BYTES
  ) {
    return Response.json({ error: 'invalid-artifact-request' }, { status: 422 })
  }

  const path = `/tmp/civil-artifact-${artifactId}-${crypto.randomUUID()}`
  try {
    const evidence = await storeAndHash(request.body, path)
    if (evidence.byteSize !== expectedByteSize) {
      return Response.json({ error: 'artifact-size-mismatch' }, { status: 422 })
    }

    const [media, version, scan] = await Promise.all([
      commandOutput(['file', '--brief', '--mime-type', '--', path]),
      commandOutput(['clamscan', '--version']),
      commandOutput([
        'clamscan',
        '--no-summary',
        '--infected',
        '--max-filesize=1024M',
        '--max-scansize=1024M',
        '--max-files=10000',
        '--max-recursion=16',
        '--alert-encrypted=yes',
        '--alert-exceeds-max=yes',
        '--',
        path,
      ]),
    ])
    if (media.exitCode !== 0 || version.exitCode !== 0 || scan.exitCode > 1) {
      console.error(
        JSON.stringify({
          event: 'civil.artifact.scanner_error',
          artifactId,
          mediaExitCode: media.exitCode,
          versionExitCode: version.exitCode,
          scanExitCode: scan.exitCode,
          scannerError: scan.stderr.slice(0, 512),
        }),
      )
      return Response.json({ error: 'artifact-scanner-unavailable' }, { status: 503 })
    }

    const detectedMediaType = media.stdout.trim().slice(0, 255) || 'application/octet-stream'
    const scannerVersion = version.stdout.trim().slice(0, 255)
    const base = {
      byteSize: evidence.byteSize,
      sha256: evidence.sha256,
      detectedMediaType,
      scanner: 'clamav' as const,
      scannerVersion,
    }
    if (scan.exitCode === 1) {
      return Response.json({ decision: 'rejected', rejectionCode: rejectionCode(scan.stdout), ...base })
    }
    return Response.json({ decision: 'accepted', ...base })
  } finally {
    await unlink(path).catch(() => undefined)
  }
}

Bun.serve({
  hostname: '0.0.0.0',
  port,
  async fetch(request) {
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/health') return Response.json({ ok: true })
    if (request.method !== 'POST' || url.pathname !== '/inspect-artifact') {
      return Response.json({ error: 'not-found' }, { status: 404 })
    }
    return inspectArtifact(request)
  },
})
