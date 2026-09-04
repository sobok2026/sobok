import { alertDiscord } from '@sobok/edge/alert'
import { withAuthorizedGuardianReport } from '@stella-worker/api/guardian-reports/access'
import { consumeGuardianRedraw } from '@stella-worker/db/queries/guardian'
import {
  createGuardianRedrawCheckout,
  equipGuardianLoveCard,
  readGuardianLoveRedraw,
} from '@stella-worker/db/queries/guardian-redraw'
import { withinRateLimits } from '@stella-worker/db/queries/rate-limit'
import type { AppEnv } from '@stella-worker/env'
import { problem } from '@stella-worker/errors'
import { GUARDIAN_LOVE_REDRAW_PRODUCT_SKUS } from '@stella-worker/guardian/manifest'
import { GUARDIAN_PAY_METHOD_SPEC, GUARDIAN_PAY_METHODS } from '@stella-worker/guardian/pay-method'
import type { GuardianLoveRedrawResult } from '@stella-worker/guardian/redraw-contract'
import { newGuardianPaymentId } from '@stella-worker/guardian/tokens'
import { NO_STORE_HEADERS, parseJson } from '@stella-worker/lib/http'
import { hashIp } from '@stella-worker/lib/ip'
import { clientIp } from '@stella-worker/lib/request'
import { guardTurnstile } from '@stella-worker/lib/turnstile'
import { guardianPaymentConfigFor } from '@stella-worker/payments/config'
import { Hono } from 'hono'
import { z } from 'zod'
import { GUARDIAN_REDRAW_CHECKOUT_ACTION } from './actions'

const MARKET = 'KR'
const BODY_LIMIT_BYTES = 4 * 1024
const CHECKOUT_LIMITS = [
  { bucket: 'guardian_redraw_checkout', windowMs: 3_600_000, limit: 20 },
  { bucket: 'guardian_redraw_checkout_burst', windowMs: 60_000, limit: 4 },
] as const
const DRAW_LIMITS = [{ bucket: 'guardian_redraw_draw_burst', windowMs: 60_000, limit: 20 }] as const

const RequestIdSchema = z.string().uuid()
const AcquisitionPublicIdSchema = z
  .string()
  .length(16)
  .regex(/^[A-Za-z0-9_-]+$/)
const CheckoutBody = z
  .object({
    requestId: RequestIdSchema,
    sku: z.enum(GUARDIAN_LOVE_REDRAW_PRODUCT_SKUS),
    payMethod: z.enum(GUARDIAN_PAY_METHODS),
    turnstileToken: z.string().min(1).max(2048),
  })
  .strict()
const DrawBody = z.object({ requestId: RequestIdSchema }).strict()
const EquipBody = z.object({ acquisitionPublicId: AcquisitionPublicIdSchema }).strict()

export const guardianLoveRedraw = new Hono<AppEnv>()

guardianLoveRedraw.get('/:reportPublicId/love-redraw', async (c) => {
  const authorized = await withAuthorizedGuardianReport(c, (db, access) =>
    readGuardianLoveRedraw(db, { ...access, market: MARKET }),
  )
  if (!authorized.authorized) {
    return problem(403, 'forbidden')
  }
  if (authorized.result.status === 'report-not-found') {
    return problem(404, 'report-not-found')
  }
  if (authorized.result.status === 'payment-required') {
    return problem(402, 'payment-required')
  }
  return c.json({ state: authorized.result.state }, 200, NO_STORE_HEADERS)
})

guardianLoveRedraw.post('/:reportPublicId/love-redraw/checkouts', async (c) => {
  const parsed = await parseBody(c.req.raw, CheckoutBody)
  if (parsed.status !== 'ok') {
    return problem(parsed.status, parsed.slug)
  }

  const ip = clientIp(c)
  const denied = await guardTurnstile(c, {
    expectedAction: GUARDIAN_REDRAW_CHECKOUT_ACTION,
    ip,
    token: parsed.body.turnstileToken,
  })
  if (denied) {
    return denied
  }

  const paymentConfig = await guardianPaymentConfigFor(c.env, parsed.body.payMethod).catch((error) => {
    console.error(
      'stella.guardian_redraw_checkout.payments_unavailable',
      error instanceof Error ? error.name : 'unknown',
    )
    return null
  })
  if (!paymentConfig) {
    console.error(`stella.guardian_redraw_checkout.channel_unbound (${parsed.body.payMethod})`)
    c.executionCtx.waitUntil(
      c.env.STELLA_DISCORD_WEBHOOK.get().then((webhook) =>
        alertDiscord(
          webhook,
          `🚨 stella guardian redraw checkout has no PortOne channel for \`${parsed.body.payMethod}\``,
        ),
      ),
    )
    return problem(503, 'service-unavailable', { headers: { 'retry-after': '30' } })
  }

  const ipHash = await hashIp(ip, await c.env.STELLA_IP_HASH_SALT.get())
  const authorized = await withAuthorizedGuardianReport(c, async (db, access) => {
    if (!(await withinRateLimits(db, ipHash ?? 'noip', CHECKOUT_LIMITS))) {
      return { status: 'rate-limited' as const }
    }
    return createGuardianRedrawCheckout(db, {
      ...access,
      requestId: parsed.body.requestId,
      paymentId: newGuardianPaymentId(),
      sku: parsed.body.sku,
      market: MARKET,
    })
  })
  if (!authorized.authorized) {
    return problem(403, 'forbidden')
  }
  const outcome = authorized.result
  if (outcome.status === 'rate-limited') {
    return problem(429, 'rate-limited')
  }
  if (outcome.status === 'report-not-found') {
    return problem(404, 'report-not-found')
  }
  if (outcome.status === 'payment-required') {
    return problem(402, 'payment-required')
  }
  if (outcome.status === 'product-unavailable') {
    return problem(409, 'product-unavailable')
  }
  if (outcome.status === 'checkout-conflict') {
    return problem(409, 'checkout-conflict')
  }

  return c.json(
    {
      payment: {
        paymentId: outcome.paymentId,
        status: outcome.purchaseStatus,
        sku: outcome.sku,
        storeId: paymentConfig.storeId,
        channelKey: paymentConfig.channelKey,
        payMethod: GUARDIAN_PAY_METHOD_SPEC[parsed.body.payMethod].sdkPayMethod,
        orderName: outcome.orderName,
        amount: outcome.amount,
        market: outcome.market,
        currency: outcome.currency,
      },
    },
    outcome.purchaseStatus === 'paid' ? 200 : 201,
    NO_STORE_HEADERS,
  )
})

