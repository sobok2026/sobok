// Cloudflare Turnstile siteverify.
//
// Hand-rolled on purpose. Cloudflare ships no server-side SDK for siteverify — the documented integration IS
// this one POST — and better-auth, which guards the auth routes of apps/api, implements the same twenty lines
// inline. Every npm wrapper is a single-maintainer fetch wrapper, which is supply-chain risk on an auth-
// adjacent path in exchange for no abstraction. Owning it is the standard, not the shortcut.
//
// `allowedHostnames` and `expectedAction` are REQUIRED, and that is the whole point of this module:
//   • hostname — asserts the solve happened on this app's own host.
//   • action   — bound per endpoint, so a token minted for one flow can't be spent on another.
// Making either optional silently re-opens replay, so the options object has no defaults and no partial form.
//
// Both pins keep earning their keep after the per-app widgets land, for different reasons. A widget's domain
// list is only an upper bound — Cloudflare auto-covers every subdomain of a configured domain, so a widget
// scoped to the apex authorizes every sibling host and only `allowedHostnames` narrows it. And one app owns
// several Turnstile-gated endpoints, which no widget boundary can separate; that is what `action` is for.
//
// CUTOVER IN FLIGHT: sobok-ops declares one widget per app (stella / vibe / web / dev) with its own secret,
// but that Terraform is not applied yet — as deployed, one account-level widget still backs every app and a
// token solved anywhere in the family verifies everywhere but for the pins below. Until it lands the pins are
// the ONLY boundary, so treat weakening them as re-opening cross-app replay for the whole family.
//
// LOCAL DEVELOPMENT: Cloudflare's always-pass dummy secret CANNOT satisfy this verifier. It answers from the
// secret alone with a canned body whose `hostname` is `example.com` and whose metadata carries
// `result_with_testing_key`, so the hostname pin below can never match a real host. That is by design rather
// than by accident — do not add a testing-key escape hatch here, because that branch would ship to
// production. Point local dev at a real widget and add the dev host under Hostname Management instead.
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

// Cloudflare's documented ceiling. Anything longer was never a token this widget minted.
const TOKEN_MAX_LENGTH = 2048

// Per attempt, not per verification. Neither workerd nor Bun gives fetch a default timeout, so a hung
// siteverify would pin the request handler; 4s twice keeps the worst case inside a form submit people wait
// through. A timeout is classified `unavailable` and therefore denies, which is the correct bias for a gate.
const ATTEMPT_TIMEOUT_MS = 4_000
const RETRY_DELAY_MS = 250

export interface VerifyTurnstileOptions {
  // Hostnames this endpoint accepts a solve from. Cloudflare auto-covers subdomains, so a widget scoped to
  // an apex authorizes every sibling host — this list, not the widget config, is what pins the host.
  allowedHostnames: readonly string[]
  // The `action` the client widget was configured with, one per endpoint. Max 32 chars, [A-Za-z0-9_-].
  expectedAction: string
}

// Why four reasons instead of a boolean: a bot, an expired token, a broken secret and a Cloudflare outage are
// four different events that a boolean reports as "you are a bot". The worst of those is `misconfigured` — a
// bad secret rotation takes down sign-up, comments and checkout at once while every dashboard blames the
// user. The caller cannot react to what it cannot see.
//
// This union is a SERVER-side value and never a response body. The audience split is the security property:
// callers map a reason to a coarse status with a generic body, and keep the diagnosis in logs. The canonical
// mapping, which each app restates in its own problem table:
//   rejected      403  the pins refused it — replay, forgery, or a client/server action drift
//   expired       400  re-solvable; tell the user to try again
//   misconfigured 500  our bug; generic body, and the ONLY reason safe to alert on per request
//   unavailable   503  fail closed; Cloudflare could not answer
//
// `misconfigured` is alert-safe precisely because a client cannot provoke it: bad secrets and malformed
// requests come from us. Wiring a per-request alert to any of the other three hands an attacker a webhook
// flood, so don't.
export type TurnstileFailureReason = 'expired' | 'misconfigured' | 'rejected' | 'unavailable'

export type TurnstileResult =
  | { ok: true }
  // `logDetail` is for `wrangler tail` and nothing else. It names which pin failed and echoes what arrived,
  // both of which are an oracle for anyone probing cross-app replay. Never put it on the wire.
  | { ok: false; logDetail: string; reason: TurnstileFailureReason }

