import {
  CIVIL_ARTIFACT_MAX_PARTS,
  CIVIL_ARTIFACT_PART_SIZE_BYTES,
  CIVIL_ARTIFACT_UPLOAD_TTL_MS,
  type CivilArtifactKind,
  type CivilBoundingBox,
} from '@sobok/civil/artifact'
import type { Db } from '@sobok/edge/db/client'
import { and, asc, desc, eq, gt, inArray, lt, ne, sql } from 'drizzle-orm'
import { type CivilTransaction, withCivilComputeContext, withCivilContext } from '../context'
import { organizationTable, projectTable } from '../schema/tenancy'
import {
  artifactTable,
  artifactUploadPartTable,
  artifactUploadTable,
  artifactVerificationJobTable,
  auditEventTable,
  deliveryPackageItemTable,
  deliveryPackageTable,
} from '../schema/work'
import { canContributeProject } from './project'

const MAX_ACTIVE_UPLOADS_PER_PROJECT = 5
const STORAGE_ADVISORY_LOCK = 2_026_082_901

async function lockAndReadGlobalStorage(tx: CivilTransaction): Promise<number> {
  await tx.execute(sql`select pg_advisory_xact_lock(${STORAGE_ADVISORY_LOCK})`)
  await tx.execute(sql`select set_config('app.civil_compute', 'on', true)`)
  try {
    const [result] = await tx
      .select({ used: sql<number>`coalesce(sum(${organizationTable.storageUsedBytes}), 0)::bigint`.mapWith(Number) })
      .from(organizationTable)
    return result?.used ?? 0
  } finally {
    await tx.execute(sql`select set_config('app.civil_compute', 'off', true)`)
  }
}

export function authorizeArtifactUpload(db: Db, userId: string, organizationId: string, projectId: string) {
  return withCivilContext(db, userId, organizationId, (tx) =>
    canContributeProject(tx, userId, organizationId, projectId),
  )
}

export function expireStaleArtifactUploads(db: Db, organizationId: string) {
  return withCivilComputeContext(db, async (tx) => {
    const expired = await tx
      .select({
        artifactId: artifactUploadTable.artifactId,
        projectId: artifactUploadTable.projectId,
        r2UploadId: artifactUploadTable.r2UploadId,
        objectKey: artifactTable.objectKey,
        byteSize: artifactTable.byteSize,
      })
      .from(artifactUploadTable)
      .innerJoin(artifactTable, eq(artifactTable.id, artifactUploadTable.artifactId))
      .where(
        and(
          eq(artifactUploadTable.organizationId, organizationId),
          eq(artifactUploadTable.status, 'open'),
          lt(artifactUploadTable.expiresAt, new Date()),
        ),
      )
      .for('update')
    if (expired.length === 0) return []

    const artifactIds = expired.map((item) => item.artifactId)
    const releasedBytes = expired.reduce((total, item) => total + item.byteSize, 0)
    await tx
      .update(artifactUploadTable)
      .set({ status: 'expired' })
      .where(inArray(artifactUploadTable.artifactId, artifactIds))
    await tx
      .update(artifactTable)
      .set({ status: 'deleted', deletedAt: new Date() })
      .where(inArray(artifactTable.id, artifactIds))
    await tx
      .update(organizationTable)
      .set({ storageUsedBytes: sql`${organizationTable.storageUsedBytes} - ${releasedBytes}` })
      .where(eq(organizationTable.id, organizationId))
    await tx.insert(auditEventTable).values(
      expired.map((item) => ({
        organizationId,
        projectId: item.projectId,
        actorType: 'system' as const,
        actorUserId: null,
        action: 'artifact.upload_expired',
        targetType: 'artifact',
        targetId: item.artifactId,
        requestId: `system:artifact-expiry:${item.artifactId}`,
        detail: { byteSize: item.byteSize },
      })),
    )
    return expired.map(({ artifactId, r2UploadId, objectKey }) => ({ artifactId, r2UploadId, objectKey }))
  })
}

