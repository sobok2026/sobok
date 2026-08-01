import { Hono } from 'hono'

import { comments } from './api/comments'
import { guardianCheckouts } from './api/guardian-checkouts'
import { guardianProducts } from './api/guardian-products'
import { guardianReports } from './api/guardian-reports'
import { runRetentionPurge } from './cron/purge'
import type { AppEnv, Bindings } from './env'
import { problem } from './errors'

// apps/stella is a Worker-with-static-assets: the Next static export in ./out is served at the edge, and this
// Worker runs only for /api/* (wrangler `run_worker_first: ["/api/*"]`). Anything reaching the Worker without
// matching an /api route falls through to the ASSETS binding (404-page / trailing-slash handling).
const app = new Hono<AppEnv>()

app.route('/api/comments', comments)
app.route('/api/guardian-checkouts', guardianCheckouts)
app.route('/api/guardian-products', guardianProducts)
app.route('/api/guardian-reports', guardianReports)

app.all('/api/*', () => problem(404, 'not-found'))
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

app.onError((error) => {
  // postgres errors may carry a separate `detail` containing the rejected row. Log only the ordinary Error
  // fields so recovery email, chart input, capability, and paid answers never ride into Workers logs.
  console.error(
    'stella.worker.unhandled',
    error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : 'non-Error thrown',
  )
  return problem(500, 'internal')
})

export default {
  fetch: app.fetch,
  // One cron (wrangler triggers.crons, daily 03:00): retention purge. It also keeps the SHARED Supabase
  // project warm — a daily query is well under the free-tier 7-day inactivity pause window.
  scheduled: (_event: ScheduledController, env: Bindings, ctx: ExecutionContext) => {
    ctx.waitUntil(runRetentionPurge(env))
  },
} satisfies ExportedHandler<Bindings>
