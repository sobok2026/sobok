import { LOCALES } from '@sobok/domain/locale'
import { openDb, withDb } from '@sobok/edge/db/client'
import { sha256Hex } from '@sobok/edge/tokens'
import { Hono } from 'hono'
import { z } from 'zod'
import { exchangeGuardianReopenAccess } from '~/db/queries/guardian-reopen'
import { withinRateLimits } from '~/db/queries/rate-limit'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { GuardianReopenTokenSchema } from '~/guardian/http'
import { sendRequestedGuardianReopenEmail } from '~/guardian/recovery'
import { newGuardianAccessToken } from '~/guardian/tokens'
import { NO_STORE_HEADERS, parseJson } from '~/lib/http'
import { hashIp } from '~/lib/ip'
import { clientIp } from '~/lib/request'
import { guardTurnstile } from '~/lib/turnstile'
import { GUARDIAN_REOPEN_ACTION } from './actions'

const BODY_LIMIT_BYTES = 2 * 1024
const REQUEST_LIMITS = [
  { bucket: 'guardian_reopen', windowMs: 3_600_000, limit: 5 },
  { bucket: 'guardian_reopen_burst', windowMs: 60_000, limit: 2 },
] as const

const RequestBody = z
  .object({
    email: z.string().trim().email().max(254),
    locale: z.enum(LOCALES),
    turnstileToken: z.string().min(1).max(2048),
  })
  .strict()
const ExchangeBody = z.object({ token: GuardianReopenTokenSchema }).strict()

export const guardianReopen = new Hono<AppEnv>()

// Always returns the same accepted response so the endpoint cannot enumerate purchase emails.
guardianReopen.post('/request', async (c) => {
  const body = await readBody(c.req.raw, RequestBody)
  if (!body) {
    return problem(422, 'invalid-request')
  }

  const ip = clientIp(c)
  const denied = await guardTurnstile(c, { expectedAction: GUARDIAN_REOPEN_ACTION, ip, token: body.turnstileToken })
  if (denied) {
    return denied
  }

  const normalizedEmail = body.email.toLowerCase()
  const ipHash = await hashIp(ip, await c.env.STELLA_IP_HASH_SALT.get())
  const allowed = await withDb(openDb(c.env.HYPERDRIVE), c.executionCtx, (db) =>
    withinRateLimits(db, ipHash ?? 'noip', REQUEST_LIMITS),
  )
  if (!allowed) {
    return problem(429, 'rate-limited')
  }

  // Purchase lookup, token issuance, and email delivery continue after the generic response. Only the
  // IP-scoped abuse decision is synchronous, keeping response timing independent of whether the email exists.
  c.executionCtx.waitUntil(
    sendRequestedGuardianReopenEmail(c.env, {
      locale: body.locale,
      normalizedEmail,
      to: body.email,
    }),
  )

  return c.json({ status: 'accepted' }, 202, NO_STORE_HEADERS)
})

// Exchanges one short-lived token. Guest collections receive a freshly rotated capability; account-owned
// collections receive only a stable report reference and must prove ownership with the Stella session.
guardianReopen.post('/exchange', async (c) => {
  const body = await readBody(c.req.raw, ExchangeBody)
  if (!body) {
    return problem(422, 'invalid-request')
  }

  const accessToken = newGuardianAccessToken()
  const [tokenHash, newAccessTokenHash] = await Promise.all([sha256Hex(body.token), sha256Hex(accessToken)])
  const reopened = await withDb(openDb(c.env.HYPERDRIVE), c.executionCtx, (db) =>
    exchangeGuardianReopenAccess(db, {
      tokenHash,
      newAccessTokenHash,
      now: new Date(),
    }),
  )
  if (!reopened) {
    return problem(410, 'reopen-link-invalid')
  }

  return c.json(reopened.status === 'guest' ? { ...reopened, accessToken } : reopened, 200, NO_STORE_HEADERS)
})

async function readBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T> | null> {
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > BODY_LIMIT_BYTES) {
    return null
  }
  const parsed = schema.safeParse(parseJson(raw))
  return parsed.success ? parsed.data : null
}
