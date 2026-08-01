import { openDb } from '@sobok/edge/db/client'
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

// Daily retention purge invoked by the shared scheduler through VibeMaintenance. Logged to Workers
// Observability by this owning Worker so database details remain within the product boundary.
export async function runRetentionPurge(env: Bindings): Promise<void> {
  const { db, sql } = openDb(env.HYPERDRIVE_FRESH)
  try {
    const now = Date.now()
    const current = new Date(now)
    const abandonedPurchases = await purgeAbandonedPurchases(db, daysBefore(current, 30))
    const minimizedAnswers = await minimizeDeliveredAnswers(db, monthsBefore(current, 3))
    // Rides the existing daily sweep so one retention RPC covers every Vibe retention policy.
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
