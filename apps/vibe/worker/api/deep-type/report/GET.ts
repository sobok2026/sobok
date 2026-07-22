import { Hono } from 'hono'

import { openCached, openFresh, withDb } from '~/db/client'
import { getPurchaseByAccessToken, stampReportViewed } from '~/db/queries/purchase'
import { getDoneSections, getReportStatus } from '~/db/queries/report'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'

const route = new Hono<AppEnv>()

// Phase 4: read-only, cache-first delivery. The gate is FRESH (entitlement must never be stale); the done
// body is read from the CACHED binding with a FRESH fallback for post-write cache lag. A GET never generates
// or mutates — except stamping viewed_at on the delivering 200 (the legal anchor for the unviewed-refund
// right). The gate transaction returns a terminal Response, or { purchaseId } to proceed to delivery.
route.get('/', async (c) => {
  const token = c.get('accessToken')

  const gate = await withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    const purchase = await getPurchaseByAccessToken(db, token)

    if (!purchase) {
      return problem(404, 'purchase-not-found')
    }

    if (purchase.status === 'refunded') {
      return problem(410, 'purchase-refunded')
    }

    if (purchase.status !== 'paid') {
      return problem(403, 'purchase-not-paid')
    }

    const report = await getReportStatus(db, purchase.id)

    if (report?.status === 'done') {
      await stampReportViewed(db, purchase.id)
      return { purchaseId: purchase.id }
    }

    if (report?.status === 'failed' && report.attempts >= 5) {
      return problem(502, 'report-generation-failed')
    }

    return problem(202, 'report-generating', undefined, undefined, { 'retry-after': '2' })
  })

  if (gate instanceof Response) {
    return gate
  }

  const cached = await withDb(openCached(c.env.HYPERDRIVE_CACHED), c.executionCtx, (db) =>
    getDoneSections(db, gate.purchaseId),
  )

  const sections =
    cached ??
    (await withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) => getDoneSections(db, gate.purchaseId)))

  return c.json({ sections, status: 'done' })
})

export default route
