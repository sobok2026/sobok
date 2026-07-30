import { createProblem } from '@sobok/edge/problem'

// The deeptype slug vocabulary. The RFC 9457 wire shape, the content-type and the no-store discipline are
// `@sobok/edge/problem`'s — identical in every Worker — and what stays here is the only part that is this
// app's: which slugs exist and what URI base they hang off.
const BASE = 'https://sobok.app/problems/deep-type/'

export type ProblemSlug =
  | 'invalid-request'
  | 'unauthorized'
  | 'result-not-found'
  | 'invalid-sku'
  | 'consent-required'
  | 'payload-too-large'
  | 'turnstile-failed'
  | 'turnstile-expired'
  | 'service-unavailable'
  | 'purchase-not-found'
  | 'amount-mismatch'
  | 'payment-not-completed'
  | 'purchase-not-paid'
  | 'purchase-refunded'
  | 'report-generating'
  | 'report-generation-failed'
  | 'refinement-required'
  | 'refinement-conflict'
  | 'reopen-link-invalid'
  | 'withdrawal-forbidden'
  | 'invalid-signature'
  | 'not-configured'
  | 'not-found'
  | 'internal'
  // APPEND ONLY. Each slug is concatenated onto BASE to form the public `type` URI of a problem document, so
  // an existing string that changes retires a URI clients may already branch on. New members go at the end
  // and old ones are never renamed or removed.
  //
  // Both of the following are 410, never 422. A stored answer set that the current instrument no longer
  // accepts is permanently unusable, and 422 invites the client to retry a payload it can never fix — which
  // is how a buyer ends up locked out of the thing they paid for with no path but a support ticket.
  | 'instrument-retired'
  | 'answers-expired'

// report-generating is a 202 poll signal, not an error; that handler passes Retry-After through `headers`.
export const problem = createProblem<ProblemSlug>(BASE)
