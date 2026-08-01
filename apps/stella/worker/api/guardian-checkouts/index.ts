import { alertDiscord } from '@sobok/edge/alert'
import { openDb, withDb } from '@sobok/edge/db/client'
import { Hono } from 'hono'
import { z } from 'zod'
import { withinRateLimits } from '~/db/queries/rate-limit'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { GuardianAccessTokenSchema, GuardianReportPublicIdSchema } from '~/guardian/http'
import { GUARDIAN_PLANET_IDS } from '~/guardian/manifest'
import { prepareGuestGuardianCheckout, resumeGuestGuardianCheckout } from '~/guardian/service'
import { NO_STORE_HEADERS, parseJson } from '~/lib/http'
import { hashIp } from '~/lib/ip'
import { bearerToken, clientIp } from '~/lib/request'
import { guardTurnstile } from '~/lib/turnstile'
import { GUARDIAN_CHECKOUT_ACTION } from './actions'

const BODY_LIMIT_BYTES = 16 * 1024
const MARKET = 'KR'
const CHECKOUT_LIMITS = [
  { bucket: 'guardian_checkout', windowMs: 3_600_000, limit: 10 },
  { bucket: 'guardian_checkout_burst', windowMs: 60_000, limit: 3 },
] as const

const LongitudeSchema = z.number().min(0).lt(360)
const PlanetSchema = z
  .object({
    id: z.enum(GUARDIAN_PLANET_IDS),
    lon: LongitudeSchema,
    retrograde: z.boolean(),
  })
  .strict()

const ChartSchema = z
  .object({
    timeKnown: z.boolean(),
    planets: z
      .array(PlanetSchema)
      .min(GUARDIAN_PLANET_IDS.length - 1)
      .max(GUARDIAN_PLANET_IDS.length),
    ascendant: LongitudeSchema.nullable(),
    midheaven: LongitudeSchema.nullable(),
    cusps: z.array(LongitudeSchema).length(12).nullable(),
    moonLongitudeRange: z.tuple([LongitudeSchema, LongitudeSchema]).nullable(),
  })
  .strict()
  .superRefine((chart, context) => {
    const ids = chart.planets.map(({ id }) => id)
    const uniqueIds = new Set(ids)
    if (uniqueIds.size !== ids.length) {
      context.addIssue({ code: 'custom', message: 'Planet IDs must be unique', path: ['planets'] })
    }

    for (const id of GUARDIAN_PLANET_IDS) {
      if (id !== 'fortune' && !uniqueIds.has(id)) {
        context.addIssue({ code: 'custom', message: `Missing planet ${id}`, path: ['planets'] })
      }
    }

    const hasFortune = uniqueIds.has('fortune')
    const hasAngles = chart.ascendant !== null && chart.midheaven !== null && chart.cusps !== null
    if (chart.timeKnown) {
      if (!hasAngles || !hasFortune || chart.moonLongitudeRange !== null) {
        context.addIssue({ code: 'custom', message: 'Known-time chart shape is inconsistent' })
      }
    } else if (
      hasAngles ||
      chart.ascendant !== null ||
      chart.midheaven !== null ||
      chart.cusps !== null ||
      hasFortune ||
      chart.moonLongitudeRange === null
    ) {
      context.addIssue({ code: 'custom', message: 'Unknown-time chart shape is inconsistent' })
    }
  })

const PreviewAnswersSchema = z
  .object({
    tone: z.enum(['comfort', 'honesty', 'action', 'possibility']),
    movement: z.enum(['start', 'continue', 'recover', 'release']),
  })
  .strict()

const CommonCheckoutBody = {
  email: z.string().trim().email().max(254),
  turnstileToken: z.string().min(1).max(2048),
} as const

const NewCheckoutBody = z
  .object({
    ...CommonCheckoutBody,
    locale: z.literal('ko'),
    chart: ChartSchema,
    previewAnswers: PreviewAnswersSchema,
  })
  .strict()

const ResumeCheckoutBody = z
  .object({
    ...CommonCheckoutBody,
    reportPublicId: GuardianReportPublicIdSchema,
  })
  .strict()

