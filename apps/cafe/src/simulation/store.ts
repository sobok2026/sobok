import { handleCleaningActions } from '../features/cleaning/actions'
import { handleColdBrewActions } from '../features/cold-brew/actions'
import { handleCraftActions } from '../features/crafting/actions'
import { handleStockActions } from '../features/inventory/actions'
import { expirePreparation, handlePreparationActions } from '../features/preparation/actions'
import { handleOrderActions } from '../features/service/actions'
import { advanceCustomer } from '../features/service/customer-progress'
import { handleShiftActions } from '../features/shift/actions'
import { handleWashingActions } from '../features/washing/actions'
import { canDispatch } from './action-guards'
import type { Action } from './actions'
import { advanceWork } from './active-work'
import { completeJobs } from './jobs'
import type { GameState } from './state'
import type { ActiveInput, WorkContext } from './work-context'

export class CafeStore {
  private state: GameState
  private listeners = new Set<() => void>()
  private input: ActiveInput = null
  constructor(state: GameState) {
    this.state = state
  }
  getSnapshot = () => this.state
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  replace(state: GameState) {
    this.input = null
    this.state = state
    this.emit()
  }
  getActiveInput = () => this.input
  stopActiveInput = () => {
    this.input = null
  }
  private emit() {
    for (const listener of this.listeners) listener()
  }
  dispatch(action: Action) {
    this.input = null
    if (this.state.phase === 'summary' && action.type !== 'next-day') return
    const work: WorkContext = { state: structuredClone(this.state), input: null }
    const s = work.state
    completeJobs(work)
    expirePreparation(work, s.time)
    if (canDispatch(work, action)) {
      switch (action.type) {
        case 'ticket':
        case 'serve':
          handleOrderActions(work, action)
          break
        case 'close':
        case 'finish':
        case 'next-day':
          handleShiftActions(work, action)
          break
        case 'take-cup':
        case 'place-cup':
        case 'pick-cup':
        case 'tool':
        case 'use-start':
        case 'confirm-craft':
        case 'discard-cup':
          handleCraftActions(work, action)
          break
        case 'wash':
        case 'wash-tool':
        case 'wash-use':
        case 'wash-confirm':
        case 'take-washed':
        case 'leave-wash':
        case 'store-washed':
          handleWashingActions(work, action)
          break
        case 'start-cleaning':
        case 'collect-cup':
        case 'drop-used-cups':
        case 'clean-tool':
        case 'clean-use':
        case 'clean-confirm':
        case 'leave-cleaning':
          handleCleaningActions(work, action)
          break
        case 'cups':
        case 'buy-cups':
        case 'take-supply':
        case 'place-supply':
        case 'return-supply':
        case 'buy-supply':
        case 'open-batch':
        case 'label-batch':
        case 'take-batch':
        case 'return-batch':
        case 'store-batch':
        case 'discard-batch':
        case 'buy':
          handleStockActions(work, action)
          break
        case 'start-preparation':
        case 'prep-tool':
        case 'prep-use':
        case 'prep-confirm':
        case 'discard-preparation':
          handlePreparationActions(work, action)
          break
        case 'start-cold-brew':
        case 'cold-tool':
        case 'cold-use':
        case 'cold-confirm':
        case 'collect-cold-brew':
        case 'discard-cold-brew':
          handleColdBrewActions(work, action)
          break
        default: {
          const unhandled: never = action
          throw new Error(`Unknown cafe action: ${unhandled}`)
        }
      }
      s.batches = s.batches.filter((batch) => batch.amount > 0 || batch.location === 'stock')
    }
    this.input = work.input
    this.state = s
    this.emit()
  }
  tick(seconds: number) {
    if (this.state.phase === 'summary') return
    const work: WorkContext = { state: structuredClone(this.state), input: this.input }
    const dt = Math.max(0, Math.min(seconds, 2))
    work.state.time += dt
    // Finish scheduled work at its own timestamp before checking expiry at the current time.
    completeJobs(work)
    expirePreparation(work, work.state.time)
    advanceWork(work, dt)
    advanceCustomer(work, dt)
    this.input = work.input
    this.state = work.state
    this.emit()
  }
}
