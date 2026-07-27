import { Hono } from 'hono'

import { openFresh, withDB } from '~/db/client'
import { getPurchaseByAccessToken } from '~/db/queries/purchase'
import { acquireReportLock, finalizeReportDone, finalizeReportFailed, getReportStatus } from '~/db/queries/report'
import { getResultForReport } from '~/db/queries/result'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { alertDiscord } from '~/lib/alert'
import { randomToken } from '~/lib/tokens'
import { generateReport } from '~/report/claude'
import { buildReportProfile } from '~/report/profile'

const route = new Hono<AppEnv>()

// Idempotent, CAS-locked generation. Gated (paid) + kill-switched (Anthropic budget). Persists BEFORE
// returning so a dropped client never loses a paid report; any failure marks the row failed and is retriable
// until attempts hit 5. The claim transaction returns a terminal Response, or { purchaseId, result } once the
// lock is held and generation may proceed.
route.post('/', async (c) => {
  const token = c.get('accessToken')

  const lockToken = randomToken()

  const claim = await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
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

    const result = await getResultForReport(db, purchase.id)
    if (!result?.refined) {
      return problem(409, 'refinement-required')
    }

    const report = await getReportStatus(db, purchase.id)

    if (report?.status === 'done') {
      return c.json({ status: 'done' })
    }

    if (report?.status === 'failed' && report.attempts >= 5) {
      return problem(502, 'report-generation-failed')
    }

    const staleBefore = new Date(Date.now() - 90 * 1000)
    const locked = await acquireReportLock(db, purchase.id, lockToken, staleBefore)

    if (!locked) {
      return problem(202, 'report-generating', undefined, undefined, { 'retry-after': '2' })
    }

    return {
      purchaseId: purchase.id,
      result,
    }
  })

  if (claim instanceof Response) {
    return claim
  }

  // Lock held. The DB handle is closed during the slow Claude call so we don't tie up a pooled connection;
  // a fresh handle finalizes. The lock_token guards both finalize paths against a reclaimed stale lock.
  const model = c.env.DEEPTYPE_REPORT_MODEL ?? 'claude-haiku-4-5-20251001'

  if (!claim.result) {
    await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
      finalizeReportFailed(db, claim.purchaseId, lockToken, 'missing result'),
    )
    return problem(502, 'report-generation-failed')
  }

  const LLM_API_KEY = await c.env.DEEPTYPE_ANTHROPIC_API_KEY.get()

  // Kill-switch / no budget. This used to persist a placeholder report as `done`, which was worse than
  // failing: `GET /report` then stamps `viewed_at`, and `cancel.ts` refuses a refund once that is set — so the
  // buyer paid, received filler and lost the refund. Fail instead; the client shows the refund CTA.
  if (!LLM_API_KEY) {
    console.error('deeptype.report.llm-disabled', { purchaseId: claim.purchaseId })

    await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
      finalizeReportFailed(db, claim.purchaseId, lockToken, 'llm disabled'),
    )

    c.executionCtx.waitUntil(
      c.env.DEEPTYPE_DISCORD_WEBHOOK.get().then((url) =>
        alertDiscord(url, '🚨 deeptype report generation is disabled; paid reports are failing'),
      ),
    )

    return problem(502, 'report-generation-failed')
  }

  try {
    const profile = buildReportProfile(claim.result)
    const sections = await generateReport(LLM_API_KEY, model, profile)

    await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
      finalizeReportDone(db, claim.purchaseId, lockToken, model, sections),
    )

    return c.json({ status: 'done' })
  } catch (error) {
    // The Discord alert points at the Worker logs, so the failure has to actually reach them — the DB `error`
    // column alone is unreadable without a psql session against the payment DB.
    console.error('deeptype.report.generate-failed', {
      message: error instanceof Error ? error.message : String(error),
      model,
      purchaseId: claim.purchaseId,
      stack: error instanceof Error ? error.stack : undefined,
    })

    await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
      finalizeReportFailed(db, claim.purchaseId, lockToken, String(error).slice(0, 500)),
    )

    c.executionCtx.waitUntil(
      c.env.DEEPTYPE_DISCORD_WEBHOOK.get().then((url) =>
        alertDiscord(url, '❌ deeptype report generation failed; inspect the restricted Worker logs'),
      ),
    )

    return problem(502, 'report-generation-failed')
  }
})

export default route
