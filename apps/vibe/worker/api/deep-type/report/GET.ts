import { openDB, withDB } from '@sobok/edge/db/client'
import { Hono } from 'hono'
import { getPurchaseByAccessToken, stampReportViewed } from '~/db/queries/purchase'
import { getDeliverableReport, getNarrativeStatus, getReportStatus } from '~/db/queries/report'
import { getResultForReport } from '~/db/queries/result'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { reportDelivery } from '~/report/pipeline'

const route = new Hono<AppEnv>()

// Read-only delivery. The gate is FRESH (entitlement must never be stale); the body comes from the CACHED
// binding only once the row has stopped changing. A GET never generates or mutates — except stamping
// viewed_at, and only on a report that is complete.
//
// D4 = A: `reportDelivery()` decides caching and stamping in one expression. An engine report whose narration
// has not landed is delivered and NOT stamped, so the buyer reads it with the withdrawal right that
// `legal.ts` promises still intact. Two conditions here instead of one, and the cache freezes a half-written
// row in front of them.
route.get('/', async (c) => {
  const token = c.get('accessToken')

  const gate = await withDB(openDB(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
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
      const result = await getResultForReport(db, purchase.id)
      if (!result?.refined) {
        return problem(409, 'refinement-required')
      }
      const narrative = await getNarrativeStatus(db, purchase.id)
      return {
        delivery: reportDelivery(narrative?.status ?? 'pending'),
        profile: result.profile,
        purchaseId: purchase.id,
      }
    }

    if (report?.status === 'failed' && report.attempts >= 5) {
      return problem(502, 'report-generation-failed')
    }

    return problem(202, 'report-generating', { headers: { 'retry-after': '2' } })
  })

  if (gate instanceof Response) {
    return gate
  }

  const cached = gate.delivery.readCached
    ? await withDB(openDB(c.env.HYPERDRIVE_CACHED), c.executionCtx, (db) => getDeliverableReport(db, gate.purchaseId))
    : null

  const stored =
    cached ??
    (await withDB(openDB(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) => getDeliverableReport(db, gate.purchaseId)))

  if (!stored) {
    return problem(502, 'report-generation-failed')
  }

  if (gate.delivery.stamp) {
    const delivered = await withDB(openDB(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
      stampReportViewed(db, gate.purchaseId),
    )
    if (!delivered) {
      return problem(410, 'purchase-refunded')
    }
  }

  return c.json({
    narrative: stored.narrative ?? [],
    // The same condition, negated: while the report can still grow, the client keeps polling and the refund
    // CTA keeps working.
    narrativePending: !gate.delivery.stamp,
    profile: gate.profile,
    sections: stored.sections,
    status: 'done',
  })
})

export default route
