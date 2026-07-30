import { INSTRUMENT_VERSION } from '@deep-type/model'

import type { Db } from '@sobok/edge/db/client'
import { getPurchaseResultByAccessToken, type PurchaseResultContext } from '~/db/queries/result'
import { problem } from '~/errors'

// The entitlement gates every refinement path shares — submit and both draft methods. Kept in one place so
// the draft endpoints can never become a way to touch a row the submit endpoint would have refused. Returns
// the context, or the terminal Response to send. Callers narrow with `instanceof Response`.
//
// Deliberately does NOT decide anything about `refinedProfile`: an already-refined buyer is a success on the
// submit path and an empty draft on the resume path, and folding those together here would make one of them
// wrong.
export async function requirePaidRefinementContext(
  db: Db,
  accessToken: string,
): Promise<PurchaseResultContext | Response> {
  const context = await getPurchaseResultByAccessToken(db, accessToken)
  if (!context) {
    return problem(404, 'purchase-not-found')
  }
  if (context.status === 'refunded') {
    return problem(410, 'purchase-refunded')
  }
  if (context.status !== 'paid') {
    return problem(403, 'purchase-not-paid')
  }
  return context
}

// Null when the stored free answers can still be re-scored, or the terminal 410 when they cannot.
//
// `scoreRefinedAssessment` re-validates the STORED base answers against the CURRENT selection tables, so two
// things that have nothing to do with the incoming payload can make it throw: the instrument moved on under a
// row that was collected before it, and the 90-day retention sweep blanked the answers of a purchase that was
// never finished. Both used to surface as 422 `invalid-request`, which tells a paying buyer to fix and retry
// a request no retry can fix. 410 says the resource is gone for good, which is the truth in both cases and
// the only answer a client can route to a real explanation instead of a spinner.
//
// Callers must run this AFTER the already-refined check. A buyer who completed the paid block under the old
// instrument still owns their report, and nothing here needs their raw answers again.
export function retiredAnswersProblem(context: PurchaseResultContext): Response | null {
  if (context.instrumentVersion !== INSTRUMENT_VERSION) {
    return problem(410, 'instrument-retired')
  }
  // The retention sweep writes `[]`, not NULL — the column is NOT NULL — so emptiness is the signal.
  if (context.baseAnswers.length === 0) {
    return problem(410, 'answers-expired')
  }
  return null
}
