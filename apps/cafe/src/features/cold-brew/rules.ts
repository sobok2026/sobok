import { COLD_BREW_HOURS, referenceLinks } from '../../content/references'
import type { ColdBrew } from '../../simulation/state'

export const COLD_BREW_COST = 9000
export const COLD_BREW_BEANS = Number(referenceLinks.brew.steps.beans.amount)
export const COLD_BREW_WATER = Number(referenceLinks.brew.steps.water.amount)
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
    tolerance: 0.06,
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
