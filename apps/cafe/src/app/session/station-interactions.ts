import { INGREDIENTS } from '../../content/ingredients'
import { expiryAt } from '../../content/lifetime'
import { recipeCup } from '../../content/recipes'
import { isCupSurface, isTable, type StationId } from '../../content/stations'
import { needsCleaning } from '../../features/cleaning/rules'
import {
  craftStations,
  craftWorkStation,
  cupRecipe,
  heldVessel,
  nextStep,
  vesselToPick,
} from '../../features/crafting/rules'
import { batchOrigin, carriedBatch, isSealed, isStorageStation } from '../../features/inventory/batches'
import { cupCount } from '../../features/inventory/cups'
import { preparationStation } from '../../features/preparation/rules'
import { currentTicket } from '../../features/service/orders'
import { washDestination, washQueue } from '../../features/washing/rules'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'

export type Interaction = Action | 'work' | 'panel' | null

export function interactionAt(current: GameState, id: StationId): Interaction {
  const carrying = carriedBatch(current)
  if (carrying && id !== 'pos') {
    if (isSealed(carrying)) {
      return id === 'fridge' || id === 'stock' ? { type: 'shelve-pack', station: id } : null
    }
    if (id === batchOrigin(carrying)) return { type: 'return-batch', station: id }
    if (isStorageStation(id)) {
      return { type: 'store-batch', id: carrying.id, station: id }
    }
    return null
  }
  if (current.cupDelivery && (id === 'cups' || id === 'stock')) {
    return { type: id === 'cups' ? 'place-cups' : 'return-cups' }
  }
  if (current.supplyDelivery && (id === 'supplies' || id === 'stock')) {
    return { type: id === 'supplies' ? 'place-supply' : 'return-supply' }
  }
  if (id === 'wash' && cupCount(current.cleaning?.heldCups)) {
    return { type: 'drop-used-cups' }
  }
  if (id === current.cleaning?.station) {
    return current.cleaning.stage === 'collect' ? { type: 'collect-cup' } : 'work'
  }
  if (id === 'wash' && current.washing) {
    if (current.washing.stage === 'ready') {
      return { type: 'take-washed', item: current.washing.item }
    }
    return current.washing.stage === 'carrying' ? { type: 'leave-wash' } : 'work'
  }
  if (current.washing?.stage === 'carrying' && id === washDestination(current.washing.item)) {
    return { type: 'store-washed', station: id }
  }

  if (current.preparation && id === preparationStation(current.preparation)) {
    const batch = current.batches.find((item) => item.id === current.preparation?.batchId)
    if (batch?.labelled && batch.expiresAt !== null && batch.expiresAt > current.time) {
      return { type: 'take-batch', id: batch.id, station: id }
    }
    return id === 'grinder' ? 'panel' : 'work'
  }

  if (id === 'cold-prep' && current.coldBrew) {
    const batch = current.batches.find((item) => item.id === current.coldBrew?.batchId)
    if (current.coldBrew.stage === 'finished') {
      return { type: 'collect-cold-brew' }
    }
    return batch?.labelled && batch.expiresAt !== null && batch.expiresAt > current.time
      ? { type: 'take-batch', id: batch.id, station: id }
      : 'work'
  }

  const cup = current.cup
  if (id === 'printer') {
    return cup?.craft.location === 'hand' && !cup.craft.sticker ? { type: 'attach-sticker' } : null
  }
  if (cup && craftStations.includes(id)) {
    if (cup.craft.location === 'hand') {
      return { type: 'place-cup', station: id }
    }
    if (heldVessel(cup)) {
      return { type: 'place-vessel', station: id }
    }
    const vessel = vesselToPick(current, id)
    if (vessel) {
      return vessel === cupRecipe(cup).vesselId
        ? { type: 'pick-cup', station: id }
        : { type: 'pick-vessel', station: id, vessel }
    }
    if (craftWorkStation(current) === id) {
      return 'work'
    }
  }
  return stationDefault(current, id)
}

