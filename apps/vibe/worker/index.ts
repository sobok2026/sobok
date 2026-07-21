import { Hono } from 'hono'

import { deepType } from './api/deep-type'
import type { AppEnv, Bindings } from './env'
import { runRetentionPurge } from './payments/purge'
import { reconcileStalePending } from './payments/reconcile'

const PURGE_CRON = '0 3 * * *'

// apps/vibe is a Worker-with-static-assets: the Next static export in ./out is served at the edge, and
// this Worker runs only for /api/* (wrangler `run_worker_first: ["/api/*"]`). Anything that reaches the
// Worker without matching an /api route falls through to the ASSETS binding, which applies the configured
// 404-page / trailing-slash handling.
const app = new Hono<AppEnv>()

app.route('/api/deep-type', deepType)

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default {
  fetch: app.fetch,
  // Two crons (wrangler triggers.crons): daily → PIPA retention purge; every 15 min → reconcile stuck
  // 'pending' purchases against PortOne.
  scheduled(event: ScheduledController, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(event.cron === PURGE_CRON ? runRetentionPurge(env) : reconcileStalePending(env))
  },
} satisfies ExportedHandler<Bindings>
