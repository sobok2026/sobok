import { getAuthenticatorName, passkey } from '@better-auth/passkey'
import { redisStorage } from '@better-auth/redis-storage'
import { TURNSTILE_AUTH_ACTION } from '@sobok/contracts'
import { db } from '@sobok/db/app'
import * as authSchema from '@sobok/db/app/auth'
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

// 플러그인 구성(필드)을 바꾸면 `bun run generate`로 스키마를 재생성해주세요.
export const auth = betterAuth({
  appName: env.APP_NAME,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.AUTH_TRUSTED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
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
    maxPasswordLength: 64,
  },
  user: {
    additionalFields: {
      isAdult: {
        type: 'boolean',
        defaultValue: false,
        input: false,
      },
    },
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        await offboardUserBeforeDelete(user.id)
      },
    },
  },
  databaseHooks: {
    account: {
      create: {
        before: async (account, ctx) => {
          if (account.providerId !== BBATON_PROVIDER_ID || !account.accessToken) {
            return
          }

          const profile = await fetchBBatonProfile(account.accessToken)

          const verification = {
            bbatonUserId: profile.userId,
            adultFlag: profile.adult,
            birthYear: profile.birthYear,
            gender: profile.gender,
            income: profile.income,
            student: profile.student,
            verifiedAt: new Date(),
          }

          await db
            .insert(bbatonVerificationTable)
            .values({ userId: account.userId, ...verification })
            .onConflictDoUpdate({ target: [bbatonVerificationTable.userId], set: verification })

          const internalAdapter = ctx?.context.internalAdapter ?? (await auth.$context).internalAdapter
          await internalAdapter.updateUser(account.userId, { isAdult: profile.adult })

          // 쿠키 캐시는 링크 완료 응답에서 refreshSessionCookies로 재발급해야 한다.
        },
      },
    },
  },
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
      // 기본 보호 대상(sign-up/email·sign-in/email·request-password-reset)에는 sign-in/username이
      // 빠져 있다. 아이디 로그인도 브루트포스에 노출되지 않도록 명시적으로 포함한다.
      endpoints: ['/sign-up/email', '/sign-in/email', '/sign-in/username', '/request-password-reset'],
      // 이 둘을 빼면 플러그인이 action·hostname 검사를 통째로 건너뛴다(verify-handlers의 두 검사가 모두
      // 옵션 존재 여부로 가드돼 있다). 그 상태에서는 apps/web이 페이지 로드마다 자동 발급하는
      // origin-protection 토큰이 로그인·가입·비밀번호 재설정에 그대로 통한다.
      //
      // 이 플러그인은 expectedAction을 엔드포인트별로 못 받고 전체에 하나만 적용한다. 그래서 네 경로가
      // action 하나(TURNSTILE_AUTH_ACTION)를 공유하고, 위젯 쪽도 같은 값을 보내야 한다.
      expectedAction: TURNSTILE_AUTH_ACTION,
      // 위젯 domains에 apex를 넣으면 서브도메인이 자동 커버되므로, 실제 호스트 고정은 여기가 담당한다.
      allowedHostnames: [new URL(env.BETTER_AUTH_URL).hostname],
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
