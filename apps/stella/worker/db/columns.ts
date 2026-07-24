import { timestamp } from 'drizzle-orm/pg-core'

// precision:3, timezone-aware timestamps; updated_at auto-touches on write. Same shape as vibe's worker db
// (the core @sobok/db is Bun/singleton-shaped and not importable on Workers).
export const createdAt = timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull()

export const updatedAt = timestamp('updated_at', { precision: 3, withTimezone: true })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date())

export const timestamps = { createdAt, updatedAt }
