import { z } from 'zod'
import { applyExtraCustomizations } from './customization-extras'
import {
  amountLevelNames,
  amountPortions,
  baseChipScoops,
  baseRoastPumps,
  chipModeNames,
  coffeeNames,
  customizationRules,
  toppingIds,
  toppingOptions,
} from './customization-options'
import { amountLabel, type PlannedStep } from './recipe-plan'

export const extraSyrups = {
  'vanilla-syrup': '바닐라 시럽',
  'hazelnut-syrup': '헤이즐넛 시럽',
  'caramel-syrup': '카라멜 시럽',
} as const

export const milkChoices = {
  milk: '일반 우유',
  'low-fat-milk': '저지방 우유',
  'nonfat-milk': '무지방 우유',
  'soy-milk': '두유',
  'oat-and-u': '오트',
} as const

export const customizationSchema = z.strictObject({
  quantities: z.record(z.string().max(160), z.number().min(0).max(99).multipleOf(0.5)),
  syrups: z.partialRecord(z.enum(['vanilla-syrup', 'hazelnut-syrup', 'caramel-syrup']), z.number().int().min(0).max(9)),
  milk: z.enum(['milk', 'low-fat-milk', 'nonfat-milk', 'soy-milk', 'oat-and-u']).nullable(),
  coffee: z.enum(['regular', 'blonde', 'decaf', 'half-decaf']).nullable(),
  omitted: z.array(z.string().max(160)).max(20),
  levels: z.record(z.string().max(160), z.enum(['less', 'extra'])),
  toppings: z.partialRecord(z.enum(toppingIds), z.enum(['less', 'normal', 'extra'])),
  roast: z.number().int().min(0).max(9).nullable(),
  javaChips: z
    .object({ scoops: z.number().int().min(0).max(9), mode: z.enum(['blended', 'split', 'topping']) })
    .nullable(),
  milkAmount: z.enum(['less', 'extra']).nullable(),
  milkFoam: z.enum(['none', 'less', 'extra']).nullable(),
  milkTemperature: z.enum(['standard', 'x-hot']).nullable(),
})
export type Customizations = z.infer<typeof customizationSchema>

export const noCustomizations = (): Customizations => ({
  quantities: {},
  syrups: {},
  milk: null,
  coffee: null,
  omitted: [],
  levels: {},
  toppings: {},
  roast: null,
  javaChips: null,
  milkAmount: null,
  milkFoam: null,
  milkTemperature: null,
})

export function countAmount(step: PlannedStep) {
  const op = step.operation
  return (op.action === 'add' || op.action === 'espresso') && op.amount.kind === 'count' ? op.amount : null
}

export function customizableQuantity(step: PlannedStep) {
  if (step.operation.action === 'add' && step.operation.materialId === 'frappuccino-roast') return false
  const amount = countAmount(step)
  return !!amount && ['shot', 'pump'].includes(amount.unit)
}

export function canOmit(step: PlannedStep) {
  const op = step.operation

  return (
    op.action === 'add' &&
    (['ice', 'whipped-cream', 'caramel-drizzle', 'sea-salt-caramel-drizzle'].includes(op.materialId) ||
      (op.materialId === 'mocha' && op.toolId === 'drizzle-bottle'))
  )
}

export function customizationLabels(plan: PlannedStep[], custom: Customizations): string[] {
  const labels: string[] = []
  if (custom.coffee) {
    labels.push(coffeeNames[custom.coffee])
  }
  if (custom.milk) {
    labels.push(milkChoices[custom.milk])
  }
  if (custom.milkAmount) labels.push(`우유 ${amountLevelNames[custom.milkAmount]}`)
  if (custom.milkFoam)
    labels.push(`우유 거품 ${custom.milkFoam === 'none' ? '없이' : amountLevelNames[custom.milkFoam]}`)
  if (custom.milkTemperature) labels.push(`우유 온도 ${custom.milkTemperature === 'x-hot' ? 'X-Hot' : '기본'}`)
  if (custom.roast !== null) labels.push(`프라푸치노 로스트 ${custom.roast}펌프`)
  if (custom.javaChips) labels.push(`자바칩 ${custom.javaChips.scoops}스쿱 · ${chipModeNames[custom.javaChips.mode]}`)

  for (const id of toppingIds) {
    const level = custom.toppings[id]
    if (level) labels.push(`${toppingOptions[id].name} 추가 · ${amountLevelNames[level]}`)
  }

  for (const step of plan) {
    const count = custom.quantities[step.id]
    const amount = countAmount(step)
    if (count !== undefined && amount) {
      labels.push(`${step.label} ${count}${amount.unit === 'shot' ? '샷' : '펌프'}`)
    }
    if (custom.omitted.includes(step.id)) {
      labels.push(`${step.label} 없이`)
    }
    if (custom.levels[step.id]) {
      labels.push(`${step.label} ${custom.levels[step.id] === 'less' ? '적게' : '많이'}`)
    }
  }

  for (const [id, count] of Object.entries(custom.syrups))
    if (count) {
      labels.push(`${extraSyrups[id as keyof typeof extraSyrups]} ${count}펌프`)
    }

  return labels
}

