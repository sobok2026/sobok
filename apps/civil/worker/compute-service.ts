import type { CivilArtifactInspectionGateway } from '@sobok/civil/artifact'
import type { CivilCalculationClaim, CivilCalculationOutput, CivilComputationGateway } from '@sobok/civil/calculation'
import { openDb, withDb } from '@sobok/edge/db/client'
import {
  claimArtifactInspection,
  completeArtifactInspection,
  failArtifactInspection,
} from './db/queries/artifact-inspection'
import { claimCalculation, completeCalculation, failCalculation } from './db/queries/calculation'
import type { Bindings } from './env'

export type CivilComputeGateway = CivilComputationGateway & CivilArtifactInspectionGateway

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
    claimArtifactInspection(artifactId) {
      return withDb(openDb(env.HYPERDRIVE_FRESH), ctx, (db) => claimArtifactInspection(db, artifactId))
    },
    completeArtifactInspection(input) {
      return withDb(openDb(env.HYPERDRIVE_FRESH), ctx, (db) => completeArtifactInspection(db, input))
    },
    failArtifactInspection(input) {
      return withDb(openDb(env.HYPERDRIVE_FRESH), ctx, (db) => failArtifactInspection(db, input))
    },
  }
}
