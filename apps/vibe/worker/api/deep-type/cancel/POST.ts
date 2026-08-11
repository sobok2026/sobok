import { openDb, withDb } from '@sobok/edge/db/client'
import type { AppEnv } from '@vibe-worker/env'
import { problem } from '@vibe-worker/errors'
import { requestWithdrawal } from '@vibe-worker/payments/cancel'
import { Hono } from 'hono'

import { requireAccessToken } from '../access'

const route = new Hono<AppEnv>()

// Phase 7: 청약철회 (customer-initiated withdrawal / refund). Allowed only while the paid report has NOT been
// delivered (viewed_at IS NULL). Cancels at PortOne + flips the purchase to refunded (the
// Transaction.Cancelled webhook is the backstop).
route.post('/', requireAccessToken, async (c) => {
  const outcome = await withDb(openDb(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
    requestWithdrawal(db, c.env, c.get('accessToken')),
  )

  switch (outcome) {
    case 'refunded':
      return c.json({ status: 'refunded' })
    case 'not-found':
      return problem(404, 'purchase-not-found')
    case 'not-paid':
      return problem(403, 'purchase-not-paid')
    case 'viewed':
      return problem(409, 'withdrawal-forbidden')
  }
})

export default route