export function createArtifactUploadRecord(
  db: Db,
  input: {
    userId: string
    organizationId: string
    projectId: string
    artifactId: string
    objectKey: string
    r2UploadId: string
    fileName: string
    mediaType: string
    byteSize: number
    kind: CivilArtifactKind
    revision: string
    coordinateReferenceSystem: string | null
    boundingBox: CivilBoundingBox | null
    previousArtifactId: string | null
    globalStorageCapBytes: number
    requestId: string
  },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canContributeProject(tx, input.userId, input.organizationId, input.projectId))) {
      return { kind: 'forbidden' as const }
    }

    if (input.previousArtifactId) {
      const [previous] = await tx
        .select({ id: artifactTable.id })
        .from(artifactTable)
        .where(
          and(
            eq(artifactTable.id, input.previousArtifactId),
            eq(artifactTable.organizationId, input.organizationId),
            eq(artifactTable.projectId, input.projectId),
            eq(artifactTable.status, 'available'),
          ),
        )
        .limit(1)
      if (!previous) return { kind: 'invalid-previous' as const }
    }

    const globalUsed = await lockAndReadGlobalStorage(tx)
    const [organization] = await tx
      .select({ quota: organizationTable.storageQuotaBytes, used: organizationTable.storageUsedBytes })
      .from(organizationTable)
      .where(eq(organizationTable.id, input.organizationId))
      .limit(1)
      .for('update')
    if (!organization) return { kind: 'forbidden' as const }

    const [active] = await tx
      .select({ count: sql<number>`count(*)::integer`.mapWith(Number) })
      .from(artifactUploadTable)
      .where(
        and(
          eq(artifactUploadTable.organizationId, input.organizationId),
          eq(artifactUploadTable.projectId, input.projectId),
          eq(artifactUploadTable.status, 'open'),
          gt(artifactUploadTable.expiresAt, new Date()),
        ),
      )
    if ((active?.count ?? 0) >= MAX_ACTIVE_UPLOADS_PER_PROJECT) return { kind: 'active-upload-limit' as const }
    if (
      organization.used + input.byteSize > organization.quota ||
      globalUsed + input.byteSize > input.globalStorageCapBytes
    ) {
      return {
        kind: 'quota-exceeded' as const,
        storageUsedBytes: organization.used,
        storageQuotaBytes: organization.quota,
      }
    }

    const partCount = Math.ceil(input.byteSize / CIVIL_ARTIFACT_PART_SIZE_BYTES)
    if (partCount < 1 || partCount > CIVIL_ARTIFACT_MAX_PARTS) throw new Error('invalid artifact part count')
    const expiresAt = new Date(Date.now() + CIVIL_ARTIFACT_UPLOAD_TTL_MS)

    await tx.insert(artifactTable).values({
      id: input.artifactId,
      organizationId: input.organizationId,
      projectId: input.projectId,
      objectKey: input.objectKey,
      fileName: input.fileName,
      mediaType: input.mediaType,
      byteSize: input.byteSize,
      kind: input.kind,
      revision: input.revision,
      coordinateReferenceSystem: input.coordinateReferenceSystem,
      boundingBox: input.boundingBox,
      previousArtifactId: input.previousArtifactId,
      uploadedByUserId: input.userId,
    })
    await tx.insert(artifactUploadTable).values({
      artifactId: input.artifactId,
      organizationId: input.organizationId,
      projectId: input.projectId,
      r2UploadId: input.r2UploadId,
      partSize: CIVIL_ARTIFACT_PART_SIZE_BYTES,
      partCount,
      expiresAt,
    })
    await tx
      .update(organizationTable)
      .set({ storageUsedBytes: sql`${organizationTable.storageUsedBytes} + ${input.byteSize}` })
      .where(eq(organizationTable.id, input.organizationId))
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.userId,
      action: 'artifact.upload_created',
      targetType: 'artifact',
      targetId: input.artifactId,
      requestId: input.requestId,
      detail: {
        byteSize: input.byteSize,
        mediaType: input.mediaType,
        kind: input.kind,
        revision: input.revision,
        partCount,
      },
    })
    return {
      kind: 'created' as const,
      artifact: {
        id: input.artifactId,
        fileName: input.fileName,
        mediaType: input.mediaType,
        byteSize: input.byteSize,
        kind: input.kind,
        revision: input.revision,
        status: 'uploading' as const,
      },
      upload: { partSize: CIVIL_ARTIFACT_PART_SIZE_BYTES, partCount, expiresAt },
    }
  })
}

