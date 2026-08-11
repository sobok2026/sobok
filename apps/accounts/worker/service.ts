import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { handleAuth, handleAuthorizationServerMetadata, handleOpenIdConfiguration } from './auth'
import type { AppEnv, Bindings } from './env'

const app = new Hono<AppEnv>()

app.use('*', secureHeaders())
app.use('/api/*', async (c, next) => {
  await next()
  c.header('cache-control', 'no-store')
})
app.use('/.well-known/*', async (c, next) => {
  await next()
  c.header('cache-control', 'public, max-age=300')
})

app.get('/api/health', (c) => c.json({ ok: true }))
app.get('/.well-known/openid-configuration', handleOpenIdConfiguration)
app.get('/.well-known/oauth-authorization-server', handleAuthorizationServerMetadata)
app.all('/api/auth/*', handleAuth)
app.all('*', (c) => c.json({ type: 'about:blank', title: 'Not Found', status: 404 }, 404))

app.onError((error, c) => {
  console.error(
    JSON.stringify({
      event: 'accounts.worker.unhandled',
      error: error instanceof Error ? error.message : 'non-Error thrown',
      errorName: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    }),
  )
  return c.json({ type: 'about:blank', title: 'Internal Server Error', status: 500 }, 500)
})

export async function handleAccountsRequest(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
  return app.fetch(request, env, ctx)
}

export type { Bindings as AccountsBindings } from './env'
export { deliverAccountEmail } from './lib/email'
