import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { getPasskeyAuthenticationAttemptCookieConfig } from '@sobok/auth/cookie'
import { WEBAUTHN_RP_ID } from '@sobok/auth/passkey/server'
import { storeChallenge } from '@sobok/auth/redis-challenge'
import type { POSTV1AuthPasskeyOptionsResponse } from '@sobok/contracts'
import { ChallengeType } from '@sobok/domain/auth/model'
import { getRequestIP } from '@sobok/http/request'
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'

import type { Env } from '@/app'

import { problemResponse, tooManyRequestsProblemResponse } from '@/utils/problem'

import { passkeyAuthOptionLimiter } from '../rate-limit'

const route = new Hono<Env>()

route.post('/', async (c) => {
  const remoteIP = getRequestIP(c.req.raw.headers)
  const { allowed, retryAfter, limit, remaining } = await passkeyAuthOptionLimiter.check(remoteIP)

  if (!allowed) {
    return tooManyRequestsProblemResponse(c, retryAfter)
  }

  try {
    const options = await generateAuthenticationOptions({
      rpID: WEBAUTHN_RP_ID,
      userVerification: 'required',
    })

    const authenticationAttemptId = crypto.randomUUID()
    const authAttemptCookie = getPasskeyAuthenticationAttemptCookieConfig(authenticationAttemptId)
    const turnstileRequired = limit !== undefined && remaining !== undefined && limit - remaining >= 4

    await storeChallenge(authenticationAttemptId, ChallengeType.AUTHENTICATION, {
      challenge: options.challenge,
      turnstileRequired,
    })

    setCookie(c, authAttemptCookie.key, authAttemptCookie.value, authAttemptCookie.options)

    return c.json({ options, turnstileRequired } satisfies POSTV1AuthPasskeyOptionsResponse)
  } catch (error) {
    console.error('getAuthenticationOptions:', error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
