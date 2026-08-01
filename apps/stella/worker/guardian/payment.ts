import type { Db } from '@sobok/edge/db/client'
import {
  type ConfirmGuardianPurchaseResult,
  confirmGuardianPurchase,
  type SettleGuardianPurchaseResult,
  settleGuardianPurchase,
} from '../db/queries/guardian'
import type { GuardianRemotePayment } from '../payments/client'

export type SyncGuardianPaymentResult =
  | ConfirmGuardianPurchaseResult
  | SettleGuardianPurchaseResult
  | { status: 'pending' }

/** Shared convergence step for browser confirm and verified webhooks. */
export async function syncGuardianPayment(db: Db, payment: GuardianRemotePayment): Promise<SyncGuardianPaymentResult> {
  switch (payment.status) {
    case 'paid':
      return confirmGuardianPurchase(db, payment)
    case 'failed':
      return settleGuardianPurchase(db, {
        paymentId: payment.paymentId,
        remoteStatus: 'failed',
        occurredAt: payment.failedAt,
        failureCode: payment.failureCode,
        failureMessage: payment.failureMessage,
      })
    case 'refunded':
      return settleGuardianPurchase(db, {
        paymentId: payment.paymentId,
        remoteStatus: 'refunded',
        occurredAt: payment.refundedAt,
      })
    case 'pending':
    case 'missing':
    case 'unknown':
      return { status: 'pending' }
  }
}