export function getArtifactUploadTarget(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; artifactId: string },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canContributeProject(tx, input.userId, input.organizationId, input.projectId))) return null
    const [target] = await tx
      .select({
        objectKey: artifactTable.objectKey,
        byteSize: artifactTable.byteSize,
        r2UploadId: artifactUploadTable.r2UploadId,
        partSize: artifactUploadTable.partSize,
        partCount: artifactUploadTable.partCount,
        uploadStatus: artifactUploadTable.status,
        expiresAt: artifactUploadTable.expiresAt,
      })
      .from(artifactTable)
      .innerJoin(artifactUploadTable, eq(artifactUploadTable.artifactId, artifactTable.id))
      .where(
        and(
          eq(artifactTable.id, input.artifactId),
          eq(artifactTable.organizationId, input.organizationId),
          eq(artifactTable.projectId, input.projectId),
        ),
      )
      .limit(1)
    return target ?? null
  })
}

export function recordArtifactUploadPart(
  db: Db,
  input: {
    userId: string
    organizationId: string
    projectId: string
    artifactId: string
    partNumber: number
    etag: string
    byteSize: number
  },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canContributeProject(tx, input.userId, input.organizationId, input.projectId))) return false
    const [upload] = await tx
      .select({ artifactId: artifactUploadTable.artifactId })
      .from(artifactUploadTable)
      .where(
        and(
          eq(artifactUploadTable.artifactId, input.artifactId),
          eq(artifactUploadTable.organizationId, input.organizationId),
          eq(artifactUploadTable.projectId, input.projectId),
          eq(artifactUploadTable.status, 'open'),
          gt(artifactUploadTable.expiresAt, new Date()),
        ),
      )
      .limit(1)
    if (!upload) return false
    await tx
      .insert(artifactUploadPartTable)
      .values({
        artifactId: input.artifactId,
        organizationId: input.organizationId,
        projectId: input.projectId,
        partNumber: input.partNumber,
        etag: input.etag,
        byteSize: input.byteSize,
      })
      .onConflictDoUpdate({
        target: [artifactUploadPartTable.artifactId, artifactUploadPartTable.partNumber],
        set: { etag: input.etag, byteSize: input.byteSize },
      })
    return true
  })
}

export function getArtifactCompletionTarget(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; artifactId: string },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canContributeProject(tx, input.userId, input.organizationId, input.projectId))) return null
    const [target] = await tx
      .select({
        objectKey: artifactTable.objectKey,
        byteSize: artifactTable.byteSize,
        r2UploadId: artifactUploadTable.r2UploadId,
        partSize: artifactUploadTable.partSize,
        partCount: artifactUploadTable.partCount,
        uploadStatus: artifactUploadTable.status,
        expiresAt: artifactUploadTable.expiresAt,
      })
      .from(artifactTable)
      .innerJoin(artifactUploadTable, eq(artifactUploadTable.artifactId, artifactTable.id))
      .where(
        and(
          eq(artifactTable.id, input.artifactId),
          eq(artifactTable.organizationId, input.organizationId),
          eq(artifactTable.projectId, input.projectId),
        ),
      )
      .limit(1)
    if (!target) return null
    const parts = await tx
      .select({
        partNumber: artifactUploadPartTable.partNumber,
        etag: artifactUploadPartTable.etag,
        byteSize: artifactUploadPartTable.byteSize,
      })
      .from(artifactUploadPartTable)
      .where(eq(artifactUploadPartTable.artifactId, input.artifactId))
      .orderBy(asc(artifactUploadPartTable.partNumber))
    return { ...target, parts }
  })
}

