import { SOBOK_PSEUDONYMOUS_CLIENT_IP_HEADER } from '@sobok/auth/contracts'
import {
  createSobokRelyingParty,
  type SobokRelyingParty,
  type SobokRelyingPartySession,
} from '@sobok/auth/relying-party'
import { type Db, openDb } from '@sobok/edge/db/client'
import { withPseudonymousClientIp, withPseudonymousClientIpHeaders } from '@sobok/edge/ip'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getSessionCookie } from 'better-auth/cookies'
import type { Context } from 'hono'
import { stellaAccount, stellaAuthRateLimit, stellaSession, stellaUser, stellaVerification } from './db/schema/auth'
import type { AppEnv } from './env'

const authSchema = {
  user: stellaUser,
  session: stellaSession,
  account: stellaAccount,
  verification: stellaVerification,
  rateLimit: stellaAuthRateLimit,
}

const STELLA_AUTH_COOKIE_PREFIX = 'stella_auth'

export function hasStellaSessionCookie(request: Request): boolean {
  return getSessionCookie(request, { cookiePrefix: STELLA_AUTH_COOKIE_PREFIX }) !== null
}

async function authorityFor(
  c: Context<AppEnv>,
): Promise<{ auth: SobokRelyingParty; db: Db; ipHashSalt: string; close: () => void }> {
  const handle = openDb(c.env.HYPERDRIVE_FRESH)
  const [secret, clientSecret, ipHashSalt] = await Promise.all([
    c.env.STELLA_AUTH_SECRET.get(),
    c.env.STELLA_OIDC_CLIENT_SECRET.get(),
    c.env.STELLA_IP_HASH_SALT.get(),
  ])
  if (!secret || !clientSecret || !ipHashSalt) {
    c.executionCtx.waitUntil(handle.sql.end({ timeout: 5 }))
    throw new Error('Stella auth secrets are not configured')
  }

  const auth = createSobokRelyingParty({
    appName: 'Stella',
    database: drizzleAdapter(handle.db, { provider: 'pg', schema: authSchema }),
    baseURL: c.env.STELLA_PUBLIC_ORIGIN,
    secret,
    issuer: c.env.STELLA_ACCOUNTS_ISSUER,
    clientId: c.env.STELLA_OIDC_CLIENT_ID,
    clientSecret,
    cookiePrefix: STELLA_AUTH_COOKIE_PREFIX,
    trustedOrigins: [c.env.STELLA_PUBLIC_ORIGIN],
    defer: (promise) => c.executionCtx.waitUntil(promise),
  })

  return {
    auth,
    db: handle.db,
    ipHashSalt,
    close: () => c.executionCtx.waitUntil(handle.sql.end({ timeout: 5 })),
  }
}

export async function handleStellaAuth(c: Context<AppEnv>): Promise<Response> {
  const handle = await authorityFor(c)
  try {
    const request = await withPseudonymousClientIp(c.req.raw, handle.ipHashSalt, SOBOK_PSEUDONYMOUS_CLIENT_IP_HEADER)
    return await handle.auth.handler(request)
  } finally {
    handle.close()
  }
}

export async function withStellaSession<T>(
  c: Context<AppEnv>,
  run: (db: Db, session: SobokRelyingPartySession | null) => Promise<T>,
): Promise<T> {
  const handle = await authorityFor(c)
  try {
    const headers = await withPseudonymousClientIpHeaders(
      c.req.raw,
      handle.ipHashSalt,
      SOBOK_PSEUDONYMOUS_CLIENT_IP_HEADER,
    )
    const session = await handle.auth.api.getSession({ headers })
    return await run(handle.db, session)
  } finally {
    handle.close()
  }
}
