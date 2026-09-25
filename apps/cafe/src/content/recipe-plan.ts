import type { CatalogSize, RecipeAmount, RecipeOperation, RecipeStep, RecipeVariant } from './recipe-schema'
import { selectedAmount } from './recipe-schema'

type Resolve<T> = T extends { action: 'run-machine' }
  ? Omit<T, 'program'> & { program: string }
  : T extends { amount: unknown }
    ? Omit<T, 'amount'> & { amount: RecipeAmount }
    : T extends { action: 'grind' | 'squeeze' }
      ? Omit<T, 'amount'> & { amount?: RecipeAmount }
      : T
export type ResolvedOperation = Resolve<RecipeOperation>
export type RecipeContext = {
  size?: CatalogSize
  container: 'standard-cup' | 'personal-cup' | 'tumbler'
  service: 'for-here' | 'takeaway'
  customizations?: Record<string, string | false>
  observations?: Record<string, string>
  alternatives?: Record<string, string>
}
export type PlannedObservation = { id: string; property: string; value: string }
export type PlannedStep = {
  id: string
  sourceStepId: string
  label: string
  instruction: string
  note: string
  operation: ResolvedOperation
  measurement: string
  conditions: PlannedObservation[]
}

const sizeNames = {
  short: 'Short',
  tall: 'Tall',
  grande: 'Grande',
  venti: 'Venti',
  trenta: 'Trenta',
  'one-size-smaller': '한 사이즈 작은',
  'one-size-larger': '한 사이즈 큰',
}
const countNames = {
  pump: '펌프',
  shot: '샷',
  scoop: '스쿱',
  pack: '봉',
  tap: '톡',
  turn: '바퀴',
  piece: '개',
  cycle: '회',
  drop: '방울',
  bag: '티백',
  cup: '컵',
}
const lineNames = { lower: '하단선', middle: '중간선', upper: '상단선', size: '주문 사이즈 선', max: 'MAX 선' }
export function amountLabel(amount: RecipeAmount): string {
  const reference = 'referenceSize' in amount && amount.referenceSize ? `${sizeNames[amount.referenceSize]} ` : ''
  const offset =
    'offsetMillimeters' in amount && amount.offsetMillimeters
      ? ` ${Math.abs(amount.offsetMillimeters)}mm ${amount.offsetMillimeters > 0 ? '위' : '아래'}`
      : ''
  switch (amount.kind) {
    case 'amount':
      return (amount.approximate ? '약 ' : '') + amount.value + amount.unit
    case 'amount-range':
      return `${amount.min}–${amount.max}${amount.unit}`
    case 'count':
      return (
        reference +
        (amount.approximate ? '약 ' : '') +
        amount.value +
        countNames[amount.unit] +
        (amount.atLeast ? ' 이상' : '')
      )
    case 'count-range':
      return `${reference + amount.min}–${amount.max}${countNames[amount.unit]}`
    case 'line':
      return `${reference + lineNames[amount.line] + offset}까지`
    case 'mark':
      return `${reference + amount.label + offset}까지`
    case 'fill-volume':
      return `전체 ${amount.value}${amount.unit}선까지`
    case 'fraction':
      return `${reference + amount.of}의 ${amount.numerator}/${amount.denominator}`
    case 'depth':
      return `${amount.millimeters}mm 두께`
    case 'depth-range':
      return `${amount.minMillimeters}–${amount.maxMillimeters}mm 두께`
    case 'rim-gap':
      return `컵 테두리 아래 ${amount.millimeters}mm까지`
    case 'all':
      return '전량'
    case 'unspecified':
      return amount.description
  }
}
export function conditionLabel(when: NonNullable<RecipeStep['when']>): string {
  return (Array.isArray(when) ? when : [when])
    .map((condition) => {
      if (condition.kind === 'container')
        return { 'standard-cup': '일반 컵', 'personal-cup': '개인 컵', tumbler: '텀블러' }[condition.value]
      if (condition.kind === 'service') return condition.value === 'takeaway' ? '포장' : '매장'
      if (condition.kind === 'customization') return `${condition.option}: ${condition.choice}`
      return `${condition.property}: ${condition.value}`
    })
    .join(' · ')
}
export function matchesConditions(when: RecipeStep['when'], context: RecipeContext): boolean {
  if (!when) return true
  return (Array.isArray(when) ? when : [when]).every((condition) => {
    if (condition.kind === 'container') return context.container === condition.value
    if (condition.kind === 'service') return context.service === condition.value
    if (condition.kind === 'customization')
      return (context.customizations?.[condition.option] ?? false) === condition.choice
    const observation = context.observations?.[condition.property]
    return observation === undefined || observation === condition.value
  })
}
function pendingObservations(when: RecipeStep['when'], context: RecipeContext, prefix: string): PlannedObservation[] {
  if (!when) return []
  return (Array.isArray(when) ? when : [when]).flatMap((condition, index) =>
    condition.kind === 'observation' && context.observations?.[condition.property] === undefined
      ? [{ id: `${prefix}:${index}`, property: condition.property, value: condition.value }]
      : [],
  )
}
function resolveOperation(operation: RecipeOperation, context: RecipeContext): ResolvedOperation {
  const selected = { ...operation }
  if ('amount' in selected && selected.amount?.kind === 'by-size') {
    if (!context.size) throw new Error('주문 사이즈가 필요합니다.')
    selected.amount = selectedAmount(selected.amount, context.size)
  }
  if (selected.action === 'run-machine' && typeof selected.program !== 'string') {
    const program = context.size && selected.program[context.size]
    if (!program) throw new Error('해당 사이즈의 장비 프로그램이 없습니다.')
    selected.program = program
  }
  return selected as ResolvedOperation
}
export function planRecipe(variant: RecipeVariant, context: RecipeContext): PlannedStep[] {
  if (variant.review.length) throw new Error(variant.review.join(' '))
  if (variant.sizes.length && (!context.size || !variant.sizes.includes(context.size)))
    throw new Error('지원하지 않는 주문 사이즈입니다.')
  context = { ...context, customizations: { ...variant.defaults, ...context.customizations } }
  const plan: PlannedStep[] = []
  for (const step of variant.steps) {
    if (!matchesConditions(step.when, context)) continue
    const choice = context.alternatives?.[step.id]
    const alternative = choice ? step.alternatives?.find((item) => item.label === choice) : undefined
    if (choice && !alternative) throw new Error(`${step.label}의 선택 제조법을 찾을 수 없습니다.`)
    const operations = alternative?.operations ?? step.operations
    if (!operations.length) throw new Error(`${step.label} 제조 동작을 확인해야 합니다.`)
    operations.forEach((operation, index) => {
      if (!matchesConditions(operation.when, context)) return
      const resolved = resolveOperation(operation, context)
      plan.push({
        id: `${step.id}:${index}`,
        sourceStepId: step.id,
        label: step.label,
        instruction: step.instructions.join(' '),
        note: step.notes.join(' '),
        operation: resolved,
        measurement: 'amount' in resolved && resolved.amount ? amountLabel(resolved.amount) : '',
        conditions: [
          ...pendingObservations(step.when, context, `${step.id}:condition`),
          ...pendingObservations(operation.when, context, `${step.id}:${index}:condition`),
        ],
      })
    })
  }
  return plan
}
