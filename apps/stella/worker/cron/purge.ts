import { openDb } from '@sobok/edge/db/client'
import {
  nullifyOldCommentIps,
  nullifyOldReportIps,
  purgeExpiredRateLimits,
  purgeModeratedComments,
} from '../db/queries/comment'
import type { Bindings } from '../env'

const DAY = 86_400_000

// Daily retention sweep (PIPA data minimization):
//  • pseudonymous ipHash NULLed 90 days after a comment/report — no longer needed for abuse tracing.
//  • soft-deleted (removed) and auto-hidden comments hard-deleted 30 days on (reversible-triage window).
//  • expired rate-limit windows dropped (housekeeping).
export async function runRetentionPurge(env: Bindings): Promise<void> {
  const { db, sql } = openDb(env.HYPERDRIVE)
  try {
    const now = Date.now()
    const commentIps = await nullifyOldCommentIps(db, new Date(now - 90 * DAY))
    const reportIps = await nullifyOldReportIps(db, new Date(now - 90 * DAY))
    const moderated = await purgeModeratedComments(db, new Date(now - 30 * DAY))
    const rateLimits = await purgeExpiredRateLimits(db, new Date(now - DAY))
    console.log('stella.comments.purge', JSON.stringify({ commentIps, reportIps, moderated, rateLimits }))
  } finally {
    await sql.end({ timeout: 5 })
  }
}
