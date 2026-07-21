import { and, lt, sql } from 'drizzle-orm'

import type { Db } from '../client'
import { purchaseTable, resultTable, webhookEventTable } from '../schema'

// PIPA data-minimization purge (runs on the daily cron). Purchases are NEVER purged here — 전자상거래법
// requires payment/contract records be kept ~5 years; only unconverted (never-paid) results and stale
// webhook payloads are removed.

// Free results that never led to a purchase, older than the cutoff. Results with ANY purchase are protected
// by the purchase→result onDelete restrict FK, so the NOT EXISTS guard also keeps the delete safe.
export async function purgeUnconvertedResults(db: Db, cutoff: Date): Promise<number> {
  const rows = await db
    .delete(resultTable)
    .where(
      and(
        lt(resultTable.createdAt, cutoff),
        sql`NOT EXISTS (SELECT 1 FROM ${purchaseTable} WHERE ${purchaseTable.resultId} = ${resultTable.id})`,
      ),
    )
    .returning({ id: resultTable.id })
  return rows.length
}

export async function purgeOldWebhookEvents(db: Db, cutoff: Date): Promise<number> {
  const rows = await db
    .delete(webhookEventTable)
    .where(lt(webhookEventTable.createdAt, cutoff))
    .returning({ id: webhookEventTable.id })
  return rows.length
}
