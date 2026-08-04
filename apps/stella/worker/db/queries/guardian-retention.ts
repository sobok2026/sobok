import type { Db } from '@sobok/edge/db/client'
import { and, asc, eq, gte, inArray, isNotNull, lt, notExists } from 'drizzle-orm'

import {
  guardianCardOwnershipTable,
  guardianCollectionTable,
  guardianPurchaseTable,
  guardianQuestionAnswerTable,
  guardianQuestionnaireMilestoneTable,
  guardianRedrawGrantTable,
  guardianReportTable,
} from '../schema/guardian'

const BATCH_SIZE = 500

function isAbandonedStatus(status: typeof guardianPurchaseTable.$inferSelect.status): boolean {
  return status === 'pending' || status === 'failed' || status === 'cancelled'
}

export type GuardianCheckoutPurgeResult = {
  collections: number
  purchases: number
  reports: number
  answers: number
  milestones: number
}

/**
 * A redraw checkout belongs to an already-paid report, so it cannot be removed by the whole-guest-aggregate
 * purge below. Delete only old terminal/unpaid attempts that never granted credits; paid purchases and every
 * purchase referenced by a grant remain durable.
 */
export async function purgeAbandonedGuardianRedrawPurchases(db: Db, cutoff: Date): Promise<number> {
  const rows = await db
    .delete(guardianPurchaseTable)
    .where(
      and(
        eq(guardianPurchaseTable.kind, 'love_redraw'),
        inArray(guardianPurchaseTable.status, ['pending', 'failed', 'cancelled']),
        lt(guardianPurchaseTable.createdAt, cutoff),
        notExists(
          db
            .select({ id: guardianRedrawGrantTable.id })
            .from(guardianRedrawGrantTable)
            .where(eq(guardianRedrawGrantTable.purchaseId, guardianPurchaseTable.id)),
        ),
      ),
    )
    .returning({ id: guardianPurchaseTable.id })
  return rows.length
}

/**
 * Deletes whole guest checkout aggregates that never produced a paid entitlement.
 *
 * Candidate discovery is deliberately outside the transaction; every candidate is then re-checked after
 * locking collection → report → purchase, the same aggregate lock order used by checkout and payment sync.
 * A recent retry restarts the retention window because its new purchase row is younger than the cutoff.
 */
export async function purgeAbandonedGuardianCheckouts(db: Db, cutoff: Date): Promise<GuardianCheckoutPurgeResult> {
  const candidates = await db
    .select({ collectionId: guardianReportTable.collectionId, reportId: guardianReportTable.id })
    .from(guardianReportTable)
    .where(
      and(
        eq(guardianReportTable.status, 'draft'),
        lt(guardianReportTable.createdAt, cutoff),
        notExists(
          db
            .select({ id: guardianPurchaseTable.id })
            .from(guardianPurchaseTable)
            .where(
              and(
                eq(guardianPurchaseTable.reportId, guardianReportTable.id),
                gte(guardianPurchaseTable.createdAt, cutoff),
              ),
            ),
        ),
      ),
    )
    .orderBy(asc(guardianReportTable.createdAt))
    .limit(BATCH_SIZE)

  if (candidates.length === 0) {
    return { collections: 0, purchases: 0, reports: 0, answers: 0, milestones: 0 }
  }

  return db.transaction(async (tx) => {
    const candidateCollectionIds = [...new Set(candidates.map(({ collectionId }) => collectionId))].sort(
      (left, right) => left - right,
    )
    const candidateReportIds = candidates.map(({ reportId }) => reportId).sort((left, right) => left - right)

    await tx
      .select({ id: guardianCollectionTable.id })
      .from(guardianCollectionTable)
      .where(inArray(guardianCollectionTable.id, candidateCollectionIds))
      .orderBy(asc(guardianCollectionTable.id))
      .for('update')

    const reports = await tx
      .select({ id: guardianReportTable.id, collectionId: guardianReportTable.collectionId })
      .from(guardianReportTable)
      .where(
        and(
          inArray(guardianReportTable.id, candidateReportIds),
          eq(guardianReportTable.status, 'draft'),
          lt(guardianReportTable.createdAt, cutoff),
        ),
      )
      .orderBy(asc(guardianReportTable.id))
      .for('update')

    if (reports.length === 0) {
      return { collections: 0, purchases: 0, reports: 0, answers: 0, milestones: 0 }
    }

    const lockedReportIds = reports.map(({ id }) => id)
    const purchases = await tx
      .select({
        id: guardianPurchaseTable.id,
        reportId: guardianPurchaseTable.reportId,
        status: guardianPurchaseTable.status,
        createdAt: guardianPurchaseTable.createdAt,
      })
      .from(guardianPurchaseTable)
      .where(inArray(guardianPurchaseTable.reportId, lockedReportIds))
      .orderBy(asc(guardianPurchaseTable.id))
      .for('update')

    const purchasesByReport = new Map<number, typeof purchases>()
    for (const purchase of purchases) {
      const reportPurchases = purchasesByReport.get(purchase.reportId) ?? []
      reportPurchases.push(purchase)
      purchasesByReport.set(purchase.reportId, reportPurchases)
    }

    const deletableReports = reports.filter(({ id }) => {
      const reportPurchases = purchasesByReport.get(id)
      return (
        reportPurchases !== undefined &&
        reportPurchases.length > 0 &&
        reportPurchases.every(({ createdAt, status }) => createdAt < cutoff && isAbandonedStatus(status))
      )
    })

    if (deletableReports.length === 0) {
      return { collections: 0, purchases: 0, reports: 0, answers: 0, milestones: 0 }
    }

    const reportIds = deletableReports.map(({ id }) => id)
    const collectionIds = [...new Set(deletableReports.map(({ collectionId }) => collectionId))]
    const answers = await tx
      .delete(guardianQuestionAnswerTable)
      .where(inArray(guardianQuestionAnswerTable.reportId, reportIds))
      .returning({ reportId: guardianQuestionAnswerTable.reportId })
    const milestones = await tx
      .delete(guardianQuestionnaireMilestoneTable)
      .where(inArray(guardianQuestionnaireMilestoneTable.reportId, reportIds))
      .returning({ reportId: guardianQuestionnaireMilestoneTable.reportId })
    const deletedPurchases = await tx
      .delete(guardianPurchaseTable)
      .where(inArray(guardianPurchaseTable.reportId, reportIds))
      .returning({ id: guardianPurchaseTable.id })
    const deletedReports = await tx
      .delete(guardianReportTable)
      .where(inArray(guardianReportTable.id, reportIds))
      .returning({ id: guardianReportTable.id })
    const deletedCollections = await tx
      .delete(guardianCollectionTable)
      .where(
        and(
          inArray(guardianCollectionTable.id, collectionIds),
          isNotNull(guardianCollectionTable.accessTokenHash),
          notExists(
            tx
              .select({ id: guardianReportTable.id })
              .from(guardianReportTable)
              .where(eq(guardianReportTable.collectionId, guardianCollectionTable.id)),
          ),
          notExists(
            tx
              .select({ collectionId: guardianCardOwnershipTable.collectionId })
              .from(guardianCardOwnershipTable)
              .where(eq(guardianCardOwnershipTable.collectionId, guardianCollectionTable.id)),
          ),
        ),
      )
      .returning({ id: guardianCollectionTable.id })

    return {
      collections: deletedCollections.length,
      purchases: deletedPurchases.length,
      reports: deletedReports.length,
      answers: answers.length,
      milestones: milestones.length,
    }
  })
}
