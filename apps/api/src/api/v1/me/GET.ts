import { AdultVerificationStatus, type GETV1MeResponse } from '@sobok/contracts'
import { db } from '@sobok/db/app'
import { user } from '@sobok/db/app/auth'
import { bbatonVerificationTable } from '@sobok/db/app/bbaton'
import { userSettingsTable } from '@sobok/db/app/user'
import { resolveUserSettings } from '@sobok/domain/utils/user-settings'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { isAdultVerificationRequiredForRequest } from '@/utils/adult-gate'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'

const route = new Hono<Env>()

route.get('/', async (c) => {
  const userId = c.get('user')!.id

  try {
    const [me] = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        displayUsername: user.displayUsername,
        image: user.image,
        adultFlag: bbatonVerificationTable.adultFlag,
        historySyncEnabled: userSettingsTable.historySyncEnabled,
        adultVerifiedAdVisible: userSettingsTable.adultVerifiedAdVisible,
        defaultCensorshipEnabled: userSettingsTable.defaultCensorshipEnabled,
        searchLanguage: userSettingsTable.searchLanguage,
        autoDeletionDay: userSettingsTable.autoDeletionDay,
      })
      .from(user)
      .leftJoin(bbatonVerificationTable, eq(bbatonVerificationTable.userId, user.id))
      .leftJoin(userSettingsTable, eq(userSettingsTable.userId, user.id))
      .where(eq(user.id, userId))

    if (!me) {
      return problemResponse(c, { status: 404, detail: '사용자 정보를 찾을 수 없어요' })
    }

    const required = isAdultVerificationRequiredForRequest(c)
    const status = getAdultStatus(me.adultFlag)

    const settings = resolveUserSettings({
      historySyncEnabled: me.historySyncEnabled ?? undefined,
      adultVerifiedAdVisible: me.adultVerifiedAdVisible ?? undefined,
      defaultCensorshipEnabled: me.defaultCensorshipEnabled ?? undefined,
      searchLanguage: me.searchLanguage ?? undefined,
      autoDeletionDay: me.autoDeletionDay ?? undefined,
    })

    const result = {
      id: me.id,
      email: me.email,
      name: me.name,
      username: me.username,
      displayUsername: me.displayUsername,
      image: me.image,
      adultVerification: { required, status },
      settings,
    } satisfies GETV1MeResponse

    return c.json(result, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route

function getAdultStatus(adultFlag: boolean | null) {
  switch (adultFlag) {
    case false:
      return AdultVerificationStatus.NOT_ADULT
    case true:
      return AdultVerificationStatus.ADULT
    default:
      return AdultVerificationStatus.UNVERIFIED
  }
}
