import { Hono } from 'hono'
import { z } from 'zod'

import { openFresh, withDb } from '~/db/client'
import { createPendingPurchase } from '~/db/queries/purchase'
import { getResultForCheckoutByToken } from '~/db/queries/result'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { resolveSku } from '~/lib/pricing'
import { newPaymentId, normalizeEmail, randomToken, sha256Hex } from '~/lib/tokens'
import { verifyTurnstile } from '~/lib/turnstile'

// Phase 3: checkout → PortOne → verify / webhook.
const CheckoutBody = z.object({
  resultToken: z.string().length(43),
  sku: z.enum(['report']),
  email: z.string().email().max(254),
  consentWithdrawal: z.boolean(),
  consentPrivacy: z.boolean(),
  ageConfirmed: z.boolean(),
  turnstileToken: z.string().min(1).max(2048),
})

const route = new Hono<AppEnv>()

route.post('/', async (c) => {
  const parsed = CheckoutBody.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }

  const body = parsed.data

  // 청약철회 제한 + 개인정보 수집·이용 — both must be affirmatively consented before we take money.
  if (!body.consentWithdrawal || !body.consentPrivacy || !body.ageConfirmed) {
    return problem(422, 'consent-required')
  }

  // Always enforced on the paid path (the shared "sobok" Turnstile widget). Locally the widget test key +
  // test secret pass any token; prod requires a real solved token (Phase 7 wires the frontend widget).
  const turnstileOk = await verifyTurnstile(
    await c.env.DEEPTYPE_TURNSTILE_SECRET.get(),
    body.turnstileToken,
    c.req.header('cf-connecting-ip') ?? null,
  )

  if (!turnstileOk) {
    return problem(403, 'turnstile-failed')
  }

  const email = normalizeEmail(body.email)
  const emailHash = await sha256Hex(email)
  const paymentId = newPaymentId()
  const accessToken = randomToken()
  const now = new Date()

  const detail = await withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    const result = await getResultForCheckoutByToken(db, body.resultToken)
    if (!result) {
      return null
    }
    const sku = resolveSku(body.sku, result.locale)
    if (!sku) {
      return null
    }

    await createPendingPurchase(db, {
      accessToken,
      paymentId,
      resultId: result.id,
      email,
      emailHash,
      orderName: sku.orderName,
      amount: sku.amount,
      currency: sku.currency,
      sku: sku.sku,
      consentWithdrawalAt: now,
      consentPrivacyAt: now,
      ageConfirmedAt: now,
    })

    return sku
  })

  if (!detail) {
    return problem(404, 'result-not-found')
  }

  return c.json({
    paymentId,
    accessToken,
    storeId: c.env.DEEPTYPE_PORTONE_STORE_ID,
    channelKey: c.env.DEEPTYPE_PORTONE_CHANNEL_KEY,
    orderName: detail.orderName,
    amount: detail.amount,
    currency: detail.currency,
  })
})

export default route
