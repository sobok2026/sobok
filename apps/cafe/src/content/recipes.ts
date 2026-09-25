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
}
export const recipeIds = ['cold-brew', 'glazed-hot', 'glazed-iced', 'hoji-hot', 'hoji-iced'] as const
export type RecipeId = (typeof recipeIds)[number]
type Recipe = {
  name: string
  shortName: string
  variant: string
  price: number
  steps: Step[]
  color: string
}

function makeRecipe(id: RecipeId, reference: DrinkReference, steps: Step[], price: number, color: string): Recipe {
  return {
    name: reference.name,
    shortName:
      id === 'cold-brew'
        ? '콜드 브루'
        : id === 'hoji-hot' || id === 'hoji-iced'
          ? '호지 글레이즈드'
          : '블랙 글레이즈드',
    variant: reference.variant,
    price,
    color,
    steps,
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
    ...options,
  }
}
const { hot, iced, cold, hojiHot, hojiIced } = referenceLinks
// Grams per shot and cup-line volumes are prototype conversions; counts use each drink's own source.
export const RECIPES: Record<RecipeId, Recipe> = {
  'cold-brew': makeRecipe(
    'cold-brew',
    cold.reference,
    [
      recipeStep(cold.steps.extract, 'brew', { coldBrew: 90 }),
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
      },
    ],
    5000,
    '#493022',
  ),
  'glazed-hot': makeRecipe(
    'glazed-hot',
    hot.reference,
    [
      recipeStep(hot.steps.milk, 'steam', { milk: 200 }, { seconds: 5, usesPitcher: true }),
      recipeStep(hot.steps.espresso, 'espresso', { beans: hot.shots * 9 }),
      recipeStep(hot.steps.glaze, 'sauce', { glaze: hot.glazePumps * hot.pumpMl }, { target: hot.glazePumps }),
      recipeStep(hot.steps.mix, 'mix'),
      recipeStep(hot.steps.steamedMilk, 'steam', {}, { seconds: 5 }),
      recipeStep(hot.steps.drizzle, 'mix', { mocha: hot.drizzleTurns * 5 }, { target: hot.drizzleTurns }),
      recipeStep(hot.steps.foam, 'topping', { foam: 45 }),
      recipeStep(hot.steps.powder, 'topping', { powder: hot.powderTaps }, { target: hot.powderTaps }),
      recipeStep(hot.steps.serve, 'pickup'),
    ],
    6500,
    '#be9871',
  ),
  'glazed-iced': makeRecipe(
    'glazed-iced',
    iced.reference,
    [
      recipeStep(iced.steps.espresso, 'espresso', { beans: iced.shots * 9 }),
      recipeStep(iced.steps.glaze, 'sauce', { glaze: iced.glazePumps * iced.pumpMl }, { target: iced.glazePumps }),
      recipeStep(iced.steps.mix, 'mix'),
      recipeStep(iced.steps.milk, 'steam', { milk: 180 }),
      recipeStep(iced.steps.ice, 'ice'),
      recipeStep(iced.steps.drizzle, 'mix', { mocha: iced.drizzleTurns * 5 }, { target: iced.drizzleTurns }),
      recipeStep(iced.steps.foam, 'topping', { foam: 45 }),
      recipeStep(iced.steps.powder, 'topping', { powder: iced.powderTaps }, { target: iced.powderTaps }),
      recipeStep(iced.steps.serve, 'pickup'),
    ],
    6500,
    '#b58b63',
  ),
  'hoji-hot': makeRecipe(
    'hoji-hot',
    hojiHot.reference,
    [
      recipeStep(hojiHot.steps.milk, 'steam', { milk: 200 }, { seconds: 5, usesPitcher: true }),
      recipeStep(
        hojiHot.steps.syrup,
        'sauce',
        { classic: hojiHot.syrupPumps * hojiHot.syrupPumpMl },
        { target: hojiHot.syrupPumps },
      ),
      recipeStep(hojiHot.steps.steamedMilk, 'steam'),
      recipeStep(hojiHot.steps.tea, 'mix', { hojicha: 50 }),
      recipeStep(hojiHot.steps.foam, 'topping', { foam: 45 }),
      recipeStep(hojiHot.steps.powder, 'topping', { powder: hojiHot.powderTaps }, { target: hojiHot.powderTaps }),
      recipeStep(hojiHot.steps.serve, 'pickup'),
    ],
    6500,
    '#a58c63',
  ),
  'hoji-iced': makeRecipe(
    'hoji-iced',
    hojiIced.reference,
    [
      recipeStep(
        hojiIced.steps.syrup,
        'sauce',
        { classic: hojiIced.syrupPumps * hojiIced.syrupPumpMl },
        { target: hojiIced.syrupPumps },
      ),
      recipeStep(hojiIced.steps.milk, 'steam', { milk: 140 }),
      recipeStep(hojiIced.steps.tea, 'mix', { hojicha: 50 }),
      recipeStep(hojiIced.steps.ice, 'ice'),
      recipeStep(hojiIced.steps.foam, 'topping', { foam: 45 }),
      recipeStep(hojiIced.steps.powder, 'topping', { powder: hojiIced.powderTaps }, { target: hojiIced.powderTaps }),
      recipeStep(hojiIced.steps.serve, 'pickup'),
    ],
    6500,
    '#ac9471',
  ),
}

export function recipeLabel(id: RecipeId) {
  return `${RECIPES[id].name} · ${RECIPES[id].variant}`
}
