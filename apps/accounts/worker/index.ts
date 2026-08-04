import type { SobokAuthorityEmail } from '@sobok/auth/authority'
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { handleAuth, handleAuthorizationServerMetadata, handleOpenIdConfiguration } from './auth'
import type { AppEnv, Bindings } from './env'
import { deliverAccountEmail } from './lib/email'

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
app.all('/api/*', (c) => c.json({ type: 'about:blank', title: 'Not Found', status: 404 }, 404))
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

app.onError((error, c) => {
  console.error(
    'accounts.worker.unhandled',
    error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : 'non-Error thrown',
  )
  return c.json({ type: 'about:blank', title: 'Internal Server Error', status: 500 }, 500)
})

export default {
  fetch: app.fetch,
  queue: async (batch: MessageBatch<SobokAuthorityEmail>, env: Bindings) => {
    for (const message of batch.messages) {
      try {
        await deliverAccountEmail(env, message.body)
        message.ack()
      } catch (error) {
        console.error('accounts.email.failed', error instanceof Error ? error.message : 'unknown')
        message.retry({ delaySeconds: 60 })
      }
    }
  },
} satisfies ExportedHandler<Bindings, SobokAuthorityEmail>
