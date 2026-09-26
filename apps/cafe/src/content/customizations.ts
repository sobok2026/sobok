import { z } from 'zod'
import { amountLabel, type PlannedStep } from './recipe-plan'

export const extraSyrups = {
  '바닐라-시럽': '바닐라 시럽',
  '헤이즐넛-시럽': '헤이즐넛 시럽',
  '카라멜-시럽': '카라멜 시럽',
} as const

export const milkChoices = { milk: '일반 우유', '무지방-우유': '무지방 우유', 두유: '두유', 오트앤유: '오트' } as const

export const customizationSchema = z.strictObject({
  quantities: z.record(z.string().max(160), z.number().min(0).max(99).multipleOf(0.5)),
  syrups: z.partialRecord(z.enum(['바닐라-시럽', '헤이즐넛-시럽', '카라멜-시럽']), z.number().int().min(0).max(9)),
  milk: z.enum(['milk', '무지방-우유', '두유', '오트앤유']).nullable(),
  coffee: z.enum(['regular', 'decaf', 'half-decaf']).nullable(),
  omitted: z.array(z.string().max(160)).max(20),
  levels: z.record(z.string().max(160), z.enum(['less', 'extra'])),
})
export type Customizations = z.infer<typeof customizationSchema>

export const noCustomizations = (): Customizations => ({
  quantities: {},
  syrups: {},
  milk: null,
  coffee: null,
  omitted: [],
  levels: {},
})

export function countAmount(step: PlannedStep) {
  const op = step.operation
  return (op.action === 'add' || op.action === 'espresso') && op.amount.kind === 'count' ? op.amount : null
}

export function customizableQuantity(step: PlannedStep) {
  const amount = countAmount(step)
  return !!amount && ['shot', 'pump'].includes(amount.unit)
}

export function canOmit(step: PlannedStep) {
  const op = step.operation

  return (
    op.action === 'add' &&
    ['ice', '일반-휘핑-크림', '카라멜-드리즐', 'barMocha', '씨솔트-카라멜-드리즐'].includes(op.materialId)
  )
}

export function customizationLabels(plan: PlannedStep[], custom: Customizations): string[] {
  const labels: string[] = []
  if (custom.coffee)
    labels.push({ regular: '일반 원두', decaf: '디카페인', 'half-decaf': '1/2 디카페인' }[custom.coffee])
  if (custom.milk) labels.push(milkChoices[custom.milk])

  for (const step of plan) {
    const count = custom.quantities[step.id]
    const amount = countAmount(step)
    if (count !== undefined && amount) labels.push(`${step.label} ${count}${amount.unit === 'shot' ? '샷' : '펌프'}`)
    if (custom.omitted.includes(step.id)) labels.push(`${step.label} 없이`)
    if (custom.levels[step.id]) labels.push(`${step.label} ${custom.levels[step.id] === 'less' ? '적게' : '많이'}`)
  }

  for (const [id, count] of Object.entries(custom.syrups))
    if (count) labels.push(`${extraSyrups[id as keyof typeof extraSyrups]} ${count}펌프`)

  return labels
}

// Public option prices and their sources are recorded in docs/cafe/pos.md.
export function customizationPrice(plan: PlannedStep[], custom: Customizations): number {
  let total = 0
  const espresso = plan.filter((step) => step.operation.action === 'espresso')
  const baseDecaf = espresso.some(
    (step) => step.operation.action === 'espresso' && step.operation.method.includes('decaf'),
  )
  if (custom.coffee && custom.coffee !== 'regular' && !baseDecaf) total += 300
  if (custom.milk === '오트앤유') total += 800

  for (const step of espresso) {
    const amount = countAmount(step)
    if (amount && custom.quantities[step.id] !== undefined)
      total += Math.ceil(Math.max(0, custom.quantities[step.id] - amount.value)) * 800
  }

  for (const [id, count] of Object.entries(custom.syrups)) {
    const included = plan.some((step) => step.operation.action === 'add' && step.operation.materialId === id)
    if (count && !included && !(custom.milk === '두유' && id === '바닐라-시럽')) total += 800
  }

  return total
}

