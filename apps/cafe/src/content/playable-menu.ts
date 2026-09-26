import { z } from 'zod'
import servingVesselData from '../../data/shop/serving-vessels.json'
import type { ServiceMode } from '../features/inventory/cups'
import { compileWorkflow, type WorkStep } from '../features/production/workflow'
import { type DrinkSize, drinkSizeIds } from './drink-sizes'
import { productionPlan, requirePreparationRoutes } from './production-plans'
import { type RecipeCatalog, recipeVariant } from './recipe-catalog'
import { planStockCosts } from './stock-amounts'

export type RecipeId = string
export type Step = WorkStep

export type SizedRecipe = {
  price: number
  plans: Partial<Record<ServiceMode, WorkStep[]>>
  vessels: Partial<Record<ServiceMode, string>>
}

export type Recipe = {
  id: RecipeId
  recipeId: string
  variantId: string
  name: string
  shortName: string
  variant: string
  temperature: 'hot' | 'iced'
  sizes: Partial<Record<DrinkSize, SizedRecipe>>
  color: string
}

export type UnavailableMenu = { recipeId: string; variantId: string; name: string; reasons: string[] }

export const menuSchema = z.array(
  z.strictObject({
    recipeId: z.string().min(1),
    variantId: z.string().min(1),
    prices: z.partialRecord(z.enum(drinkSizeIds), z.number().int().positive()),
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
  }),
)

const servingVessels = z
  .array(
    z.strictObject({
      vesselId: z.string().min(1),
      services: z.array(z.enum(['dine-in', 'takeout'])).min(1),
    }),
  )
  .parse(servingVesselData)

const CUP_STYLES = {
  hot: { 'dine-in': 'hot-mug', takeout: 'hot-paper' },
  iced: { 'dine-in': 'iced-glass', takeout: 'iced-plastic' },
} as const

export function buildMenu(catalog: RecipeCatalog, input: unknown) {
  for (const entry of servingVessels)
    if (!catalog.vessels.has(entry.vesselId)) throw new Error(`제공 용기가 없습니다: ${entry.vesselId}`)

  const entries = menuSchema.parse(input)
  const available: Record<string, Recipe> = {}
  const unavailable: UnavailableMenu[] = []
  const seen = new Set<string>()

  for (const entry of entries) {
    const id = `${entry.recipeId}:${entry.variantId}`
    if (seen.has(id)) throw new Error(`판매 메뉴가 중복됩니다: ${id}`)
    seen.add(id)
    const { recipe, variant } = recipeVariant(catalog, entry.recipeId, entry.variantId)
    const reasons = new Set<string>()
    const sizes: Recipe['sizes'] = {}
    if (recipe.kind !== 'drink') throw new Error(`${recipe.name}: 음료만 판매할 수 있습니다.`)
    if (!variant.temperature) reasons.add('음료 제공 형태 확인이 필요합니다.')

    for (const [sizeKey, price] of Object.entries(entry.prices)) {
      const size = sizeKey as DrinkSize

      if (size === 'single' && variant.sizes.length > 1) {
        reasons.add('단일 가격과 제공 사이즈 연결이 필요합니다.')
        continue
      }

      const sourceSize = size === 'single' ? variant.sizes.at(0) : size
      const plans: SizedRecipe['plans'] = {}
      const vessels: SizedRecipe['vessels'] = {}

      for (const service of ['dine-in', 'takeout'] as const) {
        if (size === 'trenta' && service === 'dine-in') continue
        try {
          const plan = productionPlan(variant, {
            size: sourceSize,
            container: 'standard-cup',
            service: service === 'dine-in' ? 'for-here' : 'takeaway',
          })
          requirePreparationRoutes(catalog, plan)
          // A lid required for every serving needs a disposable cup in the current shop.
          if (
            service === 'dine-in' &&
            plan.some((step) => step.operation.action === 'serve' && step.operation.lid === 'always')
          )
            throw new Error('이 제조법은 일회용 컵 제공으로 연결되어 있습니다.')
          const resolved = plan.map((step) =>
            step.operation.action === 'serve' && step.operation.lid === 'takeaway'
              ? {
                  ...step,
                  operation: {
                    ...step.operation,
                    lid: service === 'takeout' ? ('always' as const) : ('none' as const),
                  },
                }
              : step,
          )
          const destinations = resolved.flatMap((step) => ('into' in step.operation ? [step.operation.into] : []))
          const vesselId = destinations.includes('serving-cup') ? 'serving-cup' : (destinations.at(-1) ?? 'serving-cup')
          if (!servingVessels.find((entry) => entry.vesselId === vesselId)?.services.includes(service))
            throw new Error('원문의 제공 용기를 이 이용 방식으로 사용할 수 없습니다.')
          const cupStyle = CUP_STYLES[variant.temperature === 'hot' ? 'hot' : 'iced'][service]
          const stockContext = {
            size: sourceSize,
            cupStyle,
            recipeId: recipe.id,
            variantId: variant.id,
          } as const
          const costs = planStockCosts(catalog, resolved, stockContext)
          plans[service] = compileWorkflow(catalog, resolved, costs, stockContext)
          vessels[service] = vesselId
        } catch (error) {
          reasons.add(error instanceof Error ? error.message : String(error))
        }
      }

      if (Object.keys(plans).length) sizes[size] = { price, plans, vessels }
    }

    if (!Object.keys(entry.prices).length) reasons.add('공개 판매 가격 확인이 필요합니다.')
    if (variant.temperature && Object.keys(sizes).length) {
      available[id] = {
        id,
        recipeId: recipe.id,
        variantId: variant.id,
        name: recipe.name,
        shortName: recipe.name,
        variant:
          variant.name === variant.temperature.toUpperCase()
            ? variant.name
            : `${variant.temperature.toUpperCase()} · ${variant.name}`,
        temperature: variant.temperature,
        sizes,
        color: entry.color,
      }
    } else
      unavailable.push({
        recipeId: recipe.id,
        variantId: variant.id,
        name: `${recipe.name} · ${variant.name}`,
        reasons: [...reasons],
      })
  }

  return { available, unavailable }
}
