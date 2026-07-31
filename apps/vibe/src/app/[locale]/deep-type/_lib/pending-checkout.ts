import { isOfferCurrency, type OfferCurrency } from '@deep-type/offer'

const STORAGE_KEY = 'vibe.deeptype.pending-checkout'
const CHECKOUT_TTL_MS = 60 * 60 * 1000

/**
 * A settled payment, as every screen after it needs to describe it.
 *
 * One shape for all three routes a purchase can take — same tab, PG redirect, e-mail re-open — because the
 * confirmation they show is the same confirmation and was three different subsets of this before.
 *
 * `amount`, `currency` and `email` are what let a screen confirm a purchase in the buyer's own terms instead
 * of only saying "확인됐어요". None of them is read back for a decision: the grant is the server's word.
 * `POST /verify` is unauthenticated and may not answer with a buyer's e-mail, so the address reaches the
 * confirmation from the browser or not at all — and a mistyped address is the one error that permanently
 * costs someone the report they paid for, which makes this the last screen anybody can catch it on.
 */
export type SettledPayment = {
  accessToken: string
  amount: number
  currency: OfferCurrency
  email: string
  paymentId: string
}

/**
 * What the tab that opened a payment leaves behind for the tab the PG redirects back into — the same tab, in
 * every flow that works.
 *
 * `sessionStorage` and not `localStorage`: one tab, gone when the tab is, and never shared with the next
 * visitor on a borrowed phone.
 */
export type PendingCheckout = SettledPayment & { createdAt: number }

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
