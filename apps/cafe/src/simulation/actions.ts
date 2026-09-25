import type { DrinkSize } from '../content/drink-sizes'
import type { IngredientId } from '../content/ingredients'
import type { RecipeId } from '../content/recipes'
import type { StationId } from '../content/stations'
import type { CleaningStation } from '../features/cleaning/rules'
import type { DisposableCupKind, ServiceMode } from '../features/inventory/cups'
import type { SupplyId } from '../features/inventory/supplies'
import type { PreparationId } from '../features/preparation/rules'
import type { WashItem } from '../features/washing/rules'

export type Action =
  | { type: 'ticket'; recipe: RecipeId; service: ServiceMode; size: DrinkSize }
  | { type: 'start-preparation'; recipe: PreparationId }
  | { type: 'prep-tool' }
  | { type: 'prep-use' }
  | { type: 'prep-confirm' }
  | { type: 'discard-preparation' }
  | { type: 'wash-tool' }
  | { type: 'wash-use' }
  | { type: 'wash-confirm' }
  | { type: 'leave-wash' }
  | { type: 'wash'; item: WashItem }
  | { type: 'take-washed'; item: WashItem }
  | { type: 'store-washed'; station: StationId }
  | { type: 'cups'; kind: DisposableCupKind }
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
  | { type: 'label-batch'; id: string; station: StationId }
  | { type: 'take-batch'; id: string; station: StationId }
  | { type: 'discard-batch'; id: string; station: StationId }
  | { type: 'return-batch'; station: StationId }
  | { type: 'store-batch'; id: string; storage: 'room' | 'fridge'; station: StationId }
  | { type: 'start-cold-brew' }
  | { type: 'cold-tool' }
  | { type: 'cold-use' }
  | { type: 'cold-confirm' }
  | { type: 'collect-cold-brew' }
  | { type: 'discard-cold-brew' }
  | { type: 'place-cup'; station: StationId }
  | { type: 'pick-cup'; station: StationId }
  | { type: 'tool'; station: StationId }
  | { type: 'use-start'; station: StationId }
  | { type: 'confirm-craft'; station: StationId }
  | { type: 'open-batch'; id: string }
  | { type: 'buy'; ingredient: IngredientId }
  | {
      type: 'take-cup'
    }
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
