import { env as authEnv } from '@sobok/env/server.auth'
import { env as commonEnv } from '@sobok/env/server.common'
import { COOKIE_KEY } from '@sobok/http/cookie'
import { sec } from '@sobok/std'
import type { JWTPayload } from 'jose'
import { jwtVerify, SignJWT } from 'jose'

type PointsTurnstileTokenPayload = JWTPayload & {
  userId: string
}

const { APP_ORIGIN } = commonEnv
const issuer = new URL(APP_ORIGIN).hostname
const secret = new TextEncoder().encode(`${authEnv.BETTER_AUTH_SECRET}:points-turnstile`)

export const POINTS_TURNSTILE_TTL_SECONDS = sec('2 minutes')

export async function signPointsTurnstileToken(userId: string): Promise<string> {
  const payload: PointsTurnstileTokenPayload = {
    userId,
    jti: crypto.randomUUID(),
  }

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: COOKIE_KEY.POINTS_TURNSTILE })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + POINTS_TURNSTILE_TTL_SECONDS)
    .sign(secret)
}

export async function verifyPointsTurnstileToken(token: string): Promise<{ userId: string; expiresAt: Date } | null> {
  try {
    const { payload } = await jwtVerify<PointsTurnstileTokenPayload>(token, secret, {
      algorithms: ['HS256'],
      issuer,
      typ: COOKIE_KEY.POINTS_TURNSTILE,
    })

    if (!payload.userId || !payload.exp) {
      return null
    }

    return {
      userId: payload.userId,
      expiresAt: new Date(payload.exp * 1000),
    }
  } catch {
    return null
  }
}
