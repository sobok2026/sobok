import { INGREDIENTS } from '../../content/ingredients'
import type { Batch, GameState } from '../../simulation/state'

export const carriedBatch = (state: GameState) => state.batches.find((batch) => batch.location === 'hand')
export const batchOrigin = (batch: Batch) =>
  batch.ingredient === 'coldBrew' ? ('cold-prep' as const) : ('prep' as const)
export const batchDestination = (batch: Batch) =>
  INGREDIENTS[batch.ingredient].storage === 'fridge' ? ('stock' as const) : ('shelf' as const)
