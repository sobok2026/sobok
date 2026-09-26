import { INGREDIENTS } from '../../content/ingredients'
import { expiryAt } from '../../content/lifetime'
import { isCupSurface, type StationId } from '../../content/stations'
import { needsCleaning } from '../../features/cleaning/rules'
import { craftStations, nextStep } from '../../features/crafting/rules'
import { batchDestination, batchHome, batchOrigin, carriedBatch, isSealed } from '../../features/inventory/batches'
import { cleanCupCount, cupCount, cupKindFor } from '../../features/inventory/cups'
import { currentTicket } from '../../features/service/orders'
import { washDestination, washQueue } from '../../features/washing/rules'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'

export type Interaction = Action | 'work' | 'panel' | null

/** What E does at a station. Null means there is nothing to do there, so no panel opens. */
export function interactionAt(current: GameState, id: StationId): Interaction {
  const ticket = currentTicket(current)
  const carrying = carriedBatch(current)
  if (carrying && id !== 'pos') {
    if (isSealed(carrying)) {
      return id === 'fridge' || id === 'stock' ? { type: 'shelve-pack', station: id } : null
    }
    if (id === batchDestination(carrying)) {
      return { type: 'store-batch', id: carrying.id, station: id }
    }
    return id === batchOrigin(carrying) ? { type: 'return-batch', station: id } : null
  }
  if (current.supplyDelivery && (id === 'condiment' || id === 'stock')) {
    return { type: id === 'condiment' ? 'place-supply' : 'return-supply' }
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

  if (id === 'prep' && current.preparation) {
    const batch = current.batches.find((item) => item.id === current.preparation?.batchId)
    return batch?.labelled && batch.expiresAt !== null && batch.expiresAt > current.time
      ? { type: 'take-batch', id: batch.id, station: id }
      : 'work'
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

  if (
    id === 'cups' &&
    ticket &&
    !current.cup &&
    cleanCupCount(current, cupKindFor(ticket.recipe, ticket.service, ticket.size)) > 0
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
  return stationDefault(current, id)
}

const panelStations: StationId[] = ['pos', 'cups', 'fridge', 'stock', 'prep', 'cold-prep']

function stationDefault(state: GameState, id: StationId): Interaction {
  if (panelStations.includes(id)) {
    return 'panel'
  }
  if (isCupSurface(id) || id === 'mix' || id === 'trash') {
    return needsCleaning(state, id) ? { type: 'start-cleaning', station: id } : null
  }
  if (id === 'wash') {
    return washInteraction(state)
  }
  if (id === 'shelf') {
    return state.batches.some((batch) => batch.amount > 0 && batchHome(batch) === 'shelf') ? 'panel' : null
  }
  return null
}

/** One thing to wash or collect starts at once; a choice between vessels opens the sink panel. */
function washInteraction(state: GameState): Interaction {
  const ticket = currentTicket(state)
  const queue = washQueue(state, ticket ? cupKindFor(ticket.recipe, ticket.service, ticket.size) : null)
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
  } else if (station === 'prep' && state.preparation) {
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
  } else if (station === 'prep' && state.preparation) {
    return { type: 'prep-tool' }
  } else if (station === 'cold-prep' && state.coldBrew) {
    return { type: 'cold-tool' }
  } else {
    return { type: 'tool', station }
  }
}

/** F confirms work. Discarding never shares this key; it sits behind the work HUD's hold action. */
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

  if (station === 'prep' && prep) {
    if (prep.fault) {
      return null
    } else if (prep.stage === 'ready' && prep.batchId) {
      return labelAt(state, prep.batchId, station)
    } else {
      return { type: 'prep-confirm' }
    }
  }

  const brew = state.coldBrew

  if (station === 'cold-prep' && brew) {
    if (brew.fault) {
      return null
    } else if (brew.stage === 'finished') {
      return brew.completedAt !== null && expiryAt(brew.completedAt, INGREDIENTS.coldBrew.lifetime) <= state.time
        ? null
        : { type: 'collect-cold-brew' }
    } else if (brew.stage === 'ready' && brew.batchId) {
      return labelAt(state, brew.batchId, station)
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

function labelAt(state: GameState, id: string, station: StationId): Action | null {
  const batch = state.batches.find((item) => item.id === id)

  return batch?.expiresAt != null && batch.expiresAt <= state.time ? null : { type: 'label-batch', id, station }
}
