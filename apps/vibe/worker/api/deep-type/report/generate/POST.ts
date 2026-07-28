import { type Context, Hono } from 'hono'

import { openFresh, withDB } from '~/db/client'
import { getPurchaseByAccessToken } from '~/db/queries/purchase'
import {
  acquireNarrativeLock,
  acquireReportLock,
  finalizeNarrativeDone,
  finalizeNarrativeFailed,
  finalizeReportDone,
  finalizeReportFailed,
  getNarrativeStatus,
  getReportStatus,
} from '~/db/queries/report'
import { getReportSource } from '~/db/queries/result'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { alertDiscord } from '~/lib/alert'
import { randomToken } from '~/lib/tokens'
import { generateNarrative } from '~/report/claude'
import {
  isNarrativeEnabled,
  isReportSettled,
  NARRATIVE_DISABLED_REASON,
  planReportPasses,
  type ReportPassPlan,
} from '~/report/pipeline'

const route = new Hono<AppEnv>()

const LOCK_LEASE_MS = 90 * 1000

function staleBefore(): Date {
  return new Date(Date.now() - LOCK_LEASE_MS)
}

// Idempotent, CAS-locked generation in two commits. The rule engine writes the body and the report reaches
// `done` right there, with `model: 'rules-only'` — it used the model for nothing. The narration is a second
// pass on its own lock, and its failure degrades the report instead of voiding it (§4.2, §4.3).
//
// The narration runs after the response so the buyer reads the engine report while it is written. Until that
// pass is terminal `GET /report` serves the body without stamping `viewed_at`, so the withdrawal right stays
// open for as long as the report is incomplete — that is D4 = A, and it is the reason this file no longer
// waits on Anthropic before committing anything.
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

    const source = await getReportSource(db, purchase.id)
    if (!source?.refinedProfile) {
      return problem(409, 'refinement-required')
    }

    const report = await getReportStatus(db, purchase.id)

    // The engine body is already committed. Fall through to the narration pass rather than returning here:
    // a dropped `waitUntil` leaves narrative_status open, and the client's next poll is what reclaims it.
    if (report?.status === 'done') {
      return { phase: 'narrative' as const, purchaseId: purchase.id, source }
    }

    if (report?.status === 'failed' && report.attempts >= 5) {
      return problem(502, 'report-generation-failed')
    }

    const locked = await acquireReportLock(db, purchase.id, lockToken, staleBefore())
    if (!locked) {
      return problem(202, 'report-generating', undefined, undefined, { 'retry-after': '2' })
    }

    return { phase: 'engine' as const, purchaseId: purchase.id, source }
  })

  if (claim instanceof Response) {
    return claim
  }

  let plan: ReportPassPlan | null
  try {
    plan = planReportPasses(claim.source)
  } catch (error) {
    plan = null
    console.error('deeptype.report.engine-failed', {
      message: error instanceof Error ? error.message : String(error),
      purchaseId: claim.purchaseId,
      stack: error instanceof Error ? error.stack : undefined,
    })
  }

  if (claim.phase === 'engine') {
    // `status='failed'` survives a total engine (§4.3): unusable stored input and a DB outage both land here,
    // and both need a state that says the buyer has nothing and may withdraw.
    if (!plan) {
      await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
        finalizeReportFailed(db, claim.purchaseId, lockToken, 'engine input unusable'),
      )
      alertOps(c, '❌ deeptype engine report could not be built; inspect the restricted Worker logs')
      return problem(502, 'report-generation-failed')
    }

    const engine = plan.engine
    try {
      await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
        finalizeReportDone(db, claim.purchaseId, lockToken, engine),
      )
    } catch (error) {
      console.error('deeptype.report.commit-failed', {
        message: error instanceof Error ? error.message : String(error),
        purchaseId: claim.purchaseId,
      })
      await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
        finalizeReportFailed(db, claim.purchaseId, lockToken, String(error).slice(0, 500)),
      )
      alertOps(c, '❌ deeptype report commit failed; inspect the restricted Worker logs')
      return problem(502, 'report-generation-failed')
    }
  }

  c.executionCtx.waitUntil(runNarrativePass(c, claim.purchaseId, plan))

  return c.json({ status: 'done' })
})

