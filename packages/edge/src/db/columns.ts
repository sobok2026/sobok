import { bigint, timestamp, varchar } from 'drizzle-orm/pg-core'

// The app-db timestamp helpers, in a Workers-importable form: precision:3, timezone-aware, updated_at
// auto-touches on write. Same shape as @sobok/db's, which can't be imported here because that package is
// Bun/singleton-shaped (it opens a connection at module scope).
export const createdAt = timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull()

export const updatedAt = timestamp('updated_at', { precision: 3, withTimezone: true })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date())

export const timestamps = { createdAt, updatedAt }

// Sequential identity primary key. NEVER expose these values to clients — anti-enumeration is enforced by
// pairing them with `publicId` for every client-facing row.
export const identityId = bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity()

// Client-facing opaque reference (random chars). Keeps the sequential id unexposed, so clients cannot walk
// or scrape the table.
export const publicId = varchar('public_id', { length: 24 }).notNull().unique()
