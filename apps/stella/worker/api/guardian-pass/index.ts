import { alertDiscord } from '@sobok/edge/alert'
import { openDb, withDb } from '@sobok/edge/db/client'
import { sha256Hex } from '@sobok/edge/tokens'
import { withStellaSession } from '@stella-worker/auth'
import {
  claimGuardianCollection,
  latestGuardianPassExpiryForCollection,
  latestOwnedGuardianPassExpiry,
  listGuardianDailyCardsForCollection,
  listOwnedGuardianDailyCards,
  prepareGuardianPassCheckout,
  resolveGuardianCollectionAccess,
  resolveGuardianPurchaseAccess,
} from '@stella-worker/db/queries/guardian'
import { exchangeGuardianReopenAccess } from '@stella-worker/db/queries/guardian-reopen'
import { withinRateLimits } from '@stella-worker/db/queries/rate-limit'
import type { AppEnv } from '@stella-worker/env'
import { problem } from '@stella-worker/errors'
import { summarizeGuardianDailyCards } from '@stella-worker/guardian/daily-card'
import {
  GuardianAccessTokenSchema,
  GuardianCheckoutRequestIdSchema,
  GuardianCollectionPublicIdSchema,
  GuardianPaymentIdSchema,
  GuardianReopenTokenSchema,
  GuardianTimeZoneSchema,
  GuardianViewerIdSchema,
} from '@stella-worker/guardian/http'
import { guardianArtworkUrl } from '@stella-worker/guardian/manifest'
import { GUARDIAN_PAY_METHOD_SPEC, GUARDIAN_PAY_METHODS } from '@stella-worker/guardian/pay-method'
import { syncGuardianPayment } from '@stella-worker/guardian/payment'
import { dispatchGuardianRecoveryEmails, sendRequestedGuardianReopenEmail } from '@stella-worker/guardian/recovery'
import { newGuardianAccessToken, newGuardianPaymentId, newGuardianPublicId } from '@stella-worker/guardian/tokens'
import { NO_STORE_HEADERS, parseJson } from '@stella-worker/lib/http'
import { hashIp } from '@stella-worker/lib/ip'
import { bearerToken, clientIp } from '@stella-worker/lib/request'
import { guardTurnstile } from '@stella-worker/lib/turnstile'
import { type GuardianRemotePayment, getGuardianRemotePayment } from '@stella-worker/payments/client'
import { guardianPaymentConfigFor } from '@stella-worker/payments/config'
import { Hono } from 'hono'
import { z } from 'zod'
import { GUARDIAN_PASS_CHECKOUT_ACTION, GUARDIAN_PASS_REOPEN_ACTION } from './actions'

const CHECKOUT_BODY_LIMIT_BYTES = 8 * 1024
const REOPEN_BODY_LIMIT_BYTES = 4 * 1024
const CHECKOUT_LIMITS = [
  { bucket: 'guardian_pass_checkout', windowMs: 3_600_000, limit: 10 },
  { bucket: 'guardian_pass_checkout_burst', windowMs: 60_000, limit: 3 },
] as const
const REOPEN_LIMITS = [
  { bucket: 'guardian_pass_reopen', windowMs: 3_600_000, limit: 6 },
  { bucket: 'guardian_pass_reopen_burst', windowMs: 60_000, limit: 2 },
] as const

const CheckoutBody = z
  .object({
    locale: z.literal('ko'),
    timeZone: GuardianTimeZoneSchema,
    email: z.string().trim().email().max(254),
    payMethod: z.enum(GUARDIAN_PAY_METHODS),
    turnstileToken: z.string().min(1).max(2048),
    viewerId: GuardianViewerIdSchema,
    checkoutRequestId: GuardianCheckoutRequestIdSchema,
    consents: z
      .object({
        age: z.literal(true),
        terms: z.literal(true),
        privacy: z.literal(true),
        withdrawal: z.literal(true),
      })
      .strict(),
  })
  .strict()
const ReopenRequestBody = z
  .object({
    locale: z.literal('ko'),
    email: z.string().trim().email().max(254),
    turnstileToken: z.string().min(1).max(2048),
  })
  .strict()
