import { INGREDIENTS } from '../../content/ingredients'
import { expiryAt } from '../../content/lifetime'
import type { StationId } from '../../content/stations'
import { craftStations, nextStep } from '../../features/crafting/rules'
import { carriedBatch } from '../../features/inventory/batches'
import { cleanCupCount, cupCount, cupKindFor } from '../../features/inventory/cups'
import { washDestination } from '../../features/washing/rules'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'

export function interactionAt(current: GameState, id: StationId): Action | 'work' | 'panel' {
  const carrying = carriedBatch(current)
  if (carrying && id !== 'pos') {
    if (id === 'stock' || id === 'shelf')
      return { type: 'store-batch', id: carrying.id, storage: id === 'stock' ? 'fridge' : 'room', station: id }
    else return { type: 'return-batch', station: id }
  }
  if (current.supplyDelivery && (id === 'condiment' || id === 'stock')) {
    return { type: id === 'condiment' ? 'place-supply' : 'return-supply' }
  }
  if (id === 'wash' && cupCount(current.cleaning?.heldCups)) {
    return { type: 'drop-used-cups' }
  }
  if (id === current.cleaning?.station) {
    if (current.cleaning.stage === 'collect') return { type: 'collect-cup' }
    else return 'work'
  }
  if (id === 'wash' && current.washing) {
    if (current.washing.stage === 'ready') return { type: 'take-washed', item: current.washing.item }
    else if (current.washing.stage === 'carrying') return { type: 'leave-wash' }
    else return 'work'
  }
  if (current.washing?.stage === 'carrying' && id === washDestination(current.washing.item)) {
    return { type: 'store-washed', station: id }
  }
  if (id === 'prep' && current.preparation) {
    const batch = current.batches.find((item) => item.id === current.preparation?.batchId)
    if (batch?.labelled && batch.expiresAt !== null && batch.expiresAt > current.time)
      return { type: 'take-batch', id: batch.id, station: id }
    else return 'work'
  }
  if (id === 'cold-prep' && current.coldBrew) {
    const batch = current.batches.find((item) => item.id === current.coldBrew?.batchId)
    if (current.coldBrew.stage === 'finished') return { type: 'collect-cold-brew' }
    else if (batch?.labelled && batch.expiresAt !== null && batch.expiresAt > current.time)
      return { type: 'take-batch', id: batch.id, station: id }
    else return 'work'
  }
  if (
    id === 'cups' &&
    current.ticket &&
    !current.cup &&
    cleanCupCount(current, cupKindFor(current.ticket.recipe, current.ticket.service)) > 0
  ) {
    return { type: 'take-cup' }
  }
  if (
    current.cup &&
    craftStations.includes(id) &&
    (current.cup.craft.location === 'hand' || current.cup.craft.location === id)
  ) {
    return current.cup.craft.location === 'hand'
      ? { type: 'place-cup', station: id }
      : { type: 'pick-cup', station: id }
  }
  return 'panel'
}

export function workActionAt(state: GameState, station: StationId): Action {
  if (station === state.cleaning?.station) return { type: 'clean-use' }
  else if (station === 'wash' && state.washing) return { type: 'wash-use' }
  else if (station === 'prep' && state.preparation) return { type: 'prep-use' }
  else if (station === 'cold-prep' && state.coldBrew) return { type: 'cold-use' }
  else return { type: 'use-start', station }
}

export function toolAt(state: GameState, station: StationId): Action {
  if (station === state.cleaning?.station) return { type: 'clean-tool' }
  else if (station === 'wash' && state.washing) return { type: 'wash-tool' }
  else if (station === 'prep' && state.preparation) return { type: 'prep-tool' }
  else if (station === 'cold-prep' && state.coldBrew) return { type: 'cold-tool' }
  else return { type: 'tool', station }
}

export function confirmationAt(state: GameState, station: StationId): Action {
  if (station === state.cleaning?.station) {
    return { type: 'clean-confirm' }
  }
  const washing = state.washing
  if (washing?.stage === 'carrying' && station === washDestination(washing.item)) {
    return { type: 'store-washed', station }
  }
  if (station === 'wash' && washing) {
    if (washing.stage === 'ready') return { type: 'take-washed', item: washing.item }
    else return { type: 'wash-confirm' }
  }
  const prep = state.preparation
  if (station === 'prep' && prep) {
    if (prep.fault) return { type: 'discard-preparation' }
    else if (prep.stage === 'ready' && prep.batchId) {
      const batch = state.batches.find((item) => item.id === prep.batchId)
      return {
        type: batch?.expiresAt != null && batch.expiresAt <= state.time ? 'discard-batch' : 'label-batch',
        id: prep.batchId,
        station,
      }
    } else return { type: 'prep-confirm' }
  }
  const brew = state.coldBrew
  if (station === 'cold-prep' && brew) {
    if (brew.fault) return { type: 'discard-cold-brew' }
    else if (brew.stage === 'finished')
      return {
        type:
          brew.completedAt !== null && expiryAt(brew.completedAt, INGREDIENTS.coldBrew.lifetime) <= state.time
            ? 'discard-cold-brew'
            : 'collect-cold-brew',
      }
    else if (brew.stage === 'ready' && brew.batchId) {
      const batch = state.batches.find((item) => item.id === brew.batchId)
      return {
        type: batch?.expiresAt != null && batch.expiresAt <= state.time ? 'discard-batch' : 'label-batch',
        id: brew.batchId,
        station,
      }
    } else return { type: 'cold-confirm' }
  }
  if (state.cup?.craft.fault) return { type: 'discard-cup' }
  else if (state.cup && !nextStep(state) && station === 'pickup') return { type: 'serve' }
  else return { type: 'confirm-craft', station }
}
