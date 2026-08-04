import { type PaymentEvent, PaymentEventSchema } from '@sobok/payments'
import { Hono } from 'hono'

import { comments } from './api/comments'
import { guardianCheckouts } from './api/guardian-checkouts'
import { guardianCollections } from './api/guardian-collections'
import { guardianLoveRedraw } from './api/guardian-love-redraw'
import { guardianProducts } from './api/guardian-products'
import { guardianPurchases } from './api/guardian-purchases'
import { guardianReopen } from './api/guardian-reopen'
import { guardianReports } from './api/guardian-reports'
import { handleStellaAuth } from './auth'
import type { AppEnv, Bindings } from './env'
import { problem } from './errors'
import { handleGuardianPaymentEvent } from './payments/events'

export { StellaMaintenance } from './maintenance'

// apps/stella is a Worker-with-static-assets: the Next static export in ./out is served at the edge, and this
// Worker runs only for /api/* (wrangler `run_worker_first: ["/api/*"]`). Anything reaching the Worker without
// matching an /api route falls through to the ASSETS binding (404-page / trailing-slash handling).
const app = new Hono<AppEnv>()

app.all('/api/auth/*', handleStellaAuth)
app.route('/api/comments', comments)
app.route('/api/guardian-checkouts', guardianCheckouts)
app.route('/api/guardian-collections', guardianCollections)
app.route('/api/guardian-products', guardianProducts)
app.route('/api/guardian-purchases', guardianPurchases)
app.route('/api/guardian-reopen', guardianReopen)
app.route('/api/guardian-reports', guardianReports)
app.route('/api/guardian-reports', guardianLoveRedraw)

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
  queue: async (batch: MessageBatch<PaymentEvent>, env: Bindings, ctx: ExecutionContext) => {
    for (const message of batch.messages) {
      try {
        await handleGuardianPaymentEvent(env, ctx, PaymentEventSchema.parse(message.body))
        message.ack()
      } catch (error) {
        console.error('stella.payment_event.failed', error instanceof Error ? error.message : 'unknown')
        message.retry()
      }
    }
  },
} satisfies ExportedHandler<Bindings, PaymentEvent>
