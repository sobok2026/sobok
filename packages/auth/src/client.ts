import { passkeyClient } from '@better-auth/passkey/client'
import { env } from '@sobok/env/client'
import {
  genericOAuthClient,
  inferAdditionalFields,
  oneTapClient,
  twoFactorClient,
  usernameClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import type { Auth } from './auth'

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<Auth>(),
    usernameClient(),
    passkeyClient(),
    twoFactorClient(),
    genericOAuthClient(),
    oneTapClient({
      clientId: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    }),
  ],
})