const panelStations: StationId[] = [
  'pos',
  'cups',
  'fridge',
  'stock',
  'bar-fridge',
  'shelf',
  'prep',
  'cold-prep',
  'urn',
  'grinder',
]

function stationDefault(state: GameState, id: StationId): Interaction {
  if (panelStations.includes(id)) {
    return 'panel'
  }
  if (isCupSurface(id) || id === 'mix' || id === 'trash') {
    return isTable(id) || needsCleaning(state, id) ? { type: 'start-cleaning', station: id } : null
  }
  if (id === 'wash') {
    return washInteraction(state)
  }
  return null
}

function washInteraction(state: GameState): Interaction {
  const ticket = currentTicket(state)
  const queue = washQueue(state, ticket ? recipeCup(ticket.recipe, ticket.size, ticket.service) : null)
  const actions = queue.flatMap(({ dirtyItem, washedItem }): Action[] => [
    ...(dirtyItem ? [{ type: 'wash' as const, item: dirtyItem }] : []),
    ...(washedItem ? [{ type: 'take-washed' as const, item: washedItem }] : []),
  ])
  if (actions.length > 1) {
    return 'panel'
  }
  return actions[0] ?? null
}

export function workActionAt(state: GameState, station: StationId): Action {
  if (station === state.cleaning?.station) {
    return { type: 'clean-use' }
  } else if (station === 'wash' && state.washing) {
    return { type: 'wash-use' }
  } else if (station === 'prep' && state.preparation && preparationStation(state.preparation) === 'prep') {
    return { type: 'prep-use' }
  } else if (station === 'cold-prep' && state.coldBrew) {
    return { type: 'cold-use' }
  } else {
    return { type: 'use-start', station }
  }
}

export function toolAt(state: GameState, station: StationId): Action {
  if (station === state.cleaning?.station) {
    return { type: 'clean-tool' }
  } else if (station === 'wash' && state.washing) {
    return { type: 'wash-tool' }
  } else if (station === 'prep' && state.preparation && preparationStation(state.preparation) === 'prep') {
    return { type: 'prep-tool' }
  } else if (station === 'cold-prep' && state.coldBrew) {
    return { type: 'cold-tool' }
  } else {
    return { type: 'tool', station }
  }
}

export function confirmationAt(state: GameState, station: StationId): Action | null {
  if (station === state.cleaning?.station) {
    return { type: 'clean-confirm' }
  }
  const washing = state.washing
  if (washing?.stage === 'carrying' && station === washDestination(washing.item)) {
    return { type: 'store-washed', station }
  }
  if (station === 'wash' && washing) {
    if (washing.stage === 'ready') {
      return { type: 'take-washed', item: washing.item }
    } else {
      return { type: 'wash-confirm' }
    }
  }
  const prep = state.preparation

  if (station === 'prep' && prep && preparationStation(prep) === 'prep') {
    if (prep.fault) {
      return null
    } else if (prep.stage === 'ready') {
      // The label writer in the work card owns F while a finished batch waits for its label.
      return null
    } else {
      return { type: 'prep-confirm' }
    }
  }

  const brew = state.coldBrew

  if (station === 'cold-prep' && brew) {
    if (brew.fault) {
      return null
    } else if (brew.stage === 'finished') {
      return brew.completedAt !== null && expiryAt(brew.completedAt, INGREDIENTS['cold-brew'].lifetime) <= state.time
        ? null
        : { type: 'collect-cold-brew' }
    } else if (brew.stage === 'ready') {
      return null
    } else {
      return { type: 'cold-confirm' }
    }
  }

  if (state.cup?.craft.fault) {
    return null
  } else if (state.cup && !nextStep(state) && station === 'pickup') {
    return { type: 'serve' }
  } else {
    return { type: 'confirm-craft', station }
  }
}
