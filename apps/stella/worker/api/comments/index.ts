import { LOCALES } from '@sobok/domain/locale'
import { alertDiscord } from '@sobok/edge/alert'
import { type Db, openDB, withDB } from '@sobok/edge/db/client'
import { sha256Hex } from '@sobok/edge/tokens'
import { Hono } from 'hono'
import { z } from 'zod'
import {
  checkRateLimit,
  createComment,
  deleteComment,
  editComment,
  getCounts,
  listComments,
  reportComment,
} from '~/db/queries/comment'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { decodeCursor, encodeCursor } from '~/lib/cursor'
import { hashIp } from '~/lib/ip'
import { MAX_BODY, sanitizeBody, sanitizeNickname } from '~/lib/text'
import { newEditToken, newPublicId } from '~/lib/tokens'
import { guardTurnstile } from '~/lib/turnstile'
import { COMMENT_POST_ACTION, COMMENT_REPORT_ACTION } from './actions'

const LIST_LIMIT = 20
const COUNTS_MAX = 120
// Auto-hide thresholds: a privacy report hides immediately (pending manual review); ordinary reports need a
// quorum well above the trivially-mintable range.
const REPORT_THRESHOLD = 6
const PRIVACY_THRESHOLD = 1

const POST_LIMITS = [
  { bucket: 'post', windowMs: 600_000, limit: 12 },
  { bucket: 'post_burst', windowMs: 60_000, limit: 4 },
]
const REPORT_LIMITS = [
  { bucket: 'report', windowMs: 3_600_000, limit: 40 },
  { bucket: 'report_burst', windowMs: 60_000, limit: 8 },
]

const LocaleSchema = z.enum(LOCALES)
// The persistent public topic key minted client-side by topicKey(). camelCase bodies (northNode) are valid.
const TopicKeySchema = z
  .string()
  .min(3)
  .max(48)
  .regex(/^[a-z][a-zA-Z0-9]*(-[a-zA-Z0-9]+)+$/)
  .refine((v) => v !== 'empty')
const TurnstileSchema = z.string().min(1).max(2048)

const PostBody = z.object({
  locale: LocaleSchema,
  topic: TopicKeySchema,
  body: z.string().min(1).max(MAX_BODY),
  nickname: z.string().max(64).optional(),
  turnstileToken: TurnstileSchema,
})
const ReportBody = z.object({
  reason: z.enum(['spam', 'abuse', 'sexual', 'privacy', 'other']),
  turnstileToken: TurnstileSchema,
})

type HeaderReader = { req: { header(name: string): string | undefined } }

function clientIp(c: HeaderReader): string | null {
  return c.req.header('cf-connecting-ip') ?? null
}

