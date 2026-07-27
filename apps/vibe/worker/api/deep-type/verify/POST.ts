import { Hono } from 'hono'
import { z } from 'zod'

import { openFresh, withDB } from '~/db/client'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { confirmPurchase } from '~/payments/confirm'

import { creds } from '../creds'

const VerifyBody = z.object({ paymentId: z.string().min(1).max(64) })

const route = new Hono<AppEnv>()

// Browser-return path after PortOne.requestPayment resolves. Shares confirmPurchase with the webhook, so
// whichever lands first grants; the other is an idempotent no-op.
route.post('/', async (c) => {
  const parsed = VerifyBody.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }

  const portOneCreds = await creds(c)

  const outcome = await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
    confirmPurchase(db, { creds: portOneCreds, env: c.env }, parsed.data.paymentId),
  )

  switch (outcome) {
    case 'paid':
    case 'already-paid':
      return c.json({ status: 'paid' })
    case 'not-found':
      return problem(404, 'purchase-not-found')
    case 'refunded':
      return problem(410, 'purchase-refunded')
    case 'amount-mismatch':
      return problem(409, 'amount-mismatch')
    case 'not-completed':
      return problem(402, 'payment-not-completed')
  }
})

export default route
