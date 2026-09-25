import { recipeCatalog } from '../../content/catalog'
import { INGREDIENTS, type IngredientId } from '../../content/ingredients'
import { operationSeconds } from '../../content/playable-menu'
import { amountMilliliters, recipeVariant } from '../../content/recipe-catalog'
import { planRecipe } from '../../content/recipe-plan'
import type { Preparation } from '../../simulation/state'

export const preparationIds = ['foam', 'mocha', 'hojicha', 'matcha'] as const
export type PreparationId = (typeof preparationIds)[number]
export const prepToolIds = [
  'cream-carton',
  'milk-carton',
  'mocha-pack',
  'water-jug',
  'spatula',
  'cold-water-jug',
  'tea-scoop',
  'tea-shaker',
  'matcha-shaker',
] as const
export type PrepTool = (typeof prepToolIds)[number]
export const PREP_TOOL_NAMES: Record<PrepTool, string> = {
  'cream-carton': '휘핑크림 팩',
  'milk-carton': '우유팩',
  'mocha-pack': '바모카 원팩',
  'water-jug': '온수 계량 피처',
  spatula: '혼합 스패튤러',
  'cold-water-jug': '정수 계량 피처',
  'tea-scoop': '1티스푼 스쿱',
  'tea-shaker': '호지차 쉐이커 보틀',
  'matcha-shaker': '말차 쉐이커 보틀',
}
export type PrepStep = {
  label: string
  kind: 'pour' | 'pump' | 'pack' | 'scoop' | 'shake' | 'stir' | 'machine'
  tool: PrepTool | null
  target: number
  unit: string
  rate: number
  tolerance: number
  ingredient?: IngredientId
  perUnit?: number
  instruction: string
}
function preparationDefinition(id: PreparationId) {
  const recipeId = recipeCatalog.materials.get(id)?.preparationId
  if (!recipeId) throw new Error(`${id} 제조법이 없습니다.`)
  const { variant } = recipeVariant(recipeCatalog, recipeId, 'standard')
  const plan = planRecipe(variant, { container: 'standard-cup', service: 'takeaway' })
  let seconds = 0
  const steps: PrepStep[] = []
  for (const source of plan) {
    const operation = source.operation
    const base = {
      label: source.label,
      instruction: [source.instruction, source.note].filter(Boolean).join(' '),
      tolerance: 0,
    }
    if (operation.action === 'store') continue // Completed batches use the existing label-and-storage workflow.
    if (operation.action === 'add') {
      const material = operation.materialId
      const ingredient = material === 'water' ? undefined : (material as IngredientId)
      if (operation.amount.kind === 'count') {
        const amount = operation.amount
        if (!['pump', 'scoop', 'pack'].includes(amount.unit))
          throw new Error(`지원하지 않는 준비 계량입니다: ${amount.unit}`)
        const volume = amountMilliliters(recipeCatalog, amount, operation.toolId)
        steps.push({
          ...base,
          kind: amount.unit as 'pump' | 'scoop' | 'pack',
          tool: amount.unit === 'scoop' ? 'tea-scoop' : amount.unit === 'pack' ? 'mocha-pack' : null,
          target: amount.value,
          unit: amount.unit === 'pump' ? '펌프' : amount.unit === 'pack' ? '봉' : '스쿱',
          rate: 0,
          ingredient,
          perUnit:
            amount.unit === 'pump'
              ? (volume ??
                  (() => {
                    throw new Error('펌프 용량이 없습니다.')
                  })()) / amount.value
              : 1,
        })
      } else {
        const volume = amountMilliliters(recipeCatalog, operation.amount, operation.toolId)
        if (volume === null) throw new Error('준비 계량 부피를 확인해야 합니다.')
        const tools: Record<string, PrepTool> = { cream: 'cream-carton', milk: 'milk-carton' }
        steps.push({
          ...base,
          kind: 'pour',
          tool:
            material === 'water'
              ? operation.temperature?.kind === 'hot'
                ? 'water-jug'
                : 'cold-water-jug'
              : tools[material],
          target: volume,
          unit: 'ml',
          rate: volume / 4,
          ingredient,
          perUnit: 1,
        })
      }
    } else if (operation.action === 'shake') {
      if (typeof operation.repetitions !== 'number') throw new Error('준비 쉐이킹 횟수가 없습니다.')
      steps.push({
        ...base,
        kind: 'shake',
        tool: id === 'matcha' ? 'matcha-shaker' : 'tea-shaker',
        target: operation.repetitions,
        unit: '회',
        rate: 0,
      })
    } else if (operation.action === 'mix') {
      const duration = operationSeconds(recipeCatalog, operation)
      steps.push({
        ...base,
        kind: 'stir',
        tool: 'spatula',
        target: duration ?? 1,
        unit: duration ? '초' : '혼합',
        rate: duration ? 1 : 0.4,
      })
    } else if (operation.action === 'run-machine') {
      const duration = operationSeconds(recipeCatalog, operation)
      if (duration === null) throw new Error('준비 장비의 작동 시간을 확인해야 합니다.')
      seconds += duration
      steps.push({
        ...base,
        label: `${operation.program}번 프로그램 · ${operation.cycles}회`,
        kind: 'machine',
        tool: null,
        target: 1,
        unit: '회',
        rate: 0,
      })
    } else throw new Error(`준비대 동작 연결이 필요합니다: ${operation.action}`)
  }
  return {
    name: INGREDIENTS[id].name,
    storageNote: INGREDIENTS[id].storage === 'fridge' ? '제조 후 냉장 보관' : '제조 후 실온 보관',
    seconds,
    steps,
  }
}
export const PREPARATIONS = Object.fromEntries(preparationIds.map((id) => [id, preparationDefinition(id)])) as Record<
  PreparationId,
  ReturnType<typeof preparationDefinition>
>
export function createPreparation(recipe: PreparationId): Preparation {
  return {
    id: crypto.randomUUID(),
    recipe,
    step: 0,
    progress: 0,
    stage: 'measuring',
    tool: null,
    toolReserved: true,
    amounts: { cream: 0, milk: 0, glaze: 0, water: 0, mochaPowder: 0, hojichaPowder: 0, matchaPowder: 0 },
    fault: null,
    batchId: null,
    ingredientExpiresAt: null,
  }
}
export const preparationStep = (prep: Preparation) => PREPARATIONS[prep.recipe].steps[prep.step]
export const continuousPreparation = (step: PrepStep) => step.kind === 'pour' || step.kind === 'stir'
