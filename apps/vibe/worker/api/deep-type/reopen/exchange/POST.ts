import { Hono } from 'hono'
import { z } from 'zod'

import { openFresh, withDB } from '~/db/client'
import { consumeReopenLink } from '~/db/queries/reopen'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { sha256Hex } from '~/lib/tokens'

const ExchangeBody = z.object({ token: z.string().length(43) })

const route = new Hono<AppEnv>()

route.post('/', async (c) => {
  const parsed = ExchangeBody.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }

  const tokenHash = await sha256Hex(parsed.data.token)
  const reopened = await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
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
    refinementRequired: reopened.refinementRequired,
    status: 'ok',
  })
})

export default route
