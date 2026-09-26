import { customizationLabels } from '../../content/customizations'
import { recipeFor } from '../../content/recipes'
import type { OrderItem, OrderLine } from '../../simulation/state'
import { cupKindFor, emptyCupCounts, isReusableCup, type ReusableCupCounts } from '../inventory/cups'

export const currentTicket = (state: {
  sale: { paidAt: number | null; lines: OrderLine[] } | null
}): OrderLine | null =>
  state.sale && state.sale.paidAt !== null
    ? (state.sale.lines.find((line) => line.served < line.quantity) ?? null)
    : null

export const itemPrice = (item: OrderItem) => recipeFor(item.recipe, item.size, item.service, item.customizations).price

export const itemCustomizations = (item: OrderItem) =>
  customizationLabels(recipeFor(item.recipe, item.size, item.service).steps, item.customizations)

export const saleTotal = (sale: { lines: Array<OrderItem & { quantity: number }> } | null): number =>
  sale?.lines.reduce((sum, line) => sum + itemPrice(line) * line.quantity, 0) ?? 0

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
  ])
}

export function orderMatchesRequest(state: {
  customer: { items: Array<OrderItem & { quantity: number }> } | null
  sale: { lines: Array<OrderItem & { quantity: number }> } | null
}): boolean {
  if (!state.customer || !state.sale) return false

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
  return expected.size === entered.size && [...expected].every(([key, count]) => entered.get(key) === count)
}

export function customerCupCounts(state: {
  sale: { lines: OrderLine[] } | null
  customer: { stage: string } | null
}): ReusableCupCounts {
  const counts = emptyCupCounts()
  if (!state.customer || state.customer.stage === 'leaving') return counts

  for (const item of state.sale?.lines ?? []) {
    const kind = cupKindFor(item.recipe, item.service, item.size)
    if (isReusableCup(kind)) counts[kind] += item.served
  }

  return counts
}
