import { WorkerEntrypoint } from 'cloudflare:workers'
import {
  PAYMENT_ID_PREFIX,
  type PaymentEvent,
  PaymentEventSchema,
  type PaymentScope,
  paymentScopeOf,
  type ScopedPaymentsService,
} from '@sobok/payments'
import { Hono } from 'hono'
import { z } from 'zod'

import type { AppEnv, Bindings } from './env'
import {
  availableChannels,
  cancelPayment,
  chargePayment,
  checkoutConfig,
  getPayment,
  inspectBillingKey,
  revokeBillingKey,
  verifyWebhook,
} from './portone'

const app = new Hono<AppEnv>()
const WEBHOOK_BODY_LIMIT = 64 * 1024
const BillingKeyBody = z.object({ billingKey: z.string().min(1).max(256) }).strict()
const ChargeBody = z
  .object({
    paymentId: z.string().min(1).max(64),
    billingKey: z.string().min(1).max(256),
    orderName: z.string().min(1).max(128),
    amount: z.number().int().positive(),
    currency: z.literal('KRW'),
  })
  .strict()
const CancelBody = z.object({ reason: z.string().min(1).max(256) }).strict()

app.get('/health', (c) => c.json({ ok: true }))

app.post('/webhooks/portone', async (c) => {
  const rawBody = await c.req.text()
  if (new TextEncoder().encode(rawBody).byteLength > WEBHOOK_BODY_LIMIT) {
    return c.json({ error: 'payload-too-large' }, 413)
  }

  const headers = {
    'webhook-id': c.req.header('webhook-id') ?? '',
    'webhook-signature': c.req.header('webhook-signature') ?? '',
    'webhook-timestamp': c.req.header('webhook-timestamp') ?? '',
  }

  let verified: Awaited<ReturnType<typeof verifyWebhook>>
  try {
    verified = await verifyWebhook(c.env, rawBody, headers)
  } catch (error) {
    console.error('payments.webhook.invalid', error instanceof Error ? error.name : 'unknown')
    return c.json({ error: 'invalid-webhook' }, 400)
  }

  if (!verified) {
    return c.json({ ok: true })
  }

  if (verified.kind === 'billing-key-deleted') {
    const event = PaymentEventSchema.parse(verified)
    await c.env.CORE_PAYMENT_EVENTS.send(event, { contentType: 'json' })
    return c.json({ ok: true })
  }

  if (verified.storeId !== c.env.PORTONE_STORE_ID) {
    return c.json({ ok: true })
  }

  const scope = paymentScopeOf(verified.paymentId)
  if (!scope) {
    return c.json({ ok: true })
  }

  const payment = await getPayment(c.env, verified.paymentId)
  if (!['paid', 'failed', 'canceled'].includes(payment.status)) {
    console.error('payments.webhook.non_terminal', verified.paymentId, payment.status)
    return c.json({ error: 'payment-not-terminal' }, 503, { 'retry-after': '5' })
  }

  const event = PaymentEventSchema.parse({
    kind: 'transaction',
    eventId: verified.eventId,
    eventType: verified.eventType,
    payment,
  })

  switch (scope) {
    case 'stella':
      await c.env.STELLA_PAYMENT_EVENTS.send(event, { contentType: 'json' })
      break
    case 'vibe':
      await c.env.VIBE_PAYMENT_EVENTS.send(event, { contentType: 'json' })
      break
    case 'core':
      await c.env.CORE_PAYMENT_EVENTS.send(event, { contentType: 'json' })
      break
  }

  return c.json({ ok: true })
})

app.use('/v1/core/*', async (c, next) => {
  const expected = await c.env.PAYMENTS_CORE_CLIENT_TOKEN.get()
  if (!expected || c.req.header('authorization') !== `Bearer ${expected}`) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  await next()
})

app.get('/v1/core/checkout-config', (c) => {
  const channel = c.req.query('channel') ?? ''
  return c.json(checkoutConfig(c.env, 'core', channel))
})

