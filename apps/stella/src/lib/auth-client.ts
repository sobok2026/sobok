'use client'

import { createSobokRelyingPartyClient } from '@sobok/auth/account-client'

// Stella owns only its host-local relying-party session. Authentication methods and the central account
// session stay on accounts.sobok.cc and are reached through the `sobok` OIDC provider.
export const stellaAuthClient = createSobokRelyingPartyClient()
