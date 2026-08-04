import {
  createSobokRelyingParty,
  type SobokRelyingParty,
  type SobokRelyingPartySession,
} from '@sobok/auth/relying-party'
import { type Db, openDb } from '@sobok/edge/db/client'
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

async function authorityFor(c: Context<AppEnv>): Promise<{ auth: SobokRelyingParty; db: Db; close: () => void }> {
  const handle = openDb(c.env.HYPERDRIVE)
  const [secret, clientSecret] = await Promise.all([
    c.env.STELLA_AUTH_SECRET.get(),
    c.env.STELLA_OIDC_CLIENT_SECRET.get(),
  ])
  if (!secret || !clientSecret) {
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
    close: () => c.executionCtx.waitUntil(handle.sql.end({ timeout: 5 })),
  }
}

export async function handleStellaAuth(c: Context<AppEnv>): Promise<Response> {
  const handle = await authorityFor(c)
  try {
    return await handle.auth.handler(c.req.raw)
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
    const session = await handle.auth.api.getSession({ headers: c.req.raw.headers })
    return await run(handle.db, session)
  } finally {
    handle.close()
  }
}
