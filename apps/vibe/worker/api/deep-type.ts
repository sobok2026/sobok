import { type Context, Hono } from 'hono'
import { z } from 'zod'

import { type PortOneCreds, verifyWebhook } from '../billing/portone'
import { openCached, openFresh, withDb } from '../db/client'
import { createPendingPurchase, getPurchaseByAccessToken, stampReportViewed } from '../db/queries/purchase'
import {
  acquireReportLock,
  finalizeReportDone,
  finalizeReportFailed,
  getDoneSections,
  getReportStatus,
} from '../db/queries/report'
import {
  getPurchaseResultByAccessToken,
  getResultForReport,
  getResultIdByToken,
  insertResult,
  persistPrecision,
} from '../db/queries/result'
import { recordWebhookEvent } from '../db/queries/webhook'
import type { AppEnv } from '../env'
import { problem } from '../errors'
import { resolveSku } from '../lib/pricing'
import { newPaymentId, normalizeEmail, randomToken, sha256Hex } from '../lib/tokens'
import { verifyTurnstile } from '../lib/turnstile'
import { applyRefund, confirmPurchase } from '../payments/confirm'
import { generateReport } from '../report/claude'
import { buildReportProfile } from '../report/profile'
import { refineAxes, resolvePrecisionResponses } from '../scoring/precision'

export const deepType = new Hono<AppEnv>()

function creds(c: Context<AppEnv>): PortOneCreds {
  return { apiSecret: c.env.DEEPTYPE_PORTONE_API_SECRET, webhookSecret: c.env.DEEPTYPE_PORTONE_WEBHOOK_SECRET }
}

// The report access_token, carried as `Authorization: Bearer <token>` (never a query param — credentials
// don't belong in URLs). null when absent/malformed.
function bearer(c: Context<AppEnv>): string | null {
  const header = c.req.header('authorization')
  const match = header?.match(/^Bearer\s+(\S+)$/i)
  return match ? match[1] : null
}

// The only PortOne values that may reach the browser (needed by @portone/browser-sdk requestPayment).
// The api secret + webhook secret never leave the Worker.
deepType.get('/config', (c) =>
  c.json({
    storeId: c.env.DEEPTYPE_PORTONE_STORE_ID,
    channelKey: c.env.DEEPTYPE_PORTONE_CHANNEL_KEY,
  }),
)

// ── Phase 2: free result persistence ────────────────────────────────────────────────────────────────
const SessionBody = z.object({
  locale: z.enum(['ko', 'en', 'ja', 'zh']).default('ko'),
  selfClaim: z.string().max(4).optional(),
  persona: z.string().length(4),
  innerType: z.string().length(4),
  gem: z.string().length(4),
  baseAnswers: z.array(z.unknown()).max(500),
  innerAnswers: z.array(z.unknown()).max(500),
  gemAnswers: z.array(z.unknown()).max(500),
})

deepType.post('/session', async (c) => {
  if (Number(c.req.header('content-length') ?? 0) > 32 * 1024) {
    return problem(413, 'payload-too-large')
  }
  const parsed = SessionBody.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }

  const resultToken = randomToken()
  await withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
    insertResult(db, { ...parsed.data, resultToken }),
  )
  return c.json({ resultToken }, 201)
})

// ── Phase 3: checkout → PortOne → verify / webhook ──────────────────────────────────────────────────
const CheckoutBody = z.object({
  resultToken: z.string().length(43),
  sku: z.enum(['report']),
  email: z.string().email().max(254),
  consentWithdrawal: z.boolean(),
  consentPrivacy: z.boolean(),
  turnstileToken: z.string().min(1).max(2048),
})

deepType.post('/checkout', async (c) => {
  const parsed = CheckoutBody.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }
  const body = parsed.data

  // 청약철회 제한 + 개인정보 수집·이용 — both must be affirmatively consented before we take money.
  if (!body.consentWithdrawal || !body.consentPrivacy) {
    return problem(422, 'consent-required')
  }

  const turnstileSecret = c.env.DEEPTYPE_TURNSTILE_SECRET
  if (turnstileSecret) {
    const ok = await verifyTurnstile(turnstileSecret, body.turnstileToken, c.req.header('cf-connecting-ip') ?? null)
    if (!ok) {
      return problem(403, 'turnstile-failed')
    }
  }

  const detail = resolveSku(body.sku)
  if (!detail) {
    return problem(422, 'invalid-sku')
  }

  const email = normalizeEmail(body.email)
  const emailHash = await sha256Hex(email)
  const paymentId = newPaymentId()
  const accessToken = randomToken()
  const now = new Date()

  const created = await withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    const resultId = await getResultIdByToken(db, body.resultToken)
    if (resultId === null) {
      return false
    }
    await createPendingPurchase(db, {
      accessToken,
      paymentId,
      resultId,
      email,
      emailHash,
      orderName: detail.orderName,
      amount: detail.amount,
      currency: detail.currency,
      sku: detail.sku,
      consentWithdrawalAt: now,
      consentPrivacyAt: now,
    })
    return true
  })
  if (!created) {
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

const VerifyBody = z.object({ paymentId: z.string().min(1).max(64) })

// Browser-return path after PortOne.requestPayment resolves. Shares confirmPurchase with the webhook, so
// whichever lands first grants; the other is an idempotent no-op.
deepType.post('/verify', async (c) => {
  const parsed = VerifyBody.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }

  const outcome = await withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
    confirmPurchase(db, creds(c), parsed.data.paymentId),
  )

  switch (outcome) {
    case 'paid':
    case 'already-paid':
      return c.json({ status: 'paid' })
    case 'not-found':
      return problem(404, 'purchase-not-found')
    case 'refunded':
      return problem(410, 'purchase-refunded')
    case 'amount-mismatch':
      return problem(409, 'amount-mismatch')
    case 'not-completed':
      return problem(402, 'payment-not-completed')
  }
})

