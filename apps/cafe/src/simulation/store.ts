import { handleCleaningActions } from '../features/cleaning/actions'
import { handleColdBrewActions } from '../features/cold-brew/actions'
import { expireDrink, handleCraftActions } from '../features/crafting/actions'
import { handleDripActions, settleDrip } from '../features/drip-coffee/actions'
import { handleFoodActions } from '../features/food/actions'
import { settleFood } from '../features/food/rules'
import { grindSettingSchema } from '../features/grinder/rules'
import { handleIceActions } from '../features/ice/actions'
import { settleIce } from '../features/ice/rules'
import { handleStockActions } from '../features/inventory/actions'
import { expirePreparation, handlePreparationActions } from '../features/preparation/actions'
import { handleOrderActions } from '../features/service/actions'
import { advanceCustomer } from '../features/service/customer-progress'
import { handlePosActions } from '../features/service/pos-actions'
import { handleReceiptActions } from '../features/service/receipt-actions'
import { handleShiftActions } from '../features/shift/actions'
import { handleWashingActions } from '../features/washing/actions'
import { handleDishwasherActions } from '../features/washing/dishwasher-actions'
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
  private heldSeconds = 0

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
    this.heldSeconds = 0
    this.state = state
    this.emit()
  }

  getActiveInput = () => this.input

  stopActiveInput = () => {
    if (!this.input) return
    this.input = null
    this.heldSeconds = 0
    this.emit()
  }

  private emit() {
    for (const listener of this.listeners) listener()
  }

  dispatch(action: Action) {
    this.input = null
    this.heldSeconds = 0
    if (this.state.phase === 'summary' && action.type !== 'next-day') {
      return
    }
    const work: WorkContext = { state: structuredClone(this.state), input: null }
    const s = work.state
    completeJobs(work)
    settleIce(s)
    settleFood(s)
    expirePreparation(work, s.time)
    expireDrink(work, s.time)

    if (canDispatch(work, action)) {
      switch (action.type) {
        case 'ice-toggle':
        case 'ice-take':
        case 'ice-fill':
        case 'ice-return':
          handleIceActions(work, action)
          break
        case 'dishwasher-hood':
        case 'dishwasher-load':
        case 'dishwasher-unload':
          handleDishwasherActions(work, action)
          break
        case 'grinder-setting':
          if (grindSettingSchema.safeParse(action.setting).success) s.grindSetting = action.setting
          break
        case 'set-cow':
        case 'drip-prepare':
        case 'drip-filter':
        case 'drip-tool':
        case 'drip-use':
        case 'drip-confirm':
        case 'drip-grind':
        case 'drip-load':
        case 'drip-brew':
        case 'drip-mix':
        case 'drip-discard':
        case 'drip-stop':
          handleDripActions(work, action)
          break
        case 'pos-cash-receipt':
        case 'pos-print-receipt':
          handleReceiptActions(work, action)
          break
        case 'pos-add':
        case 'pos-accept':
        case 'pos-hold':
        case 'pos-resume':
        case 'pos-benefits':
        case 'pos-complete':
        case 'pos-credit-payment':
        case 'pos-food-add':
        case 'pos-food-update':
        case 'pos-bulk':
        case 'pos-update':
        case 'pos-remove':
        case 'pos-split':
        case 'pos-clear':
        case 'pos-pay':
        case 'pos-void':
          handlePosActions(work, action)
          break
        case 'food-buy':
        case 'food-display':
        case 'food-return':
        case 'food-discard':
        case 'food-pick':
        case 'food-move':
        case 'food-heat':
        case 'food-pack':
        case 'food-serve':
        case 'food-discard-work':
          handleFoodActions(work, action)
          break
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
        case 'place-vessel':
        case 'pick-vessel':
        case 'attach-sticker':
        case 'choose':
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
        case 'take-cups':
        case 'place-cups':
        case 'return-cups':
        case 'buy-cups':
        case 'take-supply':
        case 'place-supply':
        case 'return-supply':
        case 'buy-supply':
        case 'open-batch':
        case 'label-batch':
        case 'set-batch-storage':
        case 'take-batch':
        case 'return-batch':
        case 'store-batch':
        case 'shelve-pack':
        case 'discard-batch':
        case 'buy':
          handleStockActions(work, action)
          break
        case 'start-preparation':
        case 'prep-tool':
        case 'prep-use':
        case 'prep-confirm':
        case 'prep-choose':
        case 'discard-preparation':
          handlePreparationActions(work, action)
          break
        case 'start-cold-brew':
        case 'cold-grind':
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

      s.batches = s.batches.filter((batch) => batch.amount > 0 || batch.openedAt === null)
      settleDrip(s)
    }

    this.input = work.input
    this.state = s
    this.emit()
  }

  tick(seconds: number) {
    if (this.state.phase === 'summary') {
      return
    }
    const work: WorkContext = { state: structuredClone(this.state), input: this.input }
    const dt = Math.max(0, Math.min(seconds, 2))
    work.state.time += dt
    // Finish scheduled work at its own timestamp before checking expiry at the current time.
    completeJobs(work)
    settleIce(work.state)
    settleFood(work.state)
    expirePreparation(work, work.state.time)
    expireDrink(work, work.state.time)
    advanceWork(work, dt, this.heldSeconds)
    settleDrip(work.state)
    advanceCustomer(work, dt)
    this.input = work.input
    this.heldSeconds = work.input ? this.heldSeconds + Math.min(dt, 0.15) : 0
    this.state = work.state
    this.emit()
  }
}
