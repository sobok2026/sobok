import { db } from '@sobok/db/app'
import { bbatonVerificationTable } from '@sobok/db/app/bbaton'
import { eq } from 'drizzle-orm'

import AdultVerificationSectionClient from './AdultVerificationSectionClient'

type Props = {
  userId: string
}

export default async function AdultVerificationSection({ userId }: Props) {
  const [verification] = await db
    .select({
      adultFlag: bbatonVerificationTable.adultFlag,
      verifiedAt: bbatonVerificationTable.verifiedAt,
    })
    .from(bbatonVerificationTable)
    .where(eq(bbatonVerificationTable.userId, userId))

  return <AdultVerificationSectionClient initialVerification={verification} />
}
