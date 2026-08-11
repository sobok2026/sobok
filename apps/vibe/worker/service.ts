import { describeError } from '@sobok/edge/errors'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'

import { deepType } from './api/deep-type'
import type { AppEnv, Bindings } from './env'
import { problem } from './errors'

const app = new Hono<AppEnv>()

app.use('/api/*', requestId())
app.use('/api/*', logger())
app.use('/api/*', secureHeaders())
app.route('/api/deep-type', deepType)
app.notFound(() => problem(404, 'not-found'))

app.onError((error) => {
  console.error('deeptype.unhandled', describeError(error))
  return problem(500, 'internal')
})

export async function handleVibeRequest(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
  return app.fetch(request, env, ctx)
}

export type { Bindings as VibeBindings } from './env'
export { handleDeepTypePaymentEvent } from './payments/events'
export { runRetentionPurge as purgeVibeRetention } from './payments/purge'
export { reconcileStalePending as reconcileStaleVibePayments } from './payments/reconcile'
