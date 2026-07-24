// RFC 9457 problem+json for the stella comments API. All responses are no-store — the board is public but
// dynamic, and the money-DB caching discipline (never cache entitlement/state) carries over as a habit.
const BASE = 'https://sobok.cc/problems/comments/'

export type ProblemSlug =
  | 'invalid-request'
  | 'invalid-topic'
  | 'payload-too-large'
  | 'turnstile-failed'
  | 'rate-limited'
  | 'thread-locked'
  | 'comment-not-found'
  | 'forbidden'
  | 'internal'

export function problem(
  status: number,
  slug: ProblemSlug,
  detail?: string,
  extraHeaders?: Record<string, string>,
): Response {
  const headers = new Headers({
    'content-type': 'application/problem+json; charset=utf-8',
    'cache-control': 'no-store',
  })
  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) {
      headers.set(key, value)
    }
  }
  return new Response(JSON.stringify({ type: BASE + slug, title: slug, status, ...(detail ? { detail } : {}) }), {
    status,
    headers,
  })
}
