import { canonicalJson } from '@sobok/civil/calculation'
import type {
  CivilDesignReviewArea,
  CivilDesignReviewResult,
  CivilDesignTransition,
  CivilDesignWorkType,
} from '@sobok/civil/collaboration'
import type { Db } from '@sobok/edge/db/client'
import { sha256Hex } from '@sobok/edge/tokens'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { type CivilTransaction, withCivilContext } from '../context'
import {
  designFinalizationTable,
  designReviewItemTable,
  designRevisionEventTable,
  designRevisionTable,
} from '../schema/collaboration'
import { projectTable } from '../schema/tenancy'
import { artifactTable, auditEventTable, calculationResultTable } from '../schema/work'
import { canApproveProject, canContributeProject, canReviewProject, getEffectiveProjectRole } from './project'

type RevisionLinks = {
  baseDrawingArtifactId: string | null
  newDrawingArtifactId: string | null
  baseCalculationResultId: string | null
  newCalculationResultId: string | null
}

async function linksBelongToProject(
  tx: CivilTransaction,
  organizationId: string,
  projectId: string,
  links: RevisionLinks,
): Promise<boolean> {
  const artifactIds = [links.baseDrawingArtifactId, links.newDrawingArtifactId].filter(
    (value): value is string => value !== null,
  )
  if (artifactIds.length > 0) {
    const artifacts = await tx
      .select({ id: artifactTable.id })
      .from(artifactTable)
      .where(
        and(
          eq(artifactTable.organizationId, organizationId),
          eq(artifactTable.projectId, projectId),
          eq(artifactTable.status, 'available'),
          eq(artifactTable.kind, 'drawing'),
          inArray(artifactTable.id, artifactIds),
        ),
      )
    if (new Set(artifacts.map((item) => item.id)).size !== new Set(artifactIds).size) return false
  }
  const resultIds = [links.baseCalculationResultId, links.newCalculationResultId].filter(
    (value): value is string => value !== null,
  )
  if (resultIds.length > 0) {
    const results = await tx
      .select({ id: calculationResultTable.id })
      .from(calculationResultTable)
      .where(
        and(
          eq(calculationResultTable.organizationId, organizationId),
          eq(calculationResultTable.projectId, projectId),
          inArray(calculationResultTable.id, resultIds),
        ),
      )
    if (new Set(results.map((item) => item.id)).size !== new Set(resultIds).size) return false
  }
  return true
}

async function projectCapabilities(tx: CivilTransaction, userId: string, organizationId: string, projectId: string) {
  const role = await getEffectiveProjectRole(tx, userId, organizationId, projectId)
  if (!role) return null
  return {
    role,
    canContribute: await canContributeProject(tx, userId, organizationId, projectId),
    canReview: await canReviewProject(tx, userId, organizationId, projectId),
    canApprove: await canApproveProject(tx, userId, organizationId, projectId),
  }
}

export function listDesignRevisions(db: Db, input: { userId: string; organizationId: string; projectId: string }) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    const capabilities = await projectCapabilities(tx, input.userId, input.organizationId, input.projectId)
    if (!capabilities) return null
    const items = await tx
      .select({
        id: designRevisionTable.id,
        workType: designRevisionTable.workType,
        revisionNumber: designRevisionTable.revisionNumber,
        title: designRevisionTable.title,
        status: designRevisionTable.status,
        reason: designRevisionTable.reason,
        documentNumber: designRevisionTable.documentNumber,
        scheduleImpactDays: designRevisionTable.scheduleImpactDays,
        costImpactAmount: designRevisionTable.costImpactAmount,
        createdByUserId: designRevisionTable.createdByUserId,
        submittedAt: designRevisionTable.submittedAt,
        approvedAt: designRevisionTable.approvedAt,
        finalizedAt: designRevisionTable.finalizedAt,
        createdAt: designRevisionTable.createdAt,
        updatedAt: designRevisionTable.updatedAt,
        reviewCount: sql<number>`(
          select count(*)::integer from "civil"."design_review_item" as review
          where review."revision_id" = ${designRevisionTable.id}
        )`.mapWith(Number),
        unresolvedReviewCount: sql<number>`(
          select count(*)::integer from "civil"."design_review_item" as review
          where review."revision_id" = ${designRevisionTable.id}
            and review."result" in ('unreviewed', 'changes_required')
        )`.mapWith(Number),
      })
      .from(designRevisionTable)
      .where(
        and(
          eq(designRevisionTable.organizationId, input.organizationId),
          eq(designRevisionTable.projectId, input.projectId),
        ),
      )
      .orderBy(desc(designRevisionTable.createdAt))
    return { ...capabilities, items }
  })
}

