import referenceData from '../data/references.generated.json'
import type { Lifetime } from './quality'
import { type DrinkReference, type DrinkStepReference, linkReferences, sourceLine } from './reference-links'

export const referenceLinks = linkReferences(referenceData)
export const COLD_BREW_HOURS = referenceLinks.brew.hours
export const BAR_CENTER_Z = -1.05
export const STAFF_AISLE_EDGE_Z = -1.95
export const staffStartPosition = (): [number, number, number, number] => [-4.4, -3.05, Math.PI, -0.17]
// Reflect the original customer-facing fixtures toward the employee aisle.
export const staffFacingZ = (z: number) => 2 * BAR_CENTER_Z - z
export const STATIONS = {
  pos: { name: 'POS', subtitle: '주문을 듣고 입력해요', x: -4.8, z: -1.4, color: '#e5b263' },
  cups: { name: '컵 보관대', subtitle: '주문에 맞는 컵을 준비해요', x: -3.7, z: -1.4, color: '#f1dfc5' },
  espresso: { name: '에스프레소 머신', subtitle: '샷을 추출해요', x: -2.5, z: -1.4, color: '#a2b7ae' },
  steam: { name: '우유 · 스팀', subtitle: '우유를 계량하고 스팀해요', x: -1.2, z: -1.4, color: '#d8e8dd' },
  brew: { name: '콜드 브루', subtitle: '보관된 추출액을 계량해요', x: 0, z: -1.4, color: '#a27c58' },
  water: { name: '워터 스테이션', subtitle: '컵의 기준선까지 채워요', x: 1.1, z: -1.4, color: '#a6ced4' },
  ice: { name: '아이스 빈', subtitle: '얼음을 채워요', x: 2.1, z: -1.4, color: '#c5e4e5' },
  sauce: { name: '소스 펌프', subtitle: '소스를 펌핑해요', x: 3.1, z: -1.4, color: '#d2ad7d' },
  mix: { name: '혼합 작업대', subtitle: '혼합·호지차 샷·드리즐', x: 4.1, z: -1.4, color: '#bf9370' },
  topping: { name: '폼 · 토핑', subtitle: '음료를 마무리해요', x: 5.1, z: -1.4, color: '#eed6ad' },
  pickup: { name: '픽업대', subtitle: '주문을 확인하고 전달해요', x: 6.1, z: -1.4, color: '#d3b76b' },
  prep: { name: '준비대', subtitle: '폼·바모카·호지차 샷을 만들어요', x: -2.7, z: -5.1, color: '#c3a8cc' },
  stock: { name: '냉장고 · 창고', subtitle: '기한 확인, 개봉과 보충', x: 5.5, z: -4.8, color: '#8bb2a2' },
  shelf: { name: '실온 선반', subtitle: '실온 보관 배합을 정리해요', x: 3, z: -4.8, color: '#bc9d76' },
  'cold-prep': { name: '콜드 브루 추출대', subtitle: '원두·물 계량, 추출과 회수', x: 1, z: -5.1, color: '#9c7954' },
  wash: { name: '세척대', subtitle: '사용한 피처를 씻어요', x: -5.0, z: -5.1, color: '#aac4cf' },
  rack: { name: '건조 · 도구 선반', subtitle: '씻은 도구를 제자리에', x: -3.9, z: -5.1, color: '#d1bc9d' },
  table: { name: '고객 테이블 1', subtitle: '사용한 컵을 회수하고 닦아요', x: 3.2, z: 3.7, color: '#d2ad7d' },
  'table-left': { name: '고객 테이블 2', subtitle: '사용한 컵을 회수하고 닦아요', x: -2.2, z: 3.7, color: '#d2ad7d' },
  condiment: { name: '컨디먼트 바', subtitle: '컵 반납·청소와 냅킨·빨대·설탕 보충', x: 0, z: 5.1, color: '#bca681' },
  trash: { name: '분리수거함', subtitle: '마감 전에 비워요', x: -5.4, z: 5.1, color: '#79988b' },
} as const
export type StationId = keyof typeof STATIONS
export const stationIds = Object.keys(STATIONS) as StationId[]
export const tableIds = ['table', 'table-left'] as const
export type TableId = (typeof tableIds)[number]
export const isTable = (station: StationId): station is TableId => station === 'table' || station === 'table-left'
export const cupSurfaceIds = [...tableIds, 'condiment'] as const
export type CupSurfaceId = (typeof cupSurfaceIds)[number]
export const isCupSurface = (station: StationId): station is CupSurfaceId => isTable(station) || station === 'condiment'
export function canAccessStation(station: StationId, playerZ: number) {
  return isCupSurface(station) || station === 'trash' || playerZ <= STAFF_AISLE_EDGE_Z
}

