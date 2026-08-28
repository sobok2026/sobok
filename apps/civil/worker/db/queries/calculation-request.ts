import type { EarthworkAverageEndAreaInput } from '@sobok/civil/calculation'
import type { Db } from '@sobok/edge/db/client'
import { and, eq } from 'drizzle-orm'
import { withCivilContext } from '../context'
import { auditEventTable, calculationJobTable, calculationResultTable } from '../schema/work'
import { canWriteProject } from './project'

export function createEarthworkCalculationJob(
  db: Db,
  input: {
    userId: string
    organizationId: string
    projectId: string
    algorithmVersion: string
    inputHash: string
    calculationInput: EarthworkAverageEndAreaInput
    requestId: string
  },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canWriteProject(tx, input.userId, input.organizationId, input.projectId))) return null
    const [job] = await tx
      .insert(calculationJobTable)
      .values({
        organizationId: input.organizationId,
        projectId: input.projectId,
        kind: 'earthwork-average-end-area',
        algorithmVersion: input.algorithmVersion,
        inputSnapshot: input.calculationInput,
        inputHash: input.inputHash,
        requestedByUserId: input.userId,
      })
      .returning({ id: calculationJobTable.id, status: calculationJobTable.status })
    if (!job) throw new Error('calculation job insert returned no row')
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.userId,
      action: 'calculation.requested',
      targetType: 'calculation_job',
      targetId: job.id,
      requestId: input.requestId,
      detail: { algorithmVersion: input.algorithmVersion, inputHash: input.inputHash },
    })
    return job
  })
}

export function markCalculationDispatchFailed(
  db: Db,
  input: { userId: string; organizationId: string; jobId: string },
): Promise<void> {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    await tx
      .update(calculationJobTable)
      .set({ status: 'failed', failureCode: 'queue-dispatch-failed', completedAt: new Date() })
      .where(and(eq(calculationJobTable.id, input.jobId), eq(calculationJobTable.organizationId, input.organizationId)))
  })
}

export function getCalculation(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; jobId: string },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    const [job] = await tx
      .select({
        id: calculationJobTable.id,
        kind: calculationJobTable.kind,
        status: calculationJobTable.status,
        algorithmVersion: calculationJobTable.algorithmVersion,
        inputHash: calculationJobTable.inputHash,
        failureCode: calculationJobTable.failureCode,
        queuedAt: calculationJobTable.queuedAt,
        startedAt: calculationJobTable.startedAt,
        completedAt: calculationJobTable.completedAt,
      })
      .from(calculationJobTable)
      .where(
        and(
          eq(calculationJobTable.id, input.jobId),
          eq(calculationJobTable.organizationId, input.organizationId),
          eq(calculationJobTable.projectId, input.projectId),
        ),
      )
      .limit(1)
    if (!job) return null
    const [result] = await tx
      .select({
        id: calculationResultTable.id,
        revision: calculationResultTable.revision,
        output: calculationResultTable.outputSnapshot,
        outputHash: calculationResultTable.outputHash,
        unitSystem: calculationResultTable.unitSystem,
        coordinateReferenceSystem: calculationResultTable.coordinateReferenceSystem,
        createdAt: calculationResultTable.createdAt,
      })
      .from(calculationResultTable)
      .where(eq(calculationResultTable.jobId, input.jobId))
      .orderBy(calculationResultTable.revision)
      .limit(1)
    return { job, result: result ?? null }
  })
}