export function createDesignRevision(
  db: Db,
  input: {
    userId: string
    organizationId: string
    projectId: string
    workType: CivilDesignWorkType
    title: string
    reason: string | null
    legalBasis: string | null
    documentNumber: string | null
    scheduleImpactDays: number | null
    costImpactAmount: number | null
    links: RevisionLinks
    requestId: string
  },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canContributeProject(tx, input.userId, input.organizationId, input.projectId))) {
      return { kind: 'forbidden' as const }
    }
    const [project] = await tx
      .select({ id: projectTable.id })
      .from(projectTable)
      .where(and(eq(projectTable.organizationId, input.organizationId), eq(projectTable.id, input.projectId)))
      .limit(1)
      .for('update')
    if (!project) return { kind: 'missing' as const }
    if (!(await linksBelongToProject(tx, input.organizationId, input.projectId, input.links))) {
      return { kind: 'invalid-links' as const }
    }
    const [next] = await tx
      .select({
        revisionNumber: sql<number>`coalesce(max(${designRevisionTable.revisionNumber}), 0)::integer + 1`.mapWith(
          Number,
        ),
      })
      .from(designRevisionTable)
      .where(and(eq(designRevisionTable.projectId, input.projectId), eq(designRevisionTable.workType, input.workType)))
    const revisionNumber = next?.revisionNumber ?? 1
    const [item] = await tx
      .insert(designRevisionTable)
      .values({
        organizationId: input.organizationId,
        projectId: input.projectId,
        workType: input.workType,
        revisionNumber,
        title: input.title,
        reason: input.reason,
        legalBasis: input.legalBasis,
        documentNumber: input.documentNumber,
        scheduleImpactDays: input.scheduleImpactDays,
        costImpactAmount: input.costImpactAmount,
        ...input.links,
        createdByUserId: input.userId,
      })
      .returning()
    if (!item) throw new Error('design revision insert returned no row')
    await tx.insert(designRevisionEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      revisionId: item.id,
      fromStatus: null,
      toStatus: 'draft',
      note: '설계회차 작성 시작',
      actorType: 'user',
      actorUserId: input.userId,
    })
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.userId,
      action: 'design_revision.created',
      targetType: 'design_revision',
      targetId: item.id,
      requestId: input.requestId,
      detail: { workType: input.workType, revisionNumber },
    })
    await tx
      .update(projectTable)
      .set({ status: 'design' })
      .where(and(eq(projectTable.id, input.projectId), eq(projectTable.status, 'planning')))
    return { kind: 'created' as const, item }
  })
}

export function updateDesignRevision(
  db: Db,
  input: {
    userId: string
    organizationId: string
    projectId: string
    revisionId: string
    title: string
    reason: string | null
    legalBasis: string | null
    documentNumber: string | null
    scheduleImpactDays: number | null
    costImpactAmount: number | null
    links: RevisionLinks
    requestId: string
  },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canContributeProject(tx, input.userId, input.organizationId, input.projectId))) {
      return { kind: 'forbidden' as const }
    }
    if (!(await linksBelongToProject(tx, input.organizationId, input.projectId, input.links))) {
      return { kind: 'invalid-links' as const }
    }
    const [item] = await tx
      .update(designRevisionTable)
      .set({
        title: input.title,
        reason: input.reason,
        legalBasis: input.legalBasis,
        documentNumber: input.documentNumber,
        scheduleImpactDays: input.scheduleImpactDays,
        costImpactAmount: input.costImpactAmount,
        ...input.links,
      })
      .where(
        and(
          eq(designRevisionTable.id, input.revisionId),
          eq(designRevisionTable.organizationId, input.organizationId),
          eq(designRevisionTable.projectId, input.projectId),
          inArray(designRevisionTable.status, ['draft', 'changes_requested']),
        ),
      )
      .returning()
    if (!item) return { kind: 'conflict' as const }
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.userId,
      action: 'design_revision.updated',
      targetType: 'design_revision',
      targetId: input.revisionId,
      requestId: input.requestId,
    })
    return { kind: 'updated' as const, item }
  })
}

