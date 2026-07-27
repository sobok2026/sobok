import { Hono } from 'hono'

import { openFresh, withDB } from '~/db/client'
import { getRefinementDraft } from '~/db/queries/result'
import type { AppEnv } from '~/env'

import { requirePaidRefinementContext, retiredAnswersProblem } from '../gate'

const route = new Hono<AppEnv>()

// Resume. Returns only what this buyer typed — item ids they have already been shown and their own picks —
// so it delivers no paid content: the questions themselves come from the paid bundle, and the refined
// profile is never on this path at all.
route.get('/', async (c) => {
  return withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    const context = await requirePaidRefinementContext(db, c.get('accessToken'))
    if (context instanceof Response) {
      return context
    }
    c.header('cache-control', 'no-store')
    // Finished. `persistRefinement` already cleared the draft, so an empty set is the honest answer and the
    // client's `refinementRequired` flag (reopen/exchange) is what tells it not to ask again.
    if (context.refinedProfile) {
      return c.json({ answers: [], status: 'ok' as const, workAnswers: [] })
    }
    const retired = retiredAnswersProblem(context)
    if (retired) {
      return retired
    }

    const draft = await getRefinementDraft(db, context.resultId)
    return c.json({ answers: draft?.answers ?? [], status: 'ok' as const, workAnswers: draft?.workAnswers ?? [] })
  })
})

export default route
