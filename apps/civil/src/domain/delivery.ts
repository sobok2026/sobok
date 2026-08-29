import { z } from 'zod'
import { CivilArtifactKindSchema } from './artifact'

export const CIVIL_DELIVERY_MAX_ARTIFACTS = 100
export const CIVIL_DELIVERY_MAX_SOURCE_BYTES = 1024 * 1024 * 1024
export const CIVIL_DELIVERY_RESERVATION_OVERHEAD_BYTES = 8 * 1024 * 1024

export const CivilDeliveryKindSchema = z.enum(['survey', 'design', 'design_change', 'as_built'])
export type CivilDeliveryKind = z.infer<typeof CivilDeliveryKindSchema>

export const CivilDeliveryItemWorkSchema = z
  .object({
    artifactId: z.uuid(),
    objectKey: z.string().min(1).max(1024),
    archivePath: z.string().min(1).max(512),
    fileName: z.string().min(1).max(255),
    mediaType: z.string().min(1).max(255),
    byteSize: z.number().int().min(1).max(CIVIL_DELIVERY_MAX_SOURCE_BYTES),
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
    kind: CivilArtifactKindSchema,
    revision: z.string().min(1).max(64),
    coordinateReferenceSystem: z.string().max(64).nullable(),
  })
  .strict()

export const CivilDeliveryGenerationWorkSchema = z
  .object({
    packageId: z.uuid(),
    organizationId: z.uuid(),
    projectId: z.uuid(),
    objectKey: z.string().min(1).max(1024),
    title: z.string().min(1).max(160),
    deliveryKind: CivilDeliveryKindSchema,
    vendorName: z.string().min(1).max(160),
    revision: z.string().min(1).max(64),
    createdAt: z.iso.datetime({ offset: true }),
    items: z.array(CivilDeliveryItemWorkSchema).min(1).max(CIVIL_DELIVERY_MAX_ARTIFACTS),
  })
  .strict()

export type CivilDeliveryGenerationWork = z.infer<typeof CivilDeliveryGenerationWorkSchema>

export const CivilDeliveryManifestSchema = z
  .object({
    schemaVersion: z.literal('sobok.civil.delivery.v1'),
    packageId: z.uuid(),
    projectId: z.uuid(),
    title: z.string().min(1).max(160),
    deliveryKind: CivilDeliveryKindSchema,
    vendorName: z.string().min(1).max(160),
    revision: z.string().min(1).max(64),
    createdAt: z.iso.datetime({ offset: true }),
    files: z
      .array(
        z
          .object({
            artifactId: z.uuid(),
            path: z.string().min(1).max(512),
            originalFileName: z.string().min(1).max(255),
            mediaType: z.string().min(1).max(255),
            byteSize: z.number().int().min(1),
            sha256: z.string().regex(/^[0-9a-f]{64}$/),
            kind: CivilArtifactKindSchema,
            revision: z.string().min(1).max(64),
            coordinateReferenceSystem: z.string().max(64).nullable(),
          })
          .strict(),
      )
      .min(1)
      .max(CIVIL_DELIVERY_MAX_ARTIFACTS),
  })
  .strict()

export type CivilDeliveryManifest = z.infer<typeof CivilDeliveryManifestSchema>

export const CivilDeliveryGenerationOutputSchema = z
  .object({
    byteSize: z.number().int().min(1),
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
    manifest: CivilDeliveryManifestSchema,
    manifestSha256: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .strict()

export type CivilDeliveryGenerationOutput = z.infer<typeof CivilDeliveryGenerationOutputSchema>

export type CivilDeliveryGenerationClaim =
  | { status: 'work'; work: CivilDeliveryGenerationWork }
  | { status: 'cleanup'; objectKey: string }
  | { status: 'complete' }
  | { status: 'retry' }

export interface CivilDeliveryGenerationGateway {
  claimDeliveryGeneration(packageId: string): Promise<CivilDeliveryGenerationClaim>
  completeDeliveryGeneration(input: { packageId: string; output: CivilDeliveryGenerationOutput }): Promise<void>
  failDeliveryGeneration(input: { packageId: string; failureCode: string }): Promise<void>
  completeDeliveryCleanup(packageId: string): Promise<void>
}
