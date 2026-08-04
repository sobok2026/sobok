import {
  createSobokAuthority,
  type SobokAuthority,
  sobokAuthorizationServerMetadata,
  sobokOpenIdConfiguration,
} from '@sobok/auth/authority'
import { openDb } from '@sobok/edge/db/client'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import * as authSchema from './db/schema'
import { bbatonVerification, user } from './db/schema'
import type { AppEnv } from './env'
import { accountRuntimeConfig } from './lib/config'

type AuthorityHandle = {
  auth: SobokAuthority
  close: () => void
}

async function requiredSecret(binding: SecretsStoreSecret, name: string): Promise<string> {
  const value = await binding.get()
  if (!value) {
    throw new Error(`${name} is empty`)
  }
  return value
}

async function createAuthority(c: Context<AppEnv>): Promise<AuthorityHandle> {
  const config = accountRuntimeConfig(c.env)
  const handle = openDb(c.env.HYPERDRIVE)
  const [secret, turnstileSecret, googleSecret, kakaoSecret, bbatonSecret] = await Promise.all([
    requiredSecret(c.env.ACCOUNTS_AUTH_SECRET, 'ACCOUNTS_AUTH_SECRET'),
    requiredSecret(c.env.ACCOUNTS_TURNSTILE_SECRET, 'ACCOUNTS_TURNSTILE_SECRET'),
    requiredSecret(c.env.ACCOUNTS_GOOGLE_CLIENT_SECRET, 'ACCOUNTS_GOOGLE_CLIENT_SECRET'),
    requiredSecret(c.env.ACCOUNTS_KAKAO_CLIENT_SECRET, 'ACCOUNTS_KAKAO_CLIENT_SECRET'),
    requiredSecret(c.env.ACCOUNTS_BBATON_CLIENT_SECRET, 'ACCOUNTS_BBATON_CLIENT_SECRET'),
  ])

  const auth = createSobokAuthority({
    database: drizzleAdapter(handle.db, { provider: 'pg', schema: authSchema }),
    baseURL: config.origin,
    issuer: config.origin,
    secret,
    trustedOrigins: [config.origin],
    passkey: {
      rpID: new URL(config.origin).hostname,
      origin: config.origin,
    },
    turnstile: {
      secretKey: turnstileSecret,
      allowedHostnames: config.allowedHostnames,
      action: config.turnstileAction,
    },
    socialProviders: {
      google: { clientId: c.env.ACCOUNTS_GOOGLE_CLIENT_ID, clientSecret: googleSecret },
      kakao: { clientId: c.env.ACCOUNTS_KAKAO_CLIENT_ID, clientSecret: kakaoSecret },
    },
    bbaton: {
      clientId: c.env.ACCOUNTS_BBATON_CLIENT_ID,
      clientSecret: bbatonSecret,
      onVerified: async ({ profile, userId }) => {
        await handle.db.transaction(async (tx) => {
          await tx
            .insert(bbatonVerification)
            .values({
              userId,
              bbatonUserId: profile.userId,
              adultFlag: profile.adult,
              verifiedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: bbatonVerification.userId,
              set: {
                bbatonUserId: profile.userId,
                adultFlag: profile.adult,
                verifiedAt: new Date(),
              },
            })
          await tx.update(user).set({ isAdult: profile.adult }).where(eq(user.id, userId))
        })
      },
    },
    firstPartyClientIds: config.firstPartyClientIds,
    sendEmail: async (message) => {
      await c.env.ACCOUNTS_EMAIL_QUEUE.send(message)
    },
    defer: (promise) => c.executionCtx.waitUntil(promise),
  })

  return {
    auth,
    close: () => c.executionCtx.waitUntil(handle.sql.end({ timeout: 5 })),
  }
}

async function withAuthority(c: Context<AppEnv>, run: (auth: SobokAuthority) => Promise<Response>): Promise<Response> {
  const handle = await createAuthority(c)
  try {
    return await run(handle.auth)
  } finally {
    handle.close()
  }
}

export function handleAuth(c: Context<AppEnv>): Promise<Response> {
  return withAuthority(c, (auth) => auth.handler(c.req.raw))
}

export function handleOpenIdConfiguration(c: Context<AppEnv>): Promise<Response> {
  return withAuthority(c, (auth) => sobokOpenIdConfiguration(auth, c.req.raw))
}

export function handleAuthorizationServerMetadata(c: Context<AppEnv>): Promise<Response> {
  return withAuthority(c, (auth) => sobokAuthorizationServerMetadata(auth, c.req.raw))
}
