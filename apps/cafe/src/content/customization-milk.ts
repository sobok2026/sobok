import type { Customizations } from './customizations'
import type { RecipeCatalog } from './recipe-catalog'
import type { PlannedStep } from './recipe-plan'
import {
  buildStockEffect,
  projectStockEffect,
  type StockContext,
  type StockFlowState,
  type StockNextAdd,
  scaleStockEffect,
} from './stock-amounts'

/** Keep the recipe's serving share when milk volume or its liquid/foam balance changes. */
export function customizeMilkTransfers(
  catalog: RecipeCatalog,
  base: Array<PlannedStep & { nextStockAdd?: StockNextAdd | null }>,
  plan: PlannedStep[],
  context: StockContext,
  custom: Customizations,
): PlannedStep[] {
  if (!custom.milkAmount && !custom.milkFoam) return plan
  const vessels = new Set(
    base.flatMap((step) =>
      step.operation.action === 'add' && step.operation.materialId === 'milk' ? [step.operation.into] : [],
    ),
  )
  const shares = new Map<string, number>()
  const nextAdds = new Map(base.map((step) => [step.id, step.nextStockAdd ?? undefined]))
  let reference: StockFlowState = { vessels: {}, stockHeld: {} }

  for (const step of base) {
    const effect = buildStockEffect(catalog, reference, step.operation, context, nextAdds.get(step.id))
    const transfer = effect.transfer

    if (transfer && vessels.has(transfer.from) && transfer.availableMilliliters > 0) {
      shares.set(step.id, transfer.movedMilliliters / transfer.availableMilliliters)
    }

    reference = projectStockEffect(reference, effect, context, 0, 1)
  }

  let actual: StockFlowState = { vessels: {}, stockHeld: {} }

  return plan.map((step) => {
    let effect = buildStockEffect(catalog, actual, step.operation, context, nextAdds.get(step.id))
    const share = shares.get(step.id)
    let resolved = step

    if (share !== undefined && effect.transfer && step.operation.action === 'transfer') {
      const value = effect.transfer.availableMilliliters * share
      const amount = { kind: 'amount', value, unit: 'ml' } as const
      const measurement = `약 ${Number(value.toFixed(1))}ml`
      resolved = {
        ...step,
        operation: { ...step.operation, amount },
        portion: undefined,
        measurement,
        instruction: `${step.label} · ${measurement} · 변경한 우유와 거품 비율`,
      }
      effect = buildStockEffect(catalog, actual, resolved.operation, context)
    }

    const portion = resolved.portion ?? resolved.foamPortion
    if (portion !== undefined) effect = scaleStockEffect(actual, effect, context, portion)
    actual = projectStockEffect(actual, effect, context, 0, 1)
    return resolved
  })
}
