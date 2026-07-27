import { httpInstrumentationMiddleware } from '@hono/otel'
import type { Session, SessionUser } from '@sobok/auth'
import { Hono } from 'hono'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { etag } from 'hono/etag'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'

import apiRouter from './api'
import { getDefaultSecureHeadersOptions } from './middleware/secure-headers'
import probeRoutes from './probe'
import { problemResponse } from './utils/problem'
import { ALLOW_ANY_REQUEST_ORIGIN, APP_ORIGIN, isAllowedRequestOrigin } from './utils/request-origin'

export type Env = {
  Variables: {
    requestId: string
    user: SessionUser | null
    session: Session['session'] | null
  }
}

const app = new Hono<Env>()
const etagMiddleware = etag()

const csrfMiddleware = csrf({
  origin: isAllowedRequestOrigin,
  secFetchSite: ALLOW_ANY_REQUEST_ORIGIN ? 'same-site' : 'same-origin',
})

// 1. 상태 검사
app.route('/', probeRoutes)

// 2. 관측성
app.use(httpInstrumentationMiddleware({ serviceName: 'sobok-api' }))
app.use('*', requestId())
app.use(logger())

// 3. 네트워크 보안
app.use('/api/*', secureHeaders(getDefaultSecureHeadersOptions()))

app.use(
  '/i/*',
  secureHeaders({
    ...getDefaultSecureHeadersOptions(),
    crossOriginResourcePolicy: 'same-site',
  }),
)

app.use(
  '/i/*',
  cors({
    origin: () => APP_ORIGIN,
    allowMethods: ['GET', 'HEAD'],
    exposeHeaders: ['ETag'],
    credentials: true,
    maxAge: 86400,
  }),
)

// 4. 응답 변환
app.use(compress({ threshold: 1024 }))

app.use('/api/v1/*', async (c, next) => {
  if (c.req.method === 'GET' || c.req.method === 'HEAD') {
    return await etagMiddleware(c, next)
  }

  return await next()
})

// 5. 애플리케이션 보안 계층
app.use('*', (c, next) => {
  if (c.req.path === '/api/v1/billing/portone/webhook') {
    return next()
  }

  return csrfMiddleware(c, next)
})

// 6. 하위 route
app.route('/api', apiRouter)

app.notFound((c) => {
  return problemResponse(c, { status: 404 })
})

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return problemResponse(c, {
      status: err.status,
      detail: err.message,
    })
  }

  console.error('unhandled error', err)
  return problemResponse(c, { status: 500 })
})

export default app
