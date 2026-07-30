import { describeError } from '@sobok/edge/errors'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { deepType } from './api/deep-type'
import type { AppEnv, Bindings } from './env'

import { problem } from './errors'
import { runRetentionPurge } from './payments/purge'
import { reconcileStalePending } from './payments/reconcile'

const PURGE_CRON = '0 3 * * *'

// apps/vibe is a Worker-with-static-assets: the Next static export in ./out is served at the edge, and this
// Worker runs only for /api/* (wrangler `run_worker_first: ["/api/*"]`). Non-/api requests, and /api paths
// that match no route, are handled explicitly below.
const app = new Hono<AppEnv>()

// Observability + hardening on the API surface only. Static assets carry their own edge headers (./out/_headers).
app.use('/api/*', requestId())
app.use('/api/*', logger())
app.use('/api/*', secureHeaders())

app.route('/api/deep-type', deepType)

// Nothing matched. An unmatched /api/* path is a genuine API 404 (problem+json) — including unknown paths
// under the mounted sub-app, since Hono routes those to this root handler. Everything else falls through to
// the ASSETS binding, which applies the configured 404-page / trailing-slash handling.
app.notFound((c) => (c.req.path.startsWith('/api/') ? problem(404, 'not-found') : c.env.ASSETS.fetch(c.req.raw)))

// Any unhandled handler throw becomes a uniform problem+json 500 instead of a bare Workers exception.
app.onError((error) => {
  console.error('deeptype.unhandled', describeError(error))
  return problem(500, 'internal')
})

export default {
  fetch: app.fetch,
  // Two crons (wrangler triggers.crons): daily → PIPA retention purge; every 15 min → reconcile stuck
  // 'pending' purchases against PortOne.
  scheduled: (event: ScheduledController, env: Bindings, ctx: ExecutionContext) => {
    ctx.waitUntil(event.cron === PURGE_CRON ? runRetentionPurge(env) : reconcileStalePending(env))
  },
} satisfies ExportedHandler<Bindings>
