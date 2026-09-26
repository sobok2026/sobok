import { INGREDIENTS, type IngredientId } from '../../content/ingredients'
import { expiryAt } from '../../content/lifetime'
import type { Batch, GameState } from '../../simulation/state'

export const carriedBatch = (state: GameState) => state.batches.find((batch) => batch.location === 'hand')

/** An unopened pack; a carried one is a delivery the player still has to put away. */
export const isSealed = (batch: Batch) => batch.openedAt === null

/** Only chilled goods go in the fridge; everything else waits in the storeroom. */
export const packStorage = (ingredient: IngredientId) =>
  INGREDIENTS[ingredient].storage === 'fridge' ? ('fridge' as const) : ('stock' as const)

export const batchOrigin = (batch: Batch) =>
  batch.ingredient === 'coldBrew' ? ('cold-prep' as const) : ('prep' as const)

export const batchDestination = (batch: Batch) =>
  INGREDIENTS[batch.ingredient].storage === 'fridge' ? ('fridge' as const) : ('shelf' as const)

/** Where an ingredient is kept once it is ready: chilled goods in the fridge, room-temperature mixes on the shelf. */
export function materialHome(ingredient: IngredientId) {
  if (INGREDIENTS[ingredient].storage === 'fridge') {
    return 'fridge' as const
  }
  return INGREDIENTS[ingredient].prepared ? ('shelf' as const) : ('stock' as const)
}

/** The station that shows a batch and where it can be discarded, or null while it is carried. */
export function batchHome(batch: Batch) {
  if (batch.location === 'hand') {
    return null
  }
  return batch.location === 'bar' ? materialHome(batch.ingredient) : batch.location
}

/** A prepared batch expires early when one of its raw ingredients would expire before its own shelf life. */
export function limitedByIngredient(batch: Batch) {
  const definition = INGREDIENTS[batch.ingredient]
  const usualExpiry = batch.openedAt === null ? null : expiryAt(batch.openedAt, definition.lifetime)

  return !!definition.prepared && batch.expiresAt !== null && usualExpiry !== null && batch.expiresAt < usualExpiry
}
