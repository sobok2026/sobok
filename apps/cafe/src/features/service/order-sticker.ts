import { recipeCatalog } from '../../content/catalog'
import { customizationLabels } from '../../content/customizations'
import { DRINK_SIZES, type DrinkSize } from '../../content/drink-sizes'
import type { PlannedStep } from '../../content/recipe-plan'
import { RECIPES, recipeFor } from '../../content/recipes'
import type { GameState, OrderLine } from '../../simulation/state'
import { DRIP_BEANS } from '../drip-coffee/rules'
import { SERVICE_NAMES } from '../inventory/cups'
import { itemCustomizations, saleQuantity } from './orders'

// Public cup markings and photographed labels: docs/cafe/order-stickers.md.
// Other drinks use English ID initials, approved for unverified markings on 2026-09-28.
const DRINK_CODES: Record<string, string> = {
  'todays-coffee': 'BC',
  'iced-coffee': 'IC',
  'cold-brew': 'CBIC',
  'vanilla-cream-cold-brew': 'VCB',
  'dolce-cold-brew': 'DCB',
  'oat-cold-brew': 'CBOL',
  'caffe-americano': 'A',
  'iced-americano': 'A',
  'caffe-latte': 'L',
  'iced-caffe-latte': 'L',
  cappuccino: 'C',
  'iced-cappuccino': 'C',
  'caramel-macchiato': 'CM',
  'iced-caramel-macchiato': 'CM',
  'caffe-mocha': 'M',
  'iced-caffe-mocha': 'M',
  'white-chocolate-mocha': 'WM',
  'iced-white-chocolate-mocha': 'WM',
  'starbucks-dolce-latte': 'SDL',
  'iced-starbucks-dolce-latte': 'SDL',
  'flat-white': 'FW',
  'byeoldabang-vanilla-latte': 'BVL',
  'double-espresso-cream-latte': 'DEL',
  'blonde-vanilla-double-shot-macchiato': 'VDSM',
  'espresso-frappuccino': 'EF',
  'java-chip-frappuccino': 'FC MF',
  'chocolate-cream-chip-frappuccino': 'MO FC CRM',
  'caramel-frappuccino': 'CRF',
  'double-espresso-chip-frappuccino': 'DEF',
  'mango-passion-fruit-blended': 'MPB',
  'mango-banana-blended': 'B MB',
  'strawberry-acai-lemonade-starbucks-refresher': 'SALR',
  'cool-lime-fizzio': 'CL Fiz',
  'light-pink-grapefruit-fizzio': 'LG Fiz',
  'starbucks-strawberry-latte': 'SSL',
  'grapefruit-honey-black-tea': 'GHBT',
  'iced-grapefruit-honey-black-tea': 'GHBT',
  'yuja-mint-tea': 'YMT',
  'earl-grey-vanilla-tea-latte': 'EVTL',
  'starbucks-classic-milk-tea': 'C MT',
  'signature-hot-chocolate': 'SHC',
  'iced-signature-chocolate': 'SC',
  'steamed-milk': 'SM',
}
const VARIANT_CODES: Record<string, string> = {
  'espresso:solo': '1E',
  'espresso:doppio': '2E',
  'espresso-macchiato:solo': '1EM',
  'espresso-macchiato:doppio': '2EM',
  'espresso-con-panna:solo': '1ECP',
  'espresso-con-panna:doppio': '2ECP',
  'full-leaf-hot-tea:english-breakfast': 'EBT',
  'full-leaf-hot-tea:earl-grey': 'EGT',
  'full-leaf-hot-tea:mint': 'MT',
  'full-leaf-hot-tea:hibiscus': 'HT',
  'full-leaf-hot-tea:chamomile': 'CT',
  'full-leaf-hot-tea:green-tea': 'GRT',
  'full-leaf-hot-tea:youthberry': 'YBT',
}
const MATERIAL_CODES: Record<string, string> = {
  'vanilla-syrup': 'V',
  'hazelnut-syrup': 'H',
  'caramel-syrup': 'C',
  classic: 'CS',
  'dolce-syrup': 'D',
  mocha: 'M',
  'white-mocha-sauce': 'WM',
  'white-mocha-syrup': 'WM',
  'white-chocolate-mocha-sauce': 'WM',
  'brown-sugar-syrup': 'BSS',
  'frappuccino-roast': 'FR',
  'coffee-frappuccino-base': 'CFB',
  'cream-frappuccino-base': 'CRM',
}
const MILK_CODES: Record<string, string> = {
  milk: 'W.milk',
  'low-fat-milk': '%',
  'nonfat-milk': 'N',
  'soy-milk': 'S',
  'oat-and-u': '오트',
  'oat-milk': '오트',
  oatside: '오트사이드',
  'half-and-half': '하프앤하프',
  'vanilla-cream-base': 'VC',
}
const SIZE_CODES: Record<DrinkSize, string> = {
  short: 'S',
  tall: 'T',
  grande: 'G',
  venti: 'V',
  trenta: 'TR',
  single: '',
}

export type OrderSticker = {
  order: string
  name: string
  decaf: string
  shots: string
  syrup: string[]
  milk: string
  custom: string[]
  summary: string[]
  beverage: string
  time: string
  sequence: string
  service: string
  description: string
}

function materialMark(id: string, count: number) {
  const code = MATERIAL_CODES[id]
  if (code) return `${count}${code}`
  return `${recipeCatalog.materials.get(id)!.name} ${count}펌프`
}

