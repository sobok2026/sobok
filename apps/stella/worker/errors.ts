import { createProblem } from '@sobok/edge/problem'

// The comments slug vocabulary. The RFC 9457 wire shape, the content-type and the no-store discipline are
// `@sobok/edge/problem`'s — identical in every Worker — and what stays here is the only part that is this
// app's: which slugs exist and what URI base they hang off. All responses are no-store: the board is public
// but dynamic, and the money-DB caching discipline (never cache entitlement/state) carries over as a habit.
const BASE = 'https://sobok.cc/problems/comments/'

export type ProblemSlug =
  | 'invalid-request'
  | 'invalid-topic'
  | 'payload-too-large'
  | 'turnstile-failed'
  | 'turnstile-expired'
  | 'rate-limited'
  | 'thread-locked'
  | 'comment-not-found'
  | 'forbidden'
  | 'service-unavailable'
  | 'internal'

export const problem = createProblem<ProblemSlug>(BASE)
