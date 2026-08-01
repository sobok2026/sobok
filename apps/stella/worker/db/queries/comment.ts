import type { CommentReportReason as ReportReason } from '@sobok/domain/comment/policy'
import type { Locale } from '@sobok/domain/locale'
import type { Db } from '@sobok/edge/db/client'
import { and, eq, inArray, lt, or, sql } from 'drizzle-orm'
import type { Cursor } from '../../lib/cursor'
import { commentReportTable, commentTable, commentThreadTable } from '../schema/comment'

export interface CommentRow {
  publicId: string
  nickname: string | null
  body: string
  createdAt: Date
}

// ── Reads ─────────────────────────────────────────────────────────────────────────────────────────────
export async function listComments(
  db: Db,
  locale: Locale,
  topicKey: string,
  limit: number,
  before: Cursor | null,
): Promise<{ comments: CommentRow[]; nextCursor: Cursor | null }> {
  const [thread] = await db
    .select({ id: commentThreadTable.id })
    .from(commentThreadTable)
    .where(and(eq(commentThreadTable.locale, locale), eq(commentThreadTable.topicKey, topicKey)))
    .limit(1)

  const threadId = thread?.id ?? null

  if (threadId === null) {
    return { comments: [], nextCursor: null }
  }

  const rows = await db
    .select({
      id: commentTable.id,
      publicId: commentTable.publicId,
      nickname: commentTable.nickname,
      body: commentTable.body,
      createdAt: commentTable.createdAt,
    })
    .from(commentTable)
    .where(
      and(
        eq(commentTable.threadId, threadId),
        eq(commentTable.status, 'visible'),
        before
          ? or(
              lt(commentTable.createdAt, before.createdAt),
              and(eq(commentTable.createdAt, before.createdAt), lt(commentTable.id, before.id)),
            )
          : undefined,
      ),
    )
    .orderBy(sql`${commentTable.createdAt} desc`, sql`${commentTable.id} desc`)
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const last = hasMore ? page[page.length - 1] : null
  return {
    comments: page.map(({ publicId, nickname, body, createdAt }) => ({ publicId, nickname, body, createdAt })),
    nextCursor: last ? { createdAt: last.createdAt, id: last.id } : null,
  }
}

export async function getCounts(db: Db, locale: Locale, topicKeys: string[]): Promise<Record<string, number>> {
  if (topicKeys.length === 0) {
    return {}
  }

  const rows = await db
    .select({ topicKey: commentThreadTable.topicKey, count: commentThreadTable.commentCount })
    .from(commentThreadTable)
    .where(and(eq(commentThreadTable.locale, locale), inArray(commentThreadTable.topicKey, topicKeys)))

  const out: Record<string, number> = {}

  for (const { topicKey, count } of rows) {
    out[topicKey] = count
  }

  return out
}

// ── Writes ────────────────────────────────────────────────────────────────────────────────────────────
export interface NewComment {
  locale: Locale
  topicKey: string
  publicId: string
  nickname: string | null
  editTokenHash: string
  body: string
  ipHash: string | null
}

export async function createComment(db: Db, input: NewComment): Promise<'ok' | 'locked'> {
  return db.transaction(async (tx) => {
    const [thread] = await tx
      .insert(commentThreadTable)
      .values({ locale: input.locale, topicKey: input.topicKey })
      .onConflictDoUpdate({
        target: [commentThreadTable.locale, commentThreadTable.topicKey],
        set: { updatedAt: sql`now()` },
      })
      .returning({ id: commentThreadTable.id, locked: commentThreadTable.locked })

    if (!thread || thread.locked) {
      return 'locked'
    }

    await tx.insert(commentTable).values({
      publicId: input.publicId,
      threadId: thread.id,
      nickname: input.nickname,
      editTokenHash: input.editTokenHash,
      body: input.body,
      ipHash: input.ipHash,
    })

    await tx
      .update(commentThreadTable)
      .set({ commentCount: sql`${commentThreadTable.commentCount} + 1`, lastCommentAt: sql`now()` })
      .where(eq(commentThreadTable.id, thread.id))

    return 'ok'
  })
}

