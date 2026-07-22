import { and, eq, isNotNull, isNull, lt, or, sql } from 'drizzle-orm'

import { dateIsWithinYears } from '../../lib/retention'
import type { Db } from '../client'
import { purchaseTable } from '../schema'

export type PurchaseStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface NewPurchase {
  accessToken: string
  paymentId: string
  resultId: number
  email: string
  emailHash: string
  orderName: string
  amount: number
  currency: string
  sku: 'report' | 'compat' | 'bundle'
  consentWithdrawalAt: Date
  consentPrivacyAt: Date
  ageConfirmedAt: Date
}

export async function createPendingPurchase(db: Db, input: NewPurchase): Promise<void> {
  await db.insert(purchaseTable).values(input)
}

export interface PurchaseRow {
  id: number
  amount: number
  currency: string
  status: PurchaseStatus
}

// Report gate: resolve the bearer access_token to its purchase (FRESH — entitlement must never be stale).
export async function getPurchaseByAccessToken(
  db: Db,
  accessToken: string,
): Promise<{ id: number; status: PurchaseStatus } | null> {
  const now = new Date()
  const [row] = await db
    .select({ id: purchaseTable.id, status: purchaseTable.status })
    .from(purchaseTable)
    .where(
      and(
        eq(purchaseTable.accessToken, accessToken),
        or(isNull(purchaseTable.paidAt), dateIsWithinYears(purchaseTable.paidAt, now, 1)),
      ),
    )
    .limit(1)
  return row ?? null
}

// Cancel/청약철회 gate: needs paymentId (to cancel at the PG) + viewedAt (withdrawal is forbidden once the
// digital content has been delivered).
export async function getPurchaseForCancel(
  db: Db,
  accessToken: string,
): Promise<{ id: number; paymentId: string; status: PurchaseStatus; viewedAt: Date | null } | null> {
  const now = new Date()
  const [row] = await db
    .select({
      id: purchaseTable.id,
      paymentId: purchaseTable.paymentId,
      status: purchaseTable.status,
      viewedAt: purchaseTable.viewedAt,
    })
    .from(purchaseTable)
    .where(
      and(
        eq(purchaseTable.accessToken, accessToken),
        or(isNull(purchaseTable.paidAt), dateIsWithinYears(purchaseTable.paidAt, now, 1)),
      ),
    )
    .limit(1)
    .for('update')
  return row ?? null
}

// Stamp viewed_at immediately before a done report is delivered, preserving the first timestamp. The
// paid/access predicates also close the cancellation race between the initial gate and response delivery.
export async function stampReportViewed(db: Db, purchaseId: number): Promise<boolean> {
  const now = new Date()
  const rows = await db
    .update(purchaseTable)
    .set({ viewedAt: sql`coalesce(${purchaseTable.viewedAt}, ${new Date()})` })
    .where(
      and(
        eq(purchaseTable.id, purchaseId),
        eq(purchaseTable.status, 'paid'),
        isNotNull(purchaseTable.accessToken),
        isNotNull(purchaseTable.paidAt),
        dateIsWithinYears(purchaseTable.paidAt, now, 1),
      ),
    )
    .returning({ id: purchaseTable.id })
  return rows.length > 0
}

export async function getPurchaseByPaymentId(db: Db, paymentId: string): Promise<PurchaseRow | null> {
  const [row] = await db
    .select({
      id: purchaseTable.id,
      amount: purchaseTable.amount,
      currency: purchaseTable.currency,
      status: purchaseTable.status,
    })
    .from(purchaseTable)
    .where(eq(purchaseTable.paymentId, paymentId))
    .limit(1)
  return row ?? null
}

// CAS: only a still-pending row flips to paid, and only one caller wins (verify vs webhook vs reconcile).
// Returns true iff THIS call performed the transition.
export async function markPurchasePaid(
  db: Db,
  id: number,
  patch: { providerTxnId: string | null; method: string | null; paidAt: Date },
): Promise<boolean> {
  const rows = await db
    .update(purchaseTable)
    .set({ status: 'paid', paidAt: patch.paidAt, providerTxnId: patch.providerTxnId, method: patch.method })
    .where(and(eq(purchaseTable.id, id), eq(purchaseTable.status, 'pending')))
    .returning({ id: purchaseTable.id })
  return rows.length > 0
}

// CAS: only a paid row moves to refunded. Idempotent — a redelivered cancel webhook returns false.
export async function markPurchaseRefunded(db: Db, paymentId: string): Promise<boolean> {
  const rows = await db
    .update(purchaseTable)
    .set({ status: 'refunded', refundedAt: new Date() })
    .where(and(eq(purchaseTable.paymentId, paymentId), eq(purchaseTable.status, 'paid')))
    .returning({ id: purchaseTable.id })
  return rows.length > 0
}

export async function markPurchaseFailed(
  db: Db,
  id: number,
  failure: { code: string | null; message: string | null },
): Promise<void> {
  await db
    .update(purchaseTable)
    .set({ status: 'failed', failureCode: failure.code, failureMessage: failure.message })
    .where(and(eq(purchaseTable.id, id), eq(purchaseTable.status, 'pending')))
}

// Pending purchases older than the cutoff — the reconcile sweeper converges these against PortOne (a
// process/webhook that died between checkout and confirm).
export async function listStalePendingPurchases(
  db: Db,
  olderThan: Date,
  limit: number,
): Promise<{ id: number; paymentId: string }[]> {
  return db
    .select({ id: purchaseTable.id, paymentId: purchaseTable.paymentId })
    .from(purchaseTable)
    .where(and(eq(purchaseTable.status, 'pending'), lt(purchaseTable.createdAt, olderThan)))
    .limit(limit)
}
