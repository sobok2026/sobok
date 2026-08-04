import { openDb } from '@sobok/edge/db/client'
import { nullifyOldCommentIps, nullifyOldReportIps, purgeModeratedComments } from '../db/queries/comment'
import { purgeExpiredGuardianReopenLinks } from '../db/queries/guardian-reopen'
import {
  purgeAbandonedGuardianCheckouts,
  purgeAbandonedGuardianRedrawPurchases,
} from '../db/queries/guardian-retention'
import { purgeProcessedGuardianWebhooks } from '../db/queries/guardian-webhook'
import { purgeExpiredRateLimits } from '../db/queries/rate-limit'
import type { Bindings } from '../env'

const DAY = 86_400_000

// Daily retention sweep invoked through the StellaMaintenance RPC entrypoint:
//  • pseudonymous ipHash NULLed 90 days after a comment/report — no longer needed for abuse tracing.
//  • soft-deleted (removed) and auto-hidden comments hard-deleted 30 days on (reversible-triage window).
//  • unpaid guardian checkout aggregates dropped 30 days after their latest payment attempt.
//  • ungranted redraw attempts dropped 30 days after they were created.
//  • consumed or expired one-time report links dropped on the next daily pass.
//  • expired rate-limit windows dropped (housekeeping).
export async function runRetentionPurge(env: Bindings): Promise<void> {
  const { db, sql } = openDb(env.HYPERDRIVE)
  try {
    const now = Date.now()
    const commentIps = await nullifyOldCommentIps(db, new Date(now - 90 * DAY))
    const reportIps = await nullifyOldReportIps(db, new Date(now - 90 * DAY))
    const moderated = await purgeModeratedComments(db, new Date(now - 30 * DAY))
    const guardianCheckouts = await purgeAbandonedGuardianCheckouts(db, new Date(now - 30 * DAY))
    const guardianRedrawPurchases = await purgeAbandonedGuardianRedrawPurchases(db, new Date(now - 30 * DAY))
    const guardianReopenLinks = await purgeExpiredGuardianReopenLinks(db, new Date(now))
    const rateLimits = await purgeExpiredRateLimits(db, new Date(now - DAY))
    const guardianWebhooks = await purgeProcessedGuardianWebhooks(db, new Date(now - 90 * DAY))
    console.log(
      'stella.retention.purge',
      JSON.stringify({
        commentIps,
        reportIps,
        moderated,
        guardianCheckouts,
        guardianRedrawPurchases,
        guardianReopenLinks,
        rateLimits,
        guardianWebhooks,
      }),
    )
  } finally {
    await sql.end({ timeout: 5 })
  }
}
