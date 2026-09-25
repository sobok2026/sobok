import type { IngredientId } from '../content/ingredients'
import { type StationId, tableIds } from '../content/stations'
import { cleaningHandsBusy } from '../features/cleaning/rules'
import { nextStep, operationFor } from '../features/crafting/rules'
import { batchDestination, batchOrigin, carriedBatch } from '../features/inventory/batches'
import { cleanCupCount, cupCount, cupKindFor, isReusableCup } from '../features/inventory/cups'
import { available } from '../features/inventory/inventory'
import { supplyIds } from '../features/inventory/supplies'
import { preparationStep } from '../features/preparation/rules'
import { washDestination, washItems, washStock } from '../features/washing/rules'
import type { GameState } from './state'

function plannedStation(state: GameState): StationId {
  const carrying = carriedBatch(state)
  if (carrying)
    return carrying.expiresAt !== null && carrying.expiresAt <= state.time
      ? batchOrigin(carrying)
      : batchDestination(carrying)
  if (state.supplyDelivery) return 'condiment'
  if (cleaningHandsBusy(state.cleaning)) return cupCount(state.cleaning!.heldCups) ? 'wash' : state.cleaning!.station
  if (state.washing) return state.washing.stage === 'carrying' ? washDestination(state.washing.item) : 'wash'
  if (state.cleaning && state.cup?.craft.location !== 'hand' && !state.cup?.craft.tool && !state.preparation?.tool)
    return state.cleaning.station
  if (state.preparation) {
    const prep = state.preparation
    const operation = preparationStep(prep)
    if (
      prep.stage === 'measuring' &&
      !prep.fault &&
      operation.ingredient &&
      available(state, operation.ingredient) + 0.0001 <
        Math.max(0, operation.target - prep.progress) * (operation.perUnit ?? 1)
    )
      return 'stock'
    return 'prep'
  }
  if (state.coldBrew && state.coldBrew.stage !== 'extracting') return 'cold-prep'
  const step = nextStep(state)
  if (step) {
    const craft = state.cup!.craft
    const op = operationFor(state.cup!.recipe, state.cup!.step, craft)!
    if (craft.fault) return craft.location === 'hand' ? 'trash' : craft.location
    if (craft.location !== 'hand' && craft.location !== step.station) return craft.location
    if ((step.usesPitcher || op.tool === 'pitcher') && !craft.pitcherReserved && !state.tools.clean) return 'wash'
    for (const [key, fullAmount] of Object.entries(step.costs)) {
      const amount = fullAmount * (op.kind === 'shake' ? 1 : Math.max(0, 1 - craft.progress / op.target))
      if (available(state, key as IngredientId) + 0.0001 >= amount) continue
      const pending = state.batches.find(
        (batch) =>
          batch.ingredient === key &&
          batch.amount > 0 &&
          batch.openedAt !== null &&
          batch.location !== 'bar' &&
          batch.expiresAt !== null &&
          batch.expiresAt > state.time,
      )
      if (pending)
        return pending.location === 'prep' ? 'prep' : pending.location === 'cold-prep' ? 'cold-prep' : 'stock'
      if (key === 'foam' || key === 'mocha' || key === 'hojicha') return state.tools.clean ? 'prep' : 'wash'
      if (key === 'coldBrew') return 'cold-prep'
      return 'stock'
    }
    return step.station
  }
  if (state.cup)
    return state.cup.craft.location !== 'hand' && state.cup.craft.location !== 'pickup'
      ? state.cup.craft.location
      : 'pickup'
  if (state.ticket) {
    const kind = cupKindFor(state.ticket.recipe, state.ticket.service)
    if (cleanCupCount(state, kind)) return 'cups'
    if (!isReusableCup(kind)) return 'stock'
    if (state.reusableCups[kind].dirty || state.reusableCups[kind].washed) return 'wash'
    if (state.condiment.cups[kind]) return 'condiment'
    return tableIds.find((id) => state.tables[id].cups[kind]) ?? 'wash'
  }
  if (state.phase === 'closing') {
    if (washItems.some((item) => washStock(state, item).dirty)) return 'wash'
    if (washItems.some((item) => washStock(state, item).washed)) return 'wash'
    const dirtyTable = tableIds.find((id) => state.tables[id].dirty || cupCount(state.tables[id].cups))
    if (dirtyTable) return dirtyTable
    if (cupCount(state.condiment.cups) || state.condiment.dirty) return 'condiment'
    if (state.dirtyBar) return 'mix'
    if (state.trash) return 'trash'
    if (state.batches.some((b) => b.amount > 0 && b.expiresAt !== null && b.expiresAt <= state.time)) return 'stock'
    if (state.batches.some((b) => b.amount > 0 && b.openedAt !== null && b.location !== 'bar')) return 'stock'
    if (state.customer) return 'pos'
  }
  if (state.phase === 'open' && supplyIds.some((id) => !state.supplies[id].bar)) return 'stock'
  if (state.customer?.visit || state.customer?.stage === 'leaving') {
    if (washItems.some((item) => washStock(state, item).dirty || washStock(state, item).washed)) return 'wash'
    const dirtyTable = tableIds.find((id) => state.tables[id].dirty || cupCount(state.tables[id].cups))
    if (dirtyTable) return dirtyTable
    if (cupCount(state.condiment.cups) || state.condiment.dirty) return 'condiment'
    if (state.dirtyBar) return 'mix'
    if (state.trash) return 'trash'
    return 'stock'
  }
  return 'pos'
}
export function suggestedStation(state: GameState): StationId {
  const destination = plannedStation(state)
  if (state.cup?.craft.location === 'hand' && ['prep', 'cold-prep', 'wash', 'rack'].includes(destination))
    return nextStep(state)?.station ?? 'pickup'
  return destination
}
