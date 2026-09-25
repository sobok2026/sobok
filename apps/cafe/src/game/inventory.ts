import { type Costs, INGREDIENTS, type IngredientId, ingredientIds } from './catalog'
import { say } from './feedback'
import { expiryAt } from './quality'
import { type Batch, type GameState, uid } from './state'

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

export function available(state: GameState, ingredient: IngredientId) {
  return state.batches
    .filter((batch) => usableBatch(batch, ingredient, state.time))
    .reduce((sum, batch) => sum + batch.amount, 0)
}
export function consume(state: GameState, costs: Costs): { earliestExpiry: number | null } | null {
  for (const [key, amount] of Object.entries(costs)) {
    const ingredient = key as IngredientId
    if (available(state, ingredient) + 0.0001 < amount) {
      say(state, `${INGREDIENTS[ingredient].name}가 부족해요. 준비대 또는 창고에서 보충해주세요.`, 'error')
      return null
    }
  }
  let earliestExpiry: number | null = null
  for (const [key, amount] of Object.entries(costs)) {
    let remaining = amount
    const batches = state.batches
      .filter((batch) => usableBatch(batch, key as IngredientId, state.time))
      .sort((a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity))
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
