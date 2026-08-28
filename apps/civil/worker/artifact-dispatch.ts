import { openDb, withDb } from '@sobok/edge/db/client'
import {
  listUndispatchedArtifactInspections,
  markArtifactInspectionDispatchedBySystem,
  markArtifactInspectionDispatchFailedBySystem,
} from './db/queries/artifact-inspection'
import type { Bindings } from './env'

export function dispatchPendingArtifactInspections(env: Bindings, ctx: ExecutionContext): Promise<void> {
  return withDb(openDb(env.HYPERDRIVE_FRESH), ctx, async (db) => {
    const pending = await listUndispatchedArtifactInspections(db)
    for (const item of pending) {
      try {
        await env.CIVIL_ARTIFACT_QUEUE.send({ artifactId: item.artifactId }, { contentType: 'json' })
        await markArtifactInspectionDispatchedBySystem(db, item.artifactId)
      } catch (error) {
        console.error(
          JSON.stringify({
            event: 'civil.artifact.dispatch_failed',
            artifactId: item.artifactId,
            error: error instanceof Error ? error.message : 'unknown',
          }),
        )
        await markArtifactInspectionDispatchFailedBySystem(db, item.artifactId)
      }
    }
  })
}
