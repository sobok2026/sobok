import { openDb, withDb } from '@sobok/edge/db/client'
import { Hono } from 'hono'
import { z } from 'zod'
import { isRefinementPending } from '~/db/queries/result'
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

  // `refinementRequired` is read on the same connection as the grant, because the screen that asked this
  // question routes on the answer: sending a buyer whose paid block is already stored back into the
  // twenty-four questions makes them re-answer a set `POST /refinement` will discard as a no-op.
  //
  // Returned unauthenticated, like the rest of this route's answer. What it discloses to a holder of a
  // `dt_<uuid4>` payment id is one boolean about that payment's own report and no personal data — the same
  // trade `/reopen/exchange` already makes with its own credential.
  const { outcome, refinementRequired } = await withDb(openDb(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    const confirmed = await confirmPurchase(db, { creds: portOneCreds, env: c.env }, parsed.data.paymentId)
    if (confirmed !== 'paid' && confirmed !== 'already-paid') {
      return { outcome: confirmed, refinementRequired: false }
    }
    return { outcome: confirmed, refinementRequired: await isRefinementPending(db, parsed.data.paymentId) }
  })

  switch (outcome) {
    case 'paid':
    case 'already-paid':
      return c.json({ refinementRequired, status: 'paid' })
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
