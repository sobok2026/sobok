import { alertDiscord } from '@sobok/edge/alert'
import { type TurnstileFailureReason, type TurnstileResult, verifyTurnstile } from '@sobok/edge/turnstile'
import type { AppEnv } from '@vibe-worker/env'
import { type ProblemSlug, problem } from '@vibe-worker/errors'
import type { Context } from 'hono'

// The verifier's reason → what the client is allowed to see. Deliberately coarse: `rejected` never says
// whether the hostname or the action was the pin that refused, and `misconfigured` never says the secret is
// the problem. The diagnosis goes to the log line below instead.
const RESPONSE_BY_REASON: Record<TurnstileFailureReason, { slug: ProblemSlug; status: number }> = {
  expired: { slug: 'turnstile-expired', status: 400 },
  misconfigured: { slug: 'internal', status: 500 },
  rejected: { slug: 'turnstile-failed', status: 403 },
  unavailable: { slug: 'service-unavailable', status: 503 },
}

// Returns null when the solve is good, or the response to send when it is not. Checkout and re-open both gate
// through here so the host pin, the classification and the alert rule cannot drift apart between them.
//
// The host pin comes from DEEPTYPE_PUBLIC_ORIGIN rather than a literal: vibe serves one origin, and deriving
// it means a preview deployment cannot silently accept a solve from production.
export async function guardTurnstile(
  c: Context<AppEnv>,
  args: { expectedAction: string; token: string },
): Promise<Response | null> {
  const ip = c.req.header('cf-connecting-ip') ?? null
  const hostname = parseOriginHostname(c.env.DEEPTYPE_PUBLIC_ORIGIN)

  // An unparsable origin used to throw out of here into `app.onError`, which answers 500 `internal` without
  // ever reaching the classification below — so the one failure that means "nobody can pay" was also the one
  // that never alerted. Routing it through `misconfigured` puts it back on the single deny path that both
  // the response mapping and the Discord page hang off. Mirrors stella's `parseAllowedHostnames`.
  const result: TurnstileResult =
    hostname === null
      ? { ok: false, logDetail: 'DEEPTYPE_PUBLIC_ORIGIN is not a parsable absolute URL', reason: 'misconfigured' }
      : await verifyTurnstile(await c.env.DEEPTYPE_TURNSTILE_SECRET.get(), args.token, ip, {
          allowedHostnames: [hostname],
          expectedAction: args.expectedAction,
        })

  if (result.ok) {
    return null
  }

  // Workers Observability is the durable record for all four reasons; the token itself is a credential and
  // never belongs in a log line.
  console.warn(`turnstile ${result.reason} (${args.expectedAction}): ${result.logDetail}`)

  // Only `misconfigured` pages anyone. A client cannot provoke it — bad secrets and malformed requests come
  // from us — so a per-request webhook here cannot be turned into a flood, which is exactly what alerting on
  // `rejected` during a bot wave would be. This one is worth waking up for: it means nobody can pay.
  if (result.reason === 'misconfigured') {
    c.executionCtx.waitUntil(
      c.env.DEEPTYPE_DISCORD_WEBHOOK.get().then((url) =>
        alertDiscord(url, '🚨 deeptype Turnstile is misconfigured; checkout is down'),
      ),
    )
  }

  const { slug, status } = RESPONSE_BY_REASON[result.reason]
  return problem(status, slug, status === 503 ? { headers: { 'retry-after': '5' } } : undefined)
}

// `raw` is typed string by the binding but the runtime does not guarantee one: a wrangler.jsonc that lost the
// var, or a named environment that failed to redeclare it (wrangler does NOT inherit `vars` into named
// environments), delivers undefined — and a relative or misspelled value parses no better. try/catch rather
// than `URL.canParse`, which @cloudflare/workers-types does not declare. The value itself never reaches the
// log: it is ours, but echoing config into a line that also names the failing pin is a habit worth not having.
function parseOriginHostname(raw: string | undefined): string | null {
  try {
    return new URL(raw ?? '').hostname || null
  } catch {
    return null
  }
}