async function reviewItemsForRevision(tx: CivilTransaction, revisionId: string) {
  return tx
    .select({
      id: designReviewItemTable.id,
      area: designReviewItemTable.area,
      item: designReviewItemTable.item,
      result: designReviewItemTable.result,
      comment: designReviewItemTable.comment,
      response: designReviewItemTable.response,
      reviewedByUserId: designReviewItemTable.reviewedByUserId,
      respondedByUserId: designReviewItemTable.respondedByUserId,
      reviewedAt: designReviewItemTable.reviewedAt,
      respondedAt: designReviewItemTable.respondedAt,
      createdAt: designReviewItemTable.createdAt,
      updatedAt: designReviewItemTable.updatedAt,
    })
    .from(designReviewItemTable)
    .where(eq(designReviewItemTable.revisionId, revisionId))
    .orderBy(asc(designReviewItemTable.createdAt))
}

export function getDesignRevision(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; revisionId: string },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    const capabilities = await projectCapabilities(tx, input.userId, input.organizationId, input.projectId)
    if (!capabilities) return null
    const [item] = await tx
      .select()
      .from(designRevisionTable)
      .where(
        and(
          eq(designRevisionTable.id, input.revisionId),
          eq(designRevisionTable.organizationId, input.organizationId),
          eq(designRevisionTable.projectId, input.projectId),
        ),
      )
      .limit(1)
    if (!item) return null
    const reviews = await reviewItemsForRevision(tx, input.revisionId)
    const events = await tx
      .select()
      .from(designRevisionEventTable)
      .where(eq(designRevisionEventTable.revisionId, input.revisionId))
      .orderBy(asc(designRevisionEventTable.createdAt))
    const [finalization] = await tx
      .select({
        id: designFinalizationTable.id,
        snapshotHash: designFinalizationTable.snapshotHash,
        finalizedByUserId: designFinalizationTable.finalizedByUserId,
        createdAt: designFinalizationTable.createdAt,
      })
      .from(designFinalizationTable)
      .where(eq(designFinalizationTable.revisionId, input.revisionId))
      .limit(1)
    return { ...capabilities, item, reviews, events, finalization: finalization ?? null }
  })
}

const TRANSITIONS: Record<
  CivilDesignTransition,
  { from: string[]; to: (typeof designRevisionTable.$inferSelect)['status'] }
> = {
  submit: { from: ['draft', 'changes_requested'], to: 'submitted' },
  start_review: { from: ['submitted'], to: 'under_review' },
  request_changes: { from: ['under_review'], to: 'changes_requested' },
  request_approval: { from: ['under_review'], to: 'awaiting_approval' },
  approve: { from: ['awaiting_approval'], to: 'approved' },
  finalize: { from: ['approved'], to: 'finalized' },
}

async function canPerformTransition(
  tx: CivilTransaction,
  input: { userId: string; organizationId: string; projectId: string; action: CivilDesignTransition },
) {
  if (input.action === 'submit') return canContributeProject(tx, input.userId, input.organizationId, input.projectId)
  if (input.action === 'start_review' || input.action === 'request_changes' || input.action === 'request_approval') {
    return canReviewProject(tx, input.userId, input.organizationId, input.projectId)
  }
  return canApproveProject(tx, input.userId, input.organizationId, input.projectId)
}

