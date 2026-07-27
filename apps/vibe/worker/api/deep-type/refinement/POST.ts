import type { AssessmentProfile } from '@deep-type/model'
import { PAID_WORK_ITEMS } from '@deep-type/questionnaire'
import { scoreRefinedAssessment } from '@deep-type/scoring'
import { Hono } from 'hono'
import { z } from 'zod'

import { openFresh, withDB } from '~/db/client'
import { getRefinedProfile, persistRefinement } from '~/db/queries/result'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { RefinedWorkAnswersSchema, RefinementAnswersSchema } from '~/scoring/answer-schema'

import { requireAccessToken } from '../access'
import { requirePaidRefinementContext, retiredAnswersProblem } from './gate'

// The forced-choice answers arrive whole — the free drain block included — because the refined tally spans all
// five dimensions and re-sending the free three is cheaper than reading them back to score.
const RefinementBody = z.object({ answers: RefinementAnswersSchema, workAnswers: RefinedWorkAnswersSchema })
// Only the paid block is stored. The free three already have a column and a collection timestamp of their own,
// and overwriting them here would date the free sitting to the paid one and erase the merge-window decision.
const PAID_WORK_IDS = new Set(PAID_WORK_ITEMS.map((item) => item.id))
const route = new Hono<AppEnv>()

route.post('/', requireAccessToken, async (c) => {
  // Read the body here but do not validate it yet. `RefinementAnswersSchema` pins an exact length, so a client
  // built against a retired instrument fails that check with a payload-shaped 422 — which is the one answer
  // this route must not give them, because the row is permanently unanswerable and 410 is what says so. The
  // row's state outranks the payload's shape, so the gates below run first.
  const body = await c.req.json().catch(() => null)

  return withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    const context = await requirePaidRefinementContext(db, c.get('accessToken'))
    if (context instanceof Response) {
      return context
    }
    // Never echo the refined profile. It is paid content, and `viewed_at` is stamped only by `GET /report`
    // (report/GET.ts) — so returning it here hands the buyer the whole product on a request that leaves them
    // eligible for a full refund for a year, repeatably. Delivery happens on one path only.
    if (context.refinedProfile) {
      return c.json({ status: 'ok' as const })
    }
    // Before the scorer, not inside its catch: a retired instrument and a purged answer set are permanent
    // states of the ROW, and the 422 below is about the payload. Conflating them is what made this a dead end.
    const retired = retiredAnswersProblem(context)
    if (retired) {
      return retired
    }

    const parsed = RefinementBody.safeParse(body)
    if (!parsed.success) {
      return problem(422, 'invalid-request')
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

    const persisted = await persistRefinement(db, context.resultId, {
      answers: parsed.data.answers,
      profile,
      workAnswers: parsed.data.workAnswers.filter((answer) => PAID_WORK_IDS.has(answer.itemId)),
    })
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
