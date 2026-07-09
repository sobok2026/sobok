import {
  type AuthCookieConfig,
  getAccessTokenCookieConfig,
  getAdultPassCookieConfigForAdult,
  getAuthHintCookieConfig,
  getRefreshSessionCookieConfig,
} from '@sobok/auth/cookie'
import type { SessionWriteExecutor } from '@sobok/auth/query/session'
import { hashSessionToken } from '@sobok/auth/session'
import { issuePersistentSession } from '@sobok/auth/session/persistent-session'
import { db } from '@sobok/db/app'
import { authSessionFamilyTable, authSessionTokenTable } from '@sobok/db/app/auth'
import { and, eq, isNull } from 'drizzle-orm'

type IssueAuthCookiesInput = {
  adult: boolean
  deviceLabel?: string | null
  remember: boolean
  tx?: SessionWriteExecutor
  userId: number
}

export const hashToken = hashSessionToken

export async function issueAuthCookies({
  userId,
  adult,
  remember,
  tx,
  deviceLabel,
}: IssueAuthCookiesInput): Promise<AuthCookieConfig[]> {
  const accessTokenCookie = await getAccessTokenCookieConfig({ userId, adult })
  const adultPassCookie = getAdultPassCookieConfigForAdult(adult)

  if (!remember) {
    const authHintCookie = getAuthHintCookieConfig()
    return [accessTokenCookie, authHintCookie, adultPassCookie]
  }

  const issuedSession = await issuePersistentSession(userId, deviceLabel, tx)
  const authHintCookie = getAuthHintCookieConfig({ maxAgeSeconds: issuedSession.maxAgeSeconds })

  const options = {
    token: issuedSession.token,
    maxAgeSeconds: issuedSession.maxAgeSeconds,
  }

  return [accessTokenCookie, getRefreshSessionCookieConfig(options), authHintCookie, adultPassCookie]
}

export async function revokeCurrentSessionByTokenHash(tokenHash: string, now: Date) {
  const [token] = await db
    .select({ familyId: authSessionTokenTable.familyId, userId: authSessionFamilyTable.userId })
    .from(authSessionTokenTable)
    .innerJoin(authSessionFamilyTable, eq(authSessionFamilyTable.id, authSessionTokenTable.familyId))
    .where(eq(authSessionTokenTable.tokenHash, tokenHash))

  if (!token) {
    return null
  }

  await db
    .update(authSessionFamilyTable)
    .set({ revokedAt: now, lastUsedAt: now })
    .where(and(eq(authSessionFamilyTable.id, token.familyId), isNull(authSessionFamilyTable.revokedAt)))

  return { userId: token.userId }
}
