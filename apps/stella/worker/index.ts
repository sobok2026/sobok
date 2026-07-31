import { Hono } from 'hono'

import { comments } from './api/comments'
import { guardianProducts } from './api/guardian-products'
import { runRetentionPurge } from './cron/purge'
import type { AppEnv, Bindings } from './env'

// apps/stella is a Worker-with-static-assets: the Next static export in ./out is served at the edge, and this
// Worker runs only for /api/* (wrangler `run_worker_first: ["/api/*"]`). Anything reaching the Worker without
// matching an /api route falls through to the ASSETS binding (404-page / trailing-slash handling).
const app = new Hono<AppEnv>()

app.route('/api/comments', comments)
app.route('/api/guardian-products', guardianProducts)

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default {
  fetch: app.fetch,
  // One cron (wrangler triggers.crons, daily 03:00): retention purge. It also keeps the SHARED Supabase
  // project warm — a daily query is well under the free-tier 7-day inactivity pause window.
  scheduled: (_event: ScheduledController, env: Bindings, ctx: ExecutionContext) => {
    ctx.waitUntil(runRetentionPurge(env))
  },
} satisfies ExportedHandler<Bindings>
