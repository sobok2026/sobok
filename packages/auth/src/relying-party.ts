import type { BetterAuthOptions } from 'better-auth'
import { betterAuth } from 'better-auth/minimal'
import { genericOAuth } from 'better-auth/plugins'

import {
  normalizeIssuer,
  SOBOK_AUTH_PATH,
  SOBOK_OIDC_PROVIDER_ID,
  SOBOK_OIDC_SCOPES,
  SOBOK_PSEUDONYMOUS_CLIENT_IP_HEADER,
  sobokDiscoveryUrl,
} from './contracts'

type Database = NonNullable<BetterAuthOptions['database']>

export type SobokRelyingPartyOptions = {
  appName: string
  database: Database
  baseURL: string
  secret: string
  issuer: string
  clientId: string
  clientSecret: string
  cookiePrefix: string
  trustedOrigins: string[]
  defer: (promise: Promise<unknown>) => void
}

export function createSobokRelyingParty(options: SobokRelyingPartyOptions) {
  const issuer = normalizeIssuer(options.issuer)

  return betterAuth({
    appName: options.appName,
    baseURL: options.baseURL,
    basePath: SOBOK_AUTH_PATH,
    secret: options.secret,
    trustedOrigins: options.trustedOrigins,
    database: options.database,
    advanced: {
      cookiePrefix: options.cookiePrefix,
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
    account: {
      accountLinking: { enabled: false },
    },
    user: {
      additionalFields: {
        issuer: { type: 'string', required: true, input: false },
        subject: { type: 'string', required: true, input: false },
      },
    },
    plugins: [
      genericOAuth({
        config: [
          {
            providerId: SOBOK_OIDC_PROVIDER_ID,
            issuer,
            requireIssuerValidation: true,
            discoveryUrl: sobokDiscoveryUrl(issuer),
            clientId: options.clientId,
            clientSecret: options.clientSecret,
            scopes: [...SOBOK_OIDC_SCOPES],
            pkce: true,
            authentication: 'basic',
            mapProfileToUser: (profile) => {
              if (typeof profile.sub !== 'string' || profile.sub.length === 0) {
                throw new Error('Sobok OIDC userinfo is missing sub')
              }
              return {
                issuer,
                subject: profile.sub,
                name: typeof profile.name === 'string' && profile.name ? profile.name : 'Sobok user',
                image: typeof profile.picture === 'string' ? profile.picture : null,
              }
            },
          },
        ],
      }),
    ],
    telemetry: { enabled: false },
  })
}

export type SobokRelyingParty = ReturnType<typeof createSobokRelyingParty>
export type SobokRelyingPartySession = SobokRelyingParty['$Infer']['Session']
