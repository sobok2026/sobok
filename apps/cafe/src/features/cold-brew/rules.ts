import { recipeCatalog } from '../../content/catalog'
import { recipeVariant } from '../../content/recipe-catalog'
import { planRecipe } from '../../content/recipe-plan'
import type { ColdBrew } from '../../simulation/state'

const { variant } = recipeVariant(recipeCatalog, 'cold-brew-batch', 'standard')
const operations = planRecipe(variant, { container: 'standard-cup', service: 'takeaway' }).map((step) => step.operation)
const beans = operations.find((operation) => operation.action === 'add' && operation.materialId === 'cold-brew-beans')
const water = operations.find((operation) => operation.action === 'add' && operation.materialId === 'water')
const steep = operations.find((operation) => operation.action === 'steep')
if (
  beans?.action !== 'add' ||
  beans.amount.kind !== 'amount' ||
  beans.amount.unit !== 'lb' ||
  water?.action !== 'add' ||
  water.amount.kind !== 'amount' ||
  water.amount.unit !== 'l' ||
  steep?.action !== 'steep' ||
  !('seconds' in steep.duration)
)
  throw new Error('콜드 브루 배합의 단위·시간을 확인해야 합니다.')
export const COLD_BREW_COST = 9000
export const COLD_BREW_BEANS = beans.amount.value
export const COLD_BREW_WATER = water.amount.value
export const COLD_BREW_HOURS = steep.duration.seconds / 3600
export const coldBrewTools = ['bean-bag', 'water-jug'] as const
type ColdBrewTool = (typeof coldBrewTools)[number]
export const COLD_BREW_TOOL_NAMES: Record<ColdBrewTool, string> = {
  'bean-bag': '원두 봉투',
  'water-jug': '물 계량 피처',
}
export const COLD_BREW_STEPS = [
  {
    label: '콜드 브루 원두 계량',
    unit: 'lb',
    target: COLD_BREW_BEANS,
    rate: COLD_BREW_BEANS / 4,
    tolerance: 0,
    tool: 'bean-bag' as ColdBrewTool,
  },
  {
    label: '정수 계량',
    unit: 'L',
    target: COLD_BREW_WATER,
    rate: COLD_BREW_WATER / 4,
    tolerance: 0,
    tool: 'water-jug' as ColdBrewTool,
  },
  { label: `${COLD_BREW_HOURS}시간 추출 시작`, unit: '회', target: 1, rate: 0, tolerance: 0, tool: null },
] as const
export const coldBrewStep = (brew: ColdBrew) => COLD_BREW_STEPS[brew.step]
export function createColdBrew(): ColdBrew {
  return {
    id: crypto.randomUUID(),
    step: 0,
    progress: 0,
    stage: 'measuring',
    tool: null,
    beans: 0,
    water: 0,
    fault: null,
    completedAt: null,
    batchId: null,
  }
}
