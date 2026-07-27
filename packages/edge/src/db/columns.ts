import { timestamp } from 'drizzle-orm/pg-core'

// The app-db timestamp helpers, in a Workers-importable form: precision:3, timezone-aware, updated_at
// auto-touches on write. Same shape as @sobok/db's, which can't be imported here because that package is
// Bun/singleton-shaped (it opens a connection at module scope).
export const createdAt = timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull()

export const updatedAt = timestamp('updated_at', { precision: 3, withTimezone: true })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date())

export const timestamps = { createdAt, updatedAt }
