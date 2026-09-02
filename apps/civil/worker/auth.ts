import { SOBOK_PSEUDONYMOUS_CLIENT_IP_HEADER } from '@sobok/auth/contracts'
import {
  createSobokRelyingParty,
  type SobokRelyingParty,
  type SobokRelyingPartySession,
} from '@sobok/auth/relying-party'
import { type Db, openDb } from '@sobok/edge/db/client'
import { withPseudonymousClientIp, withPseudonymousClientIpHeaders } from '@sobok/edge/ip'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { Context } from 'hono'
import { civilAccount, civilAuthRateLimit, civilSession, civilUser, civilVerification } from './db/schema/auth'
import type { AppEnv } from './env'

const authSchema = {
  user: civilUser,
  session: civilSession,
  account: civilAccount,
  verification: civilVerification,
  rateLimit: civilAuthRateLimit,
}

const CIVIL_AUTH_COOKIE_PREFIX = 'civil_auth'

async function authorityFor(
  c: Context<AppEnv>,
): Promise<{ auth: SobokRelyingParty; db: Db; ipHashSalt: string; close: () => void }> {
  const handle = openDb(c.env.HYPERDRIVE_FRESH)
  const [secret, clientSecret, ipHashSalt] = await Promise.all([
    c.env.CIVIL_AUTH_SECRET.get(),
    c.env.CIVIL_OIDC_CLIENT_SECRET.get(),
    c.env.CIVIL_IP_HASH_SALT.get(),
  ])
  if (!secret || !clientSecret || !ipHashSalt) {
    c.executionCtx.waitUntil(handle.sql.end({ timeout: 5 }))
    throw new Error('Civil auth secrets are not configured')
  }

  const auth = createSobokRelyingParty({
    appName: 'Civil',
    database: drizzleAdapter(handle.db, { provider: 'pg', schema: authSchema }),
    baseURL: c.env.CIVIL_PUBLIC_ORIGIN,
    errorURL: `${c.env.CIVIL_PUBLIC_ORIGIN}/auth/error`,
    secret,
    issuer: c.env.CIVIL_ACCOUNTS_ISSUER,
    clientId: c.env.CIVIL_OIDC_CLIENT_ID,
    clientSecret,
    cookiePrefix: CIVIL_AUTH_COOKIE_PREFIX,
    trustedOrigins: [c.env.CIVIL_PUBLIC_ORIGIN],
    defer: (promise) => c.executionCtx.waitUntil(promise),
  })

  return {
    auth,
    db: handle.db,
    ipHashSalt,
    close: () => c.executionCtx.waitUntil(handle.sql.end({ timeout: 5 })),
  }
}

export async function handleCivilAuth(c: Context<AppEnv>): Promise<Response> {
  const handle = await authorityFor(c)
  try {
    const request = await withPseudonymousClientIp(c.req.raw, handle.ipHashSalt, SOBOK_PSEUDONYMOUS_CLIENT_IP_HEADER)
    return await handle.auth.handler(request)
  } finally {
    handle.close()
  }
}

export async function withCivilSession<T>(
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
