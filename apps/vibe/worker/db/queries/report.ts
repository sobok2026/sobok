import type { Db } from '@sobok/edge/db/client'
import { and, eq, inArray, lt, or, sql } from 'drizzle-orm'
import type { ReportPassStatus } from '../../report/pipeline'
import { type ReportSection, reportTable } from '../schema'

/** The state machine is declared with the rest of the pass contract; this module only reads and writes it. */
export type ReportStatus = ReportPassStatus

// Born the moment a purchase becomes paid, in the same call that flipped it. onConflictDoNothing keeps it
// idempotent if verify and the webhook both confirm the same purchase.
export async function ensurePendingReport(db: Db, purchaseId: number): Promise<void> {
  await db.insert(reportTable).values({ purchaseId }).onConflictDoNothing()
}

export async function getReportStatus(
  db: Db,
  purchaseId: number,
): Promise<{ status: ReportStatus; attempts: number } | null> {
  const [row] = await db
    .select({ status: reportTable.status, attempts: reportTable.attempts })
    .from(reportTable)
    .where(eq(reportTable.purchaseId, purchaseId))
    .limit(1)
  return row ?? null
}

export interface DeliverableReport {
  /** Null until the narration pass commits. The engine body ships without it. */
  narrative: ReportSection[] | null
  sections: ReportSection[]
}

// The done-report body. Readable from the CACHED Hyperdrive ONLY once the narrative pass is terminal — that
// is when the row stops changing, and `reportDelivery()` is the single condition both this read and the
// viewed_at stamp branch on. Before then the caller must read FRESH, because the narrative column is still
// being written and a cached miss would freeze an engine-only body in front of the buyer.
export async function getDeliverableReport(db: Db, purchaseId: number): Promise<DeliverableReport | null> {
  const [row] = await db
    .select({
      narrative: reportTable.narrative,
      sections: reportTable.sections,
    })
    .from(reportTable)
    .where(and(eq(reportTable.purchaseId, purchaseId), eq(reportTable.status, 'done')))
    .limit(1)

  if (!row?.sections) {
    return null
  }
  return { narrative: row.narrative, sections: row.sections }
}

// CAS lock: at most one generator per purchase. Claims a row that is pending, failed (under the retry cap),
// or generating-but-stale (dead worker, lease expired). Bumps attempts so runaway failures give up at 5.
export async function acquireReportLock(
  db: Db,
  purchaseId: number,
  lockToken: string,
  staleBefore: Date,
): Promise<boolean> {
  const rows = await db
    .update(reportTable)
    .set({
      status: 'generating',
      lockToken,
      lockedAt: new Date(),
      attempts: sql`${reportTable.attempts} + 1`,
    })
    .where(
      and(
        eq(reportTable.purchaseId, purchaseId),
        lt(reportTable.attempts, 5),
        or(
          inArray(reportTable.status, ['pending', 'failed']),
          and(eq(reportTable.status, 'generating'), lt(reportTable.lockedAt, staleBefore)),
        ),
      ),
    )
    .returning({ id: reportTable.id })
  return rows.length > 0
}

export interface ReportBody {
  model: string
  sections: readonly ReportSection[]
}

// Finalize only if THIS caller still holds the lease (lock_token guard) — a reclaimed stale lock can't be
// overwritten by the worker that lost it.
export async function finalizeReportDone(
  db: Db,
  purchaseId: number,
  lockToken: string,
  body: ReportBody,
): Promise<boolean> {
  const rows = await db
    .update(reportTable)
    .set({
      status: 'done',
      sections: [...body.sections],
      model: body.model,
      generatedAt: new Date(),
      error: null,
    })
    .where(and(eq(reportTable.purchaseId, purchaseId), eq(reportTable.lockToken, lockToken)))
    .returning({ id: reportTable.id })
  return rows.length > 0
}

export async function finalizeReportFailed(
  db: Db,
  purchaseId: number,
  lockToken: string,
  error: string,
): Promise<boolean> {
  const rows = await db
    .update(reportTable)
    .set({ status: 'failed', error, lockToken: null })
    .where(and(eq(reportTable.purchaseId, purchaseId), eq(reportTable.lockToken, lockToken)))
    .returning({ id: reportTable.id })
  return rows.length > 0
}

// The narrative pass runs after the engine has already committed `sections`, on its own lock. Nothing below
// touches the engine's `lock_token`/`attempts`/`error`: two passes sharing one lease means the narrative
// worker can release a lock the engine still holds, and a narrative retry can burn the engine's retry budget.

export async function getNarrativeStatus(
  db: Db,
  purchaseId: number,
): Promise<{ status: ReportStatus; attempts: number } | null> {
  const [row] = await db
    .select({
      status: reportTable.narrativeStatus,
      attempts: reportTable.narrativeAttempts,
    })
    .from(reportTable)
    .where(eq(reportTable.purchaseId, purchaseId))
    .limit(1)
  return row ?? null
}

// CAS lock, same shape as the engine's: claims pending, failed-under-cap, or a generating row whose lease has
// expired. Only rows whose engine body already exists are claimable — narrative without sections has nothing
// to narrate.
export async function acquireNarrativeLock(
  db: Db,
  purchaseId: number,
  lockToken: string,
  staleBefore: Date,
): Promise<boolean> {
  const rows = await db
    .update(reportTable)
    .set({
      narrativeStatus: 'generating',
      narrativeLockToken: lockToken,
      narrativeLockedAt: new Date(),
      narrativeAttempts: sql`${reportTable.narrativeAttempts} + 1`,
    })
    .where(
      and(
        eq(reportTable.purchaseId, purchaseId),
        eq(reportTable.status, 'done'),
        lt(reportTable.narrativeAttempts, 5),
        or(
          inArray(reportTable.narrativeStatus, ['pending', 'failed']),
          and(eq(reportTable.narrativeStatus, 'generating'), lt(reportTable.narrativeLockedAt, staleBefore)),
        ),
      ),
    )
    .returning({ id: reportTable.id })
  return rows.length > 0
}

export async function finalizeNarrativeDone(
  db: Db,
  purchaseId: number,
  lockToken: string,
  model: string,
  narrative: readonly ReportSection[],
): Promise<boolean> {
  const rows = await db
    .update(reportTable)
    .set({ narrativeStatus: 'done', narrative: [...narrative], narrativeModel: model, narrativeError: null })
    .where(and(eq(reportTable.purchaseId, purchaseId), eq(reportTable.narrativeLockToken, lockToken)))
    .returning({ id: reportTable.id })
  return rows.length > 0
}

export async function finalizeNarrativeFailed(
  db: Db,
  purchaseId: number,
  lockToken: string,
  error: string,
): Promise<boolean> {
  const rows = await db
    .update(reportTable)
    .set({ narrativeStatus: 'failed', narrativeError: error, narrativeLockToken: null })
    .where(and(eq(reportTable.purchaseId, purchaseId), eq(reportTable.narrativeLockToken, lockToken)))
    .returning({ id: reportTable.id })
  return rows.length > 0
}
