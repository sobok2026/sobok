import { money } from '../../shared/format'
import { say } from '../../simulation/feedback'
import type { GameState, Sale, Transaction } from '../../simulation/state'
import { foodOrderAvailable } from '../food/rules'
import { benefitsError } from './benefits'
import { type Payment, type PaymentInput, paymentAllowsChange, paymentMethods, paymentSchema } from './checkout-model'
import { cardOwner } from './members'
import { acceptOrder } from './order-flow'
import { orderMatchesRequest, salePaid, saleTotal } from './orders'
import { quoteSale } from './pricing'
import { recordTransaction } from './transactions'

export const outstandingCredit = (transaction: Transaction) =>
  transaction.payments.reduce((sum, payment) => sum + (payment.method === 'credit' ? payment.amount : 0), 0) -
  transaction.settlements.reduce((sum, payment) => sum + payment.amount, 0)

export function paymentError(state: GameState, input: PaymentInput, remaining: number) {
  if (
    !paymentMethods.includes(input.method) ||
    !Number.isSafeInteger(input.tendered) ||
    input.tendered <= 0 ||
    input.tendered > 100000000 ||
    remaining <= 0
  )
    return '결제 금액을 확인해주세요.'
  if (!paymentAllowsChange(input.method) && input.tendered > remaining) return '결제금액은 남은 금액을 넘을 수 없어요.'
  if (!['cash', 'credit'].includes(input.method) && !input.reference)
    return '리더기/스캐너로 결제수단을 먼저 확인해주세요.'
  if (
    !Number.isInteger(input.installments) ||
    input.installments < 0 ||
    input.installments > 24 ||
    input.installments === 1
  )
    return '할부 개월을 확인해주세요.'
  if (input.installments && (input.method !== 'card' || input.tendered < 50000))
    return '5만원 이상 신용카드 결제에서 할부를 선택할 수 있어요.'

  if (input.method === 'starbucks-card') {
    const account = input.cardId ? cardOwner(state, input.cardId) : null
    if (!account) return '인식한 카드가 없어요.'
    if (account.card.balance < input.tendered) return `카드 잔액이 부족해요. 사용 가능 ${money(account.card.balance)}`
  } else if (input.cardId !== null) return '결제수단과 카드 정보가 맞지 않아요.'

  if (input.method === 'gift-certificate') {
    if (![5000, 10000, 50000, 100000, 300000, 500000].includes(input.tendered)) return '상품권 권종을 선택해주세요.'
    const minimum = input.tendered <= 10000 ? 0.8 : 0.6
    if (remaining < input.tendered * minimum)
      return `이 상품권은 권면금액의 ${minimum * 100}% 이상 사용해야 거스름돈을 받을 수 있어요.`
  }

  const payment = { ...input, amount: Math.min(remaining, input.tendered) }
  if (!paymentSchema.safeParse(payment).success) return '결제수단 정보를 확인해주세요.'
  return null
}

function debitCard(state: GameState, payment: Payment) {
  if (payment.method !== 'starbucks-card' || !payment.cardId) return
  const account = cardOwner(state, payment.cardId)
  if (account) account.card.balance -= payment.amount
}

export function reversePendingPayment(state: GameState, id: string) {
  const sale = state.sale
  if (!sale || sale.paidAt !== null) return
  const payment = sale.payments.find((payment) => payment.id === id)
  if (!payment) return

  if (payment.method === 'starbucks-card' && payment.cardId) {
    const account = cardOwner(state, payment.cardId)
    if (account) account.card.balance += payment.amount
  }

  sale.payments = sale.payments.filter((payment) => payment.id !== id)
  if (!sale.payments.length) sale.benefitsCheckedAt = null
}

