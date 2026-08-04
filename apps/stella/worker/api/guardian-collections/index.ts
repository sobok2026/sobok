import { sha256Hex } from '@sobok/edge/tokens'
import { Hono } from 'hono'
import { z } from 'zod'
import { withStellaSession } from '~/auth'
import { claimGuardianCollection, listOwnedGuardianReports } from '~/db/queries/guardian'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import {
  GuardianAccessTokenSchema,
  GuardianCollectionPublicIdSchema,
  GuardianReportPublicIdSchema,
} from '~/guardian/http'
import { NO_STORE_HEADERS, parseJson } from '~/lib/http'
import { bearerToken } from '~/lib/request'

const BODY_LIMIT_BYTES = 1024
const ClaimBody = z.object({ reportPublicId: GuardianReportPublicIdSchema }).strict()

export const guardianCollections = new Hono<AppEnv>()

guardianCollections.get('/', async (c) => {
  const items = await withStellaSession(c, (db, session) => {
    if (!session) return Promise.resolve(null)
    return listOwnedGuardianReports(db, { ownerUserId: session.user.id, limit: 48 })
  })
  if (!items) return problem(401, 'forbidden')
  return c.json(
    {
      items: items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    },
    200,
    NO_STORE_HEADERS,
  )
})

guardianCollections.post('/:collectionPublicId/claim', async (c) => {
  const collectionPublicId = GuardianCollectionPublicIdSchema.safeParse(c.req.param('collectionPublicId'))
  const accessToken = GuardianAccessTokenSchema.safeParse(bearerToken(c))
  const rawBody = await c.req.text()
  if (new TextEncoder().encode(rawBody).byteLength > BODY_LIMIT_BYTES) {
    return problem(413, 'payload-too-large')
  }
  const body = ClaimBody.safeParse(parseJson(rawBody))
  if (!collectionPublicId.success || !accessToken.success || !body.success) {
    return problem(422, 'invalid-request')
  }

  const accessTokenHash = await sha256Hex(accessToken.data)
  const result = await withStellaSession(c, (db, session) => {
    if (!session) return Promise.resolve(null)
    return claimGuardianCollection(db, {
      collectionPublicId: collectionPublicId.data,
      reportPublicId: body.data.reportPublicId,
      accessTokenHash,
      ownerUserId: session.user.id,
    })
  })
  if (!result) return problem(403, 'forbidden')
  if (result.status === 'forbidden') {
    return problem(403, 'forbidden')
  }
  if (result.status === 'report-not-found') {
    return problem(404, 'report-not-found')
  }
  return c.json(
    {
      status: result.status,
      reward: result.reward,
      guestAccessRevoked: true,
    },
    200,
    NO_STORE_HEADERS,
  )
})
