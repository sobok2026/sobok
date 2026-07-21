import { and, eq, inArray, lt, or, sql } from 'drizzle-orm'

import type { Db } from '../client'
import { type ReportSection, reportTable } from '../schema'

export type ReportStatus = 'pending' | 'generating' | 'done' | 'failed'

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

// The immutable done-report body. Read via the CACHED Hyperdrive on the hot path (safe: only status='done'
// rows return, and sections never change once done), with a FRESH fallback for the brief post-write cache lag.
export async function getDoneSections(db: Db, purchaseId: number): Promise<ReportSection[] | null> {
  const [row] = await db
    .select({ sections: reportTable.sections })
    .from(reportTable)
    .where(and(eq(reportTable.purchaseId, purchaseId), eq(reportTable.status, 'done')))
    .limit(1)
  return row?.sections ?? null
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

// Finalize only if THIS caller still holds the lease (lock_token guard) — a reclaimed stale lock can't be
// overwritten by the worker that lost it.
export async function finalizeReportDone(
  db: Db,
  purchaseId: number,
  lockToken: string,
  model: string,
  sections: ReportSection[],
): Promise<boolean> {
  const rows = await db
    .update(reportTable)
    .set({ status: 'done', sections, model, generatedAt: new Date(), error: null })
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
