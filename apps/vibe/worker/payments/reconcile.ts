import { openDb } from '@sobok/edge/db/client'
import { listStalePendingPurchases } from '../db/queries/purchase'
import type { Bindings } from '../env'
import { confirmPurchase } from './confirm'

const STALE_MS = 15 * 60 * 1000
const BATCH = 100

// The last safety net: a purchase stuck 'pending' >15 min means the process/webhook died between charge
// and confirm. Re-converge each against PortOne (idempotent via the CAS). The shared scheduler invokes it
// every 15 minutes through VibeMaintenance.
export async function reconcileStalePending(env: Bindings): Promise<void> {
  const { db, sql } = openDb(env.HYPERDRIVE_FRESH)

  try {
    const cutoff = new Date(Date.now() - STALE_MS)
    const stale = await listStalePendingPurchases(db, cutoff, BATCH)

    for (const purchase of stale) {
      try {
        const outcome = await confirmPurchase(db, { env }, purchase.paymentId)
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
