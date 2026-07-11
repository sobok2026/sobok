import { auth } from '@sobok/auth/server'
import { createMiddleware } from 'hono/factory'

import type { Env } from '../app'

export const session = createMiddleware<Env>(async (c, next) => {
  const result = await auth.api.getSession({ headers: c.req.raw.headers })

  c.set('user', result?.user ?? null)
  c.set('session', result?.session ?? null)

  return await next()
})
