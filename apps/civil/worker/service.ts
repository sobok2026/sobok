import { describeError } from '@sobok/edge/errors'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { calculations } from './api/calculations'
import { organizations } from './api/organizations'
import { projects } from './api/projects'
import { handleCivilAuth, withCivilSession } from './auth'
import type { AppEnv, Bindings } from './env'
import { problem } from './errors'
import { NO_STORE_HEADERS } from './lib/http'

const app = new Hono<AppEnv>()

app.use('/api/*', requestId())
app.use('/api/*', logger())
app.use('/api/*', secureHeaders())
app.use('/api/*', async (c, next) => {
  if (c.req.method === 'GET' || c.req.method === 'HEAD' || c.req.method === 'OPTIONS') {
    return next()
  }
  if (c.req.header('origin') !== c.env.CIVIL_PUBLIC_ORIGIN) {
    return problem(403, 'forbidden')
  }
  return next()
})

app.all('/api/auth/*', handleCivilAuth)
app.get('/api/health', (c) => c.json({ ok: true }, 200, { 'cache-control': 'no-store' }))
app.get('/api/me', async (c) => {
  const session = await withCivilSession(c, (_db, value) => Promise.resolve(value))
  return c.json({ user: session?.user ?? null }, 200, NO_STORE_HEADERS)
})
app.route('/api/organizations', organizations)
app.route('/api/organizations', projects)
app.route('/api/organizations', calculations)
app.notFound(() => problem(404, 'not-found'))

app.onError((error) => {
  console.error(JSON.stringify({ event: 'civil.unhandled', error: describeError(error) }))
  return problem(500, 'internal')
})

export async function handleCivilRequest(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
  return app.fetch(request, env, ctx)
}

export type {
  CivilCalculationClaim,
  CivilCalculationOutput,
  CivilCalculationWork,
  CivilComputationGateway,
} from '@sobok/civil/calculation'
export type { CivilComputeGateway } from './compute-service'
export { createCivilComputationGateway } from './compute-service'
export type { Bindings as CivilBindings } from './env'