function bearer(c: HeaderReader): string | null {
  return c.req.header('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? null
}

async function withinLimits(
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

export const comments = new Hono<AppEnv>()

// GET /api/comments?locale=&topic=&cursor= — visible comments, newest first, cursor-paginated.
comments.get('/', async (c) => {
  const locale = LocaleSchema.safeParse(c.req.query('locale'))
  const topic = TopicKeySchema.safeParse(c.req.query('topic'))
  if (!locale.success) {
    return problem(422, 'invalid-request')
  }
  if (!topic.success) {
    return problem(422, 'invalid-topic')
  }

  const before = decodeCursor(c.req.query('cursor'))
  const { comments: rows, nextCursor } = await withDB(openDB(c.env.HYPERDRIVE), c.executionCtx, (db) =>
    listComments(db, locale.data, topic.data, LIST_LIMIT, before),
  )
  return c.json(
    {
      comments: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
    },
    200,
    { 'cache-control': 'no-store' },
  )
})

// GET /api/comments/counts?locale=&topics=a,b,c — comment counts for a batch of topics (wheel badges).
comments.get('/counts', async (c) => {
  const locale = LocaleSchema.safeParse(c.req.query('locale'))
  if (!locale.success) {
    return problem(422, 'invalid-request')
  }
  const topics = (c.req.query('topics') ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter((t) => TopicKeySchema.safeParse(t).success)
    .slice(0, COUNTS_MAX)

  const counts = await withDB(openDB(c.env.HYPERDRIVE), c.executionCtx, (db) => getCounts(db, locale.data, topics))
  return c.json({ counts }, 200, { 'cache-control': 'no-store' })
})

// POST /api/comments — create a comment (Turnstile + rate-limit gated).
comments.post('/', async (c) => {
  if (Number(c.req.header('content-length') ?? 0) > 4 * 1024) {
    return problem(413, 'payload-too-large')
  }

  const parsed = PostBody.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }

  const ip = clientIp(c)

  const denied = await guardTurnstile(c, {
    expectedAction: COMMENT_POST_ACTION,
    ip,
    token: parsed.data.turnstileToken,
  })

  if (denied) {
    return denied
  }

  const ipHash = await hashIp(ip, await c.env.STELLA_IP_HASH_SALT.get())

  const body = sanitizeBody(parsed.data.body)
  if (body.length === 0) {
    return problem(422, 'invalid-request')
  }

  const nickname = sanitizeNickname(parsed.data.nickname)
  const publicId = newPublicId()
  const editToken = newEditToken()
  const editTokenHash = await sha256Hex(editToken)

  const outcome = await withDB(openDB(c.env.HYPERDRIVE), c.executionCtx, async (db) => {
    if (!(await withinLimits(db, ipHash ?? 'noip', POST_LIMITS))) {
      return 'rate-limited' as const
    }
    return createComment(db, {
      locale: parsed.data.locale,
      topicKey: parsed.data.topic,
      publicId,
      nickname,
      editTokenHash,
      body,
      ipHash,
    })
  })

  if (outcome === 'rate-limited') {
    return problem(429, 'rate-limited')
  }
  if (outcome === 'locked') {
    return problem(423, 'thread-locked')
  }

  return c.json(
    { publicId, editToken, comment: { publicId, nickname, body, createdAt: new Date().toISOString() } },
    201,
    { 'cache-control': 'no-store' },
  )
})

// PATCH /api/comments/:publicId — edit own comment (Authorization: Bearer <editToken>).
comments.patch('/:publicId', async (c) => {
  if (Number(c.req.header('content-length') ?? 0) > 4 * 1024) {
    return problem(413, 'payload-too-large')
  }
  const token = bearer(c)
  if (!token) {
    return problem(403, 'forbidden')
  }
  const parsed = z.object({ body: z.string().min(1).max(MAX_BODY) }).safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }
  const body = sanitizeBody(parsed.data.body)
  if (body.length === 0) {
    return problem(422, 'invalid-request')
  }

  const editTokenHash = await sha256Hex(token)
  const ok = await withDB(openDB(c.env.HYPERDRIVE), c.executionCtx, (db) =>
    editComment(db, c.req.param('publicId'), editTokenHash, body),
  )
  return ok ? c.json({ ok: true }, 200, { 'cache-control': 'no-store' }) : problem(403, 'forbidden')
})

// DELETE /api/comments/:publicId — soft-delete own comment (Authorization: Bearer <editToken>).
comments.delete('/:publicId', async (c) => {
  const token = bearer(c)
  if (!token) {
    return problem(403, 'forbidden')
  }
  const editTokenHash = await sha256Hex(token)
  const ok = await withDB(openDB(c.env.HYPERDRIVE), c.executionCtx, (db) =>
    deleteComment(db, c.req.param('publicId'), editTokenHash),
  )
  return ok ? c.json({ ok: true }, 200, { 'cache-control': 'no-store' }) : problem(403, 'forbidden')
})

// POST /api/comments/:publicId/report — flag a comment (Turnstile + rate-limit gated).
comments.post('/:publicId/report', async (c) => {
  if (Number(c.req.header('content-length') ?? 0) > 2 * 1024) {
    return problem(413, 'payload-too-large')
  }
  const parsed = ReportBody.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }

  const ip = clientIp(c)

  const denied = await guardTurnstile(c, {
    expectedAction: COMMENT_REPORT_ACTION,
    ip,
    token: parsed.data.turnstileToken,
  })

  if (denied) {
    return denied
  }

  const ipHash = await hashIp(ip, await c.env.STELLA_IP_HASH_SALT.get())

  const result = await withDB(openDB(c.env.HYPERDRIVE), c.executionCtx, async (db) => {
    if (!(await withinLimits(db, ipHash ?? 'noip', REPORT_LIMITS))) {
      return 'rate-limited' as const
    }
    return reportComment(db, {
      publicId: c.req.param('publicId'),
      reason: parsed.data.reason,
      ipHash,
      threshold: parsed.data.reason === 'privacy' ? PRIVACY_THRESHOLD : REPORT_THRESHOLD,
    })
  })
  if (result === 'rate-limited') {
    return problem(429, 'rate-limited')
  }
  if (!result.found) {
    return problem(404, 'comment-not-found')
  }
  if (result.hidden) {
    const webhook = await c.env.STELLA_DISCORD_WEBHOOK.get()
    c.executionCtx.waitUntil(
      alertDiscord(
        webhook,
        `stella comment auto-hidden (${parsed.data.reason}, ${result.reportCount} reports): ${c.req.param('publicId')}`,
      ),
    )
  }
  return c.json({ ok: true }, 200, { 'cache-control': 'no-store' })
})
