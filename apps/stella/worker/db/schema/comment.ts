import { COMMENT_REPORT_REASONS } from '@sobok/domain/comment/policy'
import { createdAt, identityId, publicId, timestamps } from '@sobok/edge/db/columns'
import { sql } from 'drizzle-orm'
import { bigint, boolean, index, integer, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { localeEnum, stella } from './common'

export const commentStatusEnum = stella.enum('comment_status', ['visible', 'hidden', 'removed'])
export const reportReasonEnum = stella.enum('report_reason', COMMENT_REPORT_REASONS)

// One board per (locale, topicKey). topicKey is the persistent public identifier minted by the client's
// versioned topicKey() (e.g. 'planet-sun-aries', 'aspect-sun-moon-trine') — an opaque string to the server,
// which only validates its shape. Lazily upserted on first comment.
export const commentThreadTable = stella.table(
  'comment_thread',
  {
    id: identityId,
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
    id: identityId,
    // Client-facing opaque ref (random, 12 chars). The sequential id is NEVER exposed — prevents enumeration
    // / id-walking to brigade or scrape the board.
    publicId,
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
    // Pseudonymous, network-normalized IP hash for abuse tracing. NULLed by scheduled retention after 90 days.
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
    id: identityId,
    commentId: bigint('comment_id', { mode: 'number' })
      .notNull()
      .references(() => commentTable.id, { onDelete: 'cascade' }),
    reason: reportReasonEnum().notNull(),
    ipHash: varchar('ip_hash', { length: 64 }),
    createdAt,
  },
  (t) => [uniqueIndex('uq_stella_report_comment_ip').on(t.commentId, t.ipHash)],
)
