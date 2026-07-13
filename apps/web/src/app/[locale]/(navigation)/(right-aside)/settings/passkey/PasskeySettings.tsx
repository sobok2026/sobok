import { db } from '@sobok/db/app'
import { passkey } from '@sobok/db/app/auth'
import { desc, eq } from 'drizzle-orm'

import PasskeyList from './PasskeyList'

type Props = {
  userId: string
}

export default async function PasskeySettings({ userId }: Props) {
  const passkeys = await db
    .select({
      id: passkey.id,
      credentialId: passkey.credentialID,
      name: passkey.name,
      createdAt: passkey.createdAt,
      deviceType: passkey.deviceType,
      transports: passkey.transports,
    })
    .from(passkey)
    .where(eq(passkey.userId, userId))
    .orderBy(desc(passkey.createdAt))

  return <PasskeyList passkeys={passkeys} />
}