guardianLoveRedraw.post('/:reportPublicId/love-redraw/draws', async (c) => {
  const parsed = await parseBody(c.req.raw, DrawBody)
  if (parsed.status !== 'ok') {
    return problem(parsed.status, parsed.slug)
  }
  const ip = clientIp(c)
  const ipHash = await hashIp(ip, await c.env.STELLA_IP_HASH_SALT.get())

  const authorized = await withAuthorizedGuardianReport(c, async (db, access) => {
    if (!(await withinRateLimits(db, ipHash ?? 'noip', DRAW_LIMITS))) {
      return { status: 'rate-limited' as const }
    }
    const draw = await consumeGuardianRedraw(db, {
      ...access,
      requestId: parsed.body.requestId,
      assetOrigin: c.env.STELLA_GUARDIAN_ASSET_ORIGIN,
    })
    if (draw.status !== 'drawn') {
      return draw
    }
    const state = await readGuardianLoveRedraw(db, { ...access, market: MARKET })
    if (state.status !== 'ok') {
      throw new Error(`Guardian redraw ${draw.acquisitionPublicId} committed without a readable collection`)
    }
    const owned = state.state.cards.find(({ cardEditionId }) => cardEditionId === draw.presentation.cardEditionId)
    if (!owned) {
      throw new Error(`Guardian redraw ${draw.acquisitionPublicId} is absent from ownership`)
    }
    return {
      status: 'drawn' as const,
      result: {
        acquisition: {
          ...draw.presentation,
          acquisitionPublicId: draw.acquisitionPublicId,
          acquisitionCount: owned.acquisitionCount,
          equipped: owned.equipped,
        },
        duplicate: draw.duplicate,
        guaranteeDue: draw.guaranteeDue,
        guaranteedUnowned: draw.guaranteedUnowned,
        created: draw.created,
        state: state.state,
      } satisfies GuardianLoveRedrawResult,
    }
  })
  if (!authorized.authorized) {
    return problem(403, 'forbidden')
  }
  if (authorized.result.status === 'rate-limited') {
    return problem(429, 'rate-limited')
  }
  if (authorized.result.status === 'report-not-found') {
    return problem(404, 'report-not-found')
  }
  if (authorized.result.status === 'no-credit') {
    return problem(409, 'redraw-credit-required')
  }
  return c.json({ result: authorized.result.result }, authorized.result.result.created ? 201 : 200, NO_STORE_HEADERS)
})

guardianLoveRedraw.put('/:reportPublicId/love-redraw/equipped-card', async (c) => {
  const parsed = await parseBody(c.req.raw, EquipBody)
  if (parsed.status !== 'ok') {
    return problem(parsed.status, parsed.slug)
  }
  const authorized = await withAuthorizedGuardianReport(c, async (db, access) => {
    const status = await equipGuardianLoveCard(db, { ...access, acquisitionPublicId: parsed.body.acquisitionPublicId })
    if (status !== 'selected' && status !== 'already-selected') {
      return { status }
    }
    const state = await readGuardianLoveRedraw(db, { ...access, market: MARKET })
    if (state.status !== 'ok') {
      throw new Error(`Guardian equipped card committed without a readable collection`)
    }
    return { status, state: state.state }
  })
  if (!authorized.authorized) {
    return problem(403, 'forbidden')
  }
  if (authorized.result.status === 'report-not-found') {
    return problem(404, 'report-not-found')
  }
  if (authorized.result.status === 'payment-required') {
    return problem(402, 'payment-required')
  }
  if (authorized.result.status === 'card-not-found') {
    return problem(404, 'card-not-found')
  }
  return c.json({ selected: authorized.result.status, state: authorized.result.state }, 200, NO_STORE_HEADERS)
})

async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<
  | { status: 'ok'; body: z.infer<T> }
  | { status: 413; slug: 'payload-too-large' }
  | { status: 422; slug: 'invalid-request' }
> {
  const rawBody = await request.text()
  if (new TextEncoder().encode(rawBody).byteLength > BODY_LIMIT_BYTES) {
    return { status: 413, slug: 'payload-too-large' }
  }
  const parsed = schema.safeParse(parseJson(rawBody))
  return parsed.success ? { status: 'ok', body: parsed.data } : { status: 422, slug: 'invalid-request' }
}
