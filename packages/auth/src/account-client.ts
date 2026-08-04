import { oauthProviderClient } from '@better-auth/oauth-provider/client'
import { passkeyClient } from '@better-auth/passkey/client'
import {
  genericOAuthClient,
  inferAdditionalFields,
  magicLinkClient,
  oneTapClient,
  twoFactorClient,
  usernameClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import type { SobokAuthority } from './authority'
import type { SobokRelyingParty } from './relying-party'

export type SobokAccountClientOptions = {
  baseURL?: string
  googleClientId?: string
}

export function createSobokAccountClient(options: SobokAccountClientOptions = {}) {
  return createAuthClient({
    baseURL: options.baseURL,
    plugins: [
      inferAdditionalFields<SobokAuthority>(),
      usernameClient(),
      passkeyClient(),
      twoFactorClient(),
      magicLinkClient(),
      genericOAuthClient(),
      oauthProviderClient(),
      ...(options.googleClientId ? [oneTapClient({ clientId: options.googleClientId })] : []),
    ],
  })
}

export function createSobokRelyingPartyClient(options: { baseURL?: string } = {}) {
  return createAuthClient({
    baseURL: options.baseURL,
    plugins: [inferAdditionalFields<SobokRelyingParty>(), genericOAuthClient()],
  })
}
