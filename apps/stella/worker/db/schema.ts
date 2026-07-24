import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  index,
  integer,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

import { createdAt, timestamps } from './columns'

// The anonymous comment board lives in a DEDICATED `stella` schema on the SHARED Supabase Postgres — NOT the
// public schema, where the deeptype_* payment tables sit. This is load-bearing for isolation:
//   • drizzle-kit push runs with schemaFilter:['stella'] as the OWNER, so it never sees (and never proposes
//     dropping) the payment tables.
//   • the runtime `stella_app` role has grants ONLY inside this schema — it cannot read/write payment rows.
//   • the `stella` schema is NOT added to Supabase's exposed schemas, so PostgREST never surfaces ipHash /
//     edit-token hashes over the anon REST API.
// Plain tables, NOT RLS — access is enforced in the Worker (Turnstile + rate-limit + unguessable editToken).
export const stella = pgSchema('stella')

export const localeEnum = stella.enum('locale', ['ko', 'en', 'ja', 'zh'])
export const commentStatusEnum = stella.enum('comment_status', ['visible', 'hidden', 'removed'])
export const reportReasonEnum = stella.enum('report_reason', ['spam', 'abuse', 'sexual', 'privacy', 'other'])

// One board per (locale, topicKey). topicKey is the persistent public identifier minted by the client's
// versioned topicKey() (e.g. 'planet-sun-aries', 'aspect-sun-moon-trine') — an opaque string to the server,
// which only validates its shape. Lazily upserted on first comment.
export const commentThreadTable = stella.table(
  'comment_thread',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    locale: localeEnum().notNull(),
    topicKey: varchar('topic_key', { length: 48 }).notNull(),
    // Visible-comment count, maintained transactionally on create/remove/auto-hide.
    commentCount: integer('comment_count').notNull().default(0),
    lastCommentAt: timestamp('last_comment_at', { precision: 3, withTimezone: true }),
    // Board-level moderation kill-switch — blocks new comments without touching existing ones.
    locked: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [uniqueIndex('uq_stella_thread_topic').on(t.locale, t.topicKey)],
)

export const commentTable = stella.table(
  'comment',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    // Client-facing opaque ref (random, 12 chars). The sequential id is NEVER exposed — prevents enumeration
    // / id-walking to brigade or scrape the board.
    publicId: varchar('public_id', { length: 24 }).notNull().unique(),
    threadId: bigint('thread_id', { mode: 'number' })
      .notNull()
      .references(() => commentThreadTable.id, { onDelete: 'restrict' }),
    // Optional display name; null renders as the localized "익명".
    nickname: varchar('nickname', { length: 24 }),
    // SHA-256 of the author's editToken — the sole edit/delete capability. Only the hash is stored, so a DB
    // leak cannot forge edits. No password: cross-device edit was dropped (offline-cracking / PII liability).
    editTokenHash: varchar('edit_token_hash', { length: 64 }).notNull(),
    body: text().notNull(),
    status: commentStatusEnum().notNull().default('visible'),
    reportCount: integer('report_count').notNull().default(0),
    // Pseudonymous, network-normalized IP hash for abuse tracing. NULLed by the retention cron after 90 days.
    ipHash: varchar('ip_hash', { length: 64 }),
    ...timestamps,
  },
  (t) => [
    // List query: newest-first within a thread, composite (createdAt, id) tiebreak for stable cursoring.
    index('idx_stella_comment_thread_created').on(t.threadId, t.createdAt, t.id).where(sql`status = 'visible'`),
    // Retention scan for removed/hidden rows past their soft-delete window.
    index('idx_stella_comment_moderated').on(t.updatedAt).where(sql`status in ('removed', 'hidden')`),
  ],
)

// One report per (comment, reporter-ipHash). Threshold crossing auto-hides (reversible) via the API.
export const commentReportTable = stella.table(
  'comment_report',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    commentId: bigint('comment_id', { mode: 'number' })
      .notNull()
      .references(() => commentTable.id, { onDelete: 'cascade' }),
    reason: reportReasonEnum().notNull(),
    ipHash: varchar('ip_hash', { length: 64 }),
    createdAt,
  },
  (t) => [uniqueIndex('uq_stella_report_comment_ip').on(t.commentId, t.ipHash)],
)

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