const ReopenExchangeBody = z.object({ token: GuardianReopenTokenSchema }).strict()

export const guardianPass = new Hono<AppEnv>()

guardianPass.post('/checkouts', async (c) => {
  const rawBody = await c.req.text()
  if (new TextEncoder().encode(rawBody).byteLength > CHECKOUT_BODY_LIMIT_BYTES) {
    return problem(413, 'payload-too-large')
  }
  const parsed = CheckoutBody.safeParse(parseJson(rawBody))
  if (!parsed.success) return problem(422, 'invalid-request')
  const body = parsed.data
  if (!validTimeZone(body.timeZone)) return problem(422, 'invalid-request')

  const rawToken = bearerToken(c)
  const parsedToken = rawToken === null ? null : GuardianAccessTokenSchema.safeParse(rawToken)
  if (parsedToken && !parsedToken.success) return problem(403, 'forbidden')
  const accessTokenHash = parsedToken?.success ? await sha256Hex(parsedToken.data) : undefined

  const ip = clientIp(c)
  const denied = await guardTurnstile(c, {
    expectedAction: GUARDIAN_PASS_CHECKOUT_ACTION,
    ip,
    token: body.turnstileToken,
  })
  if (denied) return denied

  const paymentConfig = await guardianPaymentConfigFor(c.env, body.payMethod).catch((error) => {
    console.error('stella.guardian_pass_checkout.payments_unavailable', error instanceof Error ? error.name : 'unknown')
    return null
  })
  if (!paymentConfig) {
    c.executionCtx.waitUntil(
      c.env.STELLA_DISCORD_WEBHOOK.get().then((webhook) =>
        alertDiscord(webhook, `🚨 stella guardian pass has no PortOne channel for \`${body.payMethod}\``),
      ),
    )
    return problem(503, 'service-unavailable', { headers: { 'retry-after': '30' } })
  }

  const newAccessToken = newGuardianAccessToken()
  const ipHash = await hashIp(ip, await c.env.STELLA_IP_HASH_SALT.get())
  const result = await withStellaSession(c, async (db, session) => {
    if (!(await withinRateLimits(db, ipHash ?? 'noip', CHECKOUT_LIMITS))) {
      return { status: 'rate-limited' as const }
    }
    const outcome = await prepareGuardianPassCheckout(db, {
      accessTokenHash,
      ownerUserId: session?.user.id,
      newCollectionPublicId: newGuardianPublicId(),
      newCollectionAccessTokenHash: await sha256Hex(newAccessToken),
      viewerSeedHash: await sha256Hex(body.viewerId),
      checkoutRequestId: body.checkoutRequestId,
      paymentId: newGuardianPaymentId(),
      locale: body.locale,
      timeZone: body.timeZone,
      recoveryEmail: body.email,
      recoveryEmailNormalized: body.email.toLowerCase(),
      now: new Date(),
    })
    return { ...outcome, accountOwned: Boolean(session) }
  })

  if (result.status === 'rate-limited') return problem(429, 'rate-limited')
  if (result.status === 'pass-active') return problem(409, 'pass-active')
  if (result.status !== 'ready') return problem(409, 'checkout-conflict')

  return c.json(
    {
      collection: {
        publicId: result.collectionPublicId,
        ...(result.collectionCreated && !result.accountOwned ? { accessToken: newAccessToken } : {}),
      },
      payment: {
        paymentId: result.paymentId,
        status: result.purchaseStatus,
        accessExpiresAt: result.accessExpiresAt?.toISOString() ?? null,
        sku: result.sku,
        storeId: paymentConfig.storeId,
        channelKey: paymentConfig.channelKey,
        payMethod: GUARDIAN_PAY_METHOD_SPEC[body.payMethod].sdkPayMethod,
        orderName: result.orderName,
        amount: result.amount,
        market: result.market,
        currency: result.currency,
      },
    },
    result.collectionCreated ? 201 : 200,
    NO_STORE_HEADERS,
  )
})

