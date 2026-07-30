import { openDB } from '@sobok/edge/db/client'
import {
  expireReportAccess,
  minimizeDeliveredAnswers,
  purgeAbandonedPurchases,
  purgeAbandonedRefinements,
  purgeExpiredReopenLinks,
  purgeExpiredTransactionRecords,
  purgeOldWebhookEvents,
  purgeUnconvertedResults,
} from '../db/queries/purge'
import type { Bindings } from '../env'
import { daysBefore, monthsBefore } from '../lib/retention'

// Daily retention purge (driven by the daily cron in wrangler.jsonc). Logged to Workers Observability.
export async function runRetentionPurge(env: Bindings): Promise<void> {
  const { db, sql } = openDB(env.HYPERDRIVE_FRESH)
  try {
    const now = Date.now()
    const current = new Date(now)
    const abandonedPurchases = await purgeAbandonedPurchases(db, daysBefore(current, 30))
    const minimizedAnswers = await minimizeDeliveredAnswers(db, monthsBefore(current, 3))
    // Rides the existing daily sweep on purpose. wrangler.jsonc declares exactly two crons (*/15 reconcile,
    // 0 3 purge) and a third schedule for one UPDATE would be a new failure surface for no coverage.
    const abandonedRefinements = await purgeAbandonedRefinements(db, daysBefore(current, 90))
    const expiredAccess = await expireReportAccess(db, current)
    const transactionRecords = await purgeExpiredTransactionRecords(db, current)
    const results = await purgeUnconvertedResults(db, daysBefore(current, 30))
    const reopenLinks = await purgeExpiredReopenLinks(db, current)
    const webhookEvents = await purgeOldWebhookEvents(db, daysBefore(current, 90))
    console.log(
      'deeptype.purge',
      JSON.stringify({
        abandonedPurchases,
        abandonedRefinements,
        expiredAccess,
        minimizedAnswers,
        reopenLinks,
        results,
        transactionRecords,
        webhookEvents,
      }),
    )
  } finally {
    await sql.end({ timeout: 5 })
  }
}
