import { type Db, openDb, withDb } from '@sobok/edge/db/client'
import { sha256Hex } from '@sobok/edge/tokens'
import { hasStellaSessionCookie, withStellaSession } from '@stella-worker/auth'
import { resolveGuardianReportAccess } from '@stella-worker/db/queries/guardian'
import type { AppEnv } from '@stella-worker/env'
import { GuardianAccessTokenSchema, GuardianReportPublicIdSchema } from '@stella-worker/guardian/http'
import { bearerToken } from '@stella-worker/lib/request'
import type { Context } from 'hono'

export async function withAuthorizedGuardianReport<T>(
  c: Context<AppEnv>,
  fn: (db: Db, access: { collectionId: number; reportId: number }) => Promise<T>,
): Promise<{ authorized: true; result: T } | { authorized: false }> {
  const reportPublicId = GuardianReportPublicIdSchema.safeParse(c.req.param('reportPublicId'))
  const token = GuardianAccessTokenSchema.safeParse(bearerToken(c))
  if (!reportPublicId.success) {
    return { authorized: false }
  }
  const parsedReportPublicId = reportPublicId.data

  const accessTokenHash = token.success ? await sha256Hex(token.data) : undefined
  if (accessTokenHash && !hasStellaSessionCookie(c.req.raw)) {
    return withDb(openDb(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) => resolveAndRun(db, accessTokenHash))
  }
  return withStellaSession(c, async (db, session) => {
    if (!session && !accessTokenHash) {
      return { authorized: false as const }
    }
    return resolveAndRun(db, accessTokenHash, session?.user.id)
  })

  async function resolveAndRun(db: Db, tokenHash?: string, ownerUserId?: string) {
    const access = await resolveGuardianReportAccess(db, {
      accessTokenHash: tokenHash,
      ownerUserId,
      reportPublicId: parsedReportPublicId,
    })
    if (!access) {
      return { authorized: false as const }
    }
    return { authorized: true as const, result: await fn(db, access) }
  }
}
