import { INGREDIENTS } from './ingredients'
import { type RecipeCatalog, recipeVariant } from './recipe-catalog'
import { type PlannedStep, planRecipe, type RecipeContext } from './recipe-plan'
import type { RecipeOperation, RecipeVariant } from './recipe-schema'
import { planStockCosts, preparationStockOutput, type StockContext } from './stock-amounts'

function hasUnknownAmount(operation: RecipeOperation) {
  if (!('amount' in operation) || !operation.amount) return false
  const values = operation.amount.kind === 'by-size' ? Object.values(operation.amount.values) : [operation.amount]
  return values.some((amount) => amount.kind === 'unspecified')
}
export function productionPlan(variant: RecipeVariant, context: RecipeContext): PlannedStep[] {
  const alternatives: Record<string, string> = {}
  for (const step of variant.steps) {
    if (!step.operations.some(hasUnknownAmount)) continue
    const alternative = step.alternatives?.find((item) => !item.operations.some(hasUnknownAmount))
    if (alternative) alternatives[step.id] = alternative.label
  }
  const plan = planRecipe(variant, { ...context, alternatives: { ...alternatives, ...context.alternatives } })
  if (!plan.length) throw new Error('제조 순서가 없습니다.')
  for (const step of plan)
    if (hasUnknownAmount(step.operation)) throw new Error(`${step.label}: 계량 기준 확인이 필요합니다.`)
  return plan
}

function separateStorage(plan: PlannedStep[]) {
  const first = plan.findIndex(({ operation }) => operation.action === 'label' || operation.action === 'store')
  if (first < 0) return { manufacturing: plan, handoff: [] }
  const handoff = plan.slice(first)
  if (handoff.some(({ operation }) => operation.action !== 'label' && operation.action !== 'store'))
    throw new Error('제조 중간의 라벨·보관 순서를 연결해야 합니다.')
  if (handoff.some((step) => step.conditions.length)) throw new Error('라벨·보관의 관찰 조건을 연결해야 합니다.')
  return { manufacturing: plan.slice(0, first), handoff }
}

export function preparationPlan(catalog: RecipeCatalog, recipeId: string, variantId: string, path = new Set<string>()) {
  const { recipe, variant } = recipeVariant(catalog, recipeId, variantId)
  if (recipe.kind !== 'preparation' || !variant.output) throw new Error('부재료 완성 정의를 확인해야 합니다.')
  const plan = productionPlan(variant, { container: 'standard-cup', service: 'for-here' })
  const { manufacturing, handoff } = separateStorage(plan)
  if (!manufacturing.length) throw new Error('준비대에서 수행할 제조 동작이 없습니다.')
  const output = preparationStockOutput(catalog, recipeId, variantId)
  if (!Number.isFinite(output.amount) || output.amount <= 0) throw new Error('완성 재고량을 확인해야 합니다.')
  const material = INGREDIENTS[output.materialId]
  if (!material?.prepared) throw new Error('완성 부재료의 재고 연결을 확인해야 합니다.')
  if (handoff.some(({ operation }) => operation.action === 'store' && operation.storage !== material.storage))
    throw new Error('원문의 보관 장소와 완성 재고의 보관 장소를 연결해야 합니다.')
  const stockContext: StockContext = { cupStyle: 'iced-plastic', recipeId, variantId }
  const costs = planStockCosts(catalog, manufacturing, stockContext)
  requirePreparationRoutes(catalog, manufacturing, new Set([...path, output.materialId]))
  const instructions = [...new Set(handoff.map((step) => [step.instruction, step.note].filter(Boolean).join(' ')))]
  const storageNote =
    instructions.join(' ') ||
    `제조 후 날짜 라벨을 붙이고 ${material.storage === 'fridge' ? '냉장' : '실온'} 보관하세요.`
  return { recipe, variant, plan: manufacturing, handoff, output, costs, stockContext, storageNote }
}

export function preparationVariant(
  catalog: RecipeCatalog,
  materialId: string,
  path = new Set<string>(),
): ReturnType<typeof preparationPlan> {
  const material = catalog.materials.get(materialId)
  if (!material?.preparationId) throw new Error(`${material?.name ?? materialId}: 부재료 제조법이 없습니다.`)
  if (path.has(materialId)) throw new Error(`${material.name}: 제조 경로가 순환합니다.`)
  const recipe = catalog.recipes.get(material.preparationId)!
  const reasons: string[] = []
  for (const variant of recipe.variants) {
    if (variant.output?.materialId !== materialId) continue
    try {
      return preparationPlan(catalog, recipe.id, variant.id, path)
    } catch (error) {
      reasons.push(error instanceof Error ? error.message : String(error))
    }
  }
  throw new Error(`${material.name}: ${[...new Set(reasons)].join(' ') || '부재료 제조법 확인이 필요합니다.'}`)
}

export function requirePreparationRoutes(catalog: RecipeCatalog, plan: PlannedStep[], path = new Set<string>()) {
  for (const step of plan) {
    const operation = step.operation
    const materialId =
      operation.action === 'add' ||
      operation.action === 'grind' ||
      operation.action === 'squeeze' ||
      operation.action === 'peel' ||
      operation.action === 'cut' ||
      operation.action === 'espresso'
        ? operation.materialId
        : operation.action === 'place' || operation.action === 'attach'
          ? operation.itemId
          : operation.action === 'charge'
            ? operation.gasMaterialId
            : undefined
    if (!materialId || catalog.materials.get(materialId)?.kind !== 'prepared') continue
    preparationVariant(catalog, materialId, path)
  }
}
