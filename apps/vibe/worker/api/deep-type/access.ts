import type { AppEnv } from '@vibe-worker/env'
import { problem } from '@vibe-worker/errors'
import type { MiddlewareHandler } from 'hono'

// The paid report access_token, carried as `Authorization: Bearer <token>` (never a query param —
// credentials don't belong in URLs). Validates the header, exposes the token as c.var.accessToken for the
// handler, and 401s when it's absent or malformed. Applied on every entitlement route (report/cancel/
// refinement); the unauthenticated funnel routes (config/session/checkout/verify/webhook) never use it.
export const requireAccessToken: MiddlewareHandler<AppEnv> = async (c, next) => {
  const match = c.req.header('authorization')?.match(/^Bearer\s+(\S+)$/i)
  if (!match) {
    return problem(401, 'unauthorized')
  }
  c.set('accessToken', match[1])
  await next()
}
