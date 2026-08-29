import { WorkerEntrypoint } from 'cloudflare:workers'
import { deliverAccountEmail, handleAccountsRequest } from '@sobok/accounts/database-service'
import { SobokAuthorityEmailSchema } from '@sobok/auth/authority'
import {
  type CivilArtifactVerificationClaim,
  type CivilArtifactVerificationOutput,
  type CivilCalculationClaim,
  type CivilCalculationOutput,
  type CivilComputeGateway,
  type CivilDeliveryGenerationClaim,
  type CivilDeliveryGenerationOutput,
  createCivilComputationGateway,
  handleCivilRequest,
} from '@sobok/civil/database-service'
import { PaymentEventSchema } from '@sobok/payments'
import type { StellaMaintenanceService, VibeMaintenanceService } from '@sobok/scheduler'
import {
  handleGuardianPaymentEvent,
  handleStellaRequest,
  purgeStellaRetention,
  reconcileStaleGuardianPayments,
} from '@sobok/stella/database-service'
import {
  handleDeepTypePaymentEvent,
  handleVibeRequest,
  purgeVibeRetention,
  reconcileStaleVibePayments,
} from '@sobok/vibe/database-service'

import type { Bindings } from './env'

const ACCOUNT_EMAIL_QUEUES = new Set(['accounts-email', 'accounts-email-stg'])
const STELLA_PAYMENT_QUEUES = new Set(['stella-payment-events', 'stella-payment-events-stg'])
const VIBE_PAYMENT_QUEUES = new Set(['vibe-payment-events', 'vibe-payment-events-stg'])

export class AccountsService extends WorkerEntrypoint<Bindings> {
  fetch(request: Request): Promise<Response> {
    return handleAccountsRequest(request, this.env, this.ctx)
  }
}

export class StellaService extends WorkerEntrypoint<Bindings> {
  fetch(request: Request): Promise<Response> {
    return handleStellaRequest(request, this.env, this.ctx)
  }
}

export class CivilService extends WorkerEntrypoint<Bindings> {
  fetch(request: Request): Promise<Response> {
    return handleCivilRequest(request, this.env, this.ctx)
  }
}

export class CivilComputationService extends WorkerEntrypoint<Bindings> implements CivilComputeGateway {
  claimCalculation(jobId: string): Promise<CivilCalculationClaim> {
    return createCivilComputationGateway(this.env, this.ctx).claimCalculation(jobId)
  }

  completeCalculation(input: { jobId: string; output: CivilCalculationOutput; outputHash: string }): Promise<void> {
    return createCivilComputationGateway(this.env, this.ctx).completeCalculation(input)
  }

  failCalculation(input: { jobId: string; failureCode: string }): Promise<void> {
    return createCivilComputationGateway(this.env, this.ctx).failCalculation(input)
  }

  claimArtifactVerification(artifactId: string): Promise<CivilArtifactVerificationClaim> {
    return createCivilComputationGateway(this.env, this.ctx).claimArtifactVerification(artifactId)
  }

  completeArtifactVerification(input: { artifactId: string; output: CivilArtifactVerificationOutput }): Promise<void> {
    return createCivilComputationGateway(this.env, this.ctx).completeArtifactVerification(input)
  }

  failArtifactVerification(input: { artifactId: string; failureCode: string }): Promise<void> {
    return createCivilComputationGateway(this.env, this.ctx).failArtifactVerification(input)
  }

  completeArtifactCleanup(artifactId: string): Promise<void> {
    return createCivilComputationGateway(this.env, this.ctx).completeArtifactCleanup(artifactId)
  }

  claimDeliveryGeneration(packageId: string): Promise<CivilDeliveryGenerationClaim> {
    return createCivilComputationGateway(this.env, this.ctx).claimDeliveryGeneration(packageId)
  }

  completeDeliveryGeneration(input: { packageId: string; output: CivilDeliveryGenerationOutput }): Promise<void> {
    return createCivilComputationGateway(this.env, this.ctx).completeDeliveryGeneration(input)
  }

  failDeliveryGeneration(input: { packageId: string; failureCode: string }): Promise<void> {
    return createCivilComputationGateway(this.env, this.ctx).failDeliveryGeneration(input)
  }

  completeDeliveryCleanup(packageId: string): Promise<void> {
    return createCivilComputationGateway(this.env, this.ctx).completeDeliveryCleanup(packageId)
  }
}

export class VibeService extends WorkerEntrypoint<Bindings> {
  fetch(request: Request): Promise<Response> {
    return handleVibeRequest(request, this.env, this.ctx)
  }
}

export class StellaMaintenance extends WorkerEntrypoint<Bindings> implements StellaMaintenanceService {
  reconcilePendingPayments(): Promise<void> {
    return reconcileStaleGuardianPayments(this.env)
  }

  purgeRetention(): Promise<void> {
    return purgeStellaRetention(this.env)
  }
}

export class VibeMaintenance extends WorkerEntrypoint<Bindings> implements VibeMaintenanceService {
  reconcilePendingPayments(): Promise<void> {
    return reconcileStaleVibePayments(this.env)
  }

  purgeRetention(): Promise<void> {
    return purgeVibeRetention(this.env)
  }
}

export default {
  async queue(batch, env, ctx): Promise<void> {
    if (ACCOUNT_EMAIL_QUEUES.has(batch.queue)) {
      for (const message of batch.messages) {
        try {
          await deliverAccountEmail(env, SobokAuthorityEmailSchema.parse(message.body))
          message.ack()
        } catch (error) {
          console.error('database.accounts_email.failed', error instanceof Error ? error.message : 'unknown')
          message.retry({ delaySeconds: 60 })
        }
      }
      return
    }

    if (STELLA_PAYMENT_QUEUES.has(batch.queue)) {
      for (const message of batch.messages) {
        try {
          await handleGuardianPaymentEvent(env, ctx, PaymentEventSchema.parse(message.body))
          message.ack()
        } catch (error) {
          console.error('database.stella_payment_event.failed', error instanceof Error ? error.message : 'unknown')
          message.retry()
        }
      }
      return
    }

    if (VIBE_PAYMENT_QUEUES.has(batch.queue)) {
      for (const message of batch.messages) {
        try {
          await handleDeepTypePaymentEvent(env, ctx, PaymentEventSchema.parse(message.body))
          message.ack()
        } catch (error) {
          console.error('database.vibe_payment_event.failed', error instanceof Error ? error.message : 'unknown')
          message.retry()
        }
      }
      return
    }

    throw new Error(`Database Worker received an unconfigured queue: ${batch.queue}`)
  },
} satisfies ExportedHandler<Bindings, unknown>
