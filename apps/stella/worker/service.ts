import { Hono } from 'hono'

import { comments } from './api/comments'
import { guardianDaily } from './api/guardian-daily'
import { guardianPass } from './api/guardian-pass'
import { handleStellaAuth } from './auth'
import type { AppEnv, Bindings } from './env'
import { problem } from './errors'

const app = new Hono<AppEnv>()

app.all('/api/auth/*', handleStellaAuth)
app.route('/api/comments', comments)
app.route('/api/guardian-daily', guardianDaily)
app.route('/api/guardian-pass', guardianPass)
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
