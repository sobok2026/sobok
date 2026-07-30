import {
  type POSTV1PointTurnstileResponse,
  postV1PointTurnstileRequestSchema,
  TURNSTILE_POINTS_EARN_ACTION,
} from '@sobok/contracts'
import { COOKIE_KEY } from '@sobok/http/cookie'
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { guardTurnstile } from '@/utils/turnstile'
import { zProblemValidator } from '@/utils/validator'

import { POINTS_TURNSTILE_TTL_SECONDS, signPointsTurnstileToken } from '../util-turnstile-cookie'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('json', postV1PointTurnstileRequestSchema))

route.post('/', ...middlewares, async (c) => {
  const userId = c.get('user')!.id
  const { token } = c.req.valid('json')

  const denied = await guardTurnstile(c, TURNSTILE_POINTS_EARN_ACTION, token)
  if (denied) {
    return denied
  }

  const signedCookie = await signPointsTurnstileToken(userId)

  setCookie(c, COOKIE_KEY.POINTS_TURNSTILE, signedCookie, {
    httpOnly: true,
    maxAge: POINTS_TURNSTILE_TTL_SECONDS,
    path: '/api/v1/points',
    sameSite: 'strict',
    secure: true,
  })

  return c.json({
    verified: true,
    expiresInSeconds: POINTS_TURNSTILE_TTL_SECONDS,
  } satisfies POSTV1PointTurnstileResponse)
})

export default route
