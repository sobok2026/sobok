const STORAGE_KEY = 'vibe.deeptype.pending-checkout'
const CHECKOUT_TTL_MS = 60 * 60 * 1000

export type PendingCheckout = {
  accessToken: string
  createdAt: number
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
