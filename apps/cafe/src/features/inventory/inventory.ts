import {
  type Costs,
  INGREDIENTS,
  type IngredientId,
  ingredientIds,
  ingredientLifetime,
} from '../../content/ingredients'
import { expiryAt } from '../../content/lifetime'
import { uid } from '../../shared/id'
import { say } from '../../simulation/feedback'
import type { Batch, GameState } from '../../simulation/state'
import { type DripBean, isDripIngredient } from '../drip-coffee/rules'
import { consumeIce } from '../ice/rules'

export type StockArea = 'bar' | 'backroom'

export function addAmounts(target: Costs, amounts: Costs) {
  for (const id of ingredientIds) {
    const amount = amounts[id] ?? 0
    if (amount > 0) {
      target[id] = (target[id] ?? 0) + amount
    }
  }
}

export function newBatch(
  ingredient: IngredientId,
  amount: number,
  now: number,
  location: Batch['location'] = 'bar',
  sealed = false,
): Batch {
  const storage = ingredient === 'iced-coffee' && location === 'urn' ? 'room' : INGREDIENTS[ingredient].storage

  return {
    id: uid(),
    ingredient,
    amount,
    location,
    carryFrom: null,
    openedAt: sealed ? null : now,
    expiresAt: sealed ? null : expiryAt(now, ingredientLifetime(ingredient, storage)),
    storage,
    ingredientExpiresAt: null,
    labelled: location === 'bar',
    dripBean: null,
  }
}

function usableBatch(batch: Batch, ingredient: IngredientId, time: number, area: StockArea) {
  const inArea =
    area === 'bar'
      ? batch.location === 'bar' || (batch.location === 'urn' && ingredient === 'todays-coffee')
      : batch.location === 'fridge' || batch.location === 'stock'

  return (
    batch.ingredient === ingredient &&
    inArea &&
    batch.openedAt !== null &&
    batch.labelled &&
    (batch.expiresAt === null || batch.expiresAt > time)
  )
}

function usableBatches(
  state: GameState,
  ingredient: IngredientId,
  batchIds: readonly string[] | undefined,
  area: StockArea,
  dripBean: DripBean | null = null,
) {
  return state.batches.filter(
    (batch) =>
      usableBatch(batch, ingredient, state.time, area) &&
      (!batchIds || batchIds.includes(batch.id)) &&
      (!isDripIngredient(ingredient) || dripBean === null || batch.dripBean === dripBean),
  )
}

export function available(
  state: GameState,
  ingredient: IngredientId,
  batchIds?: readonly string[],
  area: StockArea = 'bar',
  dripBean: DripBean | null = null,
) {
  if (ingredient === 'ice') return state.ice.bar
  return usableBatches(state, ingredient, batchIds, area, dripBean).reduce((sum, batch) => sum + batch.amount, 0)
}

export function batchIdsFor(
  state: GameState,
  ingredient: IngredientId,
  amount: number,
  area: StockArea = 'bar',
  dripBean: DripBean | null = null,
): string[] {
  const ids: string[] = []
  let remaining = amount
  const batches = usableBatches(state, ingredient, undefined, area, dripBean).sort(
    (a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity),
  )

  for (const batch of batches) {
    if (remaining <= 1e-9) {
      break
    }
    if (batch.amount <= 0) {
      continue
    }
    ids.push(batch.id)
    remaining -= batch.amount
  }

  return ids
}

export function consume(
  state: GameState,
  costs: Costs,
  batchIds?: readonly string[],
  area: StockArea = 'bar',
  dripBean: DripBean | null = null,
): { earliestExpiry: number | null } | null {
  for (const [key, amount] of Object.entries(costs)) {
    const ingredient = key as IngredientId
    if (available(state, ingredient, batchIds, area, dripBean) + (batchIds ? 1e-9 : 0.0001) < amount) {
      const place = area === 'bar' ? '바' : '백룸'
      say(
        state,
        ingredient === 'ice'
          ? '바 아이스 빈에 얼음이 부족해요. 백룸 제빙기에서 얼음통으로 보충해주세요.'
          : `${place}에 사용할 ${INGREDIENTS[ingredient].name}가 부족해요. 재고를 확인하고 보충해주세요.`,
        'error',
      )
      return null
    }
  }

  let earliestExpiry: number | null = null

  for (const [key, amount] of Object.entries(costs)) {
    if (key === 'ice') {
      consumeIce(state, amount)
      continue
    }
    let remaining = amount
    const batches = usableBatches(state, key as IngredientId, batchIds, area, dripBean).sort(
      (a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity),
    )

    for (const batch of batches) {
      const used = Math.min(batch.amount, remaining)
      if (used > 0 && batch.expiresAt !== null) {
        earliestExpiry = Math.min(earliestExpiry ?? batch.expiresAt, batch.expiresAt)
      }
      batch.amount -= used
      remaining -= used
      if (remaining <= 0) {
        break
      }
    }
  }

  return { earliestExpiry }
}
