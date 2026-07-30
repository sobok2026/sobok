import type { Db } from '@sobok/edge/db/client'
import { cancelPayment, type PortOneCreds } from '../billing/portone'
import { getPurchaseForCancel, markPurchaseRefunded } from '../db/queries/purchase'

export type WithdrawalOutcome =
  | 'refunded' // cancelled + marked refunded (or already refunded)
  | 'not-found'
  | 'not-paid'
  | 'viewed' // digital content delivered — 청약철회 제한 (409)

// Customer-initiated 청약철회. The purchase row stays locked from the eligibility read through the PG
// cancellation and local state transition. That serializes this path against the report-delivery
// viewed_at stamp: either delivery commits first and cancellation is rejected, or cancellation commits
// first and delivery's paid predicate fails. A PG failure rolls back instead of falsely promising a refund;
// the Transaction.Cancelled webhook remains the backstop for an ambiguous lost response.
export async function requestWithdrawal(db: Db, creds: PortOneCreds, accessToken: string): Promise<WithdrawalOutcome> {
  return db.transaction(async (tx) => {
    const purchase = await getPurchaseForCancel(tx, accessToken)
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

    await cancelPayment(creds, { paymentId: purchase.paymentId, reason: '청약철회' })
    const refunded = await markPurchaseRefunded(tx, purchase.paymentId)
    if (!refunded) {
      throw new Error('refund state transition failed')
    }
    return 'refunded'
  })
}