// Public option prices and their sources are recorded in docs/cafe/pos.md.
export function customizationPrice(plan: PlannedStep[], custom: Customizations): number {
  let total = 0
  const espresso = plan.filter((step) => step.operation.action === 'espresso')
  const baseDecaf = espresso.some(
    (step) => step.operation.action === 'espresso' && step.operation.method.includes('decaf'),
  )
  if ((custom.coffee === 'decaf' || custom.coffee === 'half-decaf') && !baseDecaf) {
    total += 300
  }
  if (custom.milk === 'oat-and-u') {
    total += 800
  }

  for (const step of espresso) {
    const amount = countAmount(step)
    if (amount && custom.quantities[step.id] !== undefined) {
      total += Math.ceil(Math.max(0, custom.quantities[step.id] - amount.value)) * 800
    }
  }

  for (const [id, count] of Object.entries(custom.syrups)) {
    const included = plan.some((step) => step.operation.action === 'add' && step.operation.materialId === id)
    if (count && !included && !(custom.milk === 'soy-milk' && id === 'vanilla-syrup')) {
      total += 800
    }
  }

  for (const id of toppingIds) {
    if (
      custom.toppings[id] &&
      !plan.some(
        (step) => step.operation.action === 'add' && step.operation.materialId === toppingOptions[id].materialId,
      )
    ) {
      total += customizationRules.extraPrice
    }
  }
  if (custom.roast !== null && custom.roast > baseRoastPumps(plan)) total += customizationRules.extraPrice
  if (custom.javaChips && custom.javaChips.scoops > 0 && baseChipScoops(plan) === 0)
    total += customizationRules.extraPrice

  return total
}

const LEVEL_PORTIONS = { less: 0.5, extra: 1.5 } as const

