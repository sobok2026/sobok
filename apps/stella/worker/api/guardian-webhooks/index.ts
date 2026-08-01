import { alertDiscord } from '@sobok/edge/alert'
import { openDb, withDb } from '@sobok/edge/db/client'
import { Hono } from 'hono'
import { z } from 'zod'
import { guardianPortOnePaymentCredentials, guardianPortOneWebhookSecret } from '~/billing/credentials'
import {
  type GuardianPortOneWebhookEvent,
  type GuardianRemotePayment,
  getGuardianRemotePayment,
  verifyGuardianPortOneWebhook,
} from '~/billing/portone'
import { guardianPurchaseExists } from '~/db/queries/guardian'
import { hasProcessedGuardianWebhook, recordProcessedGuardianWebhook } from '~/db/queries/guardian-webhook'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { GuardianPaymentIdSchema } from '~/guardian/http'
import { syncGuardianPayment } from '~/guardian/payment'
import { NO_STORE_HEADERS } from '~/lib/http'

const WEBHOOK_BODY_LIMIT_BYTES = 64 * 1024
const WebhookIdSchema = z.string().min(1).max(128)

export const guardianWebhooks = new Hono<AppEnv>()

// POST /api/guardian-webhooks/portone — Standard Webhooks signature first, PortOne payment lookup second.
guardianWebhooks.post('/portone', async (c) => {
  const rawBody = await c.req.text()
  if (new TextEncoder().encode(rawBody).byteLength > WEBHOOK_BODY_LIMIT_BYTES) {
    return problem(413, 'payload-too-large')
  }

  const eventId = WebhookIdSchema.safeParse(c.req.header('webhook-id'))
  const headers = {
    'webhook-id': eventId.success ? eventId.data : '',
    'webhook-signature': c.req.header('webhook-signature') ?? '',
    'webhook-timestamp': c.req.header('webhook-timestamp') ?? '',
  }

  let webhookSecret: string
  try {
    webhookSecret = await guardianPortOneWebhookSecret(c.env)
  } catch (error) {
    console.error('stella.portone.webhook_secret_unavailable', error instanceof Error ? error.name : 'non-Error thrown')
    return problem(503, 'service-unavailable', { headers: { 'retry-after': '30' } })
  }

  let event: GuardianPortOneWebhookEvent | null
  try {
    event = await verifyGuardianPortOneWebhook(webhookSecret, rawBody, headers)
  } catch {
    return problem(400, 'invalid-webhook')
  }
  if (!event || event.storeId !== c.env.STELLA_PORTONE_STORE_ID) {
    return c.json({ ok: true }, 200, NO_STORE_HEADERS)
  }

  const paymentId = GuardianPaymentIdSchema.safeParse(event.paymentId)
  if (!eventId.success || !paymentId.success) {
    return c.json({ ok: true }, 200, NO_STORE_HEADERS)
  }

  const disposition = await withDb(openDb(c.env.HYPERDRIVE), c.executionCtx, async (db) => {
    if (await hasProcessedGuardianWebhook(db, eventId.data)) {
      return 'processed' as const
    }
    return (await guardianPurchaseExists(db, paymentId.data)) ? ('ours' as const) : ('irrelevant' as const)
  })
  if (disposition !== 'ours') {
    return c.json({ ok: true }, 200, NO_STORE_HEADERS)
  }

  let remotePayment: GuardianRemotePayment
  try {
    const credentials = await guardianPortOnePaymentCredentials(c.env)
    remotePayment = await getGuardianRemotePayment(credentials, paymentId.data)
  } catch (error) {
    console.error('stella.portone.webhook_lookup_failed', error instanceof Error ? error.name : 'non-Error thrown')
    return problem(503, 'service-unavailable', { headers: { 'retry-after': '5' } })
  }

  if (remotePayment.status === 'pending' || remotePayment.status === 'missing' || remotePayment.status === 'unknown') {
    if (remotePayment.status === 'unknown') {
      console.error('stella.portone.webhook_unknown_status')
    }
    return problem(503, 'service-unavailable', { headers: { 'retry-after': '5' } })
  }

  const outcome = await withDb(openDb(c.env.HYPERDRIVE), c.executionCtx, async (db) => {
    const synced = await syncGuardianPayment(db, remotePayment)
    if (synced.status !== 'purchase-not-found') {
      await recordProcessedGuardianWebhook(db, {
        eventId: eventId.data,
        eventType: event.eventType,
        paymentId: paymentId.data,
      })
    }
    return synced
  })

  if (
    outcome.status === 'payment-mismatch' ||
    outcome.status === 'purchase-state-conflict' ||
    outcome.status === 'report-state-conflict'
  ) {
    console.error('stella.guardian_webhook.payment_review_required')
    c.executionCtx.waitUntil(
      c.env.STELLA_DISCORD_WEBHOOK.get().then((webhook) =>
        alertDiscord(webhook, '⚠️ stella guardian webhook requires payment-state review'),
      ),
    )
  }
  if (outcome.status === 'purchase-not-found' || outcome.status === 'pending') {
    return problem(503, 'service-unavailable', { headers: { 'retry-after': '5' } })
  }
  return c.json({ ok: true }, 200, NO_STORE_HEADERS)
})
