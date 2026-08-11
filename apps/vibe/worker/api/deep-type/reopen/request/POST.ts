import { LOCALES } from '@sobok/domain/locale'
import { openDb, withDb } from '@sobok/edge/db/client'
import { randomToken, sha256Hex } from '@sobok/edge/tokens'
import { insertReopenLinks, listReopenCandidates } from '@vibe-worker/db/queries/reopen'
import type { AppEnv } from '@vibe-worker/env'
import { problem } from '@vibe-worker/errors'
import { sendReopenEmail } from '@vibe-worker/lib/reopen-email'
import { REOPEN_LINK_TTL_MS } from '@vibe-worker/lib/retention'
import { normalizeEmail } from '@vibe-worker/lib/tokens'
import { guardTurnstile } from '@vibe-worker/lib/turnstile'
import { Hono } from 'hono'
import { z } from 'zod'
import { DEEPTYPE_REOPEN_ACTION } from '../../actions'

const RequestBody = z.object({
  email: z.string().email().max(254),
  locale: z.enum(LOCALES),
  turnstileToken: z.string().min(1).max(2048),
})

const route = new Hono<AppEnv>()

// Always returns the same accepted response so callers cannot enumerate purchase emails. Turnstile and a
// per-email cooldown bound abuse; valid purchases receive one short-lived link each (up to five).
route.post('/', async (c) => {
  const parsed = RequestBody.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }

  const body = parsed.data

  // Gated before the email is ever looked up, so a Turnstile failure cannot become an enumeration oracle:
  // the response depends only on the solve, never on whether that address bought anything.
  const denied = await guardTurnstile(c, { expectedAction: DEEPTYPE_REOPEN_ACTION, token: body.turnstileToken })
  if (denied) {
    return denied
  }

  const email = normalizeEmail(body.email)
  const emailHash = await sha256Hex(email)
  const now = new Date()

  const links = await withDb(openDb(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    const candidates = await listReopenCandidates(db, emailHash, now)
    const issued = await Promise.all(
      candidates.map(async (candidate) => {
        const token = randomToken()
        const tokenHash = await sha256Hex(token)
        const expiresAt = new Date(now.getTime() + REOPEN_LINK_TTL_MS)
        const url = new URL(`/${candidate.locale}/deep-type/reopen`, c.env.DEEPTYPE_PUBLIC_ORIGIN)
        url.hash = new URLSearchParams({ token }).toString()
        return { ...candidate, expiresAt, tokenHash, url: url.toString() }
      }),
    )

    await insertReopenLinks(
      db,
      issued.map(({ expiresAt, purchaseId, tokenHash }) => ({ expiresAt, purchaseId, tokenHash })),
    )
    return issued
  })

  if (links.length > 0) {
    c.executionCtx.waitUntil(
      (async () => {
        try {
          await sendReopenEmail({
            apiKey: await c.env.DEEPTYPE_RESEND_API_KEY.get(),
            from: c.env.DEEPTYPE_EMAIL_FROM,
            idempotencyKey: `deeptype-reopen-${links[0].tokenHash}`,
            links: links.map(({ paidAt, url }) => ({ paidAt, url })),
            locale: body.locale,
            replyTo: c.env.DEEPTYPE_EMAIL_REPLY_TO,
            to: email,
          })
        } catch (error) {
          console.error('deeptype.reopen.email_failed', String(error))
        }
      })(),
    )
  }

  c.header('cache-control', 'no-store')
  return c.json({ status: 'accepted' }, 202)
})

export default route
