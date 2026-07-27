import type { AssessmentProfile } from '@deep-type/model'
import { scoreRefinedAssessment } from '@deep-type/scoring'
import { Hono } from 'hono'
import { z } from 'zod'

import { openFresh, withDB } from '~/db/client'
import { getPurchaseResultByAccessToken, getRefinedProfile, persistRefinement } from '~/db/queries/result'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { RefinedWorkAnswersSchema, RefinementAnswersSchema } from '~/scoring/answer-schema'

import { requireAccessToken } from '../access'

// The forced-choice answers arrive whole — the free drain block included — because the refined tally spans all
// five dimensions and the free three have no column of their own yet.
const RefinementBody = z.object({ answers: RefinementAnswersSchema, workAnswers: RefinedWorkAnswersSchema })
const route = new Hono<AppEnv>()

route.post('/', requireAccessToken, async (c) => {
  const parsed = RefinementBody.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }

  return withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    const context = await getPurchaseResultByAccessToken(db, c.get('accessToken'))
    if (!context) {
      return problem(404, 'purchase-not-found')
    }
    if (context.status === 'refunded') {
      return problem(410, 'purchase-refunded')
    }
    if (context.status !== 'paid') {
      return problem(403, 'purchase-not-paid')
    }
    // Never echo the refined profile. It is paid content, and `viewed_at` is stamped only by `GET /report`
    // (report/GET.ts) — so returning it here hands the buyer the whole product on a request that leaves them
    // eligible for a full refund for a year, repeatably. Delivery happens on one path only.
    if (context.refinedProfile) {
      return c.json({ status: 'ok' as const })
    }

    let profile: AssessmentProfile
    try {
      profile = scoreRefinedAssessment(
        context.baseAnswers,
        parsed.data.answers,
        parsed.data.workAnswers,
        context.declaredPersona,
      )
    } catch {
      return problem(422, 'invalid-request')
    }

    const persisted = await persistRefinement(db, context.resultId, { answers: parsed.data.answers, profile })
    // A lost race is still a success for the caller, but only if a profile actually landed — the read confirms
    // the row the other writer persisted. The value stays server-side; see the comment above.
    const stableProfile = persisted ? profile : await getRefinedProfile(db, context.resultId)
    if (!stableProfile) {
      return problem(409, 'refinement-conflict')
    }
    return c.json({ status: 'ok' as const })
  })
})

export default route
