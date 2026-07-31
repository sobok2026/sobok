import { ApiError } from './api'

/**
 * Why the return screen is not showing a report.
 *
 * `POST /verify` already answers with six distinguishable states and an RFC 9457 slug, and the screen used to
 * collapse every one of them into a single sentence that told a buyer who had cancelled at the PG window that
 * "결제가 됐다면 리포트는 그대로 있어요". The states differ in what the reader should do next, which is the
 * only reason to distinguish anything:
 *
 * - `declined`    the PG redirected back with a failure code. Cancelled or refused — no money moved. Pay again.
 * - `pending`     402 and still 402 after the retries below. The PG has not settled it. Check again, or ask.
 * - `notFound`    404. This browser holds a payment id the server has never issued. Nothing to recover here.
 * - `refunded`    410. The purchase is over; there is no report to re-open and no charge to worry about.
 * - `mismatch`    409. The charge does not match our price, so the grant is deliberately withheld. Support only.
 * - `unavailable` our side, a timeout, or the network. Nothing is decided; try again.
 * - `noContext`   the screen was opened with no payment to verify at all.
 *
 * A PG failure code is deliberately NOT sorted into cancel-versus-decline. Those codes are per-PG strings, and
 * a table of them here would be a guess that goes stale silently. The PG's own `message` is shown instead and
 * the offered action — pay again — is the same either way.
 */
export type CheckoutFailure =
  | 'declined'
  | 'mismatch'
  | 'noContext'
  | 'notFound'
  | 'pending'
  | 'refunded'
  | 'unavailable'

/**
 * Only the two states that can change on their own. `pending` is the reason this exists: for a redirect
 * return the PG's settlement and our webhook can land a beat after the browser does, and one attempt turns a
 * sale that was about to succeed into an error screen the buyer has to rescue by hand.
 */
export const RETRYABLE_FAILURES: ReadonlySet<CheckoutFailure> = new Set(['pending', 'unavailable'])

/** Three extra attempts over ~7s. Long enough for a late settlement, short enough to stay a loading screen. */
export const VERIFY_RETRY_DELAYS_MS = [1000, 2000, 4000] as const

/** A hung request is a spinner with no end. Every attempt gets its own deadline and then counts as a failure. */
export const VERIFY_TIMEOUT_MS = 12_000

/** When the wait stops being instant, say so rather than letting the spinner imply something is broken. */
export const SLOW_HINT_MS = 4000

export function verifyFailure(error: unknown): CheckoutFailure {
  if (!(error instanceof ApiError)) {
    // A timeout, a dropped connection, a proxy that never answered. Nothing about the purchase is decided.
    return 'unavailable'
  }

  switch (error.status) {
    case 402:
      return 'pending'
    case 404:
      return 'notFound'
    case 409:
      return 'mismatch'
    case 410:
      return 'refunded'
    default:
      // 5xx, and the 422 that can only mean this build and the Worker disagree about the request shape.
      return 'unavailable'
  }
}