export function customizePlan(base: PlannedStep[], custom: Customizations): PlannedStep[] {
  const ids = new Set(base.map((step) => step.id))

  for (const id of Object.keys(custom.quantities)) {
    const step = base.find((item) => item.id === id)
    if (!step || !customizableQuantity(step)) {
      throw new Error('이 음료에서 변경할 수 없는 수량입니다.')
    }
    const amount = countAmount(step)!
    if (amount.unit === 'pump' && !Number.isInteger(custom.quantities[id])) {
      throw new Error('시럽은 펌프 단위로 선택해주세요.')
    }
    if (step.operation.action === 'espresso' && custom.quantities[id] < 0.5) {
      throw new Error('에스프레소는 최소 0.5샷이 필요해요.')
    }
  }

  if (custom.omitted.some((id) => !ids.has(id) || !canOmit(base.find((step) => step.id === id)!))) {
    throw new Error('이 음료에서 제외할 수 없는 재료입니다.')
  }
  if (
    Object.keys(custom.levels).some(
      (id) => !ids.has(id) || !canOmit(base.find((step) => step.id === id)!) || custom.omitted.includes(id),
    )
  ) {
    throw new Error('얼음·휘핑·드리즐의 양을 확인해주세요.')
  }
  const hasMilk = base.some((step) => step.operation.action === 'add' && step.operation.materialId === 'milk')
  if (custom.milk && !hasMilk) {
    throw new Error('일반 우유가 들어가는 음료에서 변경해주세요.')
  }
  if (custom.coffee && !base.some((step) => step.operation.action === 'espresso')) {
    throw new Error('에스프레소 음료에서 원두를 변경해주세요.')
  }
  if (custom.milkAmount && !hasMilk) throw new Error('우유가 들어가는 음료에서 양을 변경해주세요.')
  const hasSteam = base.some((step) => step.operation.action === 'steam')
  if ((custom.milkFoam || custom.milkTemperature) && !hasSteam)
    throw new Error('스팀 우유를 사용하는 음료에서 선택해주세요.')
  const milkVessels = new Set(
    base.flatMap((step) =>
      step.operation.action === 'add' && step.operation.materialId === 'milk' ? [step.operation.into] : [],
    ),
  )
  const plan = base.flatMap((step): PlannedStep[] => {
    if (custom.omitted.includes(step.id)) {
      return []
    }
    let operation = { ...step.operation }
    const count = custom.quantities[step.id]

    if (
      count !== undefined &&
      (operation.action === 'add' || operation.action === 'espresso') &&
      operation.amount.kind === 'count'
    ) {
      if (count === 0) {
        return []
      }
      operation = { ...operation, amount: { ...operation.amount, value: count } }
    }

    if (operation.action === 'espresso' && custom.coffee) {
      const ristretto = operation.method.includes('ristretto')
      let method: typeof operation.method = custom.coffee
      if (ristretto && custom.coffee === 'regular') method = 'ristretto'
      if (ristretto && custom.coffee === 'blonde') method = 'blonde-ristretto'
      if (ristretto && custom.coffee === 'decaf') method = 'decaf-ristretto'
      operation = { ...operation, method }
    }
    if (operation.action === 'add' && operation.materialId === 'milk' && custom.milk) {
      operation = { ...operation, materialId: custom.milk }
    }
    if (operation.action === 'steam' && custom.milkTemperature) {
      operation = { ...operation, setting: custom.milkTemperature, temperature: undefined, duration: undefined }
    }

    if (operation.action === 'add' && operation.materialId in custom.syrups && operation.amount.kind === 'count') {
      const count = custom.syrups[operation.materialId as keyof typeof extraSyrups]!
      if (!count) {
        return []
      }
      operation = { ...operation, amount: { ...operation.amount, value: count } }
    }

    const level = custom.levels[step.id]
    let portion = level ? LEVEL_PORTIONS[level] : undefined
    const original = step.operation

    if (custom.milkAmount && original.action === 'add' && original.materialId === 'milk') {
      portion = LEVEL_PORTIONS[custom.milkAmount]
    }

    if (operation.action === 'transfer' && milkVessels.has(operation.from)) {
      if (operation.portion === 'foam' && custom.milkFoam === 'none') return []

      if (operation.amount.kind !== 'all') {
        if (custom.milkAmount) portion = LEVEL_PORTIONS[custom.milkAmount]
        if (operation.portion === 'foam' && custom.milkFoam) {
          portion = (portion ?? 1) * amountPortions[custom.milkFoam]
        }
      }
    }

    const foamPortion =
      custom.milkFoam && (operation.action === 'steam' || operation.action === 'aerate')
        ? amountPortions[custom.milkFoam]
        : undefined

    if (portion !== undefined) {
      const measurement = `기본 투입량의 ${portion * 100}%`
      return [{ ...step, operation, portion, measurement, instruction: `${step.label} · ${measurement}` }]
    }

    const measurement = 'amount' in operation && operation.amount ? amountLabel(operation.amount) : step.measurement
    const changed = JSON.stringify(operation) !== JSON.stringify(step.operation)
    const milk =
      operation.action === 'add' && custom.milk === operation.materialId ? ` · ${milkChoices[custom.milk]}` : ''
    let instruction = changed ? `${step.label} · ${measurement}${milk}` : step.instruction
    if (foamPortion !== undefined) instruction += ` · 거품은 기본의 ${foamPortion * 100}%`
    return [{ ...step, operation, portion: undefined, foamPortion, measurement, instruction }]
  })

  for (const [id, count] of Object.entries(custom.syrups)) {
    if (!count || base.some((step) => step.operation.action === 'add' && step.operation.materialId === id)) {
      continue
    }
    const firstPour = plan.find(
      (step) =>
        (step.operation.action === 'add' || step.operation.action === 'espresso') &&
        step.operation.into === 'serving-cup',
    )
    if (!firstPour) {
      throw new Error('이 제공 용기에는 시럽을 추가할 수 없어요.')
    }
    plan.unshift({
      id: `custom:${id}`,
      sourceStepId: `custom:${id}`,
      label: extraSyrups[id as keyof typeof extraSyrups],
      sharedLabel: false,
      instruction: '',
      note: '',
      conditions: [],
      measurement: `${count}펌프`,
      operation: {
        action: 'add',
        materialId: id,
        into: 'serving-cup',
        amount: { kind: 'count', value: count, unit: 'pump' },
        toolId: 'syrup-pump',
      },
    })
  }

  return applyExtraCustomizations(base, plan, custom)
}