export const ingredientIds = [
  'beans',
  'milk',
  'cream',
  'glaze',
  'powder',
  'mochaPowder',
  'mocha',
  'foam',
  'coldBrew',
  'classic',
  'hojichaPowder',
  'hojicha',
] as const
export type IngredientId = (typeof ingredientIds)[number]
type Ingredient = {
  name: string
  unit: string
  pack: number
  storage: 'room' | 'fridge'
  lifetime: Lifetime
  price: number
  prepared?: boolean
  source: string
}
const quality = referenceLinks.quality
// Pack capacities, purchase prices and volume estimates are prototype rules, not store standards.
export const INGREDIENTS: Record<IngredientId, Ingredient> = {
  beans: {
    name: '에스프레소 원두',
    unit: 'g',
    pack: 500,
    ...quality.beans,
    price: 12000,
  },
  milk: {
    name: '일반 우유',
    unit: 'ml',
    pack: 1000,
    ...quality.milk,
    price: 3000,
  },
  cream: {
    name: '휘핑크림 원재료',
    unit: 'ml',
    pack: 1000,
    ...quality.cream,
    price: 6000,
  },
  glaze: {
    name: '글레이즈드 소스',
    unit: 'ml',
    pack: 1000,
    ...quality.glaze,
    price: 8000,
  },
  powder: {
    name: '번트 카라멜 파우더',
    unit: '톡',
    pack: 100,
    ...quality.powder,
    price: 4000,
  },
  mochaPowder: {
    name: '바모카 원팩',
    unit: '봉',
    pack: 1,
    storage: 'room',
    lifetime: { amount: 7, unit: 'days' }, // Prototype opened-pack lifetime; the guide only specifies the prepared sauce.
    price: 7000,
    source: `${sourceLine(referenceLinks.mocha.reference.source)} · 원팩 단위 / 개봉 후 7일은 게임용 임시값`,
  },
  mocha: {
    name: '바모카',
    unit: 'ml',
    pack: 1500,
    ...quality.mocha,
    price: 0,
    prepared: true,
  },
  foam: {
    name: '글레이즈드 폼',
    unit: 'ml',
    pack: 450,
    ...quality.foam,
    price: 0,
    prepared: true,
  },
  coldBrew: {
    name: '콜드 브루 추출액',
    unit: 'ml',
    pack: 3000,
    ...quality.coldBrew,
    price: 0,
    prepared: true,
  },
  classic: { name: '클래식 시럽', unit: 'ml', pack: 750, ...quality.classic, price: 5000 },
  hojichaPowder: {
    name: '호지차 파우더',
    unit: '스쿱',
    pack: 80,
    storage: 'room',
    lifetime: { amount: 7, unit: 'days' },
    price: 6000,
    source: `${sourceLine(referenceLinks.hojicha.steps.powder.source)} · 1티스푼 스쿱 / 입고 규격·실온 7일은 게임용 임시값`,
  },
  hojicha: { name: '호지차 샷', unit: 'ml', pack: 250, ...quality.hojicha, price: 0, prepared: true },
}
export type Costs = Partial<Record<IngredientId, number>>
export type Step = {
  station: StationId
  label: string
  instruction: string
  note: string
  costs: Costs
  seconds: number
  usesPitcher: boolean
  target: number
  source: DrinkStepReference['source']
}
export const recipeIds = ['cold-brew', 'glazed-hot', 'glazed-iced', 'hoji-hot', 'hoji-iced'] as const
export type RecipeId = (typeof recipeIds)[number]
export type Recipe = {
  id: RecipeId
  name: string
  shortName: string
  variant: string
  price: number
  steps: Step[]
  color: string
}

function makeRecipe(id: RecipeId, reference: DrinkReference, steps: Step[], price: number, color: string): Recipe {
  return {
    id,
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
    source: reference.source,
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
export const customerNames = ['민서', '지우', '서준', '하린', '도윤', '수아']
export const orderSequence: RecipeId[] = [
  'cold-brew',
  'glazed-hot',
  'glazed-iced',
  'hoji-hot',
  'hoji-iced',
  'cold-brew',
  'glazed-iced',
  'glazed-hot',
]
export function recipeLabel(id: RecipeId) {
  return `${RECIPES[id].name} · ${RECIPES[id].variant}`
}
export function formatAmount(value: number) {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value)
}
export function money(value: number) {
  return `${Math.round(value).toLocaleString('ko-KR')}원`
}
