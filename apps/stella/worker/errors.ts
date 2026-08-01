import { createProblem } from '@sobok/edge/problem'

// Stella's RFC 9457 vocabulary. `@sobok/edge/problem` owns the wire shape, content type, and no-store policy;
// this Worker owns only the slugs and URI namespace shared by comments and paid guardian-card APIs.
const BASE = 'https://sobok.cc/problems/stella/'

export type ProblemSlug =
  | 'invalid-request'
  | 'not-found'
  | 'invalid-topic'
  | 'payload-too-large'
  | 'turnstile-failed'
  | 'turnstile-expired'
  | 'rate-limited'
  | 'thread-locked'
  | 'comment-not-found'
  | 'report-not-found'
  | 'payment-required'
  | 'payment-mismatch'
  | 'payment-conflict'
  | 'checkout-conflict'
  | 'question-conflict'
  | 'invalid-answer'
  | 'forbidden'
  | 'invalid-webhook'
  | 'service-unavailable'
  | 'internal'

export const problem = createProblem<ProblemSlug>(BASE)
