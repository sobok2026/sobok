import { WorkerEntrypoint } from 'cloudflare:workers'
import type { VibeMaintenanceService } from '@sobok/scheduler'

import type { Bindings } from '../env'
import { runRetentionPurge } from '../payments/purge'
import { reconcileStalePending } from '../payments/reconcile'

/** Private RPC entrypoint called only by the account-wide scheduler Worker. */
export class VibeMaintenance extends WorkerEntrypoint<Bindings> implements VibeMaintenanceService {
  reconcilePendingPayments(): Promise<void> {
    return reconcileStalePending(this.env)
  }

  purgeRetention(): Promise<void> {
    return runRetentionPurge(this.env)
  }
}
