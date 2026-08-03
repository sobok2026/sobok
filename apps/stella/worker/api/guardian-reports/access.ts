import { type Db, openDb, withDb } from '@sobok/edge/db/client'
import { sha256Hex } from '@sobok/edge/tokens'
import type { Context } from 'hono'
import { resolveGuardianReportAccess } from '~/db/queries/guardian'
import type { AppEnv } from '~/env'
import { GuardianAccessTokenSchema, GuardianReportPublicIdSchema } from '~/guardian/http'
import { bearerToken } from '~/lib/request'

export async function withAuthorizedGuardianReport<T>(
  c: Context<AppEnv>,
  fn: (db: Db, access: { collectionId: number; reportId: number }) => Promise<T>,
): Promise<{ authorized: true; result: T } | { authorized: false }> {
  const reportPublicId = GuardianReportPublicIdSchema.safeParse(c.req.param('reportPublicId'))
  const token = GuardianAccessTokenSchema.safeParse(bearerToken(c))
  if (!reportPublicId.success || !token.success) {
    return { authorized: false }
  }

  const accessTokenHash = await sha256Hex(token.data)
  return withDb(openDb(c.env.HYPERDRIVE), c.executionCtx, async (db) => {
    const access = await resolveGuardianReportAccess(db, { accessTokenHash, reportPublicId: reportPublicId.data })
    if (!access) {
      return { authorized: false as const }
    }
    return { authorized: true as const, result: await fn(db, access) }
  })
}