const LEVEL_PORTIONS = { less: 0.5, extra: 1.5 } as const

export function customizePlan(base: PlannedStep[], custom: Customizations): PlannedStep[] {
  const ids = new Set(base.map((step) => step.id))

  for (const id of Object.keys(custom.quantities)) {
    const step = base.find((item) => item.id === id)
    if (!step || !customizableQuantity(step)) throw new Error('이 음료에서 변경할 수 없는 수량입니다.')
    const amount = countAmount(step)!
    if (amount.unit === 'pump' && !Number.isInteger(custom.quantities[id]))
      throw new Error('시럽은 펌프 단위로 선택해주세요.')
    if (step.operation.action === 'espresso' && custom.quantities[id] < 0.5)
      throw new Error('에스프레소는 최소 0.5샷이 필요해요.')
  }

  if (custom.omitted.some((id) => !ids.has(id) || !canOmit(base.find((step) => step.id === id)!)))
    throw new Error('이 음료에서 제외할 수 없는 재료입니다.')
  if (
    Object.keys(custom.levels).some(
      (id) => !ids.has(id) || !canOmit(base.find((step) => step.id === id)!) || custom.omitted.includes(id),
    )
  )
    throw new Error('얼음·휘핑·드리즐의 양을 확인해주세요.')
  const hasMilk = base.some((step) => step.operation.action === 'add' && step.operation.materialId === 'milk')
  if (custom.milk && !hasMilk) throw new Error('일반 우유가 들어가는 음료에서 변경해주세요.')
  if (custom.coffee && !base.some((step) => step.operation.action === 'espresso'))
    throw new Error('에스프레소 음료에서 원두를 변경해주세요.')
  const plan = base.flatMap((step): PlannedStep[] => {
    if (custom.omitted.includes(step.id)) return []
    let operation = { ...step.operation }
    const count = custom.quantities[step.id]

    if (
      count !== undefined &&
      (operation.action === 'add' || operation.action === 'espresso') &&
      operation.amount.kind === 'count'
    ) {
      if (count === 0) return []
      operation = { ...operation, amount: { ...operation.amount, value: count } }
    }

    if (operation.action === 'espresso' && custom.coffee) operation = { ...operation, method: custom.coffee }
    if (operation.action === 'add' && operation.materialId === 'milk' && custom.milk)
      operation = { ...operation, materialId: custom.milk }

    if (operation.action === 'add' && operation.materialId in custom.syrups && operation.amount.kind === 'count') {
      const count = custom.syrups[operation.materialId as keyof typeof extraSyrups]!
      if (!count) return []
      operation = { ...operation, amount: { ...operation.amount, value: count } }
    }

    const level = custom.levels[step.id]

    if (level) {
      const portion = LEVEL_PORTIONS[level]
      const measurement = `기본 투입량의 ${portion * 100}%`
      return [{ ...step, operation, portion, measurement, instruction: `${step.label} · ${measurement}` }]
    }

    const measurement = 'amount' in operation && operation.amount ? amountLabel(operation.amount) : step.measurement
    const changed = JSON.stringify(operation) !== JSON.stringify(step.operation)
    const milk =
      operation.action === 'add' && custom.milk === operation.materialId ? ` · ${milkChoices[custom.milk]}` : ''
    const instruction = changed ? `${step.label} · ${measurement}${milk}` : step.instruction
    return [{ ...step, operation, portion: undefined, measurement, instruction }]
  })

  for (const [id, count] of Object.entries(custom.syrups)) {
    if (!count || base.some((step) => step.operation.action === 'add' && step.operation.materialId === id)) continue
    const firstPour = plan.find(
      (step) =>
        (step.operation.action === 'add' || step.operation.action === 'espresso') &&
        step.operation.into === 'serving-cup',
    )
    if (!firstPour) throw new Error('이 제공 용기에는 시럽을 추가할 수 없어요.')
    plan.unshift({
      id: `custom:${id}`,
      sourceStepId: `custom:${id}`,
      label: extraSyrups[id as keyof typeof extraSyrups],
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

  return plan
}