// Edit is gated on the editToken hash matching AND the row still being visible — a single WHERE, so a wrong
// token / removed comment simply matches nothing (no info leak, no timing side channel beyond the DB).
export async function editComment(db: Db, publicId: string, editTokenHash: string, body: string): Promise<boolean> {
  const rows = await db
    .update(commentTable)
    .set({ body })
    .where(
      and(
        eq(commentTable.publicId, publicId),
        eq(commentTable.editTokenHash, editTokenHash),
        eq(commentTable.status, 'visible'),
      ),
    )
    .returning({ id: commentTable.id })
  return rows.length === 1
}

export async function deleteComment(db: Db, publicId: string, editTokenHash: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .update(commentTable)
      .set({ status: 'removed' })
      .where(
        and(
          eq(commentTable.publicId, publicId),
          eq(commentTable.editTokenHash, editTokenHash),
          eq(commentTable.status, 'visible'),
        ),
      )
      .returning({ threadId: commentTable.threadId })

    const removed = rows[0]
    if (!removed) {
      return false
    }

    await tx
      .update(commentThreadTable)
      .set({ commentCount: sql`greatest(${commentThreadTable.commentCount} - 1, 0)` })
      .where(eq(commentThreadTable.id, removed.threadId))
    return true
  })
}

// Records a report (idempotent per reporter) and auto-hides once the report count reaches `threshold`.
// Auto-hide is a REVERSIBLE triage state (status='hidden'), not a delete — an operator can restore it.
export async function reportComment(
  db: Db,
  input: { publicId: string; reason: ReportReason; ipHash: string | null; threshold: number },
): Promise<{ found: boolean; hidden: boolean; reportCount: number }> {
  return db.transaction(async (tx) => {
    const [comment] = await tx
      .select({ id: commentTable.id, threadId: commentTable.threadId })
      .from(commentTable)
      .where(and(eq(commentTable.publicId, input.publicId), eq(commentTable.status, 'visible')))
      .limit(1)

    if (!comment) {
      return { found: false, hidden: false, reportCount: 0 }
    }

    await tx
      .insert(commentReportTable)
      .values({ commentId: comment.id, reason: input.reason, ipHash: input.ipHash })
      .onConflictDoNothing({ target: [commentReportTable.commentId, commentReportTable.ipHash] })

    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(commentReportTable)
      .where(eq(commentReportTable.commentId, comment.id))

    const hidden = count >= input.threshold
    await tx
      .update(commentTable)
      .set({ reportCount: count, ...(hidden ? { status: 'hidden' as const } : {}) })
      .where(eq(commentTable.id, comment.id))

    if (hidden) {
      await tx
        .update(commentThreadTable)
        .set({ commentCount: sql`greatest(${commentThreadTable.commentCount} - 1, 0)` })
        .where(eq(commentThreadTable.id, comment.threadId))
    }

    return { found: true, hidden, reportCount: count }
  })
}

// ── Retention (daily cron; also keeps the shared Supabase project warm past the free-tier 7-day pause) ──
export async function nullifyOldCommentIps(db: Db, cutoff: Date): Promise<number> {
  const rows = await db
    .update(commentTable)
    .set({ ipHash: null })
    .where(and(lt(commentTable.createdAt, cutoff), sql`${commentTable.ipHash} is not null`))
    .returning({ id: commentTable.id })
  return rows.length
}

export async function nullifyOldReportIps(db: Db, cutoff: Date): Promise<number> {
  const rows = await db
    .update(commentReportTable)
    .set({ ipHash: null })
    .where(and(lt(commentReportTable.createdAt, cutoff), sql`${commentReportTable.ipHash} is not null`))
    .returning({ id: commentReportTable.id })
  return rows.length
}

export async function purgeModeratedComments(db: Db, cutoff: Date): Promise<number> {
  const rows = await db
    .delete(commentTable)
    .where(and(inArray(commentTable.status, ['removed', 'hidden']), lt(commentTable.updatedAt, cutoff)))
    .returning({ id: commentTable.id })
  return rows.length
}