app.post('/v1/core/billing-keys/inspect', async (c) => {
  const body = BillingKeyBody.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: 'invalid-request' }, 422)
  }
  return c.json(await inspectBillingKey(c.env, body.data.billingKey))
})

app.post('/v1/core/billing-keys/revoke', async (c) => {
  const body = BillingKeyBody.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: 'invalid-request' }, 422)
  }
  await revokeBillingKey(c.env, body.data.billingKey)
  return c.body(null, 204)
})

app.post('/v1/core/payments/charge', async (c) => {
  const body = ChargeBody.safeParse(await c.req.json().catch(() => null))
  if (!body.success || !body.data.paymentId.startsWith(PAYMENT_ID_PREFIX.core)) {
    return c.json({ error: 'invalid-request' }, 422)
  }
  return c.json(await chargePayment(c.env, body.data))
})

app.get('/v1/core/payments/:paymentId', async (c) => {
  const paymentId = c.req.param('paymentId')
  if (!paymentId.startsWith(PAYMENT_ID_PREFIX.core)) {
    return c.json({ error: 'not-found' }, 404)
  }
  return c.json(await getPayment(c.env, paymentId))
})

app.post('/v1/core/payments/:paymentId/cancel', async (c) => {
  const paymentId = c.req.param('paymentId')
  const body = CancelBody.safeParse(await c.req.json().catch(() => null))
  if (!body.success || !paymentId.startsWith(PAYMENT_ID_PREFIX.core)) {
    return c.json({ error: 'invalid-request' }, 422)
  }
  await cancelPayment(c.env, { paymentId, reason: body.data.reason })
  return c.body(null, 204)
})

app.notFound((c) => c.json({ error: 'not-found' }, 404))
app.onError((error, c) => {
  console.error('payments.unhandled', error instanceof Error ? `${error.name}: ${error.message}` : 'unknown')
  return c.json({ error: 'service-unavailable' }, 503, { 'retry-after': '5' })
})

export default {
  fetch: app.fetch,
  queue: async (batch: MessageBatch<PaymentEvent>, env: Bindings) => {
    for (const message of batch.messages) {
      try {
        await dispatchCoreEvent(env, PaymentEventSchema.parse(message.body))
        message.ack()
      } catch (error) {
        console.error('payments.core_event.failed', error instanceof Error ? error.message : 'unknown')
        message.retry()
      }
    }
  },
} satisfies ExportedHandler<Bindings, PaymentEvent>

abstract class ScopedPayments extends WorkerEntrypoint<Bindings> implements ScopedPaymentsService {
  protected abstract readonly scope: PaymentScope

  availableChannels(): Promise<string[]> {
    return Promise.resolve(availableChannels(this.env, this.scope))
  }

  checkoutConfig(channel: string) {
    return Promise.resolve(checkoutConfig(this.env, this.scope, channel))
  }

  getPayment(paymentId: string) {
    this.assertPaymentId(paymentId)
    return getPayment(this.env, paymentId)
  }

  cancelPayment(input: { paymentId: string; reason: string }) {
    this.assertPaymentId(input.paymentId)
    return cancelPayment(this.env, input)
  }

  private assertPaymentId(paymentId: string): void {
    if (!paymentId.startsWith(PAYMENT_ID_PREFIX[this.scope])) {
      throw new Error('Payment id is outside this service boundary')
    }
  }
}

export class StellaPayments extends ScopedPayments {
  protected readonly scope = 'stella'
}

export class VibePayments extends ScopedPayments {
  protected readonly scope = 'vibe'
}

async function dispatchCoreEvent(env: Bindings, event: PaymentEvent): Promise<void> {
  const token = await env.CORE_PAYMENT_EVENTS_TOKEN.get()
  if (!token || !env.CORE_PAYMENT_EVENTS_URL) {
    throw new Error('Core payment event delivery is not configured')
  }

  const response = await fetch(env.CORE_PAYMENT_EVENTS_URL, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(event),
  })
  if (!response.ok) {
    throw new Error(`Core payment event delivery returned ${response.status}`)
  }
}
