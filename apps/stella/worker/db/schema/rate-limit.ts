import { integer, primaryKey, timestamp, varchar } from 'drizzle-orm/pg-core'
import { stella } from './common'

// Atomic fixed-window rate limiter. Every write bumps its row via INSERT … ON CONFLICT DO UPDATE hits+1
// RETURNING hits — race-free, unlike a SELECT count(*) + decide. Old windows are dropped by the retention cron.
export const rateLimitTable = stella.table(
  'rate_limit',
  {
    bucket: varchar({ length: 16 }).notNull(),
    ipHash: varchar('ip_hash', { length: 64 }).notNull(),
    windowStart: timestamp('window_start', { precision: 3, withTimezone: true }).notNull(),
    hits: integer().notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.bucket, t.ipHash, t.windowStart] })],
)
