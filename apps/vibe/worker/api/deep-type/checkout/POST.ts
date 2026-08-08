import { isPayMethodAllowed, PAY_METHODS } from '@deep-type/pay-method'
import { alertDiscord } from '@sobok/edge/alert'
import { openDb, withDb } from '@sobok/edge/db/client'
import { randomToken, sha256Hex } from '@sobok/edge/tokens'
import { Hono } from 'hono'
import { z } from 'zod'
import { createPendingPurchase } from '~/db/queries/purchase'
import { getResultForCheckoutByToken } from '~/db/queries/result'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { resolveSku } from '~/lib/pricing'
import { newPaymentId, normalizeEmail } from '~/lib/tokens'
import { guardTurnstile } from '~/lib/turnstile'
import { DEEPTYPE_CHECKOUT_ACTION } from '../actions'
import { paymentConfigFor } from '../channels'

// Phase 3: checkout → PortOne → verify / webhook.
const CheckoutBody = z.object({
  resultToken: z.string().length(43),
  sku: z.enum(['report']),
  // Which method to open. Shape-checked against the catalogue here and policy-checked below against the
  // result's locale — the enum alone would let an EN sitting open a domestic wallet it was never offered.
  payMethod: z.enum(PAY_METHODS),
  email: z.string().email().max(254),
  consentWithdrawal: z.boolean(),
  consentPrivacy: z.boolean(),
  ageConfirmed: z.boolean(),
  turnstileToken: z.string().min(1).max(2048),
  // The buyer's GA4 identity, read from the first-party cookies while they are still on the paywall. Purely
  // routing data for the server-side `purchase`: it is never trusted for entitlement, pricing or identity, and
  // is null whenever `analytics_storage` is denied. The shapes are pinned so a forged value cannot smuggle
  // anything into the Measurement Protocol payload.
  //
  // `.catch(null)` is the load-bearing part: this field must be unable to fail the request. Without it a
  // cookie Google reshapes tomorrow — it has reshaped `_ga_<stream>` once already — turns every checkout into
  // a 422 and stops the sale. A missing analytics field costs a measurement, never money.
  analytics: z
    .object({
      clientId: z.string().regex(/^\d{1,24}\.\d{1,24}$/),
      // Stored and forwarded as the whole cookie value, so the charset is the opaque-token set (base64 in
      // both alphabets, plus GA's `$` separators) rather than today's exact grammar — pinning it tighter
      // would mean Google reshaping the value once again costs every session. Its own `.catch(null)` keeps
      // that blast radius to the session: a client id still reaches the Worker on its own.
      sessionId: z
        .string()
        .regex(/^[A-Za-z0-9$._~+/=-]{1,128}$/)
        .nullable()
        .catch(null),
    })
    .nullish()
    .catch(null),
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

  // Always enforced on the paid path — this is the gate that keeps bots from minting pending purchases and
  // probing the funnel. Never conditional on the environment: a testing-key bypass would ship to production.
  const denied = await guardTurnstile(c, { expectedAction: DEEPTYPE_CHECKOUT_ACTION, token: body.turnstileToken })
  if (denied) {
    return denied
  }

  const email = normalizeEmail(body.email)
  const emailHash = await sha256Hex(email)
  const paymentId = newPaymentId()
  const accessToken = randomToken()
  const now = new Date()

  const detail = await withDb(openDb(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    const result = await getResultForCheckoutByToken(db, body.resultToken)
    if (!result) {
      return null
    }

    // The locale is the stored one, not a client claim, so this is the point where the channel policy is
    // actually enforced. Checked before the pending row is written — a refused method must leave nothing
    // behind for scheduled reconciliation to chase.
    if (!isPayMethodAllowed(result.locale, c.env.DEEPTYPE_PAY_PROFILE, body.payMethod)) {
      return 'method-not-allowed' as const
    }

    // Resolved here rather than in the response, and for the same reason: a pending row whose window can never
    // open is a row the 15-minute maintenance job re-checks against PortOne until retention purges it. The menu already says
    // this method is sellable, so an absent key means this deployment's channel map and
    // `sellableChannels(profile)` disagree — our mistake, caught before it costs a row.
    const paymentConfig = await paymentConfigFor(c.env, body.payMethod)
    if (!paymentConfig) {
      return 'channel-unbound' as const
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
      gaClientId: body.analytics?.clientId ?? null,
      gaSessionId: body.analytics?.sessionId ?? null,
    })

    return { paymentConfig, sku }
  })

  // Deliberately the same generic 422 a malformed body gets: naming the policy would tell a prober which
  // locales carry which channels, and a legitimate client cannot reach this branch — the paywall only ever
  // offers what `payMethodsFor` returned.
  if (detail === 'method-not-allowed') {
    return problem(422, 'invalid-request')
  }
  // Config, not request: 500 and a page, the same treatment a misconfigured Turnstile gets. A client cannot
  // provoke it — the method it asked for is one the menu offered — so this cannot be turned into a flood, and
  // it is worth waking up for because it means one of the methods on the paywall cannot be paid with.
  if (detail === 'channel-unbound') {
    console.error(`deeptype.checkout.channel_unbound (${c.env.DEEPTYPE_PAY_PROFILE}): ${body.payMethod}`)
    c.executionCtx.waitUntil(
      c.env.DEEPTYPE_DISCORD_WEBHOOK.get().then((url) =>
        alertDiscord(url, `🚨 deeptype has no ${c.env.DEEPTYPE_PAY_PROFILE} channel key for \`${body.payMethod}\``),
      ),
    )
    return problem(500, 'internal')
  }
  if (!detail) {
    return problem(404, 'result-not-found')
  }

  // One key, for the method the server just approved. Channel keys are public — the browser SDK needs them —
  // so this is not about secrecy; it is that the response should carry the decision rather than the menu.
  return c.json({
    paymentId,
    accessToken,
    storeId: detail.paymentConfig.storeId,
    channelKey: detail.paymentConfig.channelKey,
    orderName: detail.sku.orderName,
    amount: detail.sku.amount,
    currency: detail.sku.currency,
  })
})

export default route