interface SiteverifyResponse {
  action?: string
  'error-codes'?: string[]
  hostname?: string
  success?: boolean
}

// `invalid-input-response` covers expired, malformed AND forged tokens — Cloudflare does not separate them,
// and neither should we: folding forgery in with expiry denies an attacker the "your forgery was spotted"
// signal while still giving the many real users who sat on a form past 300s a retry that works.
const REASON_BY_ERROR_CODE: Record<string, TurnstileFailureReason> = {
  'bad-request': 'misconfigured',
  'internal-error': 'unavailable',
  'invalid-input-response': 'expired',
  'invalid-input-secret': 'misconfigured',
  'missing-input-response': 'misconfigured',
  'missing-input-secret': 'misconfigured',
  'timeout-or-duplicate': 'expired',
}

export async function verifyTurnstile(
  secret: string,
  token: string,
  ip: string | null,
  opts: VerifyTurnstileOptions,
): Promise<TurnstileResult> {
  if (!secret) {
    return {
      ok: false,
      logDetail: 'secret binding resolved empty',
      reason: 'misconfigured',
    }
  }

  // Refuse locally instead of spending a round trip — and, more importantly, so that a client can never make
  // Cloudflare answer `missing-input-response`, which is classified as our bug and therefore alerts.
  if (!token || token.length > TOKEN_MAX_LENGTH) {
    return {
      ok: false,
      logDetail: `token length ${token.length} outside 1..${TOKEN_MAX_LENGTH}`,
      reason: 'rejected',
    }
  }

  const body = JSON.stringify({
    // ONE key for the whole verification, never one per attempt. This is what lets the retry below re-ask
    // about the same single-use token instead of burning it and making the user solve another challenge.
    idempotency_key: crypto.randomUUID(),
    response: token,
    secret,
    ...(ip && { remoteip: ip }),
  })

  // Two attempts, and only for `unavailable` — that is the transport class (network error, timeout, 5xx,
  // Cloudflare's own `internal-error`). A verdict is never retried: siteverify already answered.
  let result = await attemptSiteverify(body, opts)

  if (!result.ok && result.reason === 'unavailable') {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    result = await attemptSiteverify(body, opts)
  }

  return result
}

async function attemptSiteverify(body: string, opts: VerifyTurnstileOptions): Promise<TurnstileResult> {
  let res: Response
  try {
    res = await fetch(SITEVERIFY, {
      body,
      headers: { 'content-type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
    })
  } catch (error) {
    return {
      ok: false,
      logDetail: `siteverify unreachable: ${String(error)}`,
      reason: 'unavailable',
    }
  }

  let data: SiteverifyResponse
  try {
    data = (await res.json()) as SiteverifyResponse
  } catch {
    return {
      ok: false,
      logDetail: `siteverify http ${res.status} with unreadable body`,
      reason: classifyStatus(res.status),
    }
  }

  if (data.success !== true) {
    const codes = data['error-codes'] ?? []
    return {
      ok: false,
      logDetail: `siteverify refused: ${codes.join(', ') || `http ${res.status}, no error-codes`}`,
      // An unrecognised code is treated as a refusal rather than as our bug: it denies without alerting,
      // which is the safe default when Cloudflare adds a code we have not read about yet.
      reason: REASON_BY_ERROR_CODE[codes[0] ?? ''] ?? classifyStatus(res.status),
    }
  }

  // Both pins collapse into one `rejected`. Reporting WHICH of the two failed would let someone probing
  // cross-app replay learn that the hostname passed and narrow the action string on the next try, so the
  // distinction exists in the log line and nowhere else.
  if (data.hostname === undefined || !opts.allowedHostnames.includes(data.hostname)) {
    return {
      ok: false,
      logDetail: `hostname ${data.hostname ?? '(absent)'} not in [${opts.allowedHostnames.join(', ')}]`,
      reason: 'rejected',
    }
  }

  if (data.action !== opts.expectedAction) {
    return {
      ok: false,
      logDetail: `action ${data.action ?? '(absent)'} != ${opts.expectedAction}`,
      reason: 'rejected',
    }
  }

  return { ok: true }
}

// Used when Cloudflare gave us no error code to go on. 429 is siteverify rate limiting us, which the retry
// and then a 503 handle correctly; any other 4xx means we sent something malformed.
function classifyStatus(status: number): TurnstileFailureReason {
  if (status >= 500 || status === 429) {
    return 'unavailable'
  }
  return status >= 400 ? 'misconfigured' : 'rejected'
}