function espressoMark(plan: PlannedStep[]) {
  let shots = 0
  let ristretto = false
  let decaf = ''
  let blonde = false

  for (const { operation: op } of plan) {
    if (op.action !== 'espresso' || op.amount.kind !== 'count') continue
    shots += op.amount.value
    ristretto ||= op.method.includes('ristretto')
    blonde ||= op.method.includes('blonde')
    if (op.method.includes('decaf')) decaf = op.method === 'half-decaf' ? '1/2' : 'X'
  }

  return { shots, ristretto, decaf, blonde }
}

function pumpMarks(plan: PlannedStep[]) {
  const amounts = new Map<string, number>()

  for (const { operation: op } of plan) {
    if (op.action !== 'add' || op.amount.kind !== 'count' || op.amount.unit !== 'pump') continue
    amounts.set(op.materialId, (amounts.get(op.materialId) ?? 0) + op.amount.value)
  }

  return [...amounts].map(([id, count]) => materialMark(id, count))
}

function changedSyrups(line: OrderLine, base: PlannedStep[], plan: PlannedStep[]) {
  const changed = new Set<string>()

  for (const step of base) {
    const op = step.operation
    const count = line.customizations.quantities[step.id]
    if (count === undefined || op.action !== 'add' || op.amount.kind !== 'count' || op.amount.unit !== 'pump') continue
    changed.add(op.materialId)
  }

  for (const id of Object.keys(line.customizations.syrups)) changed.add(id)

  return [...changed].map((id) => {
    const count = plan.reduce((sum, { operation: op }) => {
      if (op.action !== 'add' || op.materialId !== id || op.amount.kind !== 'count' || op.amount.unit !== 'pump')
        return sum
      return sum + op.amount.value
    }, 0)

    return materialMark(id, count)
  })
}

function generatedDrinkCode(recipeId: string, variantId: string) {
  const initials = (id: string) =>
    id
      .split('-')
      .map((word) => word[0].toUpperCase())
      .join('')
  const code = initials(recipeId.replace(/^iced-/, ''))
  if (['hot', 'iced', 'iced-trenta'].includes(variantId)) return code
  return `${code} ${initials(variantId)}`
}

/** Reads the paid recipe, including defaults and POS changes, without adding saved label state. */
export function orderSticker(state: GameState, line: OrderLine, unit = line.served + 1): OrderSticker {
  const recipe = RECIPES[line.recipe]
  const base = recipeFor(line.recipe, line.size, line.service).steps
  const plan = recipeFor(line.recipe, line.size, line.service, line.customizations).steps
  const espresso = espressoMark(plan)
  const milk = new Set<string>()

  for (const { operation: op } of plan) {
    if (op.action === 'add' && MILK_CODES[op.materialId]) milk.add(MILK_CODES[op.materialId])
  }

  const custom = customizationLabels(base, {
    ...line.customizations,
    coffee: null,
    milk: null,
    syrups: {},
    quantities: {},
  })
  if (line.dripBean) custom.unshift(DRIP_BEANS[line.dripBean])
  const variant = recipe.variant.replace(`${recipe.temperature.toUpperCase()} · `, '')
  if (variant !== recipe.temperature.toUpperCase()) custom.unshift(variant)
  const shotsChanged = base.some(
    (step) => step.operation.action === 'espresso' && line.customizations.quantities[step.id] !== undefined,
  )
  const shots = espresso.shots ? `${espresso.shots}${espresso.ristretto ? 'R' : ''}` : ''
  const summary = [...milk]
  if (shots) summary.push(`${shots} shot`)
  if (espresso.blonde) summary.push('Blonde')
  summary.push(...pumpMarks(plan))
  if (plan.some(({ operation: op }) => op.action === 'add' && op.materialId === 'ice')) summary.push('ice')
  if (plan.some(({ operation: op }) => op.action === 'add' && op.materialId === 'whipped-cream')) summary.push('WC')
  const code =
    VARIANT_CODES[line.recipe] ?? DRINK_CODES[recipe.recipeId] ?? generatedDrinkCode(recipe.recipeId, recipe.variantId)
  const size = SIZE_CODES[line.size]
  const blonde = espresso.blonde ? 'Blonde ' : ''
  const beverage = `${recipe.temperature === 'iced' ? 'i ' : ''}${size ? `${size}) ` : ''}${blonde}${code}`
  let sequence = unit

  for (const item of state.sale?.lines ?? []) {
    if (item.id === line.id) break
    sequence += item.quantity
  }

  const total = saleQuantity(state.sale)
  const time = new Date((state.sale?.paidAt ?? state.time) * 1000).toISOString().slice(11, 19)
  const order = `A-${String(state.orderNumber).padStart(2, '0')}`

  return {
    order,
    name: recipe.shortName,
    decaf: espresso.decaf,
    shots: shotsChanged || espresso.ristretto ? shots : '',
    syrup: changedSyrups(line, base, plan),
    milk: line.customizations.milk ? MILK_CODES[line.customizations.milk] : '',
    custom,
    summary,
    beverage,
    time,
    sequence: `${sequence} of ${total} (Bev ${total})`,
    service: SERVICE_NAMES[line.service],
    description: [
      `${order} ${recipe.name} ${recipe.variant} ${DRINK_SIZES[line.size].name} ${SERVICE_NAMES[line.service]}`,
      ...summary,
      ...itemCustomizations(line),
      `${sequence}/${total}잔 ${time}`,
    ].join(', '),
  }
}

export function waitingOrderStickers(state: GameState, limit: number): OrderSticker[] {
  if (!state.sale || state.sale.paidAt === null) return []
  const stickers: OrderSticker[] = []

  for (const line of state.sale.lines) {
    const attached = state.cup?.orderLineId === line.id && state.cup.craft.sticker

    for (let unit = line.served + (attached ? 2 : 1); unit <= line.quantity; unit++) {
      stickers.push(orderSticker(state, line, unit))
      if (stickers.length === limit) return stickers
    }
  }

  return stickers
}
