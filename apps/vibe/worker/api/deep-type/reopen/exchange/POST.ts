import { openDb, withDb } from '@sobok/edge/db/client'
import { sha256Hex } from '@sobok/edge/tokens'
import { Hono } from 'hono'
import { z } from 'zod'
import { consumeReopenLink } from '~/db/queries/reopen'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'

const ExchangeBody = z.object({ token: z.string().length(43) })

const route = new Hono<AppEnv>()

route.post('/', async (c) => {
  const parsed = ExchangeBody.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }

  const tokenHash = await sha256Hex(parsed.data.token)
  const reopened = await withDb(openDb(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
    consumeReopenLink(db, tokenHash, new Date()),
  )

  if (!reopened) {
    return problem(410, 'reopen-link-invalid')
  }

  c.header('cache-control', 'no-store')
  return c.json({
    accessToken: reopened.accessToken,
    accessExpiresAt: reopened.accessExpiresAt.toISOString(),
    locale: reopened.locale,
    paymentId: reopened.paymentId,
    refinementRequired: reopened.refinementRequired,
    status: 'ok',
  })
})

export default route