// PortOne Standard-Webhooks endpoint. RAW body is verified BEFORE any parse; processing is idempotent, so
// at-least-once delivery + races with /verify are safe. Always ack 200 once the signature is valid (even
// on amount-mismatch) so PortOne stops retrying; the mismatch is left pending for reconcile/review.
deepType.post('/webhook', async (c) => {
  const raw = await c.req.text()
  const headers = {
    'webhook-id': c.req.header('webhook-id') ?? '',
    'webhook-signature': c.req.header('webhook-signature') ?? '',
    'webhook-timestamp': c.req.header('webhook-timestamp') ?? '',
  }

  // verifyWebhook throws on a bad signature and returns null for an event type we don't act on.
  const event = await verifyWebhook(creds(c), raw, headers).catch(() => undefined)
  if (event === undefined) {
    return problem(400, 'invalid-signature')
  }
  if (!event) {
    return c.json({ ok: true })
  }

  const acted = event
  return withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    if (acted.type === 'paid') {
      const outcome = await confirmPurchase(db, creds(c), acted.paymentId)
      if (outcome === 'amount-mismatch') {
        console.error('deeptype.webhook.amount_mismatch', acted.paymentId)
      }
    } else {
      await applyRefund(db, acted.paymentId)
    }
    await recordWebhookEvent(db, { eventId: headers['webhook-id'], type: acted.type, payload: raw })
    return c.json({ ok: true })
  })
})

// ── Phase 4: report generation + cache-first delivery ───────────────────────────────────────────────

// Read-only, cache-first delivery. The gate is FRESH (entitlement must never be stale); the done body is
// read from the CACHED binding with a FRESH fallback for post-write cache lag. A GET never generates or
// mutates — except stamping viewed_at on the delivering 200 (the legal anchor for the unviewed-refund right).
deepType.get('/report', async (c) => {
  const token = bearer(c)
  if (!token) {
    return problem(401, 'unauthorized')
  }

  const gate = await withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    const purchase = await getPurchaseByAccessToken(db, token)
    if (!purchase) {
      return { kind: 'not-found' as const }
    }
    if (purchase.status === 'refunded') {
      return { kind: 'refunded' as const }
    }
    if (purchase.status !== 'paid') {
      return { kind: 'not-paid' as const }
    }
    const report = await getReportStatus(db, purchase.id)
    if (report?.status === 'done') {
      await stampReportViewed(db, purchase.id)
      return { kind: 'done' as const, purchaseId: purchase.id }
    }
    if (report?.status === 'failed' && report.attempts >= 5) {
      return { kind: 'failed' as const }
    }
    return { kind: 'pending' as const }
  })

  switch (gate.kind) {
    case 'not-found':
      return problem(404, 'purchase-not-found')
    case 'refunded':
      return problem(410, 'purchase-refunded')
    case 'not-paid':
      return problem(403, 'purchase-not-paid')
    case 'failed':
      return problem(502, 'report-generation-failed')
    case 'pending':
      return problem(202, 'report-generating', undefined, undefined, { 'retry-after': '2' })
    case 'done':
      break
  }

  const cached = await withDb(openCached(c.env.HYPERDRIVE_CACHED), c.executionCtx, (db) =>
    getDoneSections(db, gate.purchaseId),
  )
  const sections =
    cached ??
    (await withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) => getDoneSections(db, gate.purchaseId)))
  return c.json({ sections, status: 'done' })
})