export function markArtifactUploadCompleted(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; artifactId: string; requestId: string },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canContributeProject(tx, input.userId, input.organizationId, input.projectId))) return null
    const [upload] = await tx
      .select({ status: artifactUploadTable.status })
      .from(artifactUploadTable)
      .where(
        and(
          eq(artifactUploadTable.artifactId, input.artifactId),
          eq(artifactUploadTable.organizationId, input.organizationId),
          eq(artifactUploadTable.projectId, input.projectId),
        ),
      )
      .limit(1)
      .for('update')
    if (!upload) return null
    if (upload.status === 'aborted' || upload.status === 'expired') return { status: upload.status }

    if (upload.status === 'open') {
      await tx
        .update(artifactUploadTable)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(artifactUploadTable.artifactId, input.artifactId))
      await tx.update(artifactTable).set({ status: 'verifying' }).where(eq(artifactTable.id, input.artifactId))
      await tx.insert(auditEventTable).values({
        organizationId: input.organizationId,
        projectId: input.projectId,
        actorType: 'user',
        actorUserId: input.userId,
        action: 'artifact.upload_completed',
        targetType: 'artifact',
        targetId: input.artifactId,
        requestId: input.requestId,
      })
    }
    await tx
      .insert(artifactVerificationJobTable)
      .values({ artifactId: input.artifactId, organizationId: input.organizationId, projectId: input.projectId })
      .onConflictDoNothing({ target: artifactVerificationJobTable.artifactId })
    return { status: 'verifying' as const }
  })
}

export function markArtifactVerificationDispatched(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; artifactId: string },
): Promise<void> {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    await tx
      .update(artifactVerificationJobTable)
      .set({
        dispatchedAt: new Date(),
        dispatchAttemptCount: sql`${artifactVerificationJobTable.dispatchAttemptCount} + 1`,
        failureCode: null,
      })
      .where(
        and(
          eq(artifactVerificationJobTable.artifactId, input.artifactId),
          eq(artifactVerificationJobTable.organizationId, input.organizationId),
          eq(artifactVerificationJobTable.projectId, input.projectId),
          eq(artifactVerificationJobTable.status, 'queued'),
        ),
      )
  })
}

export function markArtifactVerificationDispatchFailed(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; artifactId: string },
): Promise<void> {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    await tx
      .update(artifactVerificationJobTable)
      .set({
        dispatchAttemptCount: sql`${artifactVerificationJobTable.dispatchAttemptCount} + 1`,
        failureCode: 'queue-dispatch-failed',
      })
      .where(eq(artifactVerificationJobTable.artifactId, input.artifactId))
  })
}

export function abortArtifactUploadRecord(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; artifactId: string; requestId: string },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canContributeProject(tx, input.userId, input.organizationId, input.projectId))) return null
    const [artifact] = await tx
      .select({ byteSize: artifactTable.byteSize, uploadStatus: artifactUploadTable.status })
      .from(artifactTable)
      .innerJoin(artifactUploadTable, eq(artifactUploadTable.artifactId, artifactTable.id))
      .where(
        and(
          eq(artifactTable.id, input.artifactId),
          eq(artifactTable.organizationId, input.organizationId),
          eq(artifactTable.projectId, input.projectId),
        ),
      )
      .limit(1)
      .for('update')
    if (!artifact) return null
    if (artifact.uploadStatus !== 'open') return { status: artifact.uploadStatus }

    await tx
      .update(artifactUploadTable)
      .set({ status: 'aborted' })
      .where(eq(artifactUploadTable.artifactId, input.artifactId))
    await tx
      .update(artifactTable)
      .set({ status: 'deleted', deletedAt: new Date() })
      .where(eq(artifactTable.id, input.artifactId))
    await tx
      .update(organizationTable)
      .set({ storageUsedBytes: sql`${organizationTable.storageUsedBytes} - ${artifact.byteSize}` })
      .where(eq(organizationTable.id, input.organizationId))
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.userId,
      action: 'artifact.upload_aborted',
      targetType: 'artifact',
      targetId: input.artifactId,
      requestId: input.requestId,
    })
    return { status: 'aborted' as const }
  })
}

