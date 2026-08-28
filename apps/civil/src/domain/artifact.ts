import { z } from 'zod'

export const CIVIL_ARTIFACT_PART_SIZE_BYTES = 8 * 1024 * 1024
export const CIVIL_ARTIFACT_MAX_BYTES = 1024 * 1024 * 1024
export const CIVIL_ARTIFACT_MAX_PARTS = CIVIL_ARTIFACT_MAX_BYTES / CIVIL_ARTIFACT_PART_SIZE_BYTES
export const CIVIL_ARTIFACT_UPLOAD_TTL_MS = 24 * 60 * 60 * 1000

export const CivilArtifactInspectionWorkSchema = z.object({
  artifactId: z.uuid(),
  organizationId: z.uuid(),
  projectId: z.uuid(),
  objectKey: z.string().min(1).max(1024),
  fileName: z.string().min(1).max(255),
  declaredMediaType: z.string().min(1).max(255),
  byteSize: z.number().int().min(1).max(CIVIL_ARTIFACT_MAX_BYTES),
})

export type CivilArtifactInspectionWork = z.infer<typeof CivilArtifactInspectionWorkSchema>

const InspectionEvidenceSchema = z.object({
  byteSize: z.number().int().min(1).max(CIVIL_ARTIFACT_MAX_BYTES),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  detectedMediaType: z.string().min(1).max(255),
  scanner: z.literal('clamav'),
  scannerVersion: z.string().min(1).max(255),
})

export const CivilArtifactInspectionOutputSchema = z.discriminatedUnion('decision', [
  InspectionEvidenceSchema.extend({ decision: z.literal('accepted') }),
  InspectionEvidenceSchema.extend({
    decision: z.literal('rejected'),
    rejectionCode: z.enum(['malware-detected', 'encrypted-content', 'scan-limit-exceeded']),
  }),
])

export type CivilArtifactInspectionOutput = z.infer<typeof CivilArtifactInspectionOutputSchema>

export type CivilArtifactInspectionClaim =
  | { status: 'work'; work: CivilArtifactInspectionWork }
  | { status: 'cleanup'; objectKey: string }
  | { status: 'complete' }
  | { status: 'retry' }

export interface CivilArtifactInspectionGateway {
  claimArtifactInspection(artifactId: string): Promise<CivilArtifactInspectionClaim>
  completeArtifactInspection(input: { artifactId: string; output: CivilArtifactInspectionOutput }): Promise<void>
  failArtifactInspection(input: { artifactId: string; failureCode: string }): Promise<void>
}
