import type { AssessmentProfile } from '@deep-type/model'
import { scoreRefinedAssessment } from '@deep-type/scoring'
import { Hono } from 'hono'
import { z } from 'zod'

import { openFresh, withDB } from '~/db/client'
import { getPurchaseResultByAccessToken, getRefinedProfile, persistRefinement } from '~/db/queries/result'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { RefinementAnswersSchema } from '~/scoring/answer-schema'

import { requireAccessToken } from '../access'

const RefinementBody = z.object({ answers: RefinementAnswersSchema })
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
    if (context.refinedProfile) {
      return c.json({ profile: context.refinedProfile, status: 'ok' as const })
    }

    let profile: AssessmentProfile
    try {
      profile = scoreRefinedAssessment(context.baseAnswers, parsed.data.answers)
    } catch {
      return problem(422, 'invalid-request')
    }

    const persisted = await persistRefinement(db, context.resultId, { answers: parsed.data.answers, profile })
    const stableProfile = persisted ? profile : await getRefinedProfile(db, context.resultId)
    if (!stableProfile) {
      return problem(409, 'refinement-conflict')
    }
    return c.json({ profile: stableProfile, status: 'ok' as const })
  })
})

export default route
