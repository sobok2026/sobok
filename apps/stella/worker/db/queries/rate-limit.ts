import type { Db } from '@sobok/edge/db/client'
import { lt, sql } from 'drizzle-orm'
import { rateLimitTable } from '../schema/rate-limit'

// Atomic fixed-window counter. The increment and read are one statement, so concurrent requests cannot pass
// through a SELECT-then-decide race. Cloudflare WAF rules may still sit in front as an edge-level first layer.
export async function checkRateLimit(
  db: Db,
  bucket: string,
  ipHash: string,
  windowMs: number,
  limit: number,
): Promise<boolean> {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs)
  const [row] = await db
    .insert(rateLimitTable)
    .values({ bucket, ipHash, windowStart, hits: 1 })
    .onConflictDoUpdate({
      target: [rateLimitTable.bucket, rateLimitTable.ipHash, rateLimitTable.windowStart],
      set: { hits: sql`${rateLimitTable.hits} + 1` },
    })
    .returning({ hits: rateLimitTable.hits })
  return (row?.hits ?? 1) <= limit
}

export async function withinRateLimits(
  db: Db,
  ipHash: string,
  limits: readonly { bucket: string; windowMs: number; limit: number }[],
): Promise<boolean> {
  for (const { bucket, windowMs, limit } of limits) {
    if (!(await checkRateLimit(db, bucket, ipHash, windowMs, limit))) {
      return false
    }
  }
  return true
}

export async function purgeExpiredRateLimits(db: Db, cutoff: Date): Promise<number> {
  const rows = await db
    .delete(rateLimitTable)
    .where(lt(rateLimitTable.windowStart, cutoff))
    .returning({ bucket: rateLimitTable.bucket })
  return rows.length
}
