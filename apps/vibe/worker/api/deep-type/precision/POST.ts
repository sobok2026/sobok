import { Hono } from 'hono'
import { z } from 'zod'

import { openFresh, withDb } from '~/db/client'
import { getPurchaseResultByAccessToken, persistPrecision } from '~/db/queries/result'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { refineAxes, resolvePrecisionResponses } from '~/scoring/precision'

import { requireAccessToken } from '../access'

// Phase 5: precision submit (server-authoritative re-scoring).
const PrecisionBody = z.object({
  answers: z
    .array(
      z.union([
        z.object({
          kind: z.literal('choice'),
          itemId: z.string().min(1).max(48),
          optionIndex: z.number().int().min(0).max(15),
        }),
        z.object({
          kind: z.literal('scale'),
          itemId: z.string().min(1).max(48),
          value: z.number().min(0).max(100),
        }),
      ]),
    )
    .min(1)
    .max(60),
})

const route = new Hono<AppEnv>()

// The paid 24Q land here AFTER payment (funnel: checkout → verify → precision → report/generate). The
// client's answers are re-scored on the server against the known bank — its computed strengths are never
// trusted — and the refined axis strengths + contested axes are persisted for the report to narrate.
route.post('/', requireAccessToken, async (c) => {
  const parsed = PrecisionBody.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }

  return withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    const ctx = await getPurchaseResultByAccessToken(db, c.get('accessToken'))

    if (!ctx) {
      return problem(404, 'purchase-not-found')
    }

    if (ctx.status === 'refunded') {
      return problem(410, 'purchase-refunded')
    }

    if (ctx.status !== 'paid') {
      return problem(403, 'purchase-not-paid')
    }

    const responses = resolvePrecisionResponses(parsed.data.answers)

    if (responses.length === 0) {
      return problem(422, 'invalid-request')
    }

    const refined = refineAxes(responses, ctx.innerType, ctx.gem)

    await persistPrecision(db, ctx.resultId, {
      precisionAnswers: parsed.data.answers,
      axisStrengths: refined.strengths,
      profile: { contested: refined.contested },
    })

    return c.json({ status: 'ok' })
  })
})

export default route
