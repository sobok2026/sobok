import { Hono } from 'hono'
import { z } from 'zod'

import { openFresh, withDB } from '~/db/client'
import { saveRefinementDraft } from '~/db/queries/result'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { RefinementDraftAnswersSchema, RefinementDraftWorkAnswersSchema } from '~/scoring/answer-schema'

import { requirePaidRefinementContext, retiredAnswersProblem } from '../gate'

// PUT, not POST: the draft is one buffer per purchase and every write replaces it whole. That makes a
// duplicate send from a flaky connection a no-op instead of a second partial set to reconcile.
const DraftBody = z.object({
  answers: RefinementDraftAnswersSchema,
  workAnswers: RefinementDraftWorkAnswersSchema,
})

const route = new Hono<AppEnv>()

// Mid-block save for the paid 37. Without it a buyer who closes the tab at question 30 starts over, and the
// ones who do not start over are a refund liability that sits on the books for the full year of the access
// window (MIGRATION.md risk 13).
route.put('/', async (c) => {
  if (Number(c.req.header('content-length') ?? 0) > 16 * 1024) {
    return problem(413, 'payload-too-large')
  }

  // Held unvalidated until the row's gates have run. The draft schemas cap length against the current
  // selection, so a client built for a longer retired instrument trips that cap and would get a 422 about its
  // payload when the truthful answer is 410 about the row. Same ordering rule as POST /refinement.
  const body = await c.req.json().catch(() => null)

  return withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    const context = await requirePaidRefinementContext(db, c.get('accessToken'))
    if (context instanceof Response) {
      return context
    }
    // Already submitted. Accepting the write would resurrect a draft that `persistRefinement` cleared and
    // hand the resume path a stale partial set to offer someone who is finished.
    if (context.refinedProfile) {
      return c.json({ status: 'ok' as const })
    }
    const retired = retiredAnswersProblem(context)
    if (retired) {
      return retired
    }

    const parsed = DraftBody.safeParse(body)
    if (!parsed.success) {
      return problem(422, 'invalid-request')
    }

    await saveRefinementDraft(db, context.resultId, {
      answers: parsed.data.answers,
      workAnswers: parsed.data.workAnswers,
    })
    // Nothing is echoed. The draft holds paid item ids, and this endpoint is not the delivery path.
    return c.json({ status: 'ok' as const })
  })
})

export default route
