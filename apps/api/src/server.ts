import './instrumentation'

import { disconnectProducer } from '@sobok/events'
import { closeRedis, pingRedis } from '@sobok/kv'
import { closePubSub } from '@sobok/kv/pubsub'
import { registerShutdownHandler, registerShutdownSignals } from '@sobok/std'
import app from './app'
import { shutdownBackendOtel } from './otel'
import { markProbeDraining, markProbeStartupComplete } from './probe/state'

const server = Bun.serve({
  fetch: app.fetch,
  hostname: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
  port: Number(process.env.PORT ?? 3002),
})

registerShutdownHandler('probe', () => markProbeDraining())
registerShutdownHandler('http-server', () => server.stop())
registerShutdownHandler('redis', () => closeRedis())
registerShutdownHandler('pubsub', () => closePubSub())
registerShutdownHandler('opentelemetry', () => shutdownBackendOtel())
registerShutdownHandler('kafka-producer', () => disconnectProducer())
registerShutdownSignals()

await pingRedis()
markProbeStartupComplete()

console.info(`sobok-api listening on http://${server.hostname}:${server.port}`)
