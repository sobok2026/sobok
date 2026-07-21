import { getRemotePayment, type PortOneCreds } from '../billing/portone'
import type { Db } from '../db/client'
import { getPurchaseByPaymentId, markPurchasePaid, markPurchaseRefunded } from '../db/queries/purchase'
import { ensurePendingReport } from '../db/queries/report'

// Outcomes of converging a local purchase against PortOne's truth. Shared by /verify (browser return),
// /webhook (Transaction.Paid), and the reconcile cron — whoever runs it first wins the CAS, the rest are
// idempotent no-ops.
export type ConfirmOutcome =
  | 'paid' // this call performed pending → paid
  | 'already-paid' // was already paid (idempotent)
  | 'not-found' // no such purchase (not ours)
  | 'not-completed' // PG says not yet paid (pending/failed) — leave pending
  | 'amount-mismatch' // PG amount/currency != our price — NEVER grant, leave pending, alert
  | 'refunded' // purchase already refunded

export async function confirmPurchase(db: Db, creds: PortOneCreds, paymentId: string): Promise<ConfirmOutcome> {
  const purchase = await getPurchaseByPaymentId(db, paymentId)
  if (!purchase) {
    return 'not-found'
  }
  if (purchase.status === 'refunded') {
    return 'refunded'
  }
  if (purchase.status === 'paid') {
    return 'already-paid'
  }

  // The grant decision depends ONLY on the PG's report, never on anything the client sent.
  const remote = await getRemotePayment(creds, paymentId)
  if (remote.status !== 'paid') {
    return 'not-completed'
  }
  if (remote.amount !== purchase.amount || (remote.currency ?? purchase.currency) !== purchase.currency) {
    // A stale/duplicate or tampered charge must never poison a legit pending row. Do not grant, do not
    // fail — leave pending for reconcile/manual review and let the caller alert.
    return 'amount-mismatch'
  }

  const won = await markPurchasePaid(db, purchase.id, {
    providerTxnId: remote.providerTxnId,
    method: remote.method,
    paidAt: remote.paidAt ?? new Date(),
  })
  if (!won) {
    // Lost the race to a concurrent verify/webhook — the purchase is paid either way.
    return 'already-paid'
  }

  await ensurePendingReport(db, purchase.id)
  return 'paid'
}

export async function applyRefund(db: Db, paymentId: string): Promise<'refunded' | 'noop'> {
  const done = await markPurchaseRefunded(db, paymentId)
  return done ? 'refunded' : 'noop'
}
