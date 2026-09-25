import { DRINK_SIZES, type DrinkSize, drinkSizeIds, drinkSizeRatio, type RecipeSize } from './drink-sizes'
import type { Costs } from './ingredients'
import type { DrinkReference, DrinkStepReference } from './reference-links'
import { referenceLinks } from './references'
import type { StationId } from './stations'

type Step = {
  station: StationId
  label: string
  instruction: string
  note: string
  costs: Costs
  seconds: number
  usesPitcher: boolean
  target: number
  measurement: string
}
export const recipeIds = ['cold-brew', 'glazed-hot', 'glazed-iced', 'hoji-hot', 'hoji-iced'] as const
export type RecipeId = (typeof recipeIds)[number]
type SizedRecipe = { price: number; steps: Step[] }
type Recipe = {
  name: string
  shortName: string
  variant: string
  sizes: Partial<Record<DrinkSize, SizedRecipe>>
  color: string
}

function makeRecipe<S extends DrinkSize>(
  id: RecipeId,
  reference: DrinkReference,
  steps: (size: S) => Step[],
  prices: Record<S, number>,
  color: string,
): Recipe {
  return {
    name: reference.name,
    shortName: id === 'cold-brew' ? '콜드 브루' : id.startsWith('hoji-') ? '호지 글레이즈드' : '블랙 글레이즈드',
    variant: reference.variant,
    sizes: Object.fromEntries(
      (Object.keys(prices) as S[]).map((size) => [size, { price: prices[size], steps: steps(size) }]),
    ),
    color,
  }
}
function recipeStep(
  reference: DrinkStepReference,
  station: StationId,
  costs: Costs = {},
  options: Partial<Pick<Step, 'target' | 'seconds' | 'usesPitcher'>> = {},
): Step {
  return {
    station,
    label: reference.item,
    instruction: reference.instruction,
    note: reference.note,
    costs,
    seconds: 2,
    usesPitcher: false,
    target: 1,
    measurement: options.target && reference.unit ? `${options.target}${reference.unit}` : '',
    ...options,
  }
}
const { hot, iced, cold, hojiHot, hojiIced } = referenceLinks
// Public Korea prices and their source dates are documented in docs/cafe/prototype-rules.md.
const lattePrices = { tall: 6700, grande: 7500, venti: 8300 }
// Cup-line amounts remain prototype conversions. Foam follows the source's size progression,
// retaining the existing 45ml Tall cup estimate instead of treating tumbler ml as cup measurements.
const foamMl = (source: Pick<typeof hot, 'tumblerFoamMl'>, size: RecipeSize) =>
  (45 * source.tumblerFoamMl[size]) / source.tumblerFoamMl.tall
const lineMl = (tallMl: number, size: DrinkSize) => Math.round(tallMl * drinkSizeRatio(size) * 10) / 10

