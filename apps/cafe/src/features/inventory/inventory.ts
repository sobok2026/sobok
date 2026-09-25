import { type Costs, INGREDIENTS, type IngredientId, ingredientIds } from '../../content/ingredients'
import { expiryAt } from '../../content/lifetime'
import { uid } from '../../shared/id'
import { say } from '../../simulation/feedback'
import type { Batch, GameState } from '../../simulation/state'

export function addAmounts(target: Costs, amounts: Costs) {
  for (const id of ingredientIds) {
    const amount = amounts[id] ?? 0
    if (amount > 0) target[id] = (target[id] ?? 0) + amount
  }
}
export function newBatch(
  ingredient: IngredientId,
  amount: number,
  now: number,
  location: Batch['location'] = 'bar',
): Batch {
  return {
    id: uid(),
    ingredient,
    amount,
    location,
    openedAt: location !== 'stock' ? now : null,
    expiresAt: location !== 'stock' ? expiryAt(now, INGREDIENTS[ingredient].lifetime) : null,
    labelled: location === 'bar',
  }
}
function usableBatch(batch: Batch, ingredient: IngredientId, time: number) {
  return (
    batch.ingredient === ingredient &&
    batch.location === 'bar' &&
    batch.labelled &&
    (batch.expiresAt === null || batch.expiresAt > time)
  )
}

function usableBatches(state: GameState, ingredient: IngredientId, batchIds?: readonly string[]) {
  return state.batches.filter(
    (batch) => usableBatch(batch, ingredient, state.time) && (!batchIds || batchIds.includes(batch.id)),
  )
}
export function available(state: GameState, ingredient: IngredientId, batchIds?: readonly string[]) {
  return usableBatches(state, ingredient, batchIds).reduce((sum, batch) => sum + batch.amount, 0)
}
export function batchIdsFor(state: GameState, ingredient: IngredientId, amount: number): string[] {
  const ids: string[] = []
  let remaining = amount
  const batches = usableBatches(state, ingredient).sort((a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity))
  for (const batch of batches) {
    if (remaining <= 1e-9) break
    if (batch.amount <= 0) continue
    ids.push(batch.id)
    remaining -= batch.amount
  }
  return ids
}
export function consume(
  state: GameState,
  costs: Costs,
  batchIds?: readonly string[],
): { earliestExpiry: number | null } | null {
  for (const [key, amount] of Object.entries(costs)) {
    const ingredient = key as IngredientId
    if (available(state, ingredient, batchIds) + (batchIds ? 1e-9 : 0.0001) < amount) {
      say(state, `${INGREDIENTS[ingredient].name}가 부족해요. 준비대 또는 창고에서 보충해주세요.`, 'error')
      return null
    }
  }
  let earliestExpiry: number | null = null
  for (const [key, amount] of Object.entries(costs)) {
    let remaining = amount
    const batches = usableBatches(state, key as IngredientId, batchIds).sort(
      (a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity),
    )
    for (const batch of batches) {
      const used = Math.min(batch.amount, remaining)
      if (used > 0 && batch.expiresAt !== null)
        earliestExpiry = Math.min(earliestExpiry ?? batch.expiresAt, batch.expiresAt)
      batch.amount -= used
      remaining -= used
      if (remaining <= 0) break
    }
  }
  return { earliestExpiry }
}