export function transitionDesignRevision(
  db: Db,
  input: {
    userId: string
    organizationId: string
    projectId: string
    revisionId: string
    action: CivilDesignTransition
    note: string | null
    requestId: string
  },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canPerformTransition(tx, input))) return { kind: 'forbidden' as const }
    const [revision] = await tx
      .select()
      .from(designRevisionTable)
      .where(
        and(
          eq(designRevisionTable.id, input.revisionId),
          eq(designRevisionTable.organizationId, input.organizationId),
          eq(designRevisionTable.projectId, input.projectId),
        ),
      )
      .limit(1)
      .for('update')
    if (!revision) return { kind: 'missing' as const }
    const transition = TRANSITIONS[input.action]
    if (!transition.from.includes(revision.status)) return { kind: 'conflict' as const }
    const reviews = await reviewItemsForRevision(tx, input.revisionId)
    if (
      input.action === 'request_approval' &&
      (reviews.length === 0 ||
        reviews.some((review) => review.result === 'unreviewed' || review.result === 'changes_required'))
    ) {
      return { kind: 'reviews-unresolved' as const }
    }

    const now = new Date()
    if (input.action === 'finalize') {
      const snapshot = {
        schemaVersion: 'sobok.civil.design-finalization.v1',
        finalizedByUserId: input.userId,
        finalizedAt: now.toISOString(),
        revision: {
          id: revision.id,
          organizationId: revision.organizationId,
          projectId: revision.projectId,
          workType: revision.workType,
          revisionNumber: revision.revisionNumber,
          title: revision.title,
          status: revision.status,
          reason: revision.reason,
          legalBasis: revision.legalBasis,
          documentNumber: revision.documentNumber,
          scheduleImpactDays: revision.scheduleImpactDays,
          costImpactAmount: revision.costImpactAmount,
          baseDrawingArtifactId: revision.baseDrawingArtifactId,
          newDrawingArtifactId: revision.newDrawingArtifactId,
          baseCalculationResultId: revision.baseCalculationResultId,
          newCalculationResultId: revision.newCalculationResultId,
          approvedAt: revision.approvedAt?.toISOString() ?? null,
          createdAt: revision.createdAt.toISOString(),
        },
        reviews: reviews.map((review) => ({
          id: review.id,
          area: review.area,
          item: review.item,
          result: review.result,
          comment: review.comment,
          response: review.response,
          reviewedByUserId: review.reviewedByUserId,
          respondedByUserId: review.respondedByUserId,
          reviewedAt: review.reviewedAt?.toISOString() ?? null,
          respondedAt: review.respondedAt?.toISOString() ?? null,
        })),
      }
      const snapshotHash = await sha256Hex(canonicalJson(snapshot))
      await tx.insert(designFinalizationTable).values({
        organizationId: input.organizationId,
        projectId: input.projectId,
        revisionId: input.revisionId,
        snapshot,
        snapshotHash,
        finalizedByUserId: input.userId,
      })
    }

    await tx
      .update(designRevisionTable)
      .set({
        status: transition.to,
        submittedAt: input.action === 'submit' ? now : revision.submittedAt,
        approvedAt: input.action === 'approve' ? now : revision.approvedAt,
        finalizedAt: input.action === 'finalize' ? now : revision.finalizedAt,
      })
      .where(eq(designRevisionTable.id, input.revisionId))
    await tx.insert(designRevisionEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      revisionId: input.revisionId,
      fromStatus: revision.status,
      toStatus: transition.to,
      note: input.note,
      actorType: 'user',
      actorUserId: input.userId,
    })
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.userId,
      action: `design_revision.${input.action}`,
      targetType: 'design_revision',
      targetId: input.revisionId,
      requestId: input.requestId,
      detail: { fromStatus: revision.status, toStatus: transition.to },
    })
    if (input.action === 'start_review') {
      await tx.update(projectTable).set({ status: 'review' }).where(eq(projectTable.id, input.projectId))
    } else if (input.action === 'finalize') {
      await tx.update(projectTable).set({ status: 'approved' }).where(eq(projectTable.id, input.projectId))
    }
    return { kind: 'transitioned' as const, status: transition.to }
  })
}

