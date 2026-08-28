import {
  type CivilArtifactInspectionClaim,
  type CivilArtifactInspectionOutput,
  CivilArtifactInspectionOutputSchema,
  CivilArtifactInspectionWorkSchema,
} from '@sobok/civil/artifact'
import type { Db } from '@sobok/edge/db/client'
import { and, asc, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm'
import { withCivilComputeContext } from '../context'
import { organizationTable } from '../schema/tenancy'
import { artifactInspectionJobTable, artifactTable, auditEventTable } from '../schema/work'

export function claimArtifactInspection(db: Db, artifactId: string): Promise<CivilArtifactInspectionClaim> {
  return withCivilComputeContext(db, async (tx) => {
    const [claimed] = await tx
      .update(artifactInspectionJobTable)
      .set({
        status: 'running',
        startedAt: new Date(),
        completedAt: null,
        failureCode: null,
        attemptCount: sql`${artifactInspectionJobTable.attemptCount} + 1`,
      })
      .where(
        and(
          eq(artifactInspectionJobTable.artifactId, artifactId),
          or(
            inArray(artifactInspectionJobTable.status, ['queued', 'failed']),
            and(
              eq(artifactInspectionJobTable.status, 'running'),
              lt(artifactInspectionJobTable.startedAt, sql`now() - interval '15 minutes'`),
            ),
          ),
        ),
      )
      .returning({ artifactId: artifactInspectionJobTable.artifactId })

    if (!claimed) {
      const [current] = await tx
        .select({
          status: artifactInspectionJobTable.status,
          artifactStatus: artifactTable.status,
          objectKey: artifactTable.objectKey,
        })
        .from(artifactInspectionJobTable)
        .innerJoin(artifactTable, eq(artifactTable.id, artifactInspectionJobTable.artifactId))
        .where(eq(artifactInspectionJobTable.artifactId, artifactId))
        .limit(1)
      if (!current) return { status: 'complete' }
      if (current.status !== 'succeeded') return { status: 'retry' }
      return current.artifactStatus === 'rejected' || current.artifactStatus === 'deleted'
        ? { status: 'cleanup', objectKey: current.objectKey }
        : { status: 'complete' }
    }

    const [artifact] = await tx
      .select({
        artifactId: artifactTable.id,
        organizationId: artifactTable.organizationId,
        projectId: artifactTable.projectId,
        objectKey: artifactTable.objectKey,
        fileName: artifactTable.fileName,
        declaredMediaType: artifactTable.mediaType,
        byteSize: artifactTable.byteSize,
      })
      .from(artifactTable)
      .where(and(eq(artifactTable.id, artifactId), eq(artifactTable.status, 'quarantined')))
      .limit(1)
    const parsed = CivilArtifactInspectionWorkSchema.safeParse(artifact)
    if (parsed.success) return { status: 'work', work: parsed.data }

    if (artifact) {
      await tx
        .update(artifactTable)
        .set({ status: 'rejected', rejectionCode: 'invalid-artifact-metadata', scannedAt: new Date() })
        .where(eq(artifactTable.id, artifactId))
      await tx
        .update(organizationTable)
        .set({ storageUsedBytes: sql`${organizationTable.storageUsedBytes} - ${artifact.byteSize}` })
        .where(eq(organizationTable.id, artifact.organizationId))
      await tx.insert(auditEventTable).values({
        organizationId: artifact.organizationId,
        projectId: artifact.projectId,
        actorType: 'system',
        actorUserId: null,
        action: 'artifact.rejected',
        targetType: 'artifact',
        targetId: artifactId,
        requestId: `compute:artifact:${artifactId}`,
        detail: { rejectionCode: 'invalid-artifact-metadata' },
      })
    }
    await tx
      .update(artifactInspectionJobTable)
      .set({ status: 'succeeded', completedAt: new Date(), failureCode: null })
      .where(eq(artifactInspectionJobTable.artifactId, artifactId))
    return artifact ? { status: 'cleanup', objectKey: artifact.objectKey } : { status: 'complete' }
  })
}

export function completeArtifactInspection(
  db: Db,
  input: { artifactId: string; output: CivilArtifactInspectionOutput },
): Promise<void> {
  return withCivilComputeContext(db, async (tx) => {
    const output = CivilArtifactInspectionOutputSchema.parse(input.output)
    const [artifact] = await tx
      .select({
        organizationId: artifactTable.organizationId,
        projectId: artifactTable.projectId,
        byteSize: artifactTable.byteSize,
        status: artifactTable.status,
        inspectionStatus: artifactInspectionJobTable.status,
      })
      .from(artifactTable)
      .innerJoin(artifactInspectionJobTable, eq(artifactInspectionJobTable.artifactId, artifactTable.id))
      .where(eq(artifactTable.id, input.artifactId))
      .limit(1)
      .for('update')
    if (!artifact) throw new Error('artifact inspection job not found')
    if (artifact.inspectionStatus === 'succeeded') return
    if (artifact.status !== 'quarantined') throw new Error('artifact is not quarantined')

    const sizeMatches = output.byteSize === artifact.byteSize
    const accepted = output.decision === 'accepted' && sizeMatches
    const rejectionCode = accepted
      ? null
      : sizeMatches && output.decision === 'rejected'
        ? output.rejectionCode
        : 'size-mismatch'
    const now = new Date()

    await tx
      .update(artifactTable)
      .set({
        status: accepted ? 'available' : 'rejected',
        sha256: output.sha256,
        detectedMediaType: output.detectedMediaType,
        rejectionCode,
        scannedAt: now,
        availableAt: accepted ? now : null,
      })
      .where(eq(artifactTable.id, input.artifactId))
    if (!accepted) {
      await tx
        .update(organizationTable)
        .set({ storageUsedBytes: sql`${organizationTable.storageUsedBytes} - ${artifact.byteSize}` })
        .where(eq(organizationTable.id, artifact.organizationId))
    }
    await tx
      .update(artifactInspectionJobTable)
      .set({ status: 'succeeded', completedAt: now, failureCode: null })
      .where(eq(artifactInspectionJobTable.artifactId, input.artifactId))
    await tx.insert(auditEventTable).values({
      organizationId: artifact.organizationId,
      projectId: artifact.projectId,
      actorType: 'system',
      actorUserId: null,
      action: accepted ? 'artifact.available' : 'artifact.rejected',
      targetType: 'artifact',
      targetId: input.artifactId,
      requestId: `compute:artifact:${input.artifactId}`,
      detail: {
        sha256: output.sha256,
        byteSize: output.byteSize,
        detectedMediaType: output.detectedMediaType,
        scanner: output.scanner,
        scannerVersion: output.scannerVersion,
        ...(rejectionCode ? { rejectionCode } : {}),
      },
    })
  })
}

export function failArtifactInspection(db: Db, input: { artifactId: string; failureCode: string }): Promise<void> {
  return withCivilComputeContext(db, async (tx) => {
    await tx
      .update(artifactInspectionJobTable)
      .set({ status: 'failed', failureCode: input.failureCode.slice(0, 120), completedAt: new Date() })
      .where(
        and(
          eq(artifactInspectionJobTable.artifactId, input.artifactId),
          inArray(artifactInspectionJobTable.status, ['queued', 'running', 'failed']),
        ),
      )
  })
}

export function listUndispatchedArtifactInspections(db: Db) {
  return withCivilComputeContext(db, (tx) =>
    tx
      .select({ artifactId: artifactInspectionJobTable.artifactId })
      .from(artifactInspectionJobTable)
      .where(
        and(
          eq(artifactInspectionJobTable.status, 'queued'),
          isNull(artifactInspectionJobTable.dispatchedAt),
          lt(artifactInspectionJobTable.dispatchAttemptCount, 100),
        ),
      )
      .orderBy(asc(artifactInspectionJobTable.queuedAt))
      .limit(100),
  )
}

export function markArtifactInspectionDispatchedBySystem(db: Db, artifactId: string): Promise<void> {
  return withCivilComputeContext(db, async (tx) => {
    await tx
      .update(artifactInspectionJobTable)
      .set({
        dispatchedAt: new Date(),
        dispatchAttemptCount: sql`${artifactInspectionJobTable.dispatchAttemptCount} + 1`,
        failureCode: null,
      })
      .where(
        and(
          eq(artifactInspectionJobTable.artifactId, artifactId),
          eq(artifactInspectionJobTable.status, 'queued'),
          isNull(artifactInspectionJobTable.dispatchedAt),
        ),
      )
  })
}

export function markArtifactInspectionDispatchFailedBySystem(db: Db, artifactId: string): Promise<void> {
  return withCivilComputeContext(db, async (tx) => {
    await tx
      .update(artifactInspectionJobTable)
      .set({
        dispatchAttemptCount: sql`${artifactInspectionJobTable.dispatchAttemptCount} + 1`,
        failureCode: 'queue-dispatch-failed',
      })
      .where(
        and(
          eq(artifactInspectionJobTable.artifactId, artifactId),
          eq(artifactInspectionJobTable.status, 'queued'),
          isNull(artifactInspectionJobTable.dispatchedAt),
        ),
      )
  })
}
