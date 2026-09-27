import { z } from 'zod'
import data from '../../data/shop/pos-customizations.json'
import { drinkSizeIds } from './drink-sizes'
import { amountLabel, type PlannedStep } from './recipe-plan'
import type { RecipeAmount } from './recipe-schema'

export const customizationRules = z
  .strictObject({
    note: z.string(),
    whippedCreamMilliliters: z.number().positive(),
    caramelDrizzleTurns: z.number().positive(),
    chocolateDrizzleTurns: z.number().positive(),
    extraPrice: z.number().int().positive(),
    roastPumps: z.record(z.enum(drinkSizeIds), z.number().int().positive()),
    chipScoops: z.record(z.enum(drinkSizeIds), z.number().int().positive()),
  })
  .parse(data)

export const toppingIds = ['whipped', 'caramel', 'chocolate'] as const
export const toppingOptions = {
  whipped: { name: '일반 휘핑', materialId: 'whipped-cream' },
  caramel: { name: '카라멜 드리즐', materialId: 'caramel-drizzle' },
  chocolate: { name: '초콜릿 드리즐', materialId: 'mocha' },
} as const
export const coffeeNames = {
  regular: '일반 원두',
  blonde: '블론드',
  decaf: '디카페인',
  'half-decaf': '1/2 디카페인',
} as const
export const chipModeNames = { blended: '모두 갈기', split: '반반', topping: '모두 토핑' } as const
export const amountLevelNames = { less: '적게', normal: '보통', extra: '많이' } as const
export const amountPortions = { none: 0, less: 0.5, normal: 1, extra: 1.5 } as const

export function baseCoffee(plan: PlannedStep[]): keyof typeof coffeeNames {
  const operation = plan.find((step) => step.operation.action === 'espresso')?.operation
  if (operation?.action !== 'espresso') return 'regular'
  if (operation.method === 'half-decaf') return 'half-decaf'
  if (operation.method.includes('decaf')) return 'decaf'
  if (operation.method.includes('blonde')) return 'blonde'
  return 'regular'
}

export const blenderStep = (plan: PlannedStep[]) =>
  plan.find((step) => step.operation.action === 'run-machine' && step.operation.equipmentId === 'blender')

export const hasServingCup = (plan: PlannedStep[]) =>
  plan.some((step) => 'into' in step.operation && step.operation.into === 'serving-cup')

export function baseRoastPumps(plan: PlannedStep[]) {
  return plan.reduce((sum, step) => {
    const op = step.operation
    if (op.action !== 'add' || op.materialId !== 'frappuccino-roast' || op.amount.kind !== 'count') return sum
    return sum + op.amount.value
  }, 0)
}

export function baseChipScoops(plan: PlannedStep[]) {
  return plan.reduce((sum, step) => {
    const op = step.operation
    if (op.action !== 'add' || op.materialId !== 'frappuccino-chips' || op.amount.kind !== 'count') return sum
    return sum + op.amount.value
  }, 0)
}

export function existingTopping(plan: PlannedStep[], id: (typeof toppingIds)[number]) {
  const option = toppingOptions[id]
  return plan.find((step) => {
    const op = step.operation
    if (op.action !== 'add' || op.materialId !== option.materialId) return false
    return id !== 'chocolate' || op.toolId === 'drizzle-bottle'
  })
}

/** Fill only approved missing measures; the source recipe remains unchanged. */
export function gameToppingAmount(step: PlannedStep): PlannedStep {
  const op = step.operation
  if (op.action !== 'add' || op.amount.kind !== 'unspecified') return step
  let amount: RecipeAmount | undefined
  let toolId = op.toolId

  if (op.materialId === 'whipped-cream') {
    amount = { kind: 'amount', value: customizationRules.whippedCreamMilliliters, unit: 'ml' }
    toolId = 'whipping-head'
  } else if (op.materialId === 'caramel-drizzle') {
    amount = { kind: 'count', value: customizationRules.caramelDrizzleTurns, unit: 'turn' }
    toolId = 'drizzle-bottle'
  } else if (op.materialId === 'mocha' && op.toolId === 'drizzle-bottle') {
    amount = { kind: 'count', value: customizationRules.chocolateDrizzleTurns, unit: 'turn' }
  }

  if (!amount) return step
  const measurement = amountLabel(amount)

  return {
    ...step,
    operation: { ...op, amount, toolId },
    measurement,
    instruction: `${step.instruction} · 게임 기준 ${measurement}`,
    note: [step.note, '원문 미기재 수량에 승인된 게임 기준을 적용합니다.'].filter(Boolean).join(' '),
  }
}