// Second commit. Nothing in here may reject: it runs detached from the response, and the report it decorates
// is already delivering.
async function runNarrativePass(c: Context<AppEnv>, purchaseId: number, plan: ReportPassPlan | null): Promise<void> {
  const status = await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
    getNarrativeStatus(db, purchaseId),
  )
  if (status && isReportSettled(status.status)) {
    return
  }

  const lockToken = randomToken()
  const locked = await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
    acquireNarrativeLock(db, purchaseId, lockToken, staleBefore()),
  )
  // Someone else holds the lease, or the pass burned its retry budget. Either way this request is not the one
  // to finish it.
  if (!locked) {
    return
  }

  // A row whose stored answers no longer feed the engine still has to reach a terminal state, or delivery
  // would never be stamped for a report that is otherwise complete.
  if (!plan) {
    console.error('deeptype.report.narrative-skipped', { purchaseId })
    await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
      finalizeNarrativeFailed(db, purchaseId, lockToken, 'engine input unusable'),
    )
    return
  }

  const enabled = isNarrativeEnabled(c.env.DEEPTYPE_LLM_ENABLED)
  const apiKey = enabled ? await c.env.DEEPTYPE_ANTHROPIC_API_KEY.get() : ''

  // Terminal on purpose. A killswitched narrator is a decision, not an outage, and leaving the pass open would
  // withhold the delivery stamp forever — the buyer would keep a withdrawal right on a finished report.
  if (!apiKey) {
    console.error('deeptype.report.narrative-disabled', { enabled, purchaseId })
    await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
      finalizeNarrativeFailed(db, purchaseId, lockToken, NARRATIVE_DISABLED_REASON),
    )
    // A missing key while the switch is ON is a misconfiguration; the switch itself being off is not.
    if (enabled) {
      alertOps(c, '⚠️ deeptype narration has no API key; reports ship with the engine body only')
    }
    return
  }

  const model = c.env.DEEPTYPE_REPORT_MODEL ?? 'claude-haiku-4-5-20251001'

  try {
    const outcome = await generateNarrative(apiKey, model, {
      engine: plan.engine.sections,
      profile: plan.profile,
    })

    if (outcome.sections.length === 0) {
      const reason = `no narration accepted: ${outcome.dropped.map((drop) => `${drop.key}/${drop.reason}`).join(', ')}`
      console.error('deeptype.report.narrative-empty', { purchaseId, reason })
      await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
        finalizeNarrativeFailed(db, purchaseId, lockToken, reason.slice(0, 500)),
      )
      return
    }

    if (outcome.dropped.length > 0) {
      console.error('deeptype.report.narrative-partial', {
        dropped: outcome.dropped,
        purchaseId,
      })
    }

    await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
      finalizeNarrativeDone(db, purchaseId, lockToken, model, outcome.sections),
    )
  } catch (error) {
    console.error('deeptype.report.narrative-failed', {
      message: error instanceof Error ? error.message : String(error),
      model,
      purchaseId,
      stack: error instanceof Error ? error.stack : undefined,
    })
    await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
      finalizeNarrativeFailed(db, purchaseId, lockToken, String(error).slice(0, 500)),
    )
    alertOps(c, '⚠️ deeptype narration failed; the engine report shipped without it')
  }
}

// The Discord alert points at the Worker logs, so the failure has to reach them first; the DB `error` column
// is unreadable without a psql session against the payment DB.
function alertOps(c: Context<AppEnv>, text: string): void {
  c.executionCtx.waitUntil(c.env.DEEPTYPE_DISCORD_WEBHOOK.get().then((url) => alertDiscord(url, text)))
}

export default route
