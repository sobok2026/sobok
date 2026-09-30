import { customizationLabels } from '../../content/customizations'
import { recipeCup, recipeFor } from '../../content/recipes'
import type { OrderItem, OrderLine } from '../../simulation/state'
import { DRIP_BEANS, type DripBean } from '../drip-coffee/rules'
import type { FoodOrder } from '../food/model'
import { emptyCupCounts, isReusableCup, type ReusableCupCounts } from '../inventory/cups'
import { packagingNames } from './checkout-model'
import { type PricedSale, quoteSale } from './pricing'

export const currentTicket = (state: {
  sale: { acceptedAt: number | null; lines: OrderLine[] } | null
}): OrderLine | null =>
  state.sale && state.sale.acceptedAt !== null
    ? (state.sale.lines.find((line) => line.served < line.quantity) ?? null)
    : null

export function pendingStickers(state: {
  sale: { acceptedAt: number | null; lines: OrderLine[] } | null
  cup: { craft: { sticker: boolean } } | null
}) {
  if (!state.sale || state.sale.acceptedAt === null) {
    return 0
  }
  const open = state.sale.lines.reduce((sum, line) => sum + line.quantity - line.served, 0)
  return Math.max(0, open - (state.cup?.craft.sticker ? 1 : 0))
}

export const itemPrice = (item: OrderItem) => recipeFor(item.recipe, item.size, item.service, item.customizations).price

export const itemCustomizations = (item: OrderItem & { dripBean?: DripBean | null }) => [
  ...(item.dripBean ? [`원두 · ${DRIP_BEANS[item.dripBean]}`] : []),
  ...customizationLabels(recipeFor(item.recipe, item.size, item.service).steps, item.customizations),
  ...(item.options.personalCup ? ['개인컵'] : []),
  ...(item.options.cupDeposit ? [`컵보증금 ${item.options.cupDeposit.toLocaleString('ko-KR')}원`] : []),
  ...(item.options.packaging !== 'none' ? [packagingNames[item.options.packaging]] : []),
]

export const saleTotal = (sale: PricedSale | null): number => quoteSale(sale).total

export const salePaid = (sale: { payments: Array<{ amount: number }> } | null): number =>
  sale?.payments.reduce((sum, payment) => sum + payment.amount, 0) ?? 0

export const saleChange = (sale: { payments: Array<{ tendered: number; amount: number }> } | null): number =>
  sale?.payments.reduce((sum, payment) => sum + payment.tendered - payment.amount, 0) ?? 0

export const saleQuantity = (sale: { lines: Array<{ quantity: number }> } | null): number =>
  sale?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0

function itemKey(item: OrderItem) {
  const { quantities, syrups, omitted, milk, coffee, levels } = item.customizations

  return JSON.stringify([
    item.recipe,
    item.size,
    item.service,
    milk,
    coffee,
    Object.entries(quantities).sort(),
    Object.entries(syrups)
      .filter(([, count]) => count > 0)
      .sort(),
    [...omitted].sort(),
    Object.entries(levels).sort(),
    Object.entries(item.customizations.toppings).sort(),
    item.customizations.roast,
    item.customizations.javaChips,
    item.customizations.milkAmount,
    item.customizations.milkFoam,
    item.customizations.milkTemperature,
    item.customizations.lid,
    item.options.personalCup,
  ])
}

export function orderMatchesRequest(state: {
  customer: { items: Array<OrderItem & { quantity: number }>; foodItems: FoodOrder[] } | null
  sale: { lines: Array<OrderItem & { quantity: number }>; foodLines: FoodOrder[] } | null
}): boolean {
  if (!state.customer || !state.sale) {
    return false
  }

  const counts = (items: Array<OrderItem & { quantity: number }>) => {
    const map = new Map<string, number>()

    for (const item of items) {
      const key = itemKey(item)
      map.set(key, (map.get(key) ?? 0) + item.quantity)
    }

    return map
  }

  const expected = counts(state.customer.items)
  const entered = counts(state.sale.lines)
  const foodCounts = (items: FoodOrder[]) => {
    const map = new Map<string, number>()

    for (const item of items) {
      const key = JSON.stringify([item.productId, item.service, item.warmed])
      map.set(key, (map.get(key) ?? 0) + item.quantity)
    }

    return map
  }
  const foodExpected = foodCounts(state.customer.foodItems)
  const foodEntered = foodCounts(state.sale.foodLines)

  return (
    expected.size === entered.size &&
    [...expected].every(([key, count]) => entered.get(key) === count) &&
    foodExpected.size === foodEntered.size &&
    [...foodExpected].every(([key, count]) => foodEntered.get(key) === count)
  )
}

export function customerCupCounts(state: {
  sale: { lines: OrderLine[] } | null
  customer: { stage: string } | null
}): ReusableCupCounts {
  const counts = emptyCupCounts()
  if (!state.customer || state.customer.stage === 'leaving') {
    return counts
  }

  for (const item of state.sale?.lines ?? []) {
    const kind = recipeCup(item.recipe, item.size, item.service)
    if (isReusableCup(kind) && !item.options.personalCup) {
      counts[kind] += item.served
    }
  }

  return counts
}
