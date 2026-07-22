// RFC 9457 problem+json for the deeptype API. Every money/entitlement response is no-store.
const BASE = 'https://sobok.app/problems/deep-type/'

export type ProblemSlug =
  | 'invalid-request'
  | 'unauthorized'
  | 'result-not-found'
  | 'invalid-sku'
  | 'consent-required'
  | 'payload-too-large'
  | 'turnstile-failed'
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

export function problem(
  status: number,
  slug: ProblemSlug,
  detail?: string,
  extra?: Record<string, unknown>,
  extraHeaders?: Record<string, string>,
): Response {
  const headers = new Headers({
    'content-type': 'application/problem+json; charset=utf-8',
    'cache-control': 'no-store',
  })
  // report-generating is a 202 poll signal, not an error; the handler passes Retry-After via extraHeaders.
  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) {
      headers.set(key, value)
    }
  }
  return new Response(
    JSON.stringify({ type: BASE + slug, title: slug, status, ...(detail ? { detail } : {}), ...extra }),
    { status, headers },
  )
}
