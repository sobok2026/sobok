import type { Db } from '@sobok/edge/db/client'
import { and, eq, exists, inArray, isNotNull, isNull, lt, ne, notExists, or } from 'drizzle-orm'
import { dateIsOlderThanYears } from '../../lib/retention'
import { purchaseTable, reopenAccessTable, reportTable, resultTable, webhookEventTable } from '../schema'

const BATCH = 500

// Daily data-lifecycle sweeps. Identifying/report data and the minimal transaction record deliberately
// have different lifetimes, so a paid purchase is anonymized after one year and deleted after five.

export async function purgeAbandonedPurchases(db: Db, cutoff: Date): Promise<number> {
  const rows = await db
    .delete(purchaseTable)
    .where(
      and(
        lt(purchaseTable.createdAt, cutoff),
        or(eq(purchaseTable.status, 'pending'), eq(purchaseTable.status, 'failed')),
      ),
    )
    .returning({ id: purchaseTable.id })
  return rows.length
}

// Free results that never led to a purchase, older than the cutoff. Results with ANY purchase are protected
// by the purchase→result onDelete restrict FK, so the NOT EXISTS guard also keeps the delete safe.
export async function purgeUnconvertedResults(db: Db, cutoff: Date): Promise<number> {
  const rows = await db
    .delete(resultTable)
    .where(
      and(
        lt(resultTable.createdAt, cutoff),
        notExists(
          db.select({ id: purchaseTable.id }).from(purchaseTable).where(eq(purchaseTable.resultId, resultTable.id)),
        ),
      ),
    )
    .returning({ id: resultTable.id })
  return rows.length
}

// Raw answers are no longer needed three months after the generated report is available. Every raw response
// column goes together — the Likert sets, both forced-choice blocks, and the unfinished paid draft — because
// they are the same category of data and keeping any one of them re-creates the record the others shed. The
// collection timestamps go with them: once the answers are gone the timestamps only describe when someone was
// here. Server-scored profiles remain until the one-year report-access window ends.
export async function minimizeDeliveredAnswers(db: Db, cutoff: Date): Promise<number> {
  const rows = await db
    .update(resultTable)
    .set({
      baseAnswers: [],
      freeWorkAnswers: null,
      freeWorkAnswersAt: null,
      refinementAnswers: null,
      refinementDraft: null,
      refinementDraftAt: null,
      workAnswers: null,
    })
    .where(
      and(
        or(
          ne(resultTable.baseAnswers, []),
          isNotNull(resultTable.freeWorkAnswers),
          isNotNull(resultTable.refinementAnswers),
          isNotNull(resultTable.refinementDraft),
          isNotNull(resultTable.workAnswers),
        ),
        exists(
          db
            .select({ id: purchaseTable.id })
            .from(purchaseTable)
            .innerJoin(reportTable, eq(reportTable.purchaseId, purchaseTable.id))
            .where(and(eq(purchaseTable.resultId, resultTable.id), lt(reportTable.generatedAt, cutoff))),
        ),
      ),
    )
    .returning({ id: resultTable.id })
  return rows.length
}

// Raw answers of a purchase that was paid and then never finished. `minimizeDeliveredAnswers` cannot reach
// these rows at all — its EXISTS keys off a generated report, and an unfinished paid block never produces one
// — so without this sweep the responses of every abandoned purchase would sit here untouched for the whole
// year of the access window. The same raw-answer set goes as it does there: keeping the free drain block
// while dropping `base_answers` would leave responses on file that can no longer be scored into anything,
// which is retention with none of the purpose. Server-scored profiles stay, so the free report a buyer
// already has keeps rendering; what ends is the ability to submit the paid block, and the 410 in
// `retiredAnswersProblem` is what says so.
export async function purgeAbandonedRefinements(db: Db, cutoff: Date): Promise<number> {
  const rows = await db
    .update(resultTable)
    .set({
      baseAnswers: [],
      freeWorkAnswers: null,
      freeWorkAnswersAt: null,
      refinementDraft: null,
      refinementDraftAt: null,
    })
    .where(
      and(
        isNull(resultTable.refinedProfile),
        // Without this the sweep re-selects and rewrites every long-abandoned row on every daily run.
        or(
          ne(resultTable.baseAnswers, []),
          isNotNull(resultTable.freeWorkAnswers),
          isNotNull(resultTable.refinementDraft),
        ),
        exists(
          db
            .select({ id: purchaseTable.id })
            .from(purchaseTable)
            .where(
              and(
                eq(purchaseTable.resultId, resultTable.id),
                eq(purchaseTable.status, 'paid'),
                lt(purchaseTable.paidAt, cutoff),
              ),
            ),
        ),
      ),
    )
    .returning({ id: resultTable.id })
  return rows.length
}

