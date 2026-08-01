import type { Locale } from '@sobok/domain/locale'
import type { Db } from '@sobok/edge/db/client'
import { sha256Hex } from '@sobok/edge/tokens'
import { createGuestGuardianCheckout, resumeGuestGuardianCheckout as resumeCheckout } from '../db/queries/guardian'
import type { GuardianReportInputSnapshot } from './manifest'
import { newGuardianAccessToken, newGuardianPaymentId, newGuardianPublicId } from './tokens'

/**
 * Creates the guest-owned aggregate and its server-priced pending purchase atomically, then returns the raw
 * collection capability exactly once. The route adds Turnstile, rate limits, and deployment payment config.
 */
export async function prepareGuestGuardianCheckout(
  db: Db,
  input: {
    locale: Locale
    market: string
    recoveryEmail: string
    recoveryEmailNormalized: string
    inputSnapshot: GuardianReportInputSnapshot
  },
): Promise<{
  collectionPublicId: string
  reportPublicId: string
  collectionAccessToken: string
  paymentId: string
  sku: 'guardian-report-full-v1'
  orderName: string
  amount: number
  market: string
  currency: string
  purchaseStatus: 'pending' | 'paid'
}> {
  const collectionAccessToken = newGuardianAccessToken()
  const checkout = await createGuestGuardianCheckout(db, {
    collectionPublicId: newGuardianPublicId(),
    collectionAccessTokenHash: await sha256Hex(collectionAccessToken),
    reportPublicId: newGuardianPublicId(),
    paymentId: newGuardianPaymentId(),
    locale: input.locale,
    market: input.market,
    recoveryEmail: input.recoveryEmail,
    recoveryEmailNormalized: input.recoveryEmailNormalized,
    inputSnapshot: input.inputSnapshot,
  })

  return {
    collectionPublicId: checkout.collectionPublicId,
    reportPublicId: checkout.reportPublicId,
    collectionAccessToken,
    paymentId: checkout.paymentId,
    sku: checkout.sku,
    orderName: checkout.orderName,
    amount: checkout.amount,
    market: checkout.market,
    currency: checkout.currency,
    purchaseStatus: checkout.purchaseStatus,
  }
}

export async function resumeGuestGuardianCheckout(
  db: Db,
  input: {
    collectionAccessToken: string
    reportPublicId: string
    market: string
    recoveryEmail: string
    recoveryEmailNormalized: string
  },
): Promise<
  | {
      status: 'ready'
      collectionPublicId: string
      reportPublicId: string
      paymentId: string
      sku: 'guardian-report-full-v1'
      orderName: string
      amount: number
      market: string
      currency: string
      purchaseStatus: 'pending' | 'paid'
    }
  | { status: 'report-not-found' }
  | { status: 'purchase-state-conflict' }
> {
  const checkout = await resumeCheckout(db, {
    collectionAccessTokenHash: await sha256Hex(input.collectionAccessToken),
    reportPublicId: input.reportPublicId,
    paymentId: newGuardianPaymentId(),
    recoveryEmail: input.recoveryEmail,
    recoveryEmailNormalized: input.recoveryEmailNormalized,
    market: input.market,
  })
  if (checkout.status !== 'ready') {
    return checkout
  }
  return {
    status: 'ready',
    collectionPublicId: checkout.collectionPublicId,
    reportPublicId: checkout.reportPublicId,
    paymentId: checkout.paymentId,
    sku: checkout.sku,
    orderName: checkout.orderName,
    amount: checkout.amount,
    market: checkout.market,
    currency: checkout.currency,
    purchaseStatus: checkout.purchaseStatus,
  }
}
