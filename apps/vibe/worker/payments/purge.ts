import { openFresh } from '../db/client'
import {
  expireReportAccess,
  minimizeDeliveredAnswers,
  purgeAbandonedPurchases,
  purgeExpiredReopenLinks,
  purgeExpiredTransactionRecords,
  purgeOldWebhookEvents,
  purgeUnconvertedResults,
} from '../db/queries/purge'
import type { Bindings } from '../env'
import { daysBefore, monthsBefore } from '../lib/retention'

// Daily retention purge (driven by the daily cron in wrangler.jsonc). Logged to Workers Observability.
export async function runRetentionPurge(env: Bindings): Promise<void> {
  const { db, sql } = openFresh(env.HYPERDRIVE_FRESH)
  try {
    const now = Date.now()
    const current = new Date(now)
    const abandonedPurchases = await purgeAbandonedPurchases(db, daysBefore(current, 30))
    const minimizedAnswers = await minimizeDeliveredAnswers(db, monthsBefore(current, 3))
    const expiredAccess = await expireReportAccess(db, current)
    const transactionRecords = await purgeExpiredTransactionRecords(db, current)
    const results = await purgeUnconvertedResults(db, daysBefore(current, 30))
    const reopenLinks = await purgeExpiredReopenLinks(db, current)
    const webhookEvents = await purgeOldWebhookEvents(db, daysBefore(current, 90))
    console.log(
      'deeptype.purge',
      JSON.stringify({
        abandonedPurchases,
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
