import { integer, primaryKey, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { stella } from './common'

// Atomic fixed-window rate limiter. Every write bumps its row via INSERT … ON CONFLICT DO UPDATE hits+1
// RETURNING hits — race-free, unlike a SELECT count(*) + decide. Old windows are dropped by scheduled retention.
// Bucket names are code-owned identifiers, so they intentionally have no arbitrary length cap. The IP hash is
// SHA-256 hex and therefore remains fixed at 64 characters.
export const rateLimitTable = stella.table(
  'rate_limit',
  {
    bucket: text().notNull(),
    ipHash: varchar('ip_hash', { length: 64 }).notNull(),
    windowStart: timestamp('window_start', { precision: 3, withTimezone: true }).notNull(),
    hits: integer().notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.bucket, t.ipHash, t.windowStart] })],
)
