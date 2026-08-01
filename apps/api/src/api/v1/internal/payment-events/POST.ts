import { getPaymentByPaymentId, markPaymentFailed } from '@sobok/db/app/query/payment'
import { markPaymentMethodDeletedByToken } from '@sobok/db/app/query/payment-method'
import { applyPaymentRefunds } from '@sobok/db/app/query/refund'
import { confirmPayment } from '@sobok/db/app/query/subscription'
import { recordWebhookEvent, wasWebhookEventProcessed } from '@sobok/db/app/query/webhook-event'
import { PaymentEventSchema } from '@sobok/payments'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { isPaymentsServiceRequest } from '@/payments'

const route = new Hono<Env>()

// Called only by apps/payments after PortOne signature verification and server-side payment lookup. This API
// owns Sobok subscription fulfillment; the central service owns provider communication, not our ledger.
route.post('/', async (c) => {
  if (!isPaymentsServiceRequest(c.req.header('authorization'))) {
    return c.body(null, 401)
  }

  const parsed = PaymentEventSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.body(null, 422)
  }
  const event = parsed.data

  if (await wasWebhookEventProcessed(event.eventId)) {
    return c.body(null, 204)
  }

  if (event.kind === 'billing-key-deleted') {
    await markPaymentMethodDeletedByToken(event.billingKey)
  } else {
    const payment = await getPaymentByPaymentId(event.payment.paymentId)
    if (!payment) {
      // A core-prefixed event with no local order is not safe to discard; ask PortOne to retry through the
      // central endpoint in case it raced the local pending-row commit.
      return c.body(null, 503, { 'Retry-After': '5' })
    }

    const remote = event.payment
    if (event.eventType === 'Transaction.Paid' && remote.status === 'paid' && payment.status !== 'paid') {
      if (remote.amount !== payment.amount || (remote.currency !== null && remote.currency !== payment.currency)) {
        console.error('billing event: amount or currency mismatch', {
          paymentId: payment.paymentId,
          expectedAmount: payment.amount,
          actualAmount: remote.amount,
          expectedCurrency: payment.currency,
          actualCurrency: remote.currency,
        })
      } else {
        await confirmPayment(payment.paymentId, {
          providerTxnId: remote.providerTxnId ?? payment.paymentId,
          paidAt: remote.paidAt ? new Date(remote.paidAt) : new Date(),
          paymentMethodId: null,
          method: remote.method,
        })
      }
    } else if (event.eventType === 'Transaction.Cancelled' || event.eventType === 'Transaction.PartialCancelled') {
      await applyPaymentRefunds(
        payment.paymentId,
        remote.refunds.map((refund) => ({ ...refund, refundedAt: new Date(refund.refundedAt) })),
      )
    } else if (event.eventType === 'Transaction.Failed' && remote.status === 'failed') {
      await markPaymentFailed(payment.paymentId, {
        code: remote.failureCode,
        message: remote.failureMessage ?? 'PortOne payment failed',
      })
    }
  }

  await recordWebhookEvent({
    eventId: event.eventId,
    type: event.eventType,
    payload: JSON.stringify(event),
  })

  return c.body(null, 204)
})

export default route
