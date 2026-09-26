import { INGREDIENTS } from '../../content/ingredients'
import { expiryAt } from '../../content/lifetime'
import type { Batch, GameState } from '../../simulation/state'

export const carriedBatch = (state: GameState) => state.batches.find((batch) => batch.location === 'hand')

export const batchOrigin = (batch: Batch) =>
  batch.ingredient === 'coldBrew' ? ('cold-prep' as const) : ('prep' as const)

export const batchDestination = (batch: Batch) =>
  INGREDIENTS[batch.ingredient].storage === 'fridge' ? ('stock' as const) : ('shelf' as const)

export function batchTitle(batch: Batch, expired: boolean, readyTitle: string) {
  if (expired) {
    return '기한 만료'
  }
  return batch.labelled ? readyTitle : '라벨 부착'
}

/** A prepared batch expires early when one of its raw ingredients would expire before its own shelf life. */
export function limitedByIngredient(batch: Batch) {
  const definition = INGREDIENTS[batch.ingredient]
  const usualExpiry = batch.openedAt === null ? null : expiryAt(batch.openedAt, definition.lifetime)

  return !!definition.prepared && batch.expiresAt !== null && usualExpiry !== null && batch.expiresAt < usualExpiry
}
