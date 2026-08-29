import { createHash } from 'node:crypto'
import {
  type CivilArtifactVerificationOutput,
  type CivilArtifactVerificationWork,
  civilArtifactExtension,
} from '@sobok/civil/artifact'

const PREFIX_LIMIT_BYTES = 8192

function startsWith(value: Uint8Array, expected: readonly number[]): boolean {
  if (value.length < expected.length) return false
  return expected.every((byte, index) => value[index] === byte)
}

function startsWithAscii(value: Uint8Array, expected: string): boolean {
  return startsWith(
    value,
    [...expected].map((character) => character.charCodeAt(0)),
  )
}

function isZip(value: Uint8Array): boolean {
  return (
    startsWith(value, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(value, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(value, [0x50, 0x4b, 0x07, 0x08])
  )
}

function isCompoundBinary(value: Uint8Array): boolean {
  return startsWith(value, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
}

function textPrefix(value: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false, ignoreBOM: false })
    .decode(value)
    .replace(/^\uFEFF/u, '')
    .trimStart()
}

function signatureFor(
  fileName: string,
  prefix: Uint8Array,
): { valid: boolean; detectedMediaType: string; detectedFormat: string } {
  const extension = civilArtifactExtension(fileName)
  const text = textPrefix(prefix)
  const hasNul = prefix.includes(0)
  switch (extension) {
    case 'pdf':
      return { valid: startsWithAscii(prefix, '%PDF-'), detectedMediaType: 'application/pdf', detectedFormat: 'pdf' }
    case 'zip':
      return { valid: isZip(prefix), detectedMediaType: 'application/zip', detectedFormat: 'zip' }
    case 'xlsx':
      return {
        valid: isZip(prefix),
        detectedMediaType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        detectedFormat: 'xlsx',
      }
    case 'docx':
      return {
        valid: isZip(prefix),
        detectedMediaType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        detectedFormat: 'docx',
      }
    case 'hwpx':
      return { valid: isZip(prefix), detectedMediaType: 'application/vnd.hancom.hwpx', detectedFormat: 'hwpx' }
    case 'xls':
      return {
        valid: isCompoundBinary(prefix),
        detectedMediaType: 'application/vnd.ms-excel',
        detectedFormat: 'xls',
      }
    case 'hwp':
      return {
        valid: isCompoundBinary(prefix),
        detectedMediaType: 'application/x-hwp',
        detectedFormat: 'hwp',
      }
    case 'dwg':
      return { valid: startsWithAscii(prefix, 'AC10'), detectedMediaType: 'application/acad', detectedFormat: 'dwg' }
    case 'dxf':
      return {
        valid: startsWithAscii(prefix, 'AutoCAD Binary DXF') || /^0\s+SECTION\b/u.test(text),
        detectedMediaType: 'application/dxf',
        detectedFormat: 'dxf',
      }
    case 'geojson':
      return {
        valid: text.startsWith('{'),
        detectedMediaType: 'application/geo+json',
        detectedFormat: 'geojson',
      }
    case 'json':
      return {
        valid: text.startsWith('{') || text.startsWith('['),
        detectedMediaType: 'application/json',
        detectedFormat: 'json',
      }
    case 'xml':
    case 'landxml':
      return { valid: text.startsWith('<'), detectedMediaType: 'application/xml', detectedFormat: extension }
    case 'ifc':
      return {
        valid: text.toUpperCase().startsWith('ISO-10303-21;'),
        detectedMediaType: 'application/x-step',
        detectedFormat: 'ifc',
      }
    case 'tif':
    case 'tiff':
      return {
        valid: startsWith(prefix, [0x49, 0x49, 0x2a, 0x00]) || startsWith(prefix, [0x4d, 0x4d, 0x00, 0x2a]),
        detectedMediaType: 'image/tiff',
        detectedFormat: 'tiff',
      }
    case 'las':
    case 'laz':
      return {
        valid: startsWithAscii(prefix, 'LASF'),
        detectedMediaType: 'application/vnd.las',
        detectedFormat: extension,
      }
    case 'csv':
      return { valid: !hasNul, detectedMediaType: 'text/csv', detectedFormat: 'csv' }
    case 'txt':
      return { valid: !hasNul, detectedMediaType: 'text/plain', detectedFormat: 'text' }
    default:
      return { valid: false, detectedMediaType: 'application/octet-stream', detectedFormat: 'unknown' }
  }
}

export async function verifyArtifact(
  bucket: R2Bucket,
  work: CivilArtifactVerificationWork,
): Promise<CivilArtifactVerificationOutput> {
  const object = await bucket.get(work.objectKey)
  if (!object) throw new Error('artifact object not found')
  const reader = object.body.getReader()
  const hash = createHash('sha256')
  const prefixChunks: Uint8Array[] = []
  let prefixLength = 0
  let byteSize = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    hash.update(value)
    byteSize += value.byteLength
    if (prefixLength < PREFIX_LIMIT_BYTES) {
      const slice = value.subarray(0, Math.min(value.byteLength, PREFIX_LIMIT_BYTES - prefixLength))
      prefixChunks.push(slice.slice())
      prefixLength += slice.byteLength
    }
  }

  const prefix = new Uint8Array(prefixLength)
  let offset = 0
  for (const chunk of prefixChunks) {
    prefix.set(chunk, offset)
    offset += chunk.byteLength
  }
  const signature = signatureFor(work.fileName, prefix)
  const evidence = {
    byteSize,
    sha256: hash.digest('hex'),
    detectedMediaType: signature.detectedMediaType,
    detectedFormat: signature.detectedFormat,
  }
  if (byteSize !== work.byteSize) return { ...evidence, decision: 'rejected', rejectionCode: 'size-mismatch' }
  if (signature.detectedFormat === 'unknown') {
    return { ...evidence, decision: 'rejected', rejectionCode: 'unsupported-format' }
  }
  if (!signature.valid) return { ...evidence, decision: 'rejected', rejectionCode: 'signature-mismatch' }
  return { ...evidence, decision: 'accepted' }
}
