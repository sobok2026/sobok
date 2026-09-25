import { DRINK_SIZES, drinkSizeRatio } from '../../content/drink-sizes'
import type { Costs } from '../../content/ingredients'
import { type RecipeId, recipeFor } from '../../content/recipes'
import type { StationId } from '../../content/stations'
import type { CraftState, GameState } from '../../simulation/state'
import { type CupKind, cupService, cupSize, isReusableCup } from '../inventory/cups'

export const CRAFT_EPSILON = 1e-9

export const craftToolIds = [
  'milk-carton',
  'pitcher',
  'shot-glass',
  'stirrer',
  'mocha-bottle',
  'foam-pitcher',
  'shaker',
  'ice-scoop',
  'lid',
  'tea-bottle',
  'matcha-bottle',
] as const
export type CraftTool = (typeof craftToolIds)[number]
export const TOOL_NAMES: Record<CraftTool, string> = {
  'milk-carton': '우유팩',
  pitcher: '스팀 피처',
  'shot-glass': '샷 글라스',
  stirrer: '머들러',
  'mocha-bottle': '드리즐 보틀',
  'foam-pitcher': '폼 피처',
  shaker: '토핑 쉐이커',
  'ice-scoop': '아이스 스쿱',
  lid: '리드',
  'tea-bottle': '호지차 샷 보틀',
  'matcha-bottle': '말차 샷 보틀',
}
type CraftContents = CraftState['contents']
export type CraftOperation = {
  id: string
  kind:
    | 'machine'
    | 'dispense'
    | 'steam'
    | 'pour'
    | 'pump'
    | 'stir'
    | 'shake'
    | 'drizzle'
    | 'sprinkle'
    | 'ice'
    | 'lid'
    | 'transfer'
  label: string
  tool: CraftTool | null
  target: number
  tolerance: number
  unit: string
  rate: number
  costs: Costs
  stockPrerequisite?: Costs
  batchIngredient?: 'hojicha' | 'matcha'
  content?: keyof CraftContents
  weight: number
  targetFill?: number
  pitcherMl?: number
  fillsPitcher?: boolean
  destination?: string
  seconds: number | null
}
export const craftStations: StationId[] = [
  'espresso',
  'steam',
  'brew',
  'water',
  'ice',
  'sauce',
  'mix',
  'topping',
  'pickup',
]
// These are drawing coordinates, not cup capacities or inventory conversion factors.
function fillFor(amount: import('../../content/recipe-schema').RecipeAmount): number {
  if (amount.kind === 'line') {
    const lines = { lower: 0.4, middle: 0.6, upper: 0.8, size: 0.8, max: 0.96 }
    return lines[amount.line]
  }
  if (amount.kind === 'rim-gap') return Math.max(0, 1 - amount.millimeters / 100)
  throw new Error(`현재 컵에서 지원하지 않는 계량 방식입니다: ${amount.kind}`)
}
export function operationFor(recipe: RecipeId, step: number, craft: CraftState): CraftOperation | null {
  const size = cupSize(craft.kind)
  const definition = recipeFor(recipe, size, cupService(craft.kind))
  const source = definition.steps[step]
  if (!source) return null
  const operation = source.operation
  if (operation.action === 'serve' && operation.lid === 'takeaway' && isReusableCup(craft.kind)) return null
  const toLine = (content: keyof CraftContents, targetFill: number) => ({
    content,
    targetFill,
    weight: Math.max(
      0,
      targetFill -
        (['coffee', 'sauce', 'milk', 'tea', 'water', 'foam', 'ice'] as const).reduce(
          (sum, key) => sum + (key === content ? 0 : craft.contents[key]),
          0,
        ),
    ),
  })
  const base = {
    id: `${recipe}:${size}:${source.id}`,
    label: source.label,
    target: 1,
    tolerance: 0,
    unit: '완료',
    rate: 0.25,
    costs: source.costs,
    weight: 0,
    seconds: source.seconds,
  }
  switch (operation.action) {
    case 'run-machine':
      return {
        ...base,
        kind: 'dispense',
        label: `${DRINK_SIZES[size].name} 온수 디스펜서 · ${operation.program.toUpperCase()}`,
        tool: null,
        unit: '회',
        ...toLine('water', 0.72),
      }
    case 'espresso':
      return {
        ...base,
        kind: 'machine',
        label: `${source.target}샷 추출`,
        tool: null,
        unit: '추출',
        content: 'coffee',
        weight: espressoFill(recipe, craft.kind),
        destination: operation.into,
      }
    case 'steam':
      return { ...base, kind: 'steam', label: `${operation.setting ?? ''} 우유 스팀`, tool: null, unit: '스팀' }
    case 'shake': {
      const following = definition.steps[step + 1]
      const materialId = following?.operation.action === 'add' ? following.operation.materialId : undefined
      if (materialId !== 'hojicha' && materialId !== 'matcha')
        throw new Error('재혼합할 샷 재료가 연결되지 않았습니다.')
      return {
        ...base,
        kind: 'shake',
        label: '사용 전 샷 재혼합',
        tool: materialId === 'matcha' ? 'matcha-bottle' : 'tea-bottle',
        target: typeof operation.repetitions === 'number' ? operation.repetitions : 1,
        unit: operation.repetitions ? '회' : '재혼합',
        stockPrerequisite: following.costs,
        batchIngredient: materialId,
      }
    }
    case 'mix':
      return {
        ...base,
        kind: 'stir',
        label: source.label,
        tool: 'stirrer',
        target: source.seconds ?? (typeof operation.repetitions === 'number' ? operation.repetitions : 1),
        unit: source.seconds ? '초' : operation.repetitions ? '회' : '혼합',
        rate: source.seconds ? 1 : 0.4,
      }
    case 'transfer':
      if (operation.from === 'shot-glass')
        return {
          ...base,
          kind: 'transfer',
          label: '추출한 샷 전량 옮기기',
          tool: 'shot-glass',
          content: 'coffee',
          weight: espressoFill(recipe, craft.kind),
        }
      if (operation.from === 'steam-pitcher')
        return {
          ...base,
          kind: 'pour',
          label: '폼을 제외하고 스팀 우유 붓기',
          tool: 'pitcher',
          ...toLine('milk', fillFor(operation.amount)),
          pitcherMl: definition.steps.find((item) => item.usesPitcher)!.costs.milk!,
        }
      break
    case 'serve':
      return { ...base, kind: 'lid', label: '리드 덮기', tool: 'lid', unit: '개' }
    case 'add': {
      const material = operation.materialId
      const previous = definition.steps[step - 1]?.operation
      const batchIngredient =
        (material === 'hojicha' || material === 'matcha') && previous?.action === 'shake' ? material : undefined
      if (batchIngredient && previous?.action === 'shake' && craft.remixPourProgress !== null) {
        const remaining = Math.max(0, 1 - craft.remixPourProgress)
        return {
          ...base,
          id: `${base.id}:remix`,
          kind: 'shake',
          label: '새 샷 배치 재혼합',
          tool: batchIngredient === 'matcha' ? 'matcha-bottle' : 'tea-bottle',
          target: typeof previous.repetitions === 'number' ? previous.repetitions : 1,
          unit: previous.repetitions ? '회' : '재혼합',
          costs: {},
          batchIngredient,
          stockPrerequisite: { [batchIngredient]: (source.costs[batchIngredient] ?? 0) * remaining },
        }
      }
      if (operation.into === 'steam-pitcher')
        return {
          ...base,
          kind: 'pour',
          label: '피처의 주문 사이즈 선까지 우유 계량',
          tool: 'milk-carton',
          fillsPitcher: true,
          unit: '기준선',
        }
      if (operation.amount.kind === 'count') {
        const amount = operation.amount
        if (amount.unit === 'pump')
          return {
            ...base,
            kind: 'pump',
            tool: null,
            target: amount.value,
            unit: '펌프',
            content: 'sauce',
            weight: (0.07 * amount.value) / (3 * drinkSizeRatio(size)),
          }
        if (amount.unit === 'turn')
          return {
            ...base,
            kind: 'drizzle',
            tool: 'mocha-bottle',
            target: amount.value,
            rate: 0.45,
            unit: '바퀴',
            content: 'drizzle',
            weight: 1,
          }
        if (amount.unit === 'tap')
          return {
            ...base,
            kind: 'sprinkle',
            tool: 'shaker',
            target: amount.value,
            unit: '톡',
            content: 'powder',
            weight: 1,
          }
      }
      const pours: Record<string, { content: keyof CraftContents; tool: CraftTool | null }> = {
        coldBrew: { content: 'coffee', tool: null },
        water: { content: 'water', tool: null },
        milk: { content: 'milk', tool: 'milk-carton' },
        hojicha: { content: 'tea', tool: 'tea-bottle' },
        matcha: { content: 'tea', tool: 'matcha-bottle' },
        foam: { content: 'foam', tool: 'foam-pitcher' },
        ice: { content: 'ice', tool: 'ice-scoop' },
      }
      const pour = pours[material]
      if (pour)
        return {
          ...base,
          kind: material === 'ice' ? 'ice' : 'pour',
          tool: pour.tool,
          unit: source.measurement,
          batchIngredient,
          ...toLine(pour.content, fillFor(operation.amount)),
        }
    }
  }
  throw new Error(`제조 동작 연결이 필요합니다: ${operation.action}`)
}
export function espressoFill(recipe: RecipeId, kind: CupKind) {
  const size = cupSize(kind)
  const shots =
    recipeFor(recipe, size, cupService(kind)).steps.find((step) => step.operation.action === 'espresso')?.target ?? 0
  return (0.13 * shots) / drinkSizeRatio(size)
}

