import { DRINK_SIZES } from '../../content/drink-sizes'
import { RECIPES } from '../../content/recipes'
import type { GameState, Sale, Transaction } from '../../simulation/state'
import { dripMenuName } from '../drip-coffee/rules'
import { SERVICE_NAMES } from '../inventory/cups'
import { itemCustomizations, itemPrice } from './orders'

export const transactionTotal = (transaction: Transaction) =>
  transaction.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)

export const transactionCash = (transaction: Transaction) =>
  transaction.payments.reduce((sum, payment) => sum + (payment.method === 'cash' ? payment.amount : 0), 0)

export const receiptNumber = (transaction: Transaction) =>
  `${new Date(transaction.paidAt * 1000).toISOString().slice(0, 10).replaceAll('-', '')}-${String(transaction.orderNumber).padStart(5, '0')}`

export const receiptTime = (time: number) => new Date(time * 1000).toISOString().slice(0, 19).replace('T', ' ')

export function cashReceiptLabel(transaction: Transaction) {
  if (!transactionCash(transaction)) return '해당 없음'
  const receipt = transaction.cashReceipts.at(-1)
  if (!receipt) return '발행 대기'
  if (receipt.kind === 'unissued') return '미발행'
  return `${receipt.kind === 'personal' ? '소득공제' : '지출증빙'} · **** ${receipt.lastFour}`
}

export function recordTransaction(state: GameState, sale: Sale) {
  if (sale.paidAt === null || state.transactions.some((transaction) => transaction.id === sale.customerId)) return

  state.transactions.push({
    id: sale.customerId,
    day: state.day,
    orderNumber: state.orderNumber,
    paidAt: sale.paidAt,
    lines: sale.lines.map((line) => ({
      id: line.id,
      name: dripMenuName(line.recipe, RECIPES[line.recipe].name),
      specification: `${RECIPES[line.recipe].temperature.toUpperCase()} · ${DRINK_SIZES[line.size].name} · ${SERVICE_NAMES[line.service]}`,
      customizations: itemCustomizations(line),
      quantity: line.quantity,
      unitPrice: itemPrice(line),
    })),
    payments: structuredClone(sale.payments),
    cashReceipts: [],
    printCount: 0,
    lastPrintedAt: null,
  })
}
