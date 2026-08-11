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
app.all('*', () => problem(404, 'not-found'))

app.onError((error) => {
  console.error(
    'stella.worker.unhandled',
    error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : 'non-Error thrown',
  )
  return problem(500, 'internal')
})

export async function handleStellaRequest(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
  return app.fetch(request, env, ctx)
}

export type { Bindings as StellaBindings } from './env'
export { runRetentionPurge as purgeStellaRetention } from './maintenance/purge'
export { handleGuardianPaymentEvent } from './payments/events'
export { reconcileStaleGuardianPayments } from './payments/reconcile'
