import type { GameState } from '../../simulation/state'
import { FOODS } from './catalog'
import type { FoodBatch, FoodLine } from './model'

export function foodQuantity(
  state: Pick<GameState, 'foodBatches' | 'time'>,
  productId: string,
  location?: FoodBatch['location'],
) {
  return state.foodBatches.reduce(
    (sum, batch) =>
      sum +
      (batch.productId === productId && (!location || batch.location === location) && batch.expiresAt > state.time
        ? batch.quantity
        : 0),
    0,
  )
}

export function currentFood(state: Pick<GameState, 'sale'>): FoodLine | null {
  return state.sale?.acceptedAt != null
    ? (state.sale.foodLines.find((line) => line.served < line.quantity) ?? null)
    : null
}

export function foodOrderAvailable(state: GameState) {
  const needed = new Map<string, number>()

  for (const line of state.sale?.foodLines ?? [])
    needed.set(line.productId, (needed.get(line.productId) ?? 0) + line.quantity - line.served)

  if (state.foodWork) needed.set(state.foodWork.productId, Math.max(0, (needed.get(state.foodWork.productId) ?? 0) - 1))
  return [...needed].every(([id, count]) => foodQuantity(state, id) >= count)
}

export function foodDescription(line: Pick<FoodLine, 'productId' | 'warmed'>) {
  return `${FOODS[line.productId]?.name ?? line.productId}${line.warmed ? ' · 데워서' : ' · 그대로'}`
}

export function settleFood(state: GameState) {
  const work = state.foodWork

  if (work?.stage === 'heating' && work.heatingEndsAt !== null && work.heatingEndsAt <= state.time) {
    work.stage = 'heated'
    work.heatingEndsAt = null
  }
}
