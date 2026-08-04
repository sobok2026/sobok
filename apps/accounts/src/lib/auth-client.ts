import { createSobokAccountClient } from '@sobok/auth/account-client'
import { GOOGLE_CLIENT_ID } from './public-env'

export const authClient = createSobokAccountClient({ googleClientId: GOOGLE_CLIENT_ID })