export async function expireReportAccess(
  db: Db,
  now: Date,
): Promise<{ purchases: number; reports: number; results: number }> {
  return db.transaction(async (tx) => {
    const expired = await tx
      .select({ id: purchaseTable.id, resultId: purchaseTable.resultId })
      .from(purchaseTable)
      .where(
        and(
          isNotNull(purchaseTable.paidAt),
          isNotNull(purchaseTable.resultId),
          dateIsOlderThanYears(purchaseTable.paidAt, now, 1),
          or(eq(purchaseTable.status, 'paid'), eq(purchaseTable.status, 'refunded')),
        ),
      )
      .limit(BATCH)

    if (expired.length === 0) {
      return { purchases: 0, reports: 0, results: 0 }
    }

    const purchaseIds = expired.map(({ id }) => id)
    const resultIds = expired.flatMap(({ resultId }) => (resultId === null ? [] : [resultId]))

    await tx.delete(reopenAccessTable).where(inArray(reopenAccessTable.purchaseId, purchaseIds))
    const reports = await tx
      .delete(reportTable)
      .where(inArray(reportTable.purchaseId, purchaseIds))
      .returning({ id: reportTable.id })
    await tx
      .update(purchaseTable)
      .set({
        accessToken: null,
        email: null,
        emailHash: null,
        failureCode: null,
        failureMessage: null,
        // Normally already null — cleared as soon as the server-side `purchase` was accepted. This is the
        // long-stop for the rows where that send was rejected and the identity was kept for a manual replay.
        gaClientId: null,
        gaSessionId: null,
        resultId: null,
      })
      .where(inArray(purchaseTable.id, purchaseIds))
    const results =
      resultIds.length === 0
        ? []
        : await tx
            .delete(resultTable)
            .where(
              and(
                inArray(resultTable.id, resultIds),
                notExists(
                  tx
                    .select({ id: purchaseTable.id })
                    .from(purchaseTable)
                    .where(eq(purchaseTable.resultId, resultTable.id)),
                ),
              ),
            )
            .returning({ id: resultTable.id })

    return { purchases: purchaseIds.length, reports: reports.length, results: results.length }
  })
}

export async function purgeExpiredTransactionRecords(db: Db, now: Date): Promise<number> {
  const rows = await db
    .delete(purchaseTable)
    .where(
      and(
        isNotNull(purchaseTable.paidAt),
        dateIsOlderThanYears(purchaseTable.paidAt, now, 5),
        or(eq(purchaseTable.status, 'paid'), eq(purchaseTable.status, 'refunded')),
      ),
    )
    .returning({ id: purchaseTable.id })
  return rows.length
}

export async function purgeExpiredReopenLinks(db: Db, cutoff: Date): Promise<number> {
  const rows = await db
    .delete(reopenAccessTable)
    .where(lt(reopenAccessTable.expiresAt, cutoff))
    .returning({ id: reopenAccessTable.id })
  return rows.length
}

export async function purgeOldWebhookEvents(db: Db, cutoff: Date): Promise<number> {
  const rows = await db
    .delete(webhookEventTable)
    .where(lt(webhookEventTable.createdAt, cutoff))
    .returning({ id: webhookEventTable.id })
  return rows.length
}