export const RECIPES: Record<RecipeId, Recipe> = {
  'cold-brew': makeRecipe(
    'cold-brew',
    cold.reference,
    (size: DrinkSize) => [
      recipeStep(cold.steps.extract, 'brew', { coldBrew: lineMl(90, size) }),
      recipeStep(cold.steps.water, 'water'),
      recipeStep(cold.steps.ice, 'ice'),
      {
        station: 'pickup',
        label: '제공',
        instruction: '포장 음료는 리드를 덮어 제공해요. 매장 유리잔은 리드 없이 제공해요.',
        note: '매장·포장에 따른 게임 규칙',
        costs: {},
        seconds: 0,
        usesPitcher: false,
        target: 1,
        measurement: '',
      },
    ],
    { tall: 5100, grande: 5700, venti: 6500, trenta: 6900 },
    '#493022',
  ),
  'glazed-hot': makeRecipe(
    'glazed-hot',
    hot.reference,
    (size: RecipeSize) => [
      recipeStep(hot.steps.milk, 'steam', { milk: lineMl(200, size) }, { seconds: 5, usesPitcher: true }),
      recipeStep(hot.steps.espresso, 'espresso', { beans: hot.shots[size] * 9 }, { target: hot.shots[size] }),
      recipeStep(
        hot.steps.glaze,
        'sauce',
        { glaze: hot.glazePumps[size] * hot.pumpMl },
        { target: hot.glazePumps[size] },
      ),
      recipeStep(hot.steps.mix, 'mix'),
      recipeStep(hot.steps.steamedMilk, 'steam', {}, { seconds: 5 }),
      recipeStep(hot.steps.drizzle, 'mix', { mocha: hot.drizzleTurns[size] * 5 }, { target: hot.drizzleTurns[size] }),
      recipeStep(hot.steps.foam, 'topping', { foam: foamMl(hot, size) }),
      recipeStep(hot.steps.powder, 'topping', { powder: hot.powderTaps[size] }, { target: hot.powderTaps[size] }),
      recipeStep(hot.steps.serve, 'pickup'),
    ],
    lattePrices,
    '#be9871',
  ),
  'glazed-iced': makeRecipe(
    'glazed-iced',
    iced.reference,
    (size: RecipeSize) => [
      recipeStep(iced.steps.espresso, 'espresso', { beans: iced.shots[size] * 9 }, { target: iced.shots[size] }),
      recipeStep(
        iced.steps.glaze,
        'sauce',
        { glaze: iced.glazePumps[size] * iced.pumpMl },
        { target: iced.glazePumps[size] },
      ),
      recipeStep(iced.steps.mix, 'mix'),
      recipeStep(iced.steps.milk, 'steam', { milk: lineMl(180, size) }),
      recipeStep(iced.steps.ice, 'ice'),
      recipeStep(
        iced.steps.drizzle,
        'mix',
        { mocha: iced.drizzleTurns[size] * 5 },
        { target: iced.drizzleTurns[size] },
      ),
      recipeStep(iced.steps.foam, 'topping', { foam: foamMl(iced, size) }),
      recipeStep(iced.steps.powder, 'topping', { powder: iced.powderTaps[size] }, { target: iced.powderTaps[size] }),
      recipeStep(iced.steps.serve, 'pickup'),
    ],
    lattePrices,
    '#b58b63',
  ),
  'hoji-hot': makeRecipe(
    'hoji-hot',
    hojiHot.reference,
    (size: RecipeSize) => [
      recipeStep(hojiHot.steps.milk, 'steam', { milk: lineMl(200, size) }, { seconds: 5, usesPitcher: true }),
      recipeStep(
        hojiHot.steps.syrup,
        'sauce',
        { classic: hojiHot.syrupPumps[size] * hojiHot.syrupPumpMl },
        { target: hojiHot.syrupPumps[size] },
      ),
      recipeStep(hojiHot.steps.steamedMilk, 'steam'),
      recipeStep(hojiHot.steps.tea, 'mix', { hojicha: hojiHot.tumblerTeaMl[size] }),
      recipeStep(hojiHot.steps.foam, 'topping', { foam: foamMl(hojiHot, size) }),
      recipeStep(
        hojiHot.steps.powder,
        'topping',
        { powder: hojiHot.powderTaps[size] },
        { target: hojiHot.powderTaps[size] },
      ),
      recipeStep(hojiHot.steps.serve, 'pickup'),
    ],
    lattePrices,
    '#a58c63',
  ),
  'hoji-iced': makeRecipe(
    'hoji-iced',
    hojiIced.reference,
    (size: RecipeSize) => [
      recipeStep(
        hojiIced.steps.syrup,
        'sauce',
        { classic: hojiIced.syrupPumps[size] * hojiIced.syrupPumpMl },
        { target: hojiIced.syrupPumps[size] },
      ),
      recipeStep(hojiIced.steps.milk, 'steam', { milk: lineMl(140, size) }),
      recipeStep(hojiIced.steps.tea, 'mix', { hojicha: lineMl(50, size) }),
      recipeStep(hojiIced.steps.ice, 'ice'),
      recipeStep(hojiIced.steps.foam, 'topping', { foam: foamMl(hojiIced, size) }),
      recipeStep(
        hojiIced.steps.powder,
        'topping',
        { powder: hojiIced.powderTaps[size] },
        { target: hojiIced.powderTaps[size] },
      ),
      recipeStep(hojiIced.steps.serve, 'pickup'),
    ],
    lattePrices,
    '#ac9471',
  ),
}

export const recipeSizes = (id: RecipeId) => drinkSizeIds.filter((size) => RECIPES[id].sizes[size])
export function recipeFor(id: RecipeId, size: DrinkSize): SizedRecipe {
  const recipe = RECIPES[id].sizes[size]
  if (!recipe) throw new Error(`${RECIPES[id].name}에는 ${DRINK_SIZES[size].name} 사이즈가 없어요.`)
  return recipe
}
export function recipeLabel(id: RecipeId, size?: DrinkSize) {
  return `${RECIPES[id].name} · ${RECIPES[id].variant}${size ? ` · ${DRINK_SIZES[size].name}` : ''}`
}
