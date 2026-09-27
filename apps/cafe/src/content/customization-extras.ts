import {
  amountPortions,
  blenderStep,
  customizationRules,
  existingTopping,
  hasServingCup,
  toppingIds,
  toppingOptions,
} from './customization-options'
import type { Customizations } from './customizations'
import { amountLabel, type PlannedStep } from './recipe-plan'
import type { RecipeAmount } from './recipe-schema'

function extraStep(
  id: string,
  label: string,
  materialId: string,
  amount: RecipeAmount,
  into: string,
  toolId?: string,
): PlannedStep {
  return {
    id: `custom:${id}`,
    sourceStepId: `custom:${id}`,
    label,
    sharedLabel: false,
    instruction: label,
    note: '',
    conditions: [],
    measurement: amountLabel(amount),
    operation: { action: 'add', materialId, into, amount, toolId },
  }
}

function beforeServe(plan: PlannedStep[], additions: PlannedStep[]) {
  const index = plan.findIndex((step) => step.operation.action === 'serve')
  plan.splice(index < 0 ? plan.length : index, 0, ...additions)
}

export function applyExtraCustomizations(base: PlannedStep[], plan: PlannedStep[], custom: Customizations) {
  const blended = blenderStep(base)
  const machine = blended?.operation
  const blenderVessel = machine?.action === 'run-machine' ? machine.vessel : undefined

  if ((custom.roast !== null || custom.javaChips !== null) && !blenderVessel) {
    throw new Error('블렌더로 제조하는 음료에서 선택해주세요.')
  }
  if (Object.keys(custom.toppings).length && !hasServingCup(base)) {
    throw new Error('이 제공 용기에는 토핑을 추가할 수 없어요.')
  }

  const beforeBlend: PlannedStep[] = []
  const afterBlend: PlannedStep[] = []

  if (custom.roast !== null && blenderVessel) {
    let replaced = false

    for (let index = plan.length - 1; index >= 0; index--) {
      const op = plan[index].operation
      if (op.action !== 'add' || op.materialId !== 'frappuccino-roast') continue
      replaced = true

      if (custom.roast === 0) {
        plan.splice(index, 1)
      } else {
        const amount = { kind: 'count', value: custom.roast, unit: 'pump' } as const
        const measurement = amountLabel(amount)
        plan[index] = {
          ...plan[index],
          operation: { ...op, amount },
          measurement,
          instruction: `${plan[index].label} · ${measurement}`,
        }
      }
    }

    if (!replaced && custom.roast > 0) {
      beforeBlend.push(
        extraStep(
          'roast',
          '프라푸치노 로스트',
          'frappuccino-roast',
          { kind: 'count', value: custom.roast, unit: 'pump' },
          blenderVessel,
          'frappuccino-roast-pump',
        ),
      )
    }
  }

  if (custom.javaChips && blenderVessel) {
    if (!hasServingCup(base)) throw new Error('이 제공 용기에는 자바칩 토핑을 추가할 수 없어요.')

    for (let index = plan.length - 1; index >= 0; index--) {
      const op = plan[index].operation
      if (op.action === 'add' && op.materialId === 'frappuccino-chips') plan.splice(index, 1)
    }

    const { scoops, mode } = custom.javaChips
    let blendedScoops = scoops
    if (mode === 'split') blendedScoops /= 2
    if (mode === 'topping') blendedScoops = 0
    const toppingScoops = scoops - blendedScoops

    if (blendedScoops > 0) {
      beforeBlend.push(
        extraStep(
          'chips-blended',
          '자바칩 갈기',
          'frappuccino-chips',
          { kind: 'count', value: blendedScoops, unit: 'scoop' },
          blenderVessel,
          'tea-scoop',
        ),
      )
    }
    if (toppingScoops > 0) {
      afterBlend.push(
        extraStep(
          'chips-topping',
          '자바칩 토핑',
          'frappuccino-chips',
          { kind: 'count', value: toppingScoops, unit: 'scoop' },
          'serving-cup',
          'tea-scoop',
        ),
      )
    }
  }

  if (beforeBlend.length && blended) {
    const index = plan.findIndex((step) => step.id === blended.id)
    plan.splice(index, 0, ...beforeBlend)
  }

  const toppings: PlannedStep[] = []

  for (const id of toppingIds) {
    const level = custom.toppings[id]
    if (!level) continue
    if (existingTopping(base, id)) throw new Error('기본 토핑은 해당 재료의 양 조절을 사용해주세요.')
    const option = toppingOptions[id]
    const portion = amountPortions[level]

    if (id === 'whipped') {
      toppings.push(
        extraStep(
          id,
          option.name,
          option.materialId,
          { kind: 'amount', value: customizationRules.whippedCreamMilliliters * portion, unit: 'ml' },
          'serving-cup',
          'whipping-head',
        ),
      )
      continue
    }

    const turns = id === 'caramel' ? customizationRules.caramelDrizzleTurns : customizationRules.chocolateDrizzleTurns
    toppings.push(
      extraStep(
        id,
        option.name,
        option.materialId,
        { kind: 'count', value: turns * portion, unit: 'turn' },
        'serving-cup',
        'drizzle-bottle',
      ),
    )
  }

  beforeServe(plan, [...toppings, ...afterBlend])
  return plan
}
