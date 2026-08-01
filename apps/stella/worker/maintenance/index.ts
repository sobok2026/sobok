import { WorkerEntrypoint } from 'cloudflare:workers'
import type { StellaMaintenanceService } from '@sobok/scheduler'

import type { Bindings } from '../env'
import { runRetentionPurge } from './purge'

/** Private RPC entrypoint called only by the account-wide scheduler Worker. */
export class StellaMaintenance extends WorkerEntrypoint<Bindings> implements StellaMaintenanceService {
  purgeRetention(): Promise<void> {
    return runRetentionPurge(this.env)
  }
}
