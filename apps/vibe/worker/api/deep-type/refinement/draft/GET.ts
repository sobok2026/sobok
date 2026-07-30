import { openDB, withDB } from '@sobok/edge/db/client'
import { Hono } from 'hono'
import { getRefinementDraft } from '~/db/queries/result'
import type { AppEnv } from '~/env'

import { requirePaidRefinementContext, retiredAnswersProblem } from '../gate'

const route = new Hono<AppEnv>()

// Resume. Returns only what this buyer typed — item ids they have already been shown and their own picks —
// so it delivers no paid content: the questions themselves come from the paid bundle, and the refined
// profile is never on this path at all.
//
// `freeWorkAnswers` rides along for the same reason, and it is what makes the block finishable in a browser
// that never held the free sitting. `POST /refinement` demands all twenty-four forced choices, the free three
// live only in `sessionStorage` on the tab that answered them, and the draft carries them onward only once a
// paid item has been answered (the client parks on every answer, not on restore). Open the e-mail link on
// another device and every one of those sources is empty, so the buyer could answer all thirty-seven and still
// be refused. The server has held the free three in `result.free_work_answers` since `POST /session`, so
// handing them back is the short path — shorter than a restore-time write, which would have to succeed before
// the buyer could finish and would still lose to a closed tab.
route.get('/', async (c) => {
  return withDB(openDB(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    const context = await requirePaidRefinementContext(db, c.get('accessToken'))
    if (context instanceof Response) {
      return context
    }
    c.header('cache-control', 'no-store')
    // Finished. `persistRefinement` already cleared the draft, so an empty set is the honest answer and the
    // client's `refinementRequired` flag (reopen/exchange) is what tells it not to ask again.
    if (context.refinedProfile) {
      return c.json({ answers: [], freeWorkAnswers: [], status: 'ok' as const, workAnswers: [] })
    }
    const retired = retiredAnswersProblem(context)
    if (retired) {
      return retired
    }

    const draft = await getRefinementDraft(db, context.resultId)
    return c.json({
      answers: draft?.answers ?? [],
      // Null on rows written before the column existed. `[]` then, and the client falls back to its own
      // sitting exactly as it did before this field was on the wire.
      freeWorkAnswers: context.freeWorkAnswers ?? [],
      status: 'ok' as const,
      workAnswers: draft?.workAnswers ?? [],
    })
  })
})

export default route
