import type { CivilCalculationApprovalAction } from '@sobok/civil/collaboration'
import type { Db } from '@sobok/edge/db/client'
import { and, desc, eq, inArray, lt } from 'drizzle-orm'
import { withCivilContext } from '../context'
import { civilUser } from '../schema/auth'
import { approvalTable, auditEventTable, calculationJobTable, calculationResultTable } from '../schema/work'
import { canApproveProject, canContributeProject, canReviewProject, getEffectiveProjectRole } from './project'

export function listProjectCalculations(db: Db, input: { userId: string; organizationId: string; projectId: string }) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    const role = await getEffectiveProjectRole(tx, input.userId, input.organizationId, input.projectId)
    if (!role) return null
    const jobs = await tx
      .select({
        id: calculationJobTable.id,
        kind: calculationJobTable.kind,
        status: calculationJobTable.status,
        algorithmVersion: calculationJobTable.algorithmVersion,
        input: calculationJobTable.inputSnapshot,
        inputHash: calculationJobTable.inputHash,
        failureCode: calculationJobTable.failureCode,
        requestedByUserId: calculationJobTable.requestedByUserId,
        queuedAt: calculationJobTable.queuedAt,
        startedAt: calculationJobTable.startedAt,
        completedAt: calculationJobTable.completedAt,
      })
      .from(calculationJobTable)
      .where(
        and(
          eq(calculationJobTable.organizationId, input.organizationId),
          eq(calculationJobTable.projectId, input.projectId),
        ),
      )
      .orderBy(desc(calculationJobTable.queuedAt))
      .limit(100)
    const jobIds = jobs.map((job) => job.id)
    const results =
      jobIds.length === 0
        ? []
        : await tx
            .select({
              id: calculationResultTable.id,
              jobId: calculationResultTable.jobId,
              revision: calculationResultTable.revision,
              output: calculationResultTable.outputSnapshot,
              outputHash: calculationResultTable.outputHash,
              unitSystem: calculationResultTable.unitSystem,
              coordinateReferenceSystem: calculationResultTable.coordinateReferenceSystem,
              createdAt: calculationResultTable.createdAt,
            })
            .from(calculationResultTable)
            .where(inArray(calculationResultTable.jobId, jobIds))
            .orderBy(desc(calculationResultTable.revision))
    const resultIds = results.map((result) => result.id)
    const approvals =
      resultIds.length === 0
        ? []
        : await tx
            .select({
              id: approvalTable.id,
              resultId: approvalTable.resultId,
              status: approvalTable.status,
              note: approvalTable.note,
              actedByUserId: approvalTable.actedByUserId,
              actedAt: approvalTable.actedAt,
            })
            .from(approvalTable)
            .where(inArray(approvalTable.resultId, resultIds))
            .orderBy(desc(approvalTable.actedAt))
    const resultByJob = new Map<string, (typeof results)[number]>()
    for (const result of results) {
      if (!resultByJob.has(result.jobId)) resultByJob.set(result.jobId, result)
    }
    const latestApprovalByResult = new Map<string, (typeof approvals)[number]>()
    for (const approval of approvals) {
      if (!latestApprovalByResult.has(approval.resultId)) latestApprovalByResult.set(approval.resultId, approval)
    }
    return {
      role,
      canCreate: await canContributeProject(tx, input.userId, input.organizationId, input.projectId),
      canReview: await canReviewProject(tx, input.userId, input.organizationId, input.projectId),
      canApprove: await canApproveProject(tx, input.userId, input.organizationId, input.projectId),
      items: jobs.map((job) => {
        const result = resultByJob.get(job.id) ?? null
        return { job, result, approval: result ? (latestApprovalByResult.get(result.id) ?? null) : null }
      }),
    }
  })
}

export function actOnCalculationApproval(
  db: Db,
  input: {
    userId: string
    organizationId: string
    projectId: string
    resultId: string
    action: CivilCalculationApprovalAction
    note: string | null
    requestId: string
  },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    const allowed =
      input.action === 'submit'
        ? await canContributeProject(tx, input.userId, input.organizationId, input.projectId)
        : input.action === 'request_changes'
          ? await canReviewProject(tx, input.userId, input.organizationId, input.projectId)
          : await canApproveProject(tx, input.userId, input.organizationId, input.projectId)
    if (!allowed) return { kind: 'forbidden' as const }
    const [result] = await tx
      .select({ id: calculationResultTable.id, outputHash: calculationResultTable.outputHash })
      .from(calculationResultTable)
      .where(
        and(
          eq(calculationResultTable.id, input.resultId),
          eq(calculationResultTable.organizationId, input.organizationId),
          eq(calculationResultTable.projectId, input.projectId),
        ),
      )
      .limit(1)
      .for('update')
    if (!result) return { kind: 'missing' as const }
    const [latest] = await tx
      .select({ status: approvalTable.status })
      .from(approvalTable)
      .where(eq(approvalTable.resultId, input.resultId))
      .orderBy(desc(approvalTable.actedAt))
      .limit(1)
    const currentStatus = latest?.status ?? null
    const nextStatus =
      input.action === 'submit' ? 'submitted' : input.action === 'request_changes' ? 'changes_requested' : 'approved'
    const valid =
      (input.action === 'submit' &&
        (currentStatus === null || ['draft', 'changes_requested'].includes(currentStatus))) ||
      ((input.action === 'request_changes' || input.action === 'approve') && currentStatus === 'submitted')
    if (!valid) return { kind: 'conflict' as const }
    const [approval] = await tx
      .insert(approvalTable)
      .values({
        organizationId: input.organizationId,
        projectId: input.projectId,
        resultId: input.resultId,
        status: nextStatus,
        note: input.note,
        actedByUserId: input.userId,
      })
      .returning({ id: approvalTable.id, status: approvalTable.status, actedAt: approvalTable.actedAt })
    if (!approval) throw new Error('calculation approval insert returned no row')
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.userId,
      action: `calculation_approval.${input.action}`,
      targetType: 'calculation_result',
      targetId: input.resultId,
      requestId: input.requestId,
      detail: { previousStatus: currentStatus, status: nextStatus, outputHash: result.outputHash },
    })
    return { kind: 'acted' as const, approval }
  })
}

export function listProjectAuditEvents(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; beforeId: number | null; limit: number },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    const role = await getEffectiveProjectRole(tx, input.userId, input.organizationId, input.projectId)
    if (!role) return null
    const conditions = [
      eq(auditEventTable.organizationId, input.organizationId),
      eq(auditEventTable.projectId, input.projectId),
    ]
    if (input.beforeId !== null) conditions.push(lt(auditEventTable.id, input.beforeId))
    const items = await tx
      .select({
        id: auditEventTable.id,
        actorType: auditEventTable.actorType,
        actorUserId: auditEventTable.actorUserId,
        actorName: civilUser.name,
        actorEmail: civilUser.email,
        action: auditEventTable.action,
        targetType: auditEventTable.targetType,
        targetId: auditEventTable.targetId,
        requestId: auditEventTable.requestId,
        detail: auditEventTable.detail,
        createdAt: auditEventTable.createdAt,
      })
      .from(auditEventTable)
      .leftJoin(civilUser, eq(civilUser.id, auditEventTable.actorUserId))
      .where(and(...conditions))
      .orderBy(desc(auditEventTable.id))
      .limit(input.limit)
    return { role, items }
  })
}