export function createCraft(kind: CupKind): CraftState {
  return {
    kind,
    consumed: {},
    location: 'hand',
    tool: null,
    progress: 0,
    contents: { coffee: 0, sauce: 0, milk: 0, tea: 0, water: 0, foam: 0, ice: 0, drizzle: 0, powder: 0 },
    pitcherMilk: 0,
    pitcherReserved: false,
    shotReady: false,
    shotTransferred: false,
    mixed: false,
    teaMixed: false,
    mixedBatchIds: [],
    remixPourProgress: null,
    lidded: false,
    fault: null,
  }
}
export function isContinuous(op: CraftOperation) {
  return ['pour', 'stir', 'drizzle', 'transfer', 'ice'].includes(op.kind)
}
export function isMetered(op: CraftOperation) {
  return ['pump', 'sprinkle'].includes(op.kind)
}
export function readyToConfirm(op: CraftOperation, progress: number) {
  return progress + CRAFT_EPSILON >= op.target * (1 - op.tolerance)
}

export function nextStep(state: GameState) {
  const cup = state.cup
  return cup && operationFor(cup.recipe, cup.step, cup.craft)
    ? recipeFor(cup.recipe, cupSize(cup.craft.kind), cupService(cup.craft.kind)).steps[cup.step]
    : undefined
}
