import { openFresh } from '../db/client'
import { listStalePendingPurchases } from '../db/queries/purchase'
import type { Bindings } from '../env'
import { confirmPurchase } from './confirm'

const STALE_MS = 15 * 60 * 1000
const BATCH = 100

// The last safety net: a purchase stuck 'pending' >15 min means the process/webhook died between charge
// and confirm. Re-converge each against PortOne (idempotent via the CAS). Runs on the 15-min cron.
export async function reconcileStalePending(env: Bindings): Promise<void> {
  const [apiSecret, webhookSecret] = await Promise.all([
    env.DEEPTYPE_PORTONE_API_SECRET.get(),
    env.DEEPTYPE_PORTONE_WEBHOOK_SECRET.get(),
  ])

  const deps = { creds: { apiSecret, webhookSecret }, env }
  const { db, sql } = openFresh(env.HYPERDRIVE_FRESH)

  try {
    const cutoff = new Date(Date.now() - STALE_MS)
    const stale = await listStalePendingPurchases(db, cutoff, BATCH)

    for (const purchase of stale) {
      try {
        const outcome = await confirmPurchase(db, deps, purchase.paymentId)
        if (outcome === 'amount-mismatch') {
          console.error('deeptype.reconcile.amount_mismatch', purchase.paymentId)
        }
      } catch (error) {
        console.error('deeptype.reconcile.error', purchase.paymentId, String(error))
      }
    }
  } finally {
    await sql.end({ timeout: 5 })
  }
}