const CheckoutBody = z.union([NewCheckoutBody, ResumeCheckoutBody])

export const guardianCheckouts = new Hono<AppEnv>()

// POST /api/guardian-checkouts — create a guest collection, report draft, and server-priced pending order.
guardianCheckouts.post('/', async (c) => {
  const rawBody = await c.req.text()
  if (new TextEncoder().encode(rawBody).byteLength > BODY_LIMIT_BYTES) {
    return problem(413, 'payload-too-large')
  }

  const parsed = CheckoutBody.safeParse(parseJson(rawBody))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }

  const body = parsed.data
  let resumeToken: string | null = null
  if ('reportPublicId' in body) {
    const parsedToken = GuardianAccessTokenSchema.safeParse(bearerToken(c))
    if (!parsedToken.success) {
      return problem(403, 'forbidden')
    }
    resumeToken = parsedToken.data
  }

  const ip = clientIp(c)
  const denied = await guardTurnstile(c, {
    expectedAction: GUARDIAN_CHECKOUT_ACTION,
    ip,
    token: body.turnstileToken,
  })
  if (denied) {
    return denied
  }

  const paymentConfig = await c.env.PAYMENTS.checkoutConfig('tosspay_v2').catch((error) => {
    console.error('stella.guardian_checkout.payments_unavailable', error instanceof Error ? error.name : 'unknown')
    return null
  })
  if (!paymentConfig) {
    console.error('stella.guardian_checkout.channel_unbound (tosspay_v2)')
    c.executionCtx.waitUntil(
      c.env.STELLA_DISCORD_WEBHOOK.get().then((webhook) =>
        alertDiscord(webhook, '🚨 stella guardian checkout has no PortOne Toss Pay channel'),
      ),
    )
    return problem(503, 'service-unavailable', { headers: { 'retry-after': '30' } })
  }

  const recoveryEmail = body.email
  const recoveryEmailNormalized = recoveryEmail.toLowerCase()
  const ipHash = await hashIp(ip, await c.env.STELLA_IP_HASH_SALT.get())

  const outcome = await withDb(openDb(c.env.HYPERDRIVE), c.executionCtx, async (db) => {
    if (!(await withinRateLimits(db, ipHash ?? 'noip', CHECKOUT_LIMITS))) {
      return { status: 'rate-limited' as const }
    }

    if ('reportPublicId' in body) {
      if (!resumeToken) {
        return { status: 'report-not-found' as const }
      }
      return resumeGuestGuardianCheckout(db, {
        collectionAccessToken: resumeToken,
        reportPublicId: body.reportPublicId,
        market: MARKET,
        recoveryEmail,
        recoveryEmailNormalized,
      })
    }

    const checkout = await prepareGuestGuardianCheckout(db, {
      locale: body.locale,
      market: MARKET,
      recoveryEmail,
      recoveryEmailNormalized,
      inputSnapshot: {
        chart: body.chart,
        previewAnswers: body.previewAnswers,
      },
    })
    return { status: 'ready' as const, ...checkout }
  })

  if (outcome.status === 'rate-limited') {
    return problem(429, 'rate-limited')
  }
  if (outcome.status === 'report-not-found') {
    return problem(403, 'forbidden')
  }
  if (outcome.status === 'purchase-state-conflict') {
    return problem(409, 'checkout-conflict')
  }
  if (outcome.status !== 'ready') {
    return problem(409, 'checkout-conflict')
  }

  return c.json(
    {
      guest: {
        collectionPublicId: outcome.collectionPublicId,
        reportPublicId: outcome.reportPublicId,
        ...('collectionAccessToken' in outcome ? { accessToken: outcome.collectionAccessToken } : {}),
      },
      payment: {
        paymentId: outcome.paymentId,
        status: outcome.purchaseStatus,
        sku: outcome.sku,
        storeId: paymentConfig.storeId,
        channelKey: paymentConfig.channelKey,
        payMethod: 'EASY_PAY' as const,
        orderName: outcome.orderName,
        amount: outcome.amount,
        market: outcome.market,
        currency: outcome.currency,
      },
    },
    'reportPublicId' in body ? 200 : 201,
    NO_STORE_HEADERS,
  )
})
