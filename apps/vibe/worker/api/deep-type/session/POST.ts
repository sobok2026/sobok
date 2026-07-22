import { Hono } from 'hono'
import { z } from 'zod'

import { openFresh, withDb } from '~/db/client'
import { insertResult } from '~/db/queries/result'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { randomToken } from '~/lib/tokens'

// Phase 2: free result persistence.
const SessionBody = z.object({
  locale: z.enum(['ko', 'en', 'ja', 'zh']).default('ko'),
  selfClaim: z.string().max(4).optional(),
  persona: z.string().length(4),
  innerType: z.string().length(4),
  gem: z.string().length(4),
  baseAnswers: z.array(z.unknown()).max(500),
  innerAnswers: z.array(z.unknown()).max(500),
  gemAnswers: z.array(z.unknown()).max(500),
})

const route = new Hono<AppEnv>()

route.post('/', async (c) => {
  if (Number(c.req.header('content-length') ?? 0) > 32 * 1024) {
    return problem(413, 'payload-too-large')
  }

  const parsed = SessionBody.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }

  const resultToken = randomToken()
  await withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
    insertResult(db, { ...parsed.data, resultToken }),
  )

  return c.json({ resultToken }, 201)
})

export default route
