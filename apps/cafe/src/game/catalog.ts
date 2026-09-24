import referenceData from '../data/references.generated.json'

export const references = referenceData
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
  mix: { name: '혼합 작업대', subtitle: '혼합하고 드리즐해요', x: 4.1, z: -1.4, color: '#bf9370' },
  topping: { name: '폼 · 토핑', subtitle: '음료를 마무리해요', x: 5.1, z: -1.4, color: '#eed6ad' },
  pickup: { name: '픽업대', subtitle: '주문을 확인하고 전달해요', x: 6.1, z: -1.4, color: '#d3b76b' },
  prep: { name: '준비대', subtitle: '폼과 바모카를 만들어요', x: -2.7, z: -5.1, color: '#c3a8cc' },
  stock: { name: '냉장고 · 창고', subtitle: '기한 확인, 개봉과 보충', x: 5.5, z: -4.8, color: '#8bb2a2' },
  wash: { name: '세척대', subtitle: '사용한 피처를 씻어요', x: -5.0, z: -5.1, color: '#aac4cf' },
  rack: { name: '건조 · 도구 선반', subtitle: '씻은 도구를 제자리에', x: -3.9, z: -5.1, color: '#d1bc9d' },
  table: { name: '고객 테이블', subtitle: '사용한 자리를 정리해요', x: 3.2, z: 3.7, color: '#d2ad7d' },
  trash: { name: '분리수거함', subtitle: '마감 전에 비워요', x: -5.4, z: 5.1, color: '#79988b' },
} as const
export type StationId = keyof typeof STATIONS
export const stationIds = Object.keys(STATIONS) as StationId[]
export function canAccessStation(station: StationId, playerZ: number) {
  return station === 'table' || station === 'trash' || playerZ <= STAFF_AISLE_EDGE_Z
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
] as const
export type IngredientId = (typeof ingredientIds)[number]
type Ingredient = {
  name: string
  unit: string
  pack: number
  storage: 'room' | 'fridge'
  lifetime: number
  price: number
  prepared?: boolean
  source: string
}
const HOUR = 3600
// Pack capacities, purchase prices and volume estimates are prototype rules, not store standards.
export const INGREDIENTS: Record<IngredientId, Ingredient> = {
  beans: {
    name: '에스프레소 원두',
    unit: 'g',
    pack: 500,
    storage: 'room',
    lifetime: 7 * 24 * HOUR,
    price: 12000,
    source: 'core 제조 베이스 13행',
  },
  milk: {
    name: '일반 우유',
    unit: 'ml',
    pack: 1000,
    storage: 'fridge',
    lifetime: 2 * 24 * HOUR,
    price: 3000,
    source: 'core 코어 원재료 23행',
  },
  cream: {
    name: '휘핑크림 원재료',
    unit: 'ml',
    pack: 1000,
    storage: 'fridge',
    lifetime: 24 * HOUR,
    price: 6000,
    source: 'core 코어 원재료 22행',
  },
  glaze: {
    name: '글레이즈드 소스',
    unit: 'ml',
    pack: 1000,
    storage: 'fridge',
    lifetime: 3 * 24 * HOUR,
    price: 8000,
    source: 'special 72행 · 개봉후',
  },
  powder: {
    name: '번트 카라멜 파우더',
    unit: '톡',
    pack: 100,
    storage: 'room',
    lifetime: 7 * 24 * HOUR,
    price: 4000,
    source: 'special 51행 · 소분후',
  },
  mochaPowder: {
    name: '바모카 원팩',
    unit: '봉',
    pack: 1,
    storage: 'room',
    lifetime: 7 * 24 * HOUR,
    price: 7000,
    source: 'prep 13행 · 원팩 단위',
  },
  mocha: {
    name: '바모카',
    unit: 'ml',
    pack: 1500,
    storage: 'room',
    lifetime: 24 * HOUR,
    price: 0,
    prepared: true,
    source: 'prep 13행 / core 제조 베이스 20행',
  },
  foam: {
    name: '글레이즈드 폼',
    unit: 'ml',
    pack: 450,
    storage: 'fridge',
    lifetime: 24 * HOUR,
    price: 0,
    prepared: true,
    source: 'recipes 폼·베이스 제조 7~10행',
  },
  coldBrew: {
    name: '콜드 브루 추출액',
    unit: 'ml',
    pack: 3000,
    storage: 'fridge',
    lifetime: 7 * 24 * HOUR,
    price: 0,
    prepared: true,
    source: 'core 제조 베이스 11행',
  },
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
  sourceRow: number
}
export const recipeIds = ['cold-brew', 'glazed-hot', 'glazed-iced'] as const
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

function makeRecipe(
  id: RecipeId,
  name: string,
  variant: string,
  stations: StationId[],
  costs: Costs[],
  price: number,
  color: string,
): Recipe {
  const source = references.recipes.find((recipe) => recipe.name === name && recipe.variant === variant)
  if (!source || source.steps.length !== stations.length)
    throw new Error(`레시피 구조를 확인해주세요: ${name} ${variant}`)
  return {
    id,
    name,
    shortName: id === 'cold-brew' ? '콜드 브루' : '블랙 글레이즈드',
    variant,
    price,
    color,
    steps: source.steps.map((step, index) => ({
      station: stations[index],
      label: step.item,
      instruction: step.instruction,
      note: step.note,
      costs: costs[index] ?? {},
      seconds: step.item.includes('스팀') || (id === 'glazed-hot' && index === 0) ? 5 : 2,
      usesPitcher: id === 'glazed-hot' && index === 0,
      sourceRow: step.source.row,
    })),
  }
}
const sourcePumpCount = Number(references.recipes[0].steps[2].tall)
const sourceShotCount = Number(references.recipes[0].steps[1].tall)
const glazeCost = sourcePumpCount * 10.2
const espressoCost = sourceShotCount * 9 // Prototype grams per shot; source expresses shots, not grams.
export const RECIPES: Record<RecipeId, Recipe> = {
  'cold-brew': makeRecipe(
    'cold-brew',
    '콜드 브루',
    'ICED',
    ['brew', 'water', 'ice'],
    [{ coldBrew: 90 }, {}, {}],
    5000,
    '#493022',
  ),
  'glazed-hot': makeRecipe(
    'glazed-hot',
    '블랙 글레이즈드 라떼',
    'HOT',
    ['steam', 'espresso', 'sauce', 'mix', 'steam', 'mix', 'topping', 'topping', 'pickup'],
    [
      { milk: 200 },
      { beans: espressoCost },
      { glaze: glazeCost },
      {},
      {},
      { mocha: 5 },
      { foam: 45 },
      { powder: 2 },
      {},
    ],
    6500,
    '#be9871',
  ),
  'glazed-iced': makeRecipe(
    'glazed-iced',
    '블랙 글레이즈드 라떼',
    'ICED',
    ['espresso', 'sauce', 'mix', 'steam', 'ice', 'mix', 'topping', 'topping', 'pickup'],
    [
      { beans: espressoCost },
      { glaze: glazeCost },
      {},
      { milk: 180 },
      {},
      { mocha: 5 },
      { foam: 45 },
      { powder: 2 },
      {},
    ],
    6500,
    '#b58b63',
  ),
}
export const customerNames = ['민서', '지우', '서준', '하린', '도윤', '수아']
export const orderSequence: RecipeId[] = [
  'cold-brew',
  'glazed-hot',
  'glazed-iced',
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
