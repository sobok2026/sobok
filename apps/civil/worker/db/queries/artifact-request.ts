import {
  CIVIL_ARTIFACT_MAX_PARTS,
  CIVIL_ARTIFACT_PART_SIZE_BYTES,
  CIVIL_ARTIFACT_UPLOAD_TTL_MS,
} from '@sobok/civil/artifact'
import type { Db } from '@sobok/edge/db/client'
import { and, asc, desc, eq, gt, inArray, lt, sql } from 'drizzle-orm'
import { withCivilComputeContext, withCivilContext } from '../context'
import { organizationTable, projectTable } from '../schema/tenancy'
import {
  artifactInspectionJobTable,
  artifactTable,
  artifactUploadPartTable,
  artifactUploadTable,
  auditEventTable,
} from '../schema/work'
import { canWriteProject } from './project'

const MAX_ACTIVE_UPLOADS_PER_PROJECT = 5

export function authorizeArtifactUpload(db: Db, userId: string, organizationId: string, projectId: string) {
  return withCivilContext(db, userId, organizationId, (tx) => canWriteProject(tx, userId, organizationId, projectId))
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
    await tx.update(artifactTable).set({ status: 'deleted' }).where(inArray(artifactTable.id, artifactIds))
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
    requestId: string
  },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canWriteProject(tx, input.userId, input.organizationId, input.projectId))) {
      return { kind: 'forbidden' as const }
    }

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
    if ((active?.count ?? 0) >= MAX_ACTIVE_UPLOADS_PER_PROJECT) {
      return { kind: 'active-upload-limit' as const }
    }
    if (organization.used + input.byteSize > organization.quota) {
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
      detail: { byteSize: input.byteSize, mediaType: input.mediaType, partCount },
    })
    return {
      kind: 'created' as const,
      artifact: {
        id: input.artifactId,
        fileName: input.fileName,
        mediaType: input.mediaType,
        byteSize: input.byteSize,
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
    if (!(await canWriteProject(tx, input.userId, input.organizationId, input.projectId))) return null
    const [target] = await tx
      .select({
        artifactId: artifactTable.id,
        objectKey: artifactTable.objectKey,
        byteSize: artifactTable.byteSize,
        artifactStatus: artifactTable.status,
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
    if (!(await canWriteProject(tx, input.userId, input.organizationId, input.projectId))) return false
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
    if (!(await canWriteProject(tx, input.userId, input.organizationId, input.projectId))) return null
    const [target] = await tx
      .select({
        objectKey: artifactTable.objectKey,
        byteSize: artifactTable.byteSize,
        artifactStatus: artifactTable.status,
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
    if (!(await canWriteProject(tx, input.userId, input.organizationId, input.projectId))) return null
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
      await tx.update(artifactTable).set({ status: 'quarantined' }).where(eq(artifactTable.id, input.artifactId))
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
      .insert(artifactInspectionJobTable)
      .values({ artifactId: input.artifactId, organizationId: input.organizationId, projectId: input.projectId })
      .onConflictDoNothing({ target: artifactInspectionJobTable.artifactId })
    return { status: 'quarantined' as const }
  })
}

export function markArtifactInspectionDispatched(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; artifactId: string },
): Promise<void> {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    await tx
      .update(artifactInspectionJobTable)
      .set({
        dispatchedAt: new Date(),
        dispatchAttemptCount: sql`${artifactInspectionJobTable.dispatchAttemptCount} + 1`,
        failureCode: null,
      })
      .where(
        and(
          eq(artifactInspectionJobTable.artifactId, input.artifactId),
          eq(artifactInspectionJobTable.organizationId, input.organizationId),
          eq(artifactInspectionJobTable.projectId, input.projectId),
          eq(artifactInspectionJobTable.status, 'queued'),
        ),
      )
  })
}

export function markArtifactInspectionDispatchFailed(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; artifactId: string },
): Promise<void> {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    await tx
      .update(artifactInspectionJobTable)
      .set({
        dispatchAttemptCount: sql`${artifactInspectionJobTable.dispatchAttemptCount} + 1`,
        failureCode: 'queue-dispatch-failed',
      })
      .where(
        and(
          eq(artifactInspectionJobTable.artifactId, input.artifactId),
          eq(artifactInspectionJobTable.organizationId, input.organizationId),
          eq(artifactInspectionJobTable.projectId, input.projectId),
          eq(artifactInspectionJobTable.status, 'queued'),
        ),
      )
  })
}

export function abortArtifactUploadRecord(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; artifactId: string; requestId: string },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canWriteProject(tx, input.userId, input.organizationId, input.projectId))) return null
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
    await tx.update(artifactTable).set({ status: 'deleted' }).where(eq(artifactTable.id, input.artifactId))
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
        byteSize: artifactTable.byteSize,
        sha256: artifactTable.sha256,
        status: artifactTable.status,
        rejectionCode: artifactTable.rejectionCode,
        createdAt: artifactTable.createdAt,
        scannedAt: artifactTable.scannedAt,
        availableAt: artifactTable.availableAt,
      })
      .from(artifactTable)
      .where(
        and(
          eq(artifactTable.organizationId, input.organizationId),
          eq(artifactTable.projectId, input.projectId),
          inArray(artifactTable.status, ['uploading', 'quarantined', 'available', 'rejected']),
        ),
      )
      .orderBy(desc(artifactTable.createdAt))
    return {
      ...organization,
      canUpload: await canWriteProject(tx, input.userId, input.organizationId, input.projectId),
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
