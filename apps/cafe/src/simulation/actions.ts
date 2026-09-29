import type { IngredientId } from '../content/ingredients'
import type { StationId } from '../content/stations'
import type { CleaningStation } from '../features/cleaning/rules'
import type { DripBean, DripTemperature } from '../features/drip-coffee/rules'
import type { GrindSetting } from '../features/grinder/rules'
import type { CupKind, DisposableCupKind } from '../features/inventory/cups'
import type { SupplyId } from '../features/inventory/supplies'
import type { PreparationId } from '../features/preparation/rules'
import type { WashItem } from '../features/washing/rules'
import type { OrderItem } from './state'

export type DripAction =
  | { type: 'set-cow'; hot: DripBean; iced: DripBean }
  | { type: 'drip-prepare'; temperature: DripTemperature; bean: DripBean }
  | {
      type:
        | 'drip-filter'
        | 'drip-tool'
        | 'drip-use'
        | 'drip-confirm'
        | 'drip-grind'
        | 'drip-load'
        | 'drip-brew'
        | 'drip-mix'
        | 'drip-discard'
      temperature: DripTemperature
    }
  | { type: 'drip-stop' }

export type PosAction =
  | { type: 'pos-add'; item: OrderItem }
  | { type: 'pos-update'; id: string; item: OrderItem; quantity: number }
  | { type: 'pos-remove'; id: string }
  | { type: 'pos-split'; id: string }
  | { type: 'pos-clear' }
  | { type: 'pos-pay'; id: string; method: 'cash' | 'card'; tendered: number }
  | { type: 'pos-void'; id: string }

export type ReceiptAction =
  | {
      type: 'pos-cash-receipt'
      transactionId: string
      id: string
      kind: 'personal' | 'business' | 'unissued'
      lastFour: string | null
    }
  | { type: 'pos-print-receipt'; transactionId: string }

export type Action =
  | DripAction
  | PosAction
  | ReceiptAction
  | { type: 'grinder-setting'; setting: GrindSetting }
  | { type: 'start-preparation'; recipe: PreparationId }
  | { type: 'prep-tool' }
  | { type: 'prep-use' }
  | { type: 'prep-confirm'; observation?: { id: string; value: boolean } }
  | { type: 'prep-choose'; key: string; value: string }
  | { type: 'discard-preparation' }
  | { type: 'wash-tool' }
  | { type: 'wash-use' }
  | { type: 'wash-confirm' }
  | { type: 'leave-wash' }
  | { type: 'wash'; item: WashItem }
  | { type: 'take-washed'; item: WashItem }
  | { type: 'store-washed'; station: StationId }
  | { type: 'take-cups'; kind: DisposableCupKind }
  | { type: 'place-cups' }
  | { type: 'return-cups' }
  | { type: 'buy-cups'; kind: DisposableCupKind }
  | { type: 'start-cleaning'; station: CleaningStation }
  | { type: 'take-supply'; supply: SupplyId }
  | { type: 'buy-supply'; supply: SupplyId }
  | { type: 'place-supply' }
  | { type: 'return-supply' }
  | { type: 'collect-cup' }
  | { type: 'drop-used-cups' }
  | { type: 'clean-tool' }
  | { type: 'clean-use' }
  | { type: 'clean-confirm' }
  | { type: 'leave-cleaning' }
  | { type: 'label-batch'; id: string; station: StationId; until: number }
  | { type: 'set-batch-storage'; id: string; station: StationId; storage: 'room' | 'fridge' }
  | { type: 'take-batch'; id: string; station: StationId }
  | { type: 'discard-batch'; id: string; station: StationId }
  | { type: 'return-batch'; station: StationId }
  | { type: 'store-batch'; id: string; station: StationId }
  | { type: 'shelve-pack'; station: StationId }
  | { type: 'start-cold-brew' }
  | { type: 'cold-grind' }
  | { type: 'cold-tool' }
  | { type: 'cold-use' }
  | { type: 'cold-confirm' }
  | { type: 'collect-cold-brew' }
  | { type: 'discard-cold-brew' }
  | { type: 'place-cup'; station: StationId }
  | { type: 'pick-cup'; station: StationId }
  | { type: 'place-vessel'; station: StationId }
  | { type: 'pick-vessel'; station: StationId; vessel: string }
  | { type: 'attach-sticker' }
  | { type: 'choose'; station: StationId; key: string; value: string }
  | { type: 'tool'; station: StationId }
  | { type: 'use-start'; station: StationId }
  | { type: 'confirm-craft'; station: StationId; observation?: { id: string; value: boolean } }
  | { type: 'open-batch'; id: string }
  | { type: 'buy'; ingredient: IngredientId }
  | { type: 'take-cup'; kind: CupKind }
  | {
      type: 'discard-cup'
    }
  | {
      type: 'serve'
    }
  | {
      type: 'close'
    }
  | {
      type: 'finish'
    }
  | {
      type: 'next-day'
    }
