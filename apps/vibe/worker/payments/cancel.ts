import { cancelPayment, type PortOneCreds } from '../billing/portone'
import type { Db } from '../db/client'
import { getPurchaseForCancel, markPurchaseRefunded } from '../db/queries/purchase'

export type WithdrawalOutcome =
  | 'refunded' // cancelled + marked refunded (or already refunded)
  | 'not-found'
  | 'not-paid'
  | 'viewed' // digital content delivered — 청약철회 제한 (409)

// Customer-initiated 청약철회. Allowed only while the paid report has NOT been delivered (viewed_at IS
// NULL) — once the content reached the user the withdrawal right lapses. Cancels at PortOne, then flips the
// purchase to refunded locally (idempotent CAS); the Transaction.Cancelled webhook is the backstop.
export async function requestWithdrawal(db: Db, creds: PortOneCreds, accessToken: string): Promise<WithdrawalOutcome> {
  const purchase = await getPurchaseForCancel(db, accessToken)
  if (!purchase) {
    return 'not-found'
  }
  if (purchase.status === 'refunded') {
    return 'refunded'
  }
  if (purchase.status !== 'paid') {
    return 'not-paid'
  }
  if (purchase.viewedAt !== null) {
    return 'viewed'
  }

  // Best-effort: cancelPayment throws if already cancelled at the PG — the local CAS + webhook/reconcile
  // converge either way.
  try {
    await cancelPayment(creds, { paymentId: purchase.paymentId, reason: '청약철회' })
  } catch {
    // fall through to the local flip; reconcile re-verifies against PortOne
  }
  await markPurchaseRefunded(db, purchase.paymentId)
  return 'refunded'
}
