import { type TurnstileFailureReason, verifyTurnstile } from '@sobok/edge/turnstile'
import type { Context } from 'hono'

import type { AppEnv } from '~/env'
import { type ProblemSlug, problem } from '~/errors'
import { alertDiscord } from './alert'

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
  const secret = await c.env.DEEPTYPE_TURNSTILE_SECRET.get()
  const ip = c.req.header('cf-connecting-ip') ?? null

  const result = await verifyTurnstile(secret, args.token, ip, {
    allowedHostnames: [new URL(c.env.DEEPTYPE_PUBLIC_ORIGIN).hostname],
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
  return problem(status, slug, undefined, undefined, status === 503 ? { 'retry-after': '5' } : undefined)
}
