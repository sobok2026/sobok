import {
  oauthProvider,
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from '@better-auth/oauth-provider'
import { getAuthenticatorName, passkey } from '@better-auth/passkey'
import type { BetterAuthOptions } from 'better-auth'
import { betterAuth } from 'better-auth/minimal'
import { captcha, genericOAuth, haveIBeenPwned, jwt, magicLink, oneTap, twoFactor, username } from 'better-auth/plugins'
import { z } from 'zod'
import {
  BBATON_AUTHORIZATION_URL,
  BBATON_PROVIDER_ID,
  BBATON_SCOPES,
  BBATON_TOKEN_URL,
  type BBatonProfile,
  fetchBBatonProfile,
} from './bbaton'
import {
  normalizeIssuer,
  SOBOK_ACCOUNT_TECHNICAL_NAME,
  SOBOK_AUTH_PATH,
  SOBOK_OIDC_SCOPES,
  SOBOK_PSEUDONYMOUS_CLIENT_IP_HEADER,
  SOBOK_USERNAME_PATTERN,
} from './contracts'

type Database = NonNullable<BetterAuthOptions['database']>

export const SobokAuthorityEmailSchema = z.object({
  kind: z.enum(['email-verification', 'magic-link', 'password-reset']),
  to: z.email(),
  url: z.url(),
  name: z.string().min(1).optional(),
})

export type SobokAuthorityEmail = z.infer<typeof SobokAuthorityEmailSchema>

export type SobokSocialProvider = {
  clientId: string
  clientSecret: string
}

export type SobokBbatonConfig = SobokSocialProvider & {
  onVerified: (input: { profile: BBatonProfile; userId: string }) => Promise<void>
}

export type SobokAuthorityOptions = {
  database: Database
  baseURL: string
  issuer: string
  secret: string
  trustedOrigins: string[]
  passkey: {
    rpID: string
    origin: string
  }
  turnstile: {
    secretKey: string
    allowedHostnames: string[]
    action: string
  }
  socialProviders?: {
    google?: SobokSocialProvider
    kakao?: SobokSocialProvider
  }
  bbaton?: SobokBbatonConfig
  firstPartyClientIds?: string[]
  sendEmail: (message: SobokAuthorityEmail) => Promise<void>
  defer: (promise: Promise<unknown>) => void
  beforeDeleteUser?: (userId: string) => Promise<void>
  oauthClientGenerators?: {
    clientId?: () => string
    clientSecret?: () => string
  }
}

export function createSobokAuthority(options: SobokAuthorityOptions) {
  const issuer = normalizeIssuer(options.issuer)
  const google = options.socialProviders?.google
  const kakao = options.socialProviders?.kakao

  return betterAuth({
    appName: SOBOK_ACCOUNT_TECHNICAL_NAME,
    baseURL: options.baseURL,
    basePath: SOBOK_AUTH_PATH,
    secret: options.secret,
    trustedOrigins: options.trustedOrigins,
    database: options.database,
    advanced: {
      cookiePrefix: 'sobok_accounts',
      useSecureCookies: new URL(options.baseURL).protocol === 'https:',
      ipAddress: {
        ipAddressHeaders: [SOBOK_PSEUDONYMOUS_CLIENT_IP_HEADER],
        ipv6Subnet: 128,
      },
      backgroundTasks: { handler: options.defer },
    },
    session: {
      storeSessionInDatabase: true,
      freshAge: 60 * 60,
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60,
      sendVerificationEmail: async ({ user, url }) => {
        options.defer(options.sendEmail({ kind: 'email-verification', to: user.email, name: user.name, url }))
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 64,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        options.defer(options.sendEmail({ kind: 'password-reset', to: user.email, name: user.name, url }))
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google'],
        // Different-email linking is still an authenticated, explicit account-setting action. BBaton has no
        // email at all, and Kakao may expose a different address; automatic same-email trust remains limited
        // to Google by `trustedProviders` above.
        allowDifferentEmails: true,
        allowUnlinkingAll: false,
        updateUserInfoOnLink: false,
      },
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
        enabled: Boolean(options.beforeDeleteUser),
        beforeDelete: options.beforeDeleteUser
          ? async (user) => {
              await options.beforeDeleteUser?.(user.id)
            }
          : undefined,
      },
    },
    databaseHooks: options.bbaton
      ? {
          account: {
            create: {
              before: async (account) => {
                if (account.providerId !== BBATON_PROVIDER_ID || !account.accessToken) {
                  return
                }
                const profile = await fetchBBatonProfile(account.accessToken)
                await options.bbaton?.onVerified({ profile, userId: account.userId })
              },
            },
          },
        }
      : undefined,
    plugins: [
      haveIBeenPwned(),
      username({
        minUsernameLength: 3,
        maxUsernameLength: 30,
        usernameValidator: (value) => SOBOK_USERNAME_PATTERN.test(value),
        usernameNormalization: (value) => value.toLowerCase(),
        displayUsernameValidator: (value) => {
          const trimmed = value.trim()
          return trimmed.length >= 2 && trimmed.length <= 30
        },
      }),
      passkey({
        rpID: options.passkey.rpID,
        origin: options.passkey.origin,
        rpName: SOBOK_ACCOUNT_TECHNICAL_NAME,
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
        issuer: SOBOK_ACCOUNT_TECHNICAL_NAME,
        allowPasswordless: true,
      }),
      magicLink({
        expiresIn: 60 * 5,
        storeToken: 'hashed',
        sendMagicLink: async ({ email, url }) => {
          options.defer(options.sendEmail({ kind: 'magic-link', to: email, url }))
        },
      }),
      ...(google ? [oneTap()] : []),
      captcha({
        provider: 'cloudflare-turnstile',
        secretKey: options.turnstile.secretKey,
        allowedHostnames: options.turnstile.allowedHostnames,
        expectedAction: options.turnstile.action,
        endpoints: [
          '/sign-up/email',
          '/sign-in/email',
          '/sign-in/username',
          '/sign-in/magic-link',
          '/request-password-reset',
          '/send-verification-email',
        ],
      }),
      ...(options.bbaton
        ? [
            genericOAuth({
              config: [
                {
                  providerId: BBATON_PROVIDER_ID,
                  clientId: options.bbaton.clientId,
                  clientSecret: options.bbaton.clientSecret,
                  authorizationUrl: BBATON_AUTHORIZATION_URL,
                  tokenUrl: BBATON_TOKEN_URL,
                  scopes: BBATON_SCOPES,
                  authentication: 'basic',
                  disableImplicitSignUp: true,
                  getUserInfo: async (tokens) => {
                    if (!tokens.accessToken) {
                      return null
                    }
                    const profile = await fetchBBatonProfile(tokens.accessToken)
                    return { id: profile.userId, emailVerified: false }
                  },
                },
              ],
            }),
          ]
        : []),
      jwt({
        disableSettingJwtHeader: true,
        jwt: { issuer, audience: issuer },
        jwks: { rotationInterval: 60 * 60 * 24 * 30, gracePeriod: 60 * 60 * 24 * 30 },
      }),
      oauthProvider({
        loginPage: '/sign-in',
        consentPage: '/consent',
        signup: { page: '/sign-up' },
        postLogin: {
          page: '/complete-profile',
          consentReferenceId: () => undefined,
          shouldRedirect: ({ user }) => typeof user.username !== 'string' || user.username.length === 0,
        },
        scopes: [...SOBOK_OIDC_SCOPES],
        advertisedMetadata: {
          scopes_supported: [...SOBOK_OIDC_SCOPES],
        },
        grantTypes: ['authorization_code'],
        allowDynamicClientRegistration: false,
        allowUnauthenticatedClientRegistration: false,
        cachedTrustedClients: new Set(options.firstPartyClientIds ?? []),
        generateClientId: options.oauthClientGenerators?.clientId,
        generateClientSecret: options.oauthClientGenerators?.clientSecret,
        prefix: {
          clientSecret: 'sobok_cs_',
          opaqueAccessToken: 'sobok_at_',
        },
        customIdTokenClaims: ({ scopes, user }) =>
          scopes.includes('profile') && typeof user.username === 'string'
            ? { 'https://sobok.cc/claims/username': user.username }
            : {},
        customUserInfoClaims: ({ scopes, user }) =>
          scopes.includes('profile') && typeof user.username === 'string'
            ? { 'https://sobok.cc/claims/username': user.username }
            : {},
      }),
    ],
    socialProviders: {
      ...(google ? { google } : {}),
      ...(kakao ? { kakao } : {}),
    },
    telemetry: { enabled: false },
  })
}

export type SobokAuthority = ReturnType<typeof createSobokAuthority>
export type SobokAuthoritySession = SobokAuthority['$Infer']['Session']

export function sobokOpenIdConfiguration(auth: SobokAuthority, request: Request): Promise<Response> {
  return oauthProviderOpenIdConfigMetadata(auth)(request)
}

export function sobokAuthorizationServerMetadata(auth: SobokAuthority, request: Request): Promise<Response> {
  return oauthProviderAuthServerMetadata(auth)(request)
}