// Idempotent, CAS-locked generation. Gated (paid) + kill-switched (Anthropic budget). Persists BEFORE
// returning so a dropped client never loses a paid report; any failure marks the row failed and is
// retriable until attempts hit 5.
deepType.post('/report/generate', async (c) => {
  const token = bearer(c)
  if (!token) {
    return problem(401, 'unauthorized')
  }
  if (c.env.DEEPTYPE_LLM_ENABLED !== '1') {
    return problem(503, 'not-configured')
  }

  const lockToken = randomToken()
  const claim = await withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    const purchase = await getPurchaseByAccessToken(db, token)
    if (!purchase) {
      return { kind: 'not-found' as const }
    }
    if (purchase.status === 'refunded') {
      return { kind: 'refunded' as const }
    }
    if (purchase.status !== 'paid') {
      return { kind: 'not-paid' as const }
    }
    const report = await getReportStatus(db, purchase.id)
    if (report?.status === 'done') {
      return { kind: 'done' as const }
    }
    if (report?.status === 'failed' && report.attempts >= 5) {
      return { kind: 'failed' as const }
    }

    const staleBefore = new Date(Date.now() - 90 * 1000)
    const locked = await acquireReportLock(db, purchase.id, lockToken, staleBefore)
    if (!locked) {
      return { kind: 'busy' as const }
    }
    const result = await getResultForReport(db, purchase.id)
    return { kind: 'locked' as const, purchaseId: purchase.id, result }
  })

  switch (claim.kind) {
    case 'not-found':
      return problem(404, 'purchase-not-found')
    case 'refunded':
      return problem(410, 'purchase-refunded')
    case 'not-paid':
      return problem(403, 'purchase-not-paid')
    case 'done':
      return c.json({ status: 'done' })
    case 'failed':
      return problem(502, 'report-generation-failed')
    case 'busy':
      return problem(202, 'report-generating', undefined, undefined, { 'retry-after': '2' })
    case 'locked':
      break
  }

  // Lock held. The DB handle is closed during the slow Claude call so we don't tie up a pooled connection;
  // a fresh handle finalizes. The lock_token guards both finalize paths against a reclaimed stale lock.
  const model = c.env.DEEPTYPE_REPORT_MODEL ?? 'claude-haiku-4-5'
  if (!claim.result) {
    await withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
      finalizeReportFailed(db, claim.purchaseId, lockToken, 'missing result'),
    )
    return problem(502, 'report-generation-failed')
  }

  try {
    const sections = await generateReport(c.env.DEEPTYPE_ANTHROPIC_API_KEY, model, buildReportProfile(claim.result))
    await withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
      finalizeReportDone(db, claim.purchaseId, lockToken, model, sections),
    )
    return c.json({ status: 'done' })
  } catch (error) {
    await withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
      finalizeReportFailed(db, claim.purchaseId, lockToken, String(error).slice(0, 500)),
    )
    return problem(502, 'report-generation-failed')
  }
})

// ── Phase 5: precision submit (server-authoritative re-scoring) ──────────────────────────────────────
const PrecisionBody = z.object({
  answers: z
    .array(
      z.union([
        z.object({
          kind: z.literal('choice'),
          itemId: z.string().min(1).max(48),
          optionIndex: z.number().int().min(0).max(15),
        }),
        z.object({
          kind: z.literal('scale'),
          itemId: z.string().min(1).max(48),
          value: z.number().min(0).max(100),
        }),
      ]),
    )
    .min(1)
    .max(60),
})

// The paid 24Q land here AFTER payment (funnel: checkout → verify → precision → report/generate). The
// client's answers are re-scored on the server against the known bank — its computed strengths are never
// trusted — and the refined axis strengths + contested axes are persisted for the report to narrate.
deepType.post('/precision', async (c) => {
  const token = bearer(c)
  if (!token) {
    return problem(401, 'unauthorized')
  }
  const parsed = PrecisionBody.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }

  const outcome = await withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    const ctx = await getPurchaseResultByAccessToken(db, token)
    if (!ctx) {
      return 'not-found' as const
    }
    if (ctx.status === 'refunded') {
      return 'refunded' as const
    }
    if (ctx.status !== 'paid') {
      return 'not-paid' as const
    }

    const responses = resolvePrecisionResponses(parsed.data.answers)
    if (responses.length === 0) {
      return 'invalid' as const
    }

    const refined = refineAxes(responses, ctx.innerType, ctx.gem)
    await persistPrecision(db, ctx.resultId, {
      precisionAnswers: parsed.data.answers,
      axisStrengths: refined.strengths,
      profile: { contested: refined.contested },
    })
    return 'ok' as const
  })

  switch (outcome) {
    case 'ok':
      return c.json({ status: 'ok' })
    case 'not-found':
      return problem(404, 'purchase-not-found')
    case 'refunded':
      return problem(410, 'purchase-refunded')
    case 'not-paid':
      return problem(403, 'purchase-not-paid')
    case 'invalid':
      return problem(422, 'invalid-request')
  }
})
