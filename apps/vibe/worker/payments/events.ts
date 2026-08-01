import { alertDiscord } from '@sobok/edge/alert'
import { openDb, withDb } from '@sobok/edge/db/client'
import type { PaymentEvent } from '@sobok/payments'

import { recordWebhookEvent } from '../db/queries/webhook'
import type { Bindings } from '../env'
import { toDeepTypeRemotePayment } from './client'
import { applyRefund, confirmPurchase } from './confirm'

/** Applies events already verified and enriched by apps/payments. The queue retries failures and the local
 * purchase CAS keeps browser confirmation, reconciliation, and duplicate deliveries convergent. */
export async function handleDeepTypePaymentEvent(
  env: Bindings,
  ctx: ExecutionContext,
  event: PaymentEvent,
): Promise<void> {
  if (event.kind !== 'transaction' || !event.payment.paymentId.startsWith('dt_')) {
    return
  }

  await withDb(openDb(env.HYPERDRIVE_FRESH), ctx, async (db) => {
    if (event.eventType === 'Transaction.Paid') {
      const outcome = await confirmPurchase(
        db,
        { env, payment: toDeepTypeRemotePayment(event.payment) },
        event.payment.paymentId,
      )
      if (outcome === 'amount-mismatch') {
        console.error('deeptype.payment_event.amount_mismatch', event.payment.paymentId)
        ctx.waitUntil(
          env.DEEPTYPE_DISCORD_WEBHOOK.get().then((url) =>
            alertDiscord(url, '⚠️ deeptype amount mismatch; inspect the restricted Worker logs'),
          ),
        )
      }
    } else if (event.eventType === 'Transaction.Cancelled' || event.eventType === 'Transaction.PartialCancelled') {
      await applyRefund(db, event.payment.paymentId)
    }

    await recordWebhookEvent(db, {
      eventId: event.eventId,
      type: event.eventType,
      payload: JSON.stringify(event),
    })
  })
}
