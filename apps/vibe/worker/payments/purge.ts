import { openFresh } from '../db/client'
import { purgeOldWebhookEvents, purgeUnconvertedResults } from '../db/queries/purge'
import type { Bindings } from '../env'

const UNCONVERTED_RESULT_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const WEBHOOK_EVENT_TTL_MS = 90 * 24 * 60 * 60 * 1000 // 90 days

// Daily retention purge (driven by the daily cron in wrangler.jsonc). Logged to Workers Observability.
export async function runRetentionPurge(env: Bindings): Promise<void> {
  const { db, sql } = openFresh(env.HYPERDRIVE_FRESH)
  try {
    const now = Date.now()
    const results = await purgeUnconvertedResults(db, new Date(now - UNCONVERTED_RESULT_TTL_MS))
    const webhookEvents = await purgeOldWebhookEvents(db, new Date(now - WEBHOOK_EVENT_TTL_MS))
    console.log('deeptype.purge', JSON.stringify({ results, webhookEvents }))
  } finally {
    await sql.end({ timeout: 5 })
  }
}
