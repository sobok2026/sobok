import estimates from '../../data/simulation/stock-estimates.json'
import { type Costs, type IngredientId, ingredientIds } from './ingredients'
import { amountMilliliters, lineVolume, type RecipeCatalog } from './recipe-catalog'
import type { PlannedStep } from './recipe-plan'
import type { CatalogSize } from './recipe-schema'

// This adapter alone may use the inventory estimates explicitly approved by the user.
// The recipe planner, measurements and manufacturing instructions never read them.
export function stockCosts(
  recipeCatalog: RecipeCatalog,
  recipeId: string,
  variantId: string,
  step: PlannedStep,
  size: CatalogSize,
): Costs {
  const operation = step.operation
  if (operation.action === 'espresso') {
    if (operation.amount.kind !== 'count' || operation.amount.unit !== 'shot')
      throw new Error('에스프레소 샷 수가 필요합니다.')
    return { beans: operation.amount.value * estimates.espressoGramsPerShot }
  }
  if (operation.action !== 'add') return {}
  const material = recipeCatalog.materials.get(operation.materialId)!
  if (material.kind === 'utility') return {}
  if (!ingredientIds.includes(operation.materialId as IngredientId))
    throw new Error(`${material.name}의 재고 연결이 없습니다.`)
  const id = operation.materialId as IngredientId
  const amount = operation.amount
  const milliliters = amountMilliliters(recipeCatalog, amount, operation.toolId)
  if (material.stockUnit === 'ml' && milliliters !== null) return { [id]: milliliters }
  if (amount.kind === 'count' && amount.unit === material.stockUnit) return { [id]: amount.value }
  if (amount.kind === 'amount' && amount.unit === material.stockUnit) return { [id]: amount.value }
  if (id === 'mocha' && amount.kind === 'count' && amount.unit === 'turn')
    return { mocha: amount.value * estimates.mochaMillilitersPerTurn }
  const key = `${recipeId}/${variantId}/${step.sourceStepId}`
  const estimate = (
    estimates.drinkSteps as Record<string, { materialId: string; amounts: Partial<Record<CatalogSize, number>> }>
  )[key]
  if (!estimate || estimate.materialId !== id || estimate.amounts[size] === undefined)
    throw new Error(`${key}의 재고 환산값이 없습니다.`)
  return { [id]: estimate.amounts[size] }
}
export const estimatedPreparationMilliliters = estimates.preparedMilliliters

// A fill line is the total volume in the cup. Stock consumption is only the added volume.
// Unknown espresso, ice displacement or rim gaps invalidate the running volume until
// a known liquid fill line establishes it again. They never inherit an invented ml value.
export function cupStockCosts(
  catalog: RecipeCatalog,
  plan: PlannedStep[],
  size: CatalogSize,
  cupStyle: 'hot-paper' | 'iced-plastic',
  baseCosts: Costs[],
): Costs[] {
  let cupMilliliters: number | null = 0
  return plan.map((step, index) => {
    const operation = step.operation
    if (operation.action === 'add' && operation.into === 'serving-cup') {
      const material = catalog.materials.get(operation.materialId)!
      const liquid = material.stockUnit === 'ml' || material.id === 'water'
      const amount = operation.amount
      const target =
        liquid && amount.kind === 'line' && !amount.referenceSize && !amount.offsetMillimeters
          ? lineVolume(catalog, 'serving-cup', size, amount.line, cupStyle)
          : null
      if (target !== null) {
        const added = cupMilliliters === null ? null : target - cupMilliliters
        if (added !== null && added < -1e-9) throw new Error(`${step.label}: 현재 내용물이 목표 기준선을 넘습니다.`)
        cupMilliliters = target
        if (added !== null && material.stockUnit === 'ml' && material.kind !== 'utility') {
          return { [material.id]: Math.round(Math.max(0, added) * 10) / 10 }
        }
      } else {
        const added = liquid ? amountMilliliters(catalog, amount, operation.toolId) : null
        cupMilliliters = cupMilliliters === null || added === null ? null : cupMilliliters + added
      }
    } else if (
      (operation.action === 'espresso' || operation.action === 'transfer' || operation.action === 'strain') &&
      operation.into === 'serving-cup'
    ) {
      cupMilliliters = null
    } else if (operation.action === 'run-machine' && operation.vessel === 'serving-cup') {
      cupMilliliters = null
    }
    return baseCosts[index]
  })
}
