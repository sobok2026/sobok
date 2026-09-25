import { INGREDIENTS, type IngredientId, ingredientIds } from '../content/ingredients'
import { staffStartPosition } from '../content/stations'
import { CUP_SUPPLY, emptyCupCounts, REUSABLE_CUPS_PER_KIND } from '../features/inventory/cups'
import { newBatch } from '../features/inventory/inventory'
import { SUPPLY_CAPACITY, SUPPLY_PACK } from '../features/inventory/supplies'
import { createCustomer } from '../features/service/customer'
import { emptyTotals } from '../features/shift/rules'
import { uid } from '../shared/id'
import type { GameState } from './state'

const START = Date.UTC(2026, 8, 1, 9) / 1000
export function initialState(): GameState {
  const amounts: Record<IngredientId, number> = {
    beans: 100,
    milk: 100,
    cream: 400,
    glaze: 500,
    powder: 40,
    mochaPowder: 1,
    mocha: 0,
    foam: 0,
    coldBrew: 600,
    classic: 0,
    hojichaPowder: 0,
    hojicha: 0,
  }
  return {
    day: 1,
    time: START,
    phase: 'open',
    cash: 50000,
    orderNumber: 1,
    request: 'cold-brew',
    customer: createCustomer(1, 'cold-brew'),
    ticket: null,
    cup: null,
    preparation: null,
    coldBrew: null,
    washing: null,
    cleaning: null,
    batches: ingredientIds.flatMap((ingredient) => [
      newBatch(ingredient, amounts[ingredient], START),
      ...(!INGREDIENTS[ingredient].prepared
        ? [newBatch(ingredient, INGREDIENTS[ingredient].pack, START, 'stock')]
        : []),
    ]),
    jobs: [],
    tools: { clean: 2, dirty: 1, washed: 0 },
    disposableCups: {
      'hot-paper': { bar: CUP_SUPPLY.initialBar, reserve: CUP_SUPPLY.initialReserve },
      'iced-plastic': { bar: CUP_SUPPLY.initialBar, reserve: CUP_SUPPLY.initialReserve },
    },
    reusableCups: {
      'hot-mug': { clean: REUSABLE_CUPS_PER_KIND, dirty: 0, washed: 0 },
      'iced-glass': { clean: REUSABLE_CUPS_PER_KIND, dirty: 0, washed: 0 },
    },
    tables: { table: { cups: emptyCupCounts(), dirty: false }, 'table-left': { cups: emptyCupCounts(), dirty: false } },
    condiment: { cups: emptyCupCounts(), dirty: false },
    supplies: {
      napkins: { bar: SUPPLY_CAPACITY, stock: SUPPLY_PACK },
      straws: { bar: SUPPLY_CAPACITY, stock: SUPPLY_PACK },
      sugar: { bar: SUPPLY_CAPACITY, stock: SUPPLY_PACK },
    },
    supplyDelivery: null,
    dirtyBar: 0,
    trash: 0,
    totals: emptyTotals(50000),
    messages: [{ id: uid(), text: '첫 손님이 들어오고 있어요. 매장을 둘러보세요.', tone: 'info' }],
    position: staffStartPosition(),
  }
}
