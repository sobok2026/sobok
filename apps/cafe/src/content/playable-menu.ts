import { z } from 'zod'
import { type DrinkSize, drinkSizeIds } from './drink-sizes'
import type { Costs } from './ingredients'
import { executableRecipeVariant, type RecipeCatalog } from './recipe-catalog'
import { type PlannedStep, planRecipe, type ResolvedOperation } from './recipe-plan'
import { recipeSizeSchema } from './recipe-schema'
import type { StationId } from './stations'
import { cupStockCosts, stockCosts } from './stock-amounts'

export const recipeIds = [
  'cold-brew',
  'glazed-hot',
  'glazed-iced',
  'hoji-hot',
  'hoji-iced',
  'pure-hoji-hot',
  'pure-hoji-iced',
  'pure-matcha-hot',
  'pure-matcha-iced',
] as const
export type RecipeId = (typeof recipeIds)[number]
export type Step = PlannedStep & {
  station: StationId
  costs: Costs
  seconds: number | null
  usesPitcher: boolean
  target: number
}
type SizedRecipe = { price: number; steps: Step[]; dineInSteps: Step[] }
export type Recipe = {
  name: string
  shortName: string
  variant: string
  sizes: Partial<Record<DrinkSize, SizedRecipe>>
  color: string
}
function stationFor(operation: ResolvedOperation): StationId {
  switch (operation.action) {
    case 'espresso':
      return 'espresso'
    case 'steam':
      return 'steam'
    case 'run-machine':
      if (operation.equipmentId === 'hot-water-dispenser') return 'water'
      break
    case 'shake':
    case 'mix':
      return 'mix'
    case 'transfer':
      return operation.from === 'steam-pitcher' ? 'steam' : 'mix'
    case 'serve':
      return 'pickup'
    case 'add': {
      const stations: Record<string, StationId> = {
        milk: 'steam',
        coldBrew: 'brew',
        water: 'water',
        ice: 'ice',
        glaze: 'sauce',
        classic: 'sauce',
        hojicha: 'mix',
        matcha: 'mix',
        mocha: 'mix',
        foam: 'topping',
        powder: 'topping',
      }
      if (stations[operation.materialId]) return stations[operation.materialId]
    }
  }
  throw new Error(`${operation.action} 동작을 지원하는 작업대를 연결해야 합니다.`)
}
export function operationSeconds(recipeCatalog: RecipeCatalog, operation: ResolvedOperation): number | null {
  let duration = 'duration' in operation ? operation.duration : undefined
  let cycles = 1
  if (operation.action === 'run-machine') {
    duration ??=
      recipeCatalog.equipment.get(operation.equipmentId)?.programs.find((program) => program.id === operation.program)
        ?.duration ?? undefined
    if (typeof operation.cycles !== 'number') throw new Error('작동 횟수 범위의 선택이 필요합니다.')
    cycles = operation.cycles
  }
  if (!duration) return null
  if (!('seconds' in duration) || duration.atLeast)
    throw new Error('시간 범위·최소 시간의 종료 조건을 연결해야 합니다.')
  return duration.seconds * cycles
}
export function buildMenu(recipeCatalog: RecipeCatalog, input: unknown): Record<RecipeId, Recipe> {
  const menu = z
    .array(
      z.strictObject({
        id: z.enum(recipeIds),
        recipeId: z.string(),
        variantId: z.string(),
        prices: z.partialRecord(recipeSizeSchema, z.number().int().positive()),
        color: z.string().regex(/^#[0-9a-f]{6}$/i),
      }),
    )
    .parse(input)
  if (menu.length !== recipeIds.length || new Set(menu.map((item) => item.id)).size !== recipeIds.length)
    throw new Error('판매 메뉴 ID가 중복되거나 누락되었습니다.')

  return Object.fromEntries(
    menu.map((item) => {
      const { recipe, variant } = executableRecipeVariant(recipeCatalog, item.recipeId, item.variantId)
      const sizes = Object.fromEntries(
        Object.entries(item.prices).map(([key, price]) => {
          const size = key as DrinkSize
          if (!drinkSizeIds.includes(size)) throw new Error(`현재 매장에서 지원하지 않는 컵 사이즈입니다: ${size}`)
          const plan = planRecipe(variant, { size, container: 'standard-cup', service: 'takeaway' })
          const baseCosts = plan.map((step) => stockCosts(recipeCatalog, item.recipeId, item.variantId, step, size))
          const takeoutCosts = cupStockCosts(
            recipeCatalog,
            plan,
            size,
            variant.temperature === 'iced' ? 'iced-plastic' : 'hot-paper',
            baseCosts,
          )
          const steps: Step[] = plan.map((step, index) => ({
            ...step,
            station: stationFor(step.operation),
            costs: takeoutCosts[index],
            seconds: operationSeconds(recipeCatalog, step.operation),
            usesPitcher: step.operation.action === 'add' && step.operation.into === 'steam-pitcher',
            target:
              'amount' in step.operation && step.operation.amount?.kind === 'count' ? step.operation.amount.value : 1,
          }))
          const dineInSteps = steps.map((step, index) => ({ ...step, costs: baseCosts[index] }))
          return [size, { price, steps, dineInSteps }]
        }),
      )
      return [
        item.id,
        {
          name: recipe.name,
          shortName: recipe.name.replace(/(?: 티)? 라떼$/, ''),
          variant: variant.temperature?.toUpperCase() ?? variant.name,
          sizes,
          color: item.color,
        },
      ]
    }),
  ) as Record<RecipeId, Recipe>
}
