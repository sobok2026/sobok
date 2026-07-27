// RFC 9457 problem+json. Each app supplies its own `type` URI base and its own slug union; the wire shape,
// the content-type and the no-store discipline are identical everywhere.
//
// `title` is deliberately the bare slug rather than a human reason phrase: clients switch on it (stella's
// comment UI maps it straight to localized copy), so it is a machine contract. Changing it is a breaking
// change even though nothing about the HTTP status moves.
//
// Note this is NOT @sobok/http's `createProblemDetailsResponse` — that one derives the type URI from the
// request origin and calls Buffer.byteLength, neither of which works in a Worker.

export interface ProblemOptions {
  // dev-facing diagnostic for this one occurrence (RFC 9457 `detail`). Never shown to users.
  detail?: string
  // merged over the defaults. The one real use is a Retry-After hint on a 202 poll signal.
  headers?: Record<string, string>
}

export type ProblemFn<Slug extends string> = (status: number, slug: Slug, opts?: ProblemOptions) => Response

// `baseUri` must end with '/' — the slug is appended verbatim.
export function createProblem<Slug extends string>(baseUri: string): ProblemFn<Slug> {
  return function problem(status, slug, opts): Response {
    const headers = new Headers({
      'content-type': 'application/problem+json; charset=utf-8',
      'cache-control': 'no-store',
    })

    if (opts?.headers) {
      for (const [key, value] of Object.entries(opts.headers)) {
        headers.set(key, value)
      }
    }

    const body = {
      type: baseUri + slug,
      title: slug,
      status,
      ...(opts?.detail && { detail: opts.detail }),
    }

    return new Response(JSON.stringify(body), { status, headers })
  }
}