guardianPass.post('/purchases/:paymentId/confirm', async (c) => {
  const paymentId = GuardianPaymentIdSchema.safeParse(c.req.param('paymentId'))
  const rawToken = bearerToken(c)
  const token = rawToken === null ? null : GuardianAccessTokenSchema.safeParse(rawToken)
  if (!paymentId.success || (token && !token.success)) return problem(403, 'forbidden')
  const accessTokenHash = token?.success ? await sha256Hex(token.data) : undefined

  const access = await withStellaSession(c, (db, session) => {
    if (!session && !accessTokenHash) return Promise.resolve(null)
    return resolveGuardianPurchaseAccess(db, {
      accessTokenHash,
      ownerUserId: session?.user.id,
      paymentId: paymentId.data,
    })
  })
  if (!access) return problem(403, 'forbidden')
  if (access.purchaseStatus === 'review_required') return problem(409, 'payment-conflict')
  if (['failed', 'cancelled', 'refunded'].includes(access.purchaseStatus)) {
    return c.json({ status: access.purchaseStatus }, 200, NO_STORE_HEADERS)
  }

  let remotePayment: GuardianRemotePayment
  try {
    remotePayment = await getGuardianRemotePayment(c.env, paymentId.data)
  } catch (error) {
    console.error('stella.guardian_pass.confirm_lookup_failed', error instanceof Error ? error.name : 'unknown')
    return problem(503, 'service-unavailable', { headers: { 'retry-after': '5' } })
  }
  const outcome = await withDb(openDb(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
    syncGuardianPayment(db, remotePayment),
  )
  if (outcome.status === 'pending') return c.json({ status: 'pending' }, 202, NO_STORE_HEADERS)
  if (outcome.status === 'granted' || outcome.status === 'already-granted') {
    c.executionCtx.waitUntil(dispatchGuardianRecoveryEmails(c.env, { paymentId: paymentId.data }))
    return c.json(
      {
        status: 'paid',
        grant: outcome.status,
        accessExpiresAt: outcome.accessExpiresAt.toISOString(),
        collectionPublicId: outcome.collectionPublicId,
      },
      200,
      NO_STORE_HEADERS,
    )
  }
  if (outcome.status === 'failed' || outcome.status === 'cancelled' || outcome.status === 'refunded') {
    return c.json({ status: outcome.status }, 200, NO_STORE_HEADERS)
  }
  if (outcome.status === 'payment-mismatch') {
    c.executionCtx.waitUntil(
      c.env.STELLA_DISCORD_WEBHOOK.get().then((webhook) =>
        alertDiscord(webhook, '⚠️ stella guardian pass requires amount/currency review'),
      ),
    )
    return problem(409, 'payment-mismatch')
  }
  if (outcome.status === 'purchase-not-found') return problem(403, 'forbidden')
  return problem(409, 'payment-conflict')
})

guardianPass.get('/library', async (c) => {
  const rawToken = bearerToken(c)
  const token = rawToken === null ? null : GuardianAccessTokenSchema.safeParse(rawToken)
  if (token && !token.success) return problem(403, 'forbidden')
  const accessTokenHash = token?.success ? await sha256Hex(token.data) : undefined
  const result = await withStellaSession(c, async (db, session) => {
    if (accessTokenHash) {
      const collection = await resolveGuardianCollectionAccess(db, { accessTokenHash })
      if (!collection) return null
      const [cards, accessExpiresAt] = await Promise.all([
        listGuardianDailyCardsForCollection(db, { collectionId: collection.id, limit: 48 }),
        latestGuardianPassExpiryForCollection(db, collection.id),
      ])
      return { cards, accessExpiresAt }
    }
    if (!session) return null
    const [cards, accessExpiresAt] = await Promise.all([
      listOwnedGuardianDailyCards(db, { ownerUserId: session.user.id, limit: 48 }),
      latestOwnedGuardianPassExpiry(db, session.user.id),
    ])
    return { cards, accessExpiresAt }
  })
  if (!result) return problem(401, 'forbidden')

  return c.json(
    {
      items: result.cards.map(({ snapshot, source, createdAt, ...item }) => {
        const { artworkObjectKey, ...card } = snapshot
        return {
          ...item,
          ...card,
          artworkPath: guardianArtworkUrl(artworkObjectKey, c.env.STELLA_GUARDIAN_ASSET_ORIGIN),
          source,
          createdAt: createdAt.toISOString(),
        }
      }),
      summary: summarizeGuardianDailyCards(result.cards.map(({ snapshot }) => snapshot)),
      access: {
        active: result.accessExpiresAt !== null && result.accessExpiresAt > new Date(),
        expiresAt: result.accessExpiresAt?.toISOString() ?? null,
      },
    },
    200,
    NO_STORE_HEADERS,
  )
})

guardianPass.post('/collections/:collectionPublicId/claim', async (c) => {
  const collectionPublicId = GuardianCollectionPublicIdSchema.safeParse(c.req.param('collectionPublicId'))
  const token = GuardianAccessTokenSchema.safeParse(bearerToken(c))
  if (!collectionPublicId.success || !token.success) return problem(422, 'invalid-request')
  const result = await withStellaSession(c, async (db, session) => {
    if (!session) return Promise.resolve(null)
    return claimGuardianCollection(db, {
      collectionPublicId: collectionPublicId.data,
      accessTokenHash: await sha256Hex(token.data),
      ownerUserId: session.user.id,
    })
  })
  if (!result || result === 'forbidden') return problem(403, 'forbidden')
  return c.json({ status: result, guestAccessRevoked: true }, 200, NO_STORE_HEADERS)
})

guardianPass.post('/reopen/request', async (c) => {
  const rawBody = await c.req.text()
  if (new TextEncoder().encode(rawBody).byteLength > REOPEN_BODY_LIMIT_BYTES) {
    return problem(413, 'payload-too-large')
  }
  const parsed = ReopenRequestBody.safeParse(parseJson(rawBody))
  if (!parsed.success) return problem(422, 'invalid-request')
  const ip = clientIp(c)
  const denied = await guardTurnstile(c, {
    expectedAction: GUARDIAN_PASS_REOPEN_ACTION,
    ip,
    token: parsed.data.turnstileToken,
  })
  if (denied) return denied

  const ipHash = await hashIp(ip, await c.env.STELLA_IP_HASH_SALT.get())
  const allowed = await withDb(openDb(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
    withinRateLimits(db, ipHash ?? 'noip', REOPEN_LIMITS),
  )
  if (!allowed) return problem(429, 'rate-limited')

  c.executionCtx.waitUntil(
    sendRequestedGuardianReopenEmail(c.env, {
      locale: parsed.data.locale,
      normalizedEmail: parsed.data.email.toLowerCase(),
      to: parsed.data.email,
    }),
  )
  return c.json({ status: 'accepted' as const }, 202, NO_STORE_HEADERS)
})

guardianPass.post('/reopen/exchange', async (c) => {
  const rawBody = await c.req.text()
  if (new TextEncoder().encode(rawBody).byteLength > REOPEN_BODY_LIMIT_BYTES) {
    return problem(413, 'payload-too-large')
  }
  const parsed = ReopenExchangeBody.safeParse(parseJson(rawBody))
  if (!parsed.success) return problem(422, 'invalid-request')

  const newAccessToken = newGuardianAccessToken()
  const result = await withDb(openDb(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) =>
    exchangeGuardianReopenAccess(db, {
      tokenHash: await sha256Hex(parsed.data.token),
      newAccessTokenHash: await sha256Hex(newAccessToken),
      now: new Date(),
    }),
  )
  if (!result) return problem(403, 'reopen-link-invalid')
  if (result.status === 'account') {
    return c.json({ status: 'account', locale: result.locale }, 200, NO_STORE_HEADERS)
  }
  return c.json(
    {
      status: 'guest',
      accessToken: newAccessToken,
      collectionPublicId: result.collectionPublicId,
      locale: result.locale,
      paymentId: result.paymentId,
      accessExpiresAt: result.accessExpiresAt.toISOString(),
    },
    200,
    NO_STORE_HEADERS,
  )
})

function validTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format()
    return true
  } catch {
    return false
  }
}
