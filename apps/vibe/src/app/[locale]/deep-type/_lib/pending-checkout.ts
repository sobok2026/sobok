import { isOfferCurrency, type OfferCurrency } from '@deep-type/offer'

const STORAGE_KEY = 'vibe.deeptype.pending-checkout'
const CHECKOUT_TTL_MS = 60 * 60 * 1000

/**
 * What the tab that opened a payment leaves behind for the tab the PG redirects back into — the same tab, in
 * every flow that works.
 *
 * `amount`, `currency` and `email` are here so the return screen can confirm the purchase in the buyer's own
 * terms instead of only saying "확인됐어요". They are not read back for any decision: the grant is the
 * server's word, and `POST /verify` is unauthenticated so it may not answer with a buyer's e-mail. A wrong
 * e-mail is also the one mistake that permanently costs someone their report, and printing it here is the last
 * moment anybody can catch the typo.
 *
 * `sessionStorage` and not `localStorage`: one tab, gone when the tab is, and never shared with the next
 * visitor on a borrowed phone.
 */
export type PendingCheckout = {
  accessToken: string
  amount: number
  createdAt: number
  currency: OfferCurrency
  email: string
  paymentId: string
}

export function storePendingCheckout(pending: PendingCheckout): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending))
  } catch {
    // A successful payment can still be recovered through the purchase-email re-open flow.
  }
}

export function readPendingCheckout(expectedPaymentId?: string): PendingCheckout | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const value = JSON.parse(raw) as Partial<PendingCheckout>
    const valid =
      typeof value.createdAt === 'number' &&
      Date.now() - value.createdAt < CHECKOUT_TTL_MS &&
      typeof value.paymentId === 'string' &&
      value.paymentId.length >= 1 &&
      value.paymentId.length <= 64 &&
      typeof value.accessToken === 'string' &&
      /^[A-Za-z0-9_-]{43}$/.test(value.accessToken) &&
      typeof value.amount === 'number' &&
      Number.isFinite(value.amount) &&
      typeof value.currency === 'string' &&
      isOfferCurrency(value.currency) &&
      typeof value.email === 'string' &&
      (!expectedPaymentId || value.paymentId === expectedPaymentId)

    if (!valid) {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return value as PendingCheckout
  } catch {
    return null
  }
}

export function clearPendingCheckout(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing else to clear when browser storage is unavailable.
  }
}
