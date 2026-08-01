'use client'

// Snapshot of the visitor's GA4 identity, taken while they are still in the browser, so a server can attach a
// later Measurement Protocol event to the right user and session — the event may be emitted by a webhook or a
// cron, where no browser exists.
export type GaIdentity = {
  clientId: string
  sessionId: string | null
}

// Returns null when there is no readable `_ga`; the server then sends nothing, because minting an identity
// would fabricate a user GA4 has never seen. The converse does NOT hold — a present `_ga` is not evidence of
// consent. Consent Mode stops WRITING cookies on withdrawal without deleting the ones already there, and
// `_ga` is scoped to the registrable domain, so it may have been written by any other sobok.cc app. That is
// why the server-side hit carries no consent block (see vibe's worker/lib/ga4.ts).
export function readGaIdentity(measurementId: string): GaIdentity | null {
  const clientId = parseClientId(readCookie('_ga'))
  if (!clientId) {
    return null
  }

  return {
    clientId,
    // Passed through UNPARSED. The Measurement Protocol reference accepts either the bare session id or "the
    // full value of the cookie", and only the latter is a documented contract: the `_ga_<STREAM>` value
    // format changed without notice (`GS1.1.<id>.<hits>…` → `GS2.1.s<id>$o…$t…`) and broke every parser that
    // reached inside it. Sending it whole cannot break that way again.
    sessionId: readCookie(`_ga_${measurementId.replace(/^G-/, '')}`),
  }
}

function readCookie(name: string): string | null {
  let value: string | null = null

  for (const entry of document.cookie.split('; ')) {
    const separator = entry.indexOf('=')
    if (separator > 0 && entry.slice(0, separator) === name) {
      if (value !== null) {
        return null
      }

      value = entry.slice(separator + 1)
    }
  }

  return value || null
}

// `_ga` is `GA1.<domain depth>.<client id>`, and the client id itself contains a dot
// (`<random>.<first seen>`). Unlike the session cookie this shape has been stable since GA4 shipped, and the
// two-numbers-joined-by-a-period form it yields is the format the Measurement Protocol reference *recommends*
// — so extracting it is worth the three lines here.
function parseClientId(cookie: string | null): string | null {
  const parts = cookie?.split('.') ?? []
  if (parts.length < 4) {
    return null
  }
  const clientId = parts.slice(-2).join('.')
  return /^\d+\.\d+$/.test(clientId) ? clientId : null
}
