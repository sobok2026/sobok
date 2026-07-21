import { timestamp } from 'drizzle-orm/pg-core'

// Local copy of the app-db timestamp helpers (@sobok/db is Bun/singleton-shaped and not importable on
// Workers). Same shape: precision:3, timezone-aware, updated_at auto-touches on write.
export const createdAt = timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull()

export const updatedAt = timestamp('updated_at', { precision: 3, withTimezone: true })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date())

export const timestamps = { createdAt, updatedAt }
