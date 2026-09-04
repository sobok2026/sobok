import { alertDiscord } from '@sobok/edge/alert'
import { openDb, withDb } from '@sobok/edge/db/client'
import type { PaymentEvent } from '@sobok/payments'

import { guardianPurchaseExists } from '../db/queries/guardian'
import { hasProcessedGuardianWebhook, recordProcessedGuardianWebhook } from '../db/queries/guardian-webhook'
import type { Bindings } from '../env'
import { GuardianPaymentIdSchema } from '../guardian/http'
import { syncGuardianPayment } from '../guardian/payment'
import { dispatchGuardianRecoveryEmails } from '../guardian/recovery'
import { toGuardianRemotePayment } from './client'

/** Applies a centrally verified PortOne event. Queue delivery is at-least-once; the local event id and paid CAS
 * keep the seven-day entitlement grant idempotent. */
export async function handleGuardianPaymentEvent(
  env: Bindings,
  ctx: ExecutionContext,
  event: PaymentEvent,
): Promise<void> {
  if (event.kind !== 'transaction') {
    return
  }

  const paymentId = GuardianPaymentIdSchema.safeParse(event.payment.paymentId)
  if (!paymentId.success) {
    return
  }

  const disposition = await withDb(openDb(env.HYPERDRIVE_FRESH), ctx, async (db) => {
    if (await hasProcessedGuardianWebhook(db, event.eventId)) {
      return 'processed' as const
    }
    return (await guardianPurchaseExists(db, paymentId.data)) ? ('ours' as const) : ('irrelevant' as const)
  })
  if (disposition !== 'ours') {
    return
  }

  const remotePayment = toGuardianRemotePayment(event.payment)
  if (remotePayment.status === 'pending' || remotePayment.status === 'missing' || remotePayment.status === 'unknown') {
    throw new Error(`Central payment event was not terminal: ${remotePayment.status}`)
  }

  const outcome = await withDb(openDb(env.HYPERDRIVE_FRESH), ctx, async (db) => {
    const synced = await syncGuardianPayment(db, remotePayment)
    if (synced.status !== 'purchase-not-found') {
      await recordProcessedGuardianWebhook(db, {
        eventId: event.eventId,
        eventType: event.eventType,
        paymentId: paymentId.data,
      })
    }
    return synced
  })

  if (outcome.status === 'payment-mismatch' || outcome.status === 'purchase-state-conflict') {
    console.error('stella.guardian_payment_event.review_required')
    ctx.waitUntil(
      env.STELLA_DISCORD_WEBHOOK.get().then((webhook) =>
        alertDiscord(webhook, '⚠️ stella guardian payment event requires payment-state review'),
      ),
    )
  }
  if (outcome.status === 'purchase-not-found' || outcome.status === 'pending') {
    throw new Error(`Stella payment event could not converge: ${outcome.status}`)
  }
  if (outcome.status === 'granted' || outcome.status === 'already-granted') {
    ctx.waitUntil(dispatchGuardianRecoveryEmails(env, { paymentId: paymentId.data }))
  }
}
