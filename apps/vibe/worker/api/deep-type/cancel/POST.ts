import { Hono } from 'hono'

import { openFresh, withDB } from '~/db/client'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { requestWithdrawal } from '~/payments/cancel'

import { requireAccessToken } from '../access'
import { creds } from '../creds'

const route = new Hono<AppEnv>()

// Phase 7: 청약철회 (customer-initiated withdrawal / refund). Allowed only while the paid report has NOT been
// delivered (viewed_at IS NULL). Cancels at PortOne + flips the purchase to refunded (the
// Transaction.Cancelled webhook is the backstop).
route.post('/', requireAccessToken, async (c) => {
  const portOneCreds = await creds(c)

  const outcome = await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
    requestWithdrawal(db, portOneCreds, c.get('accessToken')),
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
