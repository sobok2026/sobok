import { ApiError } from './api'

// The Turnstile gate is the only thing in the checkout and re-open flows that answers 400, 403 or 503 —
// every other failure in those routes is 413, 422, 402, 404, 409, 410 or — when our own config is broken —
// 500, so the status alone identifies it.
// See worker/lib/turnstile.ts for the mapping this mirrors.
//
// The split that earns its keep is `expired`: the solve ran past 300s or was already spent, and solving again
// genuinely works. Telling that user to "try again later" sends them away from a form they could have
// finished. `rejected` is the opposite — re-solving cannot help, because the token's host or action did not
// match what this endpoint pins.
export type VerificationErrorKind = 'expired' | 'generic' | 'rejected' | 'unavailable'

export function classifyApiError(error: unknown): VerificationErrorKind {
  if (!(error instanceof ApiError)) {
    return 'generic'
  }

  switch (error.status) {
    case 400:
      return 'expired'
    case 403:
      return 'rejected'
    case 503:
      return 'unavailable'
    default:
      return 'generic'
  }
}
