import { auth } from '@sobok/auth/server'
import { headers } from 'next/headers'

import TwoFactorSettingsClient from './TwoFactorSettingsClient'

export default async function TwoFactorSettings() {
  const session = await auth.api.getSession({ headers: await headers() })

  return <TwoFactorSettingsClient initialEnabled={Boolean(session?.user.twoFactorEnabled)} />
}
