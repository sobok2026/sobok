import { DRINK_SIZES } from '../../content/drink-sizes'
import { RECIPES } from '../../content/recipes'
import type { GameState, Sale, Transaction } from '../../simulation/state'
import { dripMenuName } from '../drip-coffee/rules'
import { FOODS } from '../food/catalog'
import { SERVICE_NAMES } from '../inventory/cups'
import { packagingNames, paymentReceiptAmount } from './checkout-model'
import { itemCustomizations, itemPrice } from './orders'
import { quoteSale } from './pricing'

export const transactionTotal = (transaction: Transaction) =>
  transaction.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity - line.discount + line.deposit, 0)

export const transactionCash = (transaction: Transaction) =>
  [...transaction.payments, ...transaction.settlements].reduce((sum, payment) => sum + paymentReceiptAmount(payment), 0)

export const receiptNumber = (transaction: Transaction) =>
  `${new Date(transaction.paidAt * 1000).toISOString().slice(0, 10).replaceAll('-', '')}-${String(transaction.orderNumber).padStart(5, '0')}`

export const receiptTime = (time: number) => new Date(time * 1000).toISOString().slice(0, 19).replace('T', ' ')
export const receiptItemName = (name: string) => name.replace(/starbucks|스타벅스/gi, '소복다방')

export function cashReceiptLabel(transaction: Transaction) {
  if (!transactionCash(transaction)) return '해당 없음'
  const receipt = transaction.cashReceipts.at(-1)
  if (!receipt) return '발행 대기'
  if (receipt.kind === 'unissued') return '미발행'
  return `${receipt.kind === 'personal' ? '소득공제' : '지출증빙'} · **** ${receipt.lastFour}`
}

export function recordTransaction(state: GameState, sale: Sale) {
  if (sale.paidAt === null || state.transactions.some((transaction) => transaction.id === sale.customerId)) return

  const quote = quoteSale(sale)
  const discount = (id: string) => {
    const line = quote.lines.find((line) => line.id === id)!
    return { discount: line.discount, deposit: line.deposit, discounts: structuredClone(line.discounts) }
  }

  state.transactions.push({
    id: sale.customerId,
    day: state.day,
    orderNumber: state.orderNumber,
    paidAt: sale.paidAt,
    lines: [
      ...sale.lines.map((line) => ({
        id: line.id,
        name: dripMenuName(line.recipe, RECIPES[line.recipe].name),
        specification: `${RECIPES[line.recipe].temperature.toUpperCase()} · ${DRINK_SIZES[line.size].name} · ${SERVICE_NAMES[line.service]}`,
        customizations: itemCustomizations(line),
        quantity: line.quantity,
        unitPrice: itemPrice(line),
        ...discount(line.id),
      })),
      ...sale.foodLines.map((line) => ({
        id: line.id,
        name: FOODS[line.productId].name,
        specification: SERVICE_NAMES[line.service],
        customizations: [line.warmed ? '데워서' : '그대로', packagingNames[line.options.packaging]],
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        ...discount(line.id),
      })),
    ],
    payments: structuredClone(sale.payments),
    settlements: [],
    memberId: sale.benefits.memberId,
    creditName: sale.payments.find((payment) => payment.method === 'credit')?.label ?? null,
    cashReceipts: [],
    printCount: 0,
    lastPrintedAt: null,
  })
}
