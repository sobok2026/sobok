import { db } from '@sobok/db/app'
import { user } from '@sobok/db/app/auth'
import { userSettingsTable } from '@sobok/db/app/user'
import { resolveUserSettings, type UserSettings } from '@sobok/domain/utils/user-settings'
import { eq } from 'drizzle-orm'

export async function readUserSettings(userId: string): Promise<UserSettings> {
  const [row] = await db
    .select({
      historySyncEnabled: userSettingsTable.historySyncEnabled,
      adultVerifiedAdVisible: userSettingsTable.adultVerifiedAdVisible,
      defaultCensorshipEnabled: userSettingsTable.defaultCensorshipEnabled,
      searchLanguage: userSettingsTable.searchLanguage,
      autoDeletionDay: userSettingsTable.autoDeletionDay,
    })
    .from(user)
    .leftJoin(userSettingsTable, eq(userSettingsTable.userId, user.id))
    .where(eq(user.id, userId))

  if (!row) {
    return resolveUserSettings()
  }

  return resolveUserSettings({
    historySyncEnabled: row.historySyncEnabled ?? undefined,
    adultVerifiedAdVisible: row.adultVerifiedAdVisible ?? undefined,
    defaultCensorshipEnabled: row.defaultCensorshipEnabled ?? undefined,
    searchLanguage: row.searchLanguage ?? undefined,
    autoDeletionDay: row.autoDeletionDay ?? undefined,
  })
}
