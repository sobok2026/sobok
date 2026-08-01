import { alertDiscord } from '@sobok/edge/alert'
import { type TurnstileFailureReason, type TurnstileResult, verifyTurnstile } from '@sobok/edge/turnstile'
import type { Context } from 'hono'
import type { AppEnv } from '~/env'
import { type ProblemSlug, problem } from '~/errors'

// The verifier's reason → what the client is allowed to see. Deliberately coarse: `rejected` never says
// whether the hostname or the action was the pin that refused, and `misconfigured` never says the secret is
// the problem. The diagnosis goes to the log line below instead.
const RESPONSE_BY_REASON: Record<TurnstileFailureReason, { slug: ProblemSlug; status: number }> = {
  expired: { slug: 'turnstile-expired', status: 400 },
  misconfigured: { slug: 'internal', status: 500 },
  rejected: { slug: 'turnstile-failed', status: 403 },
  unavailable: { slug: 'service-unavailable', status: 503 },
}

// Returns null when the solve is good, or the response to send when it is not. Both write paths gate through
// here so the host pin, the classification and the alert rule cannot drift apart between them.
export async function guardTurnstile(
  c: Context<AppEnv>,
  args: { expectedAction: string; ip: string | null; token: string },
): Promise<Response | null> {
  const allowedHostnames = parseAllowedHostnames(c.env.STELLA_ALLOWED_HOSTNAMES)

  const { token, ip, expectedAction } = args

  // An empty pin would reject every real visitor while looking exactly like a bot wave in the logs. That is
  // precisely the confusion the `misconfigured` class exists to prevent, so route it there — one deny path,
  // so the alert and the response mapping below cover this case too.
  const result: TurnstileResult =
    allowedHostnames.length === 0
      ? { ok: false, logDetail: 'STELLA_ALLOWED_HOSTNAMES resolved to an empty list', reason: 'misconfigured' }
      : await verifyTurnstile(await c.env.STELLA_TURNSTILE_SECRET.get(), token, ip, {
          allowedHostnames,
          expectedAction,
        })

  if (result.ok) {
    return null
  }

  // Workers Observability is the durable record for all four reasons; the token itself is a credential and
  // never belongs in a log line.
  console.warn(`turnstile ${result.reason} (${expectedAction}): ${result.logDetail}`)

  // Only `misconfigured` pages anyone. A client cannot provoke it — bad secrets and malformed requests come
  // from us — so a per-request webhook here cannot be turned into a flood, which is exactly what alerting on
  // `rejected` during a bot wave would be.
  if (result.reason === 'misconfigured') {
    const webhook = await c.env.STELLA_DISCORD_WEBHOOK.get()
    c.executionCtx.waitUntil(alertDiscord(webhook, `🚨 stella Turnstile is misconfigured for \`${expectedAction}\``))
  }

  const { slug, status } = RESPONSE_BY_REASON[result.reason]
  return problem(status, slug, status === 503 ? { headers: { 'retry-after': '5' } } : undefined)
}

// Whitespace and stray trailing commas are dropped rather than becoming a hostname that can never match —
// a silently unmatchable entry is how a pin turns into a total outage that reads as a bot wave.
//
// `raw` is typed string by the binding but the runtime does not guarantee one: a wrangler.jsonc that lost the
// var, or a named environment that failed to redeclare it (wrangler does NOT inherit `vars` into named
// environments), delivers undefined. Coercing here sends that into the misconfigured branch — which alerts —
// instead of an unhandled TypeError that 500s with no diagnosis.
function parseAllowedHostnames(raw: string | undefined): readonly string[] {
  return (raw ?? '')
    .split(',')
    .map((hostname) => hostname.trim())
    .filter(Boolean)
}
