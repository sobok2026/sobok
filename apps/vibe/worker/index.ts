import { Hono } from 'hono'

import { deepType } from './api/deep-type'
import type { AppEnv, Bindings } from './env'
import { reconcileStalePending } from './payments/reconcile'

// apps/vibe is a Worker-with-static-assets: the Next static export in ./out is served at the edge, and
// this Worker runs only for /api/* (wrangler `run_worker_first: ["/api/*"]`). Anything that reaches the
// Worker without matching an /api route falls through to the ASSETS binding, which applies the configured
// 404-page / trailing-slash handling.
const app = new Hono<AppEnv>()

app.route('/api/deep-type', deepType)

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default {
  fetch: app.fetch,
  // 15-min cron (wrangler triggers.crons): converge purchases stuck 'pending' against PortOne.
  scheduled(_event: ScheduledController, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(reconcileStalePending(env))
  },
} satisfies ExportedHandler<Bindings>
