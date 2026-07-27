import { getRemotePayment, type PortOneCreds } from '../billing/portone'
import type { Db } from '../db/client'
import {
  clearPurchaseAnalytics,
  getPurchaseByPaymentId,
  markPurchasePaid,
  markPurchaseRefunded,
  type PurchaseRow,
} from '../db/queries/purchase'
import { ensurePendingReport } from '../db/queries/report'
import type { Bindings } from '../env'
import { sendGA4Purchase } from '../lib/ga4'
import { skuItem } from '../lib/pricing'

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

export interface ConfirmDeps {
  creds: PortOneCreds
  env: Bindings
}

export async function confirmPurchase(db: Db, deps: ConfirmDeps, paymentId: string): Promise<ConfirmOutcome> {
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
  const remote = await getRemotePayment(deps.creds, paymentId)

  if (remote.status !== 'paid') {
    return 'not-completed'
  }
  if (remote.amount !== purchase.amount || (remote.currency ?? purchase.currency) !== purchase.currency) {
    // A stale/duplicate or tampered charge must never poison a legit pending row. Do not grant, do not
    // fail — leave pending for reconcile/manual review and let the caller alert.
    return 'amount-mismatch'
  }

  const paidAt = remote.paidAt ?? new Date()

  const won = await markPurchasePaid(db, purchase.id, {
    providerTxnId: remote.providerTxnId,
    method: remote.method,
    paidAt,
  })

  if (!won) {
    // Lost the race to a concurrent verify/webhook — the purchase is paid either way.
    return 'already-paid'
  }

  await ensurePendingReport(db, purchase.id)
  // Winning the CAS is what makes this call the single place a purchase can ever be counted, so the revenue
  // event belongs here and nowhere else. Awaited rather than deferred to waitUntil: `withDB` closes the pooled
  // connection the moment the caller returns, and clearing the identity afterwards needs it alive.
  await reportPurchase(db, deps.env, purchase, paymentId, paidAt)
  return 'paid'
}

// Best-effort GA4 delivery. Every failure mode — denied consent, an unknown SKU, a GA outage — leaves the
// grant untouched; revenue reporting must never be able to fail a payment the PG has already settled.
async function reportPurchase(
  db: Db,
  env: Bindings,
  purchase: PurchaseRow,
  paymentId: string,
  paidAt: Date,
): Promise<void> {
  // No client id means `analytics_storage` was denied at checkout. Sending anyway would invent a user GA4 has
  // never seen, so silence is the correct behaviour.
  if (!purchase.gaClientId) {
    return
  }

  const item = skuItem(purchase.sku)
  if (!item) {
    console.error('deeptype.ga4.unknown_sku', purchase.sku)
    return
  }

  const apiSecret = await env.DEEPTYPE_GA4_API_SECRET.get()
  if (!apiSecret) {
    return
  }

  const delivered = await sendGA4Purchase(
    { apiSecret, measurementId: env.DEEPTYPE_GA4_MEASUREMENT_ID },
    {
      clientId: purchase.gaClientId,
      currency: purchase.currency,
      items: [item],
      occurredAt: paidAt,
      sessionId: purchase.gaSessionId,
      transactionId: paymentId,
      value: purchase.amount,
    },
  )

  // Retained on a rejected send so the hit can still be replayed by hand inside GA4's 72-hour window; the
  // daily purge nulls it either way when the record is anonymized.
  if (delivered) {
    await clearPurchaseAnalytics(db, purchase.id)
  }
}

export async function applyRefund(db: Db, paymentId: string): Promise<'refunded' | 'noop'> {
  const done = await markPurchaseRefunded(db, paymentId)
  return done ? 'refunded' : 'noop'
}
