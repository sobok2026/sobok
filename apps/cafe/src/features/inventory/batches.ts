import { z } from 'zod'
import storageData from '../../../data/shop/storage.json'
import { INGREDIENTS, type IngredientId, type IngredientStorage, ingredientLifetime } from '../../content/ingredients'
import { expiryAt } from '../../content/lifetime'
import type { StationId } from '../../content/stations'
import type { Batch, GameState } from '../../simulation/state'
import { DRIP_BEANS, type DripBean, isDripIngredient } from '../drip-coffee/rules'
import { available, batchIdsFor, type StockArea } from './inventory'

export const batchName = (batch: Batch) =>
  batch.dripBean
    ? `${INGREDIENTS[batch.ingredient].name} · ${DRIP_BEANS[batch.dripBean]}`
    : INGREDIENTS[batch.ingredient].name

export const storageStations = ['fridge', 'stock', 'bar-fridge', 'shelf'] as const
export type StorageStation = (typeof storageStations)[number]
export const BAR_BATCH_CAPACITY = z.number().int().positive().parse(storageData.barContainersPerMaterial)
export const barBatchCount = (state: GameState, ingredient: IngredientId): number =>
  state.batches.filter((batch) => batch.ingredient === ingredient && batch.location === 'bar' && batch.amount > 0)
    .length
export const isStorageStation = (station: StationId): station is StorageStation =>
  storageStations.some((id) => id === station)

export const carriedBatch = (state: GameState) => state.batches.find((batch) => batch.location === 'hand')

export const isSealed = (batch: Batch) => batch.openedAt === null

export function dispensingFill(state: GameState, ingredient: IngredientId, area: StockArea = 'bar') {
  const [id] = batchIdsFor(state, ingredient, 1, area)
  const batch = state.batches.find((entry) => entry.id === id)
  return Math.min(1, (batch?.amount ?? 0) / INGREDIENTS[ingredient].pack)
}

export const packStorage = (ingredient: IngredientId) =>
  INGREDIENTS[ingredient].storage === 'fridge' ? ('fridge' as const) : ('stock' as const)

export const batchLifetime = (batch: Batch) => ingredientLifetime(batch.ingredient, batch.storage)
export const reserveStorage = (batch: Batch) =>
  (INGREDIENTS[batch.ingredient].closingStorage ?? batch.storage) === 'fridge'
    ? ('fridge' as const)
    : ('stock' as const)

export function batchOrigin(batch: Batch): StationId {
  if (batch.carryFrom === 'bar') return materialHome(batch.ingredient, batch.storage)
  if (batch.carryFrom) return batch.carryFrom
  return batch.ingredient === 'cold-brew' ? 'cold-prep' : 'prep'
}

export const batchDestination = (batch: Batch) =>
  batch.carryFrom === 'bar' ? reserveStorage(batch) : materialHome(batch.ingredient, batch.storage)

export function deliveryDestination(state: GameState, batch: Batch) {
  const destination = batchDestination(batch)
  return destination === materialHome(batch.ingredient, batch.storage) &&
    barBatchCount(state, batch.ingredient) >= BAR_BATCH_CAPACITY
    ? reserveStorage(batch)
    : destination
}

export function materialHome(ingredient: IngredientId, storage: IngredientStorage = INGREDIENTS[ingredient].storage) {
  if (ingredient === 'todays-coffee') return 'urn' as const
  if (storage === 'fridge') {
    return 'bar-fridge' as const
  }
  return 'shelf' as const
}

export function materialSource(
  state: GameState,
  ingredient: IngredientId,
  area: StockArea = 'bar',
  needed = 0,
  dripBean: DripBean | null = null,
) {
  const batches = state.batches.filter(
    (batch) =>
      batch.ingredient === ingredient &&
      batch.amount > 0 &&
      batch.location !== 'hand' &&
      (!isDripIngredient(ingredient) || dripBean === null || batch.dripBean === dripBean) &&
      (batch.expiresAt === null || batch.expiresAt > state.time),
  )
  const outside = (batch: Batch) =>
    area === 'bar'
      ? batch.location !== 'bar'
      : batch.location === 'bar' ||
        batch.location === 'prep' ||
        batch.location === 'cold-prep' ||
        batch.location === 'grinder'

  if (area === 'backroom') {
    const local = batches.filter((batch) => batch.location === 'fridge' || batch.location === 'stock')
    const unopened = local.find((batch) => !batch.labelled && !isSealed(batch)) ?? local.find(isSealed)
    if (unopened) return unopened
  }

  const remaining = Math.max(0, needed - available(state, ingredient, undefined, area, dripBean))
  const lastBarSlot = area === 'bar' && barBatchCount(state, ingredient) === BAR_BATCH_CAPACITY - 1
  const ready = batches
    .filter((batch) => !isSealed(batch) && batch.labelled && outside(batch))
    .sort((a, b) => b.amount - a.amount)

  return (
    ready.find((batch) => !lastBarSlot || batch.amount >= remaining) ??
    batches.find((batch) => !isSealed(batch) && !batch.labelled) ??
    batches.find(isSealed)
  )
}

export function batchHome(batch: Batch) {
  if (batch.location === 'hand') {
    return null
  }
  return batch.location === 'bar' ? materialHome(batch.ingredient, batch.storage) : batch.location
}

export function limitedByIngredient(batch: Batch) {
  const definition = INGREDIENTS[batch.ingredient]
  const usualExpiry = batch.openedAt === null ? null : expiryAt(batch.openedAt, batchLifetime(batch))

  return (
    !!definition.prepared &&
    batch.ingredientExpiresAt !== null &&
    usualExpiry !== null &&
    batch.ingredientExpiresAt < usualExpiry
  )
}
