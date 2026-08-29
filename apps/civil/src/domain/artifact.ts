import { z } from 'zod'

export const CIVIL_ARTIFACT_PART_SIZE_BYTES = 8 * 1024 * 1024
export const CIVIL_ARTIFACT_MAX_BYTES = 1024 * 1024 * 1024
export const CIVIL_ARTIFACT_MAX_PARTS = CIVIL_ARTIFACT_MAX_BYTES / CIVIL_ARTIFACT_PART_SIZE_BYTES
export const CIVIL_ARTIFACT_UPLOAD_TTL_MS = 24 * 60 * 60 * 1000

export const CivilArtifactKindSchema = z.enum([
  'drawing',
  'survey',
  'calculation_input',
  'cost_basis',
  'deliverable',
  'supporting',
])

export type CivilArtifactKind = z.infer<typeof CivilArtifactKindSchema>

export const CivilBoundingBoxSchema = z
  .object({
    minX: z.number().finite(),
    minY: z.number().finite(),
    maxX: z.number().finite(),
    maxY: z.number().finite(),
  })
  .strict()
  .refine((value) => value.minX <= value.maxX && value.minY <= value.maxY)

export type CivilBoundingBox = z.infer<typeof CivilBoundingBoxSchema>

export const CIVIL_ARTIFACT_ALLOWED_EXTENSIONS = [
  'csv',
  'docx',
  'dwg',
  'dxf',
  'geojson',
  'hwp',
  'hwpx',
  'ifc',
  'json',
  'landxml',
  'las',
  'laz',
  'pdf',
  'tif',
  'tiff',
  'txt',
  'xls',
  'xlsx',
  'xml',
  'zip',
] as const

const allowedExtensionSet: ReadonlySet<string> = new Set(CIVIL_ARTIFACT_ALLOWED_EXTENSIONS)

export function civilArtifactExtension(fileName: string): string | null {
  const separator = fileName.lastIndexOf('.')
  if (separator <= 0 || separator === fileName.length - 1) return null
  return fileName.slice(separator + 1).toLowerCase()
}

export function isAllowedCivilArtifactFileName(fileName: string): boolean {
  const extension = civilArtifactExtension(fileName)
  return extension !== null && allowedExtensionSet.has(extension)
}

export const CivilArtifactVerificationWorkSchema = z
  .object({
    artifactId: z.uuid(),
    organizationId: z.uuid(),
    projectId: z.uuid(),
    objectKey: z.string().min(1).max(1024),
    fileName: z.string().min(1).max(255),
    declaredMediaType: z.string().min(1).max(255),
    byteSize: z.number().int().min(1).max(CIVIL_ARTIFACT_MAX_BYTES),
  })
  .strict()

export type CivilArtifactVerificationWork = z.infer<typeof CivilArtifactVerificationWorkSchema>

const VerificationEvidenceSchema = z
  .object({
    byteSize: z.number().int().min(1).max(CIVIL_ARTIFACT_MAX_BYTES),
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
    detectedMediaType: z.string().min(1).max(255),
    detectedFormat: z.string().min(1).max(64),
  })
  .strict()

export const CivilArtifactVerificationOutputSchema = z.discriminatedUnion('decision', [
  VerificationEvidenceSchema.extend({ decision: z.literal('accepted') }),
  VerificationEvidenceSchema.extend({
    decision: z.literal('rejected'),
    rejectionCode: z.enum(['unsupported-format', 'signature-mismatch', 'size-mismatch', 'unreadable-content']),
  }),
])

export type CivilArtifactVerificationOutput = z.infer<typeof CivilArtifactVerificationOutputSchema>

export type CivilArtifactVerificationClaim =
  | { status: 'work'; work: CivilArtifactVerificationWork }
  | { status: 'cleanup'; objectKey: string }
  | { status: 'complete' }
  | { status: 'retry' }

export interface CivilArtifactVerificationGateway {
  claimArtifactVerification(artifactId: string): Promise<CivilArtifactVerificationClaim>
  completeArtifactVerification(input: { artifactId: string; output: CivilArtifactVerificationOutput }): Promise<void>
  failArtifactVerification(input: { artifactId: string; failureCode: string }): Promise<void>
  completeArtifactCleanup(artifactId: string): Promise<void>
}
