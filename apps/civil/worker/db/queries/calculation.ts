import {
  type CivilCalculationClaim,
  type CivilCalculationOutput,
  CivilCalculationOutputSchema,
  CivilCalculationWorkSchema,
} from '@sobok/civil/calculation'
import type { Db } from '@sobok/edge/db/client'
import { and, eq, inArray, lt, or, sql } from 'drizzle-orm'
import { withCivilComputeContext } from '../context'
import { auditEventTable, calculationJobTable, calculationResultTable } from '../schema/work'

export function claimCalculation(db: Db, jobId: string): Promise<CivilCalculationClaim> {
  return withCivilComputeContext(db, async (tx) => {
    const [job] = await tx
      .update(calculationJobTable)
      .set({ status: 'running', startedAt: new Date(), failureCode: null })
      .where(
        and(
          eq(calculationJobTable.id, jobId),
          or(
            inArray(calculationJobTable.status, ['queued', 'failed']),
            and(
              eq(calculationJobTable.status, 'running'),
              lt(calculationJobTable.startedAt, sql`now() - interval '5 minutes'`),
            ),
          ),
        ),
      )
      .returning({
        jobId: calculationJobTable.id,
        organizationId: calculationJobTable.organizationId,
        projectId: calculationJobTable.projectId,
        kind: calculationJobTable.kind,
        algorithmVersion: calculationJobTable.algorithmVersion,
        input: calculationJobTable.inputSnapshot,
      })
    if (!job) {
      const [current] = await tx
        .select({ status: calculationJobTable.status })
        .from(calculationJobTable)
        .where(eq(calculationJobTable.id, jobId))
        .limit(1)
      return !current || current.status === 'succeeded' || current.status === 'cancelled'
        ? { status: 'complete' }
        : { status: 'retry' }
    }

    const parsed = CivilCalculationWorkSchema.safeParse(job)
    if (!parsed.success) {
      await tx
        .update(calculationJobTable)
        .set({ status: 'failed', failureCode: 'invalid-input-snapshot', completedAt: new Date() })
        .where(eq(calculationJobTable.id, jobId))
      await tx.insert(auditEventTable).values({
        organizationId: job.organizationId,
        projectId: job.projectId,
        actorType: 'system',
        actorUserId: null,
        action: 'calculation.rejected',
        targetType: 'calculation_job',
        targetId: jobId,
        requestId: `compute:${jobId}`,
        detail: { failureCode: 'invalid-input-snapshot' },
      })
      return { status: 'complete' }
    }
    return { status: 'work', work: parsed.data }
  })
}

export function completeCalculation(
  db: Db,
  input: { jobId: string; output: CivilCalculationOutput; outputHash: string },
): Promise<void> {
  return withCivilComputeContext(db, async (tx) => {
    const output = CivilCalculationOutputSchema.parse(input.output)
    const [job] = await tx
      .select({
        organizationId: calculationJobTable.organizationId,
        projectId: calculationJobTable.projectId,
      })
      .from(calculationJobTable)
      .where(eq(calculationJobTable.id, input.jobId))
      .limit(1)
    if (!job) throw new Error('calculation job not found')

    await tx
      .insert(calculationResultTable)
      .values({
        organizationId: job.organizationId,
        projectId: job.projectId,
        jobId: input.jobId,
        revision: 1,
        outputSnapshot: output,
        outputHash: input.outputHash,
        coordinateReferenceSystem: output.coordinateReferenceSystem,
      })
      .onConflictDoNothing({ target: [calculationResultTable.jobId, calculationResultTable.revision] })

    await tx
      .update(calculationJobTable)
      .set({ status: 'succeeded', completedAt: new Date(), failureCode: null })
      .where(eq(calculationJobTable.id, input.jobId))
    await tx.insert(auditEventTable).values({
      organizationId: job.organizationId,
      projectId: job.projectId,
      actorType: 'system',
      actorUserId: null,
      action: 'calculation.succeeded',
      targetType: 'calculation_job',
      targetId: input.jobId,
      requestId: `compute:${input.jobId}`,
      detail: { outputHash: input.outputHash },
    })
  })
}

export function failCalculation(db: Db, input: { jobId: string; failureCode: string }): Promise<void> {
  return withCivilComputeContext(db, async (tx) => {
    const [job] = await tx
      .update(calculationJobTable)
      .set({ status: 'failed', failureCode: input.failureCode.slice(0, 120), completedAt: new Date() })
      .where(and(eq(calculationJobTable.id, input.jobId), inArray(calculationJobTable.status, ['queued', 'running'])))
      .returning({ organizationId: calculationJobTable.organizationId, projectId: calculationJobTable.projectId })
    if (!job) return
    await tx.insert(auditEventTable).values({
      organizationId: job.organizationId,
      projectId: job.projectId,
      actorType: 'system',
      actorUserId: null,
      action: 'calculation.failed',
      targetType: 'calculation_job',
      targetId: input.jobId,
      requestId: `compute:${input.jobId}`,
      detail: { failureCode: input.failureCode.slice(0, 120) },
    })
  })
}