export function createDesignReviewItem(
  db: Db,
  input: {
    userId: string
    organizationId: string
    projectId: string
    revisionId: string
    area: CivilDesignReviewArea
    item: string
    comment: string | null
    requestId: string
  },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canReviewProject(tx, input.userId, input.organizationId, input.projectId))) {
      return { kind: 'forbidden' as const }
    }
    const [revision] = await tx
      .select({ id: designRevisionTable.id, status: designRevisionTable.status })
      .from(designRevisionTable)
      .where(
        and(
          eq(designRevisionTable.id, input.revisionId),
          eq(designRevisionTable.organizationId, input.organizationId),
          eq(designRevisionTable.projectId, input.projectId),
        ),
      )
      .limit(1)
      .for('update')
    if (!revision) return { kind: 'missing' as const }
    if (revision.status !== 'under_review') return { kind: 'conflict' as const }
    const [item] = await tx
      .insert(designReviewItemTable)
      .values({
        organizationId: input.organizationId,
        projectId: input.projectId,
        revisionId: input.revisionId,
        area: input.area,
        item: input.item,
        comment: input.comment,
        createdByUserId: input.userId,
      })
      .returning()
    if (!item) throw new Error('design review item insert returned no row')
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.userId,
      action: 'design_review.created',
      targetType: 'design_review_item',
      targetId: item.id,
      requestId: input.requestId,
      detail: { revisionId: input.revisionId, area: input.area },
    })
    return { kind: 'created' as const, item }
  })
}

export function decideDesignReviewItem(
  db: Db,
  input: {
    userId: string
    organizationId: string
    projectId: string
    revisionId: string
    reviewId: string
    result: CivilDesignReviewResult
    comment: string | null
    requestId: string
  },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canReviewProject(tx, input.userId, input.organizationId, input.projectId))) {
      return { kind: 'forbidden' as const }
    }
    const [revision] = await tx
      .select({ status: designRevisionTable.status })
      .from(designRevisionTable)
      .where(eq(designRevisionTable.id, input.revisionId))
      .limit(1)
      .for('update')
    if (!revision) return { kind: 'missing' as const }
    if (revision.status !== 'under_review') return { kind: 'conflict' as const }
    const [item] = await tx
      .update(designReviewItemTable)
      .set({
        result: input.result,
        comment: input.comment,
        reviewedByUserId: input.userId,
        reviewedAt: new Date(),
      })
      .where(
        and(
          eq(designReviewItemTable.id, input.reviewId),
          eq(designReviewItemTable.revisionId, input.revisionId),
          eq(designReviewItemTable.organizationId, input.organizationId),
          eq(designReviewItemTable.projectId, input.projectId),
        ),
      )
      .returning({ id: designReviewItemTable.id })
    if (!item) return { kind: 'missing' as const }
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.userId,
      action: 'design_review.decided',
      targetType: 'design_review_item',
      targetId: input.reviewId,
      requestId: input.requestId,
      detail: { revisionId: input.revisionId, result: input.result },
    })
    return { kind: 'updated' as const }
  })
}

export function respondToDesignReviewItem(
  db: Db,
  input: {
    userId: string
    organizationId: string
    projectId: string
    revisionId: string
    reviewId: string
    response: string
    requestId: string
  },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canContributeProject(tx, input.userId, input.organizationId, input.projectId))) {
      return { kind: 'forbidden' as const }
    }
    const [revision] = await tx
      .select({ status: designRevisionTable.status })
      .from(designRevisionTable)
      .where(eq(designRevisionTable.id, input.revisionId))
      .limit(1)
      .for('update')
    if (!revision) return { kind: 'missing' as const }
    if (!['under_review', 'changes_requested'].includes(revision.status)) return { kind: 'conflict' as const }
    const [item] = await tx
      .update(designReviewItemTable)
      .set({ response: input.response, respondedByUserId: input.userId, respondedAt: new Date() })
      .where(
        and(
          eq(designReviewItemTable.id, input.reviewId),
          eq(designReviewItemTable.revisionId, input.revisionId),
          eq(designReviewItemTable.organizationId, input.organizationId),
          eq(designReviewItemTable.projectId, input.projectId),
        ),
      )
      .returning({ id: designReviewItemTable.id })
    if (!item) return { kind: 'missing' as const }
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.userId,
      action: 'design_review.responded',
      targetType: 'design_review_item',
      targetId: input.reviewId,
      requestId: input.requestId,
      detail: { revisionId: input.revisionId },
    })
    return { kind: 'updated' as const }
  })
}
