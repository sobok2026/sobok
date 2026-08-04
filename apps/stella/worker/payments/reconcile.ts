import { alertDiscord } from '@sobok/edge/alert'
import { openDb } from '@sobok/edge/db/client'

import {
  listStalePendingGuardianPurchases,
  touchPendingGuardianPurchaseAfterReconciliation,
} from '../db/queries/guardian'
import type { Bindings } from '../env'
import { syncGuardianPayment } from '../guardian/payment'
import { dispatchGuardianRecoveryEmails } from '../guardian/recovery'
import { getGuardianRemotePayment } from './client'

const STALE_MS = 15 * 60 * 1000
const BATCH_SIZE = 100

/**
 * Last-resort convergence for a browser return or webhook lost after payment. The shared scheduler invokes
 * this RPC every 15 minutes; every state transition still passes through the same row-locked payment sync as
 * browser confirmation and verified queue events.
 */
export async function reconcileStaleGuardianPayments(env: Bindings): Promise<void> {
  const { db, sql } = openDb(env.HYPERDRIVE)
  const summary = {
    conflicts: 0,
    errors: 0,
    granted: 0,
    pending: 0,
    reviewRequired: 0,
    selected: 0,
    terminal: 0,
  }

  try {
    const stale = await listStalePendingGuardianPurchases(db, new Date(Date.now() - STALE_MS), BATCH_SIZE)
    summary.selected = stale.length

    for (const purchase of stale) {
      try {
        const remotePayment = await getGuardianRemotePayment(env, purchase.paymentId)
        const outcome = await syncGuardianPayment(db, remotePayment)

        switch (outcome.status) {
          case 'granted':
          case 'already-granted':
            summary.granted += 1
            break
          case 'failed':
          case 'cancelled':
          case 'refunded':
            summary.terminal += 1
            break
          case 'pending':
            summary.pending += 1
            break
          case 'payment-mismatch':
            summary.reviewRequired += 1
            break
          case 'purchase-not-found':
          case 'purchase-state-conflict':
          case 'report-state-conflict':
            summary.conflicts += 1
            break
        }
      } catch (error) {
        summary.errors += 1
        console.error(
          JSON.stringify({
            error: error instanceof Error ? error.name : 'unknown',
            event: 'stella.guardian_payment.reconcile_item_failed',
          }),
        )
      }

      try {
        await touchPendingGuardianPurchaseAfterReconciliation(db, purchase.paymentId, new Date())
      } catch (error) {
        summary.errors += 1
        console.error(
          JSON.stringify({
            error: error instanceof Error ? error.name : 'unknown',
            event: 'stella.guardian_payment.reconcile_touch_failed',
          }),
        )
      }
    }

    console.log(JSON.stringify({ event: 'stella.guardian_payment.reconcile_completed', ...summary }))
  } finally {
    await sql.end({ timeout: 5 })
  }

  if (summary.reviewRequired > 0 || summary.conflicts > 0 || summary.errors > 0) {
    await alertReconciliationReview(env, summary.reviewRequired, summary.conflicts, summary.errors)
  }

  // The durable delivery row is created with the entitlement. Running its bounded dispatcher here closes the
  // crash gap even when browser confirmation and the verified payment event both ended before sending mail.
  await dispatchGuardianRecoveryEmails(env)
}

async function alertReconciliationReview(
  env: Bindings,
  reviewRequired: number,
  conflicts: number,
  errors: number,
): Promise<void> {
  try {
    const webhook = await env.STELLA_DISCORD_WEBHOOK.get()
    await alertDiscord(
      webhook,
      `⚠️ stella guardian reconciliation requires review (${reviewRequired} mismatch, ${conflicts} conflict, ${errors} error)`,
    )
  } catch (error) {
    console.error(
      JSON.stringify({
        error: error instanceof Error ? error.name : 'unknown',
        event: 'stella.guardian_payment.reconcile_alert_failed',
      }),
    )
  }
}
