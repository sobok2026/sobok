import { getAuthenticatorName, passkey } from '@better-auth/passkey'
import { redisStorage } from '@better-auth/redis-storage'
import { db } from '@sobok/db/app'
import { bbatonVerificationTable } from '@sobok/db/app/bbaton'
import { env } from '@sobok/env/server.auth'
import { redis } from '@sobok/kv'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { betterAuth } from 'better-auth/minimal'
import { captcha, genericOAuth, oneTap, twoFactor, username } from 'better-auth/plugins'

import {
  BBATON_AUTHORIZATION_URL,
  BBATON_PROVIDER_ID,
  BBATON_SCOPES,
  BBATON_TOKEN_URL,
  fetchBBatonProfile,
} from './bbaton'
import { offboardUserBeforeDelete } from './delete-user'

// 인증 테이블 스키마는 packages/db/src/app/schema/auth.ts에 CLI로 생성합니다(수동 편집 금지).
// 플러그인 구성(필드)을 바꾸면 `bun run generate`로 스키마를 재생성한 뒤 push하세요.
export const auth = betterAuth({
  appName: env.APP_NAME,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.AUTH_TRUSTED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  secondaryStorage: redisStorage({
    client: redis,
  }),
  session: {
    storeSessionInDatabase: true,
    cookieCache: {
      enabled: true,
    },
  },
  rateLimit: {
    storage: 'secondary-storage',
  },
  emailAndPassword: {
    enabled: true,
  },
  // user: {
  //   additionalFields: {
  //     isAdult: {
  //       type: 'boolean',
  //       defaultValue: false,
  //       input: false,
  //     },
  //   },
  //   deleteUser: {
  //     enabled: true,
  //     beforeDelete: async (user) => {
  //       await offboardUserBeforeDelete(user.id)
  //     },
  //   },
  // },
  // databaseHooks: {
  //   account: {
  //     create: {
  //       // BBaton 계정 연결(link) 완료 시 성인인증 결과를 반영한다.
  //       after: async (account, ctx) => {
  //         if (account.providerId !== BBATON_PROVIDER_ID || !account.accessToken) {
  //           return
  //         }

  //         const profile = await fetchBBatonProfile(account.accessToken)
  //         const verification = {
  //           bbatonUserId: profile.userId,
  //           adultFlag: profile.adult,
  //           birthYear: profile.birthYear,
  //           gender: profile.gender,
  //           income: profile.income,
  //           student: profile.student,
  //           verifiedAt: new Date(),
  //         }

  //         await db
  //           .insert(bbatonVerificationTable)
  //           .values({ userId: account.userId, ...verification })
  //           .onConflictDoUpdate({ target: [bbatonVerificationTable.userId], set: verification })

  //         // internalAdapter로 갱신해야 secondaryStorage에 캐시된 세션 user까지 함께 반영된다.
  //         const internalAdapter = ctx?.context.internalAdapter ?? (await auth.$context).internalAdapter
  //         await internalAdapter.updateUser(account.userId, { isAdult: profile.adult })
  //       },
  //     },
  //   },
  // },
  plugins: [
    username({
      displayUsernameValidator: (displayUsername) => {
        const trimmed = displayUsername.trim()
        return trimmed.length >= 2 && trimmed.length <= 30
      },
    }),
    passkey({
      origin: env.PASSKEY_ORIGIN,
      rpID: env.PASSKEY_RP_ID,
      rpName: env.APP_NAME,
      registration: {
        afterVerification: async ({ verification }) => ({
          name: getAuthenticatorName(verification.registrationInfo?.aaguid),
        }),
        extensions: { credProps: true },
      },
      authentication: {
        extensions: { credProps: true },
      },
    }),
    twoFactor({
      allowPasswordless: true,
    }),
    oneTap(),
    captcha({
      provider: 'cloudflare-turnstile',
      secretKey: env.TURNSTILE_SECRET_KEY,
    }),
    genericOAuth({
      config: [
        {
          providerId: BBATON_PROVIDER_ID,
          clientId: env.BBATON_CLIENT_ID ?? '',
          clientSecret: env.BBATON_CLIENT_SECRET ?? '',
          authorizationUrl: BBATON_AUTHORIZATION_URL,
          tokenUrl: BBATON_TOKEN_URL,
          scopes: BBATON_SCOPES,
          authentication: 'basic',
          // BBaton은 성인인증 전용 — 로그인 수단이 아니므로 신규 가입은 차단하고 계정 연결만 허용한다.
          disableImplicitSignUp: true,
          getUserInfo: async (tokens) => {
            if (!tokens.accessToken) {
              return null
            }

            const profile = await fetchBBatonProfile(tokens.accessToken)

            return {
              id: profile.userId,
              emailVerified: false,
            }
          },
        },
      ],
    }),
  ],
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID &&
      env.GOOGLE_CLIENT_SECRET && {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }),
    ...(env.KAKAO_CLIENT_ID &&
      env.KAKAO_CLIENT_SECRET && {
        kakao: {
          clientId: env.KAKAO_CLIENT_ID,
          clientSecret: env.KAKAO_CLIENT_SECRET,
        },
      }),
  },
  telemetry: {
    enabled: false,
  },
})

export type Auth = typeof auth
export type Session = Auth['$Infer']['Session']
export type SessionUser = Session['user']
