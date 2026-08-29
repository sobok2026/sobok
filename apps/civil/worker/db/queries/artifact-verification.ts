import {
  type CivilArtifactVerificationClaim,
  type CivilArtifactVerificationOutput,
  CivilArtifactVerificationOutputSchema,
  CivilArtifactVerificationWorkSchema,
} from '@sobok/civil/artifact'
import type { Db } from '@sobok/edge/db/client'
import { and, eq, inArray, lt, or, sql } from 'drizzle-orm'
import { withCivilComputeContext } from '../context'
import { organizationTable } from '../schema/tenancy'
import { artifactTable, artifactVerificationJobTable, auditEventTable } from '../schema/work'

export function claimArtifactVerification(db: Db, artifactId: string): Promise<CivilArtifactVerificationClaim> {
  return withCivilComputeContext(db, async (tx) => {
    const [cleanup] = await tx
      .select({ objectKey: artifactTable.objectKey })
      .from(artifactVerificationJobTable)
      .innerJoin(artifactTable, eq(artifactTable.id, artifactVerificationJobTable.artifactId))
      .where(
        and(
          eq(artifactVerificationJobTable.artifactId, artifactId),
          eq(artifactVerificationJobTable.cleanupRequired, true),
        ),
      )
      .limit(1)
    if (cleanup) return { status: 'cleanup', objectKey: cleanup.objectKey }

    const [job] = await tx
      .update(artifactVerificationJobTable)
      .set({
        status: 'running',
        startedAt: new Date(),
        failureCode: null,
        attemptCount: sql`${artifactVerificationJobTable.attemptCount} + 1`,
      })
      .where(
        and(
          eq(artifactVerificationJobTable.artifactId, artifactId),
          or(
            inArray(artifactVerificationJobTable.status, ['queued', 'failed']),
            and(
              eq(artifactVerificationJobTable.status, 'running'),
              lt(artifactVerificationJobTable.startedAt, sql`now() - interval '10 minutes'`),
            ),
          ),
        ),
      )
      .returning({ artifactId: artifactVerificationJobTable.artifactId })
    if (!job) {
      const [current] = await tx
        .select({ status: artifactVerificationJobTable.status })
        .from(artifactVerificationJobTable)
        .where(eq(artifactVerificationJobTable.artifactId, artifactId))
        .limit(1)
      return !current || current.status === 'succeeded' ? { status: 'complete' } : { status: 'retry' }
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
        status: artifactTable.status,
      })
      .from(artifactTable)
      .where(eq(artifactTable.id, artifactId))
      .limit(1)
    if (artifact && !['verifying', 'verification_failed'].includes(artifact.status)) {
      await tx
        .update(artifactVerificationJobTable)
        .set({ status: 'succeeded', completedAt: new Date() })
        .where(eq(artifactVerificationJobTable.artifactId, artifactId))
      return { status: 'complete' }
    }
    if (!artifact) return { status: 'complete' }
    if (artifact.status === 'verification_failed') {
      await tx
        .update(artifactTable)
        .set({ status: 'verifying', verificationFailureCode: null })
        .where(eq(artifactTable.id, artifactId))
    }
    const { status: _status, ...work } = artifact
    const parsed = CivilArtifactVerificationWorkSchema.safeParse(work)
    if (!parsed.success) {
      await tx
        .update(artifactVerificationJobTable)
        .set({ status: 'failed', failureCode: 'invalid-verification-snapshot', completedAt: new Date() })
        .where(eq(artifactVerificationJobTable.artifactId, artifactId))
      return { status: 'complete' }
    }
    return { status: 'work', work: parsed.data }
  })
}

export function completeArtifactVerification(
  db: Db,
  input: { artifactId: string; output: CivilArtifactVerificationOutput },
): Promise<void> {
  return withCivilComputeContext(db, async (tx) => {
    const output = CivilArtifactVerificationOutputSchema.parse(input.output)
    const [artifact] = await tx
      .select({
        organizationId: artifactTable.organizationId,
        projectId: artifactTable.projectId,
        byteSize: artifactTable.byteSize,
        status: artifactTable.status,
      })
      .from(artifactTable)
      .where(eq(artifactTable.id, input.artifactId))
      .limit(1)
      .for('update')
    if (!artifact) throw new Error('artifact not found')
    if (artifact.status !== 'verifying') return

    const now = new Date()
    if (output.decision === 'accepted') {
      await tx
        .update(artifactTable)
        .set({
          status: 'available',
          detectedMediaType: output.detectedMediaType,
          detectedFormat: output.detectedFormat,
          sha256: output.sha256,
          verifiedAt: now,
          availableAt: now,
          rejectionCode: null,
          verificationFailureCode: null,
        })
        .where(eq(artifactTable.id, input.artifactId))
    } else {
      await tx
        .update(artifactTable)
        .set({
          status: 'rejected',
          detectedMediaType: output.detectedMediaType,
          detectedFormat: output.detectedFormat,
          sha256: output.sha256,
          verifiedAt: now,
          rejectionCode: output.rejectionCode,
          verificationFailureCode: null,
        })
        .where(eq(artifactTable.id, input.artifactId))
      await tx
        .update(organizationTable)
        .set({ storageUsedBytes: sql`${organizationTable.storageUsedBytes} - ${artifact.byteSize}` })
        .where(eq(organizationTable.id, artifact.organizationId))
    }
    await tx
      .update(artifactVerificationJobTable)
      .set({
        status: 'succeeded',
        completedAt: now,
        failureCode: null,
        cleanupRequired: output.decision === 'rejected',
      })
      .where(eq(artifactVerificationJobTable.artifactId, input.artifactId))
    await tx.insert(auditEventTable).values({
      organizationId: artifact.organizationId,
      projectId: artifact.projectId,
      actorType: 'system',
      actorUserId: null,
      action: output.decision === 'accepted' ? 'artifact.verified' : 'artifact.rejected',
      targetType: 'artifact',
      targetId: input.artifactId,
      requestId: `compute:artifact:${input.artifactId}`,
      detail: {
        sha256: output.sha256,
        detectedFormat: output.detectedFormat,
        ...(output.decision === 'rejected' ? { rejectionCode: output.rejectionCode } : {}),
      },
    })
  })
}

export function failArtifactVerification(db: Db, input: { artifactId: string; failureCode: string }): Promise<void> {
  return withCivilComputeContext(db, async (tx) => {
    const [job] = await tx
      .update(artifactVerificationJobTable)
      .set({ status: 'failed', failureCode: input.failureCode.slice(0, 120), completedAt: new Date() })
      .where(
        and(
          eq(artifactVerificationJobTable.artifactId, input.artifactId),
          inArray(artifactVerificationJobTable.status, ['queued', 'running']),
        ),
      )
      .returning({ artifactId: artifactVerificationJobTable.artifactId })
    if (!job) return
    await tx
      .update(artifactTable)
      .set({ status: 'verification_failed', verificationFailureCode: input.failureCode.slice(0, 120) })
      .where(and(eq(artifactTable.id, input.artifactId), eq(artifactTable.status, 'verifying')))
  })
}

export function completeArtifactCleanup(db: Db, artifactId: string): Promise<void> {
  return withCivilComputeContext(db, async (tx) => {
    await tx
      .update(artifactVerificationJobTable)
      .set({ cleanupRequired: false })
      .where(eq(artifactVerificationJobTable.artifactId, artifactId))
  })
}
