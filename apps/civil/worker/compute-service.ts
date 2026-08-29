import type {
  CivilArtifactVerificationClaim,
  CivilArtifactVerificationGateway,
  CivilArtifactVerificationOutput,
} from '@sobok/civil/artifact'
import type { CivilCalculationClaim, CivilCalculationOutput, CivilComputationGateway } from '@sobok/civil/calculation'
import type {
  CivilDeliveryGenerationClaim,
  CivilDeliveryGenerationGateway,
  CivilDeliveryGenerationOutput,
} from '@sobok/civil/delivery'
import { openDb, withDb } from '@sobok/edge/db/client'
import {
  claimArtifactVerification,
  completeArtifactCleanup,
  completeArtifactVerification,
  failArtifactVerification,
} from './db/queries/artifact-verification'
import { claimCalculation, completeCalculation, failCalculation } from './db/queries/calculation'
import {
  claimDeliveryGeneration,
  completeDeliveryCleanup,
  completeDeliveryGeneration,
  failDeliveryGeneration,
} from './db/queries/delivery-generation'
import type { Bindings } from './env'

export type CivilComputeGateway = CivilComputationGateway &
  CivilArtifactVerificationGateway &
  CivilDeliveryGenerationGateway

export function createCivilComputationGateway(env: Bindings, ctx: ExecutionContext): CivilComputeGateway {
  return {
    claimCalculation(jobId: string): Promise<CivilCalculationClaim> {
      return withDb(openDb(env.HYPERDRIVE_FRESH), ctx, (db) => claimCalculation(db, jobId))
    },
    completeCalculation(input: { jobId: string; output: CivilCalculationOutput; outputHash: string }): Promise<void> {
      return withDb(openDb(env.HYPERDRIVE_FRESH), ctx, (db) => completeCalculation(db, input))
    },
    failCalculation(input: { jobId: string; failureCode: string }): Promise<void> {
      return withDb(openDb(env.HYPERDRIVE_FRESH), ctx, (db) => failCalculation(db, input))
    },
    claimArtifactVerification(artifactId: string): Promise<CivilArtifactVerificationClaim> {
      return withDb(openDb(env.HYPERDRIVE_FRESH), ctx, (db) => claimArtifactVerification(db, artifactId))
    },
    completeArtifactVerification(input: {
      artifactId: string
      output: CivilArtifactVerificationOutput
    }): Promise<void> {
      return withDb(openDb(env.HYPERDRIVE_FRESH), ctx, (db) => completeArtifactVerification(db, input))
    },
    failArtifactVerification(input: { artifactId: string; failureCode: string }): Promise<void> {
      return withDb(openDb(env.HYPERDRIVE_FRESH), ctx, (db) => failArtifactVerification(db, input))
    },
    completeArtifactCleanup(artifactId: string): Promise<void> {
      return withDb(openDb(env.HYPERDRIVE_FRESH), ctx, (db) => completeArtifactCleanup(db, artifactId))
    },
    claimDeliveryGeneration(packageId: string): Promise<CivilDeliveryGenerationClaim> {
      return withDb(openDb(env.HYPERDRIVE_FRESH), ctx, (db) => claimDeliveryGeneration(db, packageId))
    },
    completeDeliveryGeneration(input: { packageId: string; output: CivilDeliveryGenerationOutput }): Promise<void> {
      return withDb(openDb(env.HYPERDRIVE_FRESH), ctx, (db) => completeDeliveryGeneration(db, input))
    },
    failDeliveryGeneration(input: { packageId: string; failureCode: string }): Promise<void> {
      return withDb(openDb(env.HYPERDRIVE_FRESH), ctx, (db) => failDeliveryGeneration(db, input))
    },
    completeDeliveryCleanup(packageId: string): Promise<void> {
      return withDb(openDb(env.HYPERDRIVE_FRESH), ctx, (db) => completeDeliveryCleanup(db, packageId))
    },
  }
}