export function listArtifacts(db: Db, input: { userId: string; organizationId: string; projectId: string }) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    const [project] = await tx
      .select({ id: projectTable.id })
      .from(projectTable)
      .where(and(eq(projectTable.organizationId, input.organizationId), eq(projectTable.id, input.projectId)))
      .limit(1)
    if (!project) return null
    const [organization] = await tx
      .select({
        storageQuotaBytes: organizationTable.storageQuotaBytes,
        storageUsedBytes: organizationTable.storageUsedBytes,
      })
      .from(organizationTable)
      .where(eq(organizationTable.id, input.organizationId))
      .limit(1)
    if (!organization) return null
    const items = await tx
      .select({
        id: artifactTable.id,
        fileName: artifactTable.fileName,
        mediaType: artifactTable.mediaType,
        detectedMediaType: artifactTable.detectedMediaType,
        detectedFormat: artifactTable.detectedFormat,
        byteSize: artifactTable.byteSize,
        sha256: artifactTable.sha256,
        kind: artifactTable.kind,
        revision: artifactTable.revision,
        coordinateReferenceSystem: artifactTable.coordinateReferenceSystem,
        boundingBox: artifactTable.boundingBox,
        previousArtifactId: artifactTable.previousArtifactId,
        status: artifactTable.status,
        rejectionCode: artifactTable.rejectionCode,
        verificationFailureCode: artifactTable.verificationFailureCode,
        createdAt: artifactTable.createdAt,
        verifiedAt: artifactTable.verifiedAt,
        availableAt: artifactTable.availableAt,
      })
      .from(artifactTable)
      .where(
        and(
          eq(artifactTable.organizationId, input.organizationId),
          eq(artifactTable.projectId, input.projectId),
          inArray(artifactTable.status, ['uploading', 'verifying', 'verification_failed', 'available', 'rejected']),
        ),
      )
      .orderBy(desc(artifactTable.createdAt))
    return {
      ...organization,
      canUpload: await canContributeProject(tx, input.userId, input.organizationId, input.projectId),
      items,
    }
  })
}

export function getArtifactDownloadTarget(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; artifactId: string },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    const [artifact] = await tx
      .select({
        objectKey: artifactTable.objectKey,
        fileName: artifactTable.fileName,
        byteSize: artifactTable.byteSize,
        sha256: artifactTable.sha256,
      })
      .from(artifactTable)
      .where(
        and(
          eq(artifactTable.id, input.artifactId),
          eq(artifactTable.organizationId, input.organizationId),
          eq(artifactTable.projectId, input.projectId),
          eq(artifactTable.status, 'available'),
        ),
      )
      .limit(1)
    return artifact ?? null
  })
}

export function markArtifactDeleted(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; artifactId: string; requestId: string },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canContributeProject(tx, input.userId, input.organizationId, input.projectId))) {
      return { kind: 'forbidden' as const }
    }
    const [referenced] = await tx
      .select({ id: deliveryPackageItemTable.packageId })
      .from(deliveryPackageItemTable)
      .innerJoin(deliveryPackageTable, eq(deliveryPackageTable.id, deliveryPackageItemTable.packageId))
      .where(
        and(
          eq(deliveryPackageItemTable.artifactId, input.artifactId),
          eq(deliveryPackageItemTable.organizationId, input.organizationId),
          ne(deliveryPackageTable.status, 'withdrawn'),
        ),
      )
      .limit(1)
    if (referenced) return { kind: 'referenced' as const }

    const [artifact] = await tx
      .select({ status: artifactTable.status, byteSize: artifactTable.byteSize, objectKey: artifactTable.objectKey })
      .from(artifactTable)
      .where(
        and(
          eq(artifactTable.id, input.artifactId),
          eq(artifactTable.organizationId, input.organizationId),
          eq(artifactTable.projectId, input.projectId),
          inArray(artifactTable.status, ['available', 'rejected', 'verification_failed']),
        ),
      )
      .limit(1)
      .for('update')
    if (!artifact) return { kind: 'missing' as const }

    await tx
      .update(artifactTable)
      .set({ status: 'deleted', deletedAt: new Date() })
      .where(eq(artifactTable.id, input.artifactId))
    if (artifact.status === 'available' || artifact.status === 'verification_failed') {
      await tx
        .update(organizationTable)
        .set({ storageUsedBytes: sql`${organizationTable.storageUsedBytes} - ${artifact.byteSize}` })
        .where(eq(organizationTable.id, input.organizationId))
    }
    await tx
      .update(artifactVerificationJobTable)
      .set({ cleanupRequired: true })
      .where(eq(artifactVerificationJobTable.artifactId, input.artifactId))
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.userId,
      action: 'artifact.deleted',
      targetType: 'artifact',
      targetId: input.artifactId,
      requestId: input.requestId,
    })
    return { kind: 'deleted' as const, objectKey: artifact.objectKey }
  })
}