export function completeSale(state: GameState) {
  const sale = state.sale
  if (!sale || sale.paidAt !== null || salePaid(sale) !== saleTotal(sale) || !orderMatchesRequest(state)) return
  const error = benefitsError(state, sale, sale.benefits)
  if (error) return say(state, error, 'error')
  if (sale.acceptedAt === null && !foodOrderAvailable(state))
    return say(state, '푸드 재고를 먼저 준비해주세요.', 'error')
  sale.benefitsCheckedAt ??= state.time
  sale.acceptedAt ??= state.time
  sale.paidAt = state.time
  recordTransaction(state, sale)
  const deposits = sale.lines.reduce((sum, line) => sum + line.options.cupDeposit * line.quantity, 0)
  state.totals.discounts += quoteSale(sale).discount
  state.totals.deposits += deposits
  state.totals.revenue += saleTotal(sale) - deposits

  for (const payment of sale.payments) {
    if (payment.method === 'credit') state.totals.creditSales += payment.amount
    else {
      state.cash += payment.amount

      if (payment.method === 'cash') state.totals.cashSales += payment.amount
      else if (payment.method === 'card') state.totals.cardSales += payment.amount
      else state.totals.otherSales += payment.amount
    }
  }

  consumeBenefits(state, sale)
  acceptOrder(state)
  say(state, '결제와 주문 접수가 완료됐어요.', 'success')
}

function consumeBenefits(state: GameState, sale: Sale) {
  const member = state.members.find((member) => member.id === sale.benefits.memberId)
  const coupons = [...state.members.flatMap((member) => member.coupons), ...(state.customer?.paperCoupons ?? [])]

  for (const applied of sale.benefits.coupons) {
    const coupon = coupons.find((coupon) => coupon.id === applied.coupon.id)
    if (coupon) coupon.usedAt = state.time
  }

  if (member && sale.benefits.telecom)
    member.telecomUses.push({
      carrier: sale.benefits.telecom.carrier,
      service: sale.benefits.telecom.service,
      at: state.time,
    })
  if (
    member &&
    sale.payments.reduce((sum, payment) => sum + (payment.method === 'starbucks-card' ? payment.amount : 0), 0) >= 3000
  )
    member.stars++
}

export function paySale(state: GameState, input: PaymentInput) {
  const sale = state.sale
  if (!sale || sale.paidAt !== null || sale.payments.some((payment) => payment.id === input.id)) return
  if (sale.payments.length >= 20) return say(state, '결제수단은 한 주문에 최대 20개까지 사용할 수 있어요.', 'error')
  if (!orderMatchesRequest(state)) return say(state, '손님 요청과 주문의 상품·규격·수량을 확인해주세요.', 'error')
  if (sale.acceptedAt === null && !foodOrderAvailable(state))
    return say(state, '주문할 푸드 재고가 부족해요. 냉장고에서 입고해주세요.', 'error')
  if (sale.benefits.freeExtra && input.method !== 'starbucks-card')
    return say(state, '다른 결제수단을 함께 쓰려면 결제 전 Free Extra를 미사용으로 선택해주세요.', 'error')
  const benefitError = benefitsError(state, sale, sale.benefits)
  if (benefitError) return say(state, benefitError, 'error')
  if (input.method === 'starbucks-card' && cardOwner(state, input.cardId ?? '')?.member.id !== state.customer?.memberId)
    return say(state, '현재 손님이 제시한 카드를 사용해주세요.', 'error')
  const remaining = saleTotal(sale) - salePaid(sale)
  const error = paymentError(state, input, remaining)
  if (error) return say(state, error, 'error')
  const payment: Payment = { ...input, amount: Math.min(remaining, input.tendered) }
  if (input.method === 'starbucks-card' && input.cardId && sale.benefits.memberId === null)
    sale.benefits.memberId = cardOwner(state, input.cardId)?.member.id ?? null
  sale.benefitsCheckedAt ??= state.time
  debitCard(state, payment)
  sale.payments.push(payment)
  completeSale(state)
}

export function settleCredit(state: GameState, transactionId: string, input: PaymentInput) {
  const transaction = state.transactions.find((transaction) => transaction.id === transactionId)
  if (!transaction || transaction.settlements.some((payment) => payment.id === input.id)) return
  if (transaction.settlements.length >= 100) return say(state, '이 거래의 정산 내역 한도에 도달했어요.', 'error')
  if (input.method === 'credit') return say(state, '외상을 다른 외상으로 정산할 수 없어요.', 'error')
  const remaining = outstandingCredit(transaction)
  const error = paymentError(state, input, remaining)
  if (error) return say(state, error, 'error')
  const payment: Payment = { ...input, amount: Math.min(remaining, input.tendered) }
  debitCard(state, payment)
  transaction.settlements.push({ ...payment, at: state.time })
  state.cash += payment.amount
  state.totals.creditCollected += payment.amount
  say(
    state,
    `외상 ${money(payment.amount)}을 정산했어요. 남은 금액 ${money(outstandingCredit(transaction))}`,
    'success',
  )
}
