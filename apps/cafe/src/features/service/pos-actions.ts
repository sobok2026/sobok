import { customizationSchema } from '../../content/customizations'
import { uid } from '../../shared/id'
import type { PosAction } from '../../simulation/actions'
import { say } from '../../simulation/feedback'
import type { WorkContext } from '../../simulation/work-context'
import { customerToPickup } from './customer'
import { itemPrice, orderMatchesRequest, salePaid, saleTotal } from './orders'

export function handlePosActions({ state: s }: WorkContext, action: PosAction) {
  const fail = (text: string) => say(s, text, 'error')

  if (s.customer?.stage !== 'ordering' || s.phase !== 'open') {
    fail(
      s.sale?.paidAt !== null && s.sale
        ? '결제가 끝난 주문이에요. 제조를 진행해주세요.'
        : '손님이 POS에 도착하면 주문을 받아주세요.',
    )
    return
  }

  if (s.sale && (s.sale.customerId !== s.customer.id || s.sale.paidAt !== null)) {
    return
  }

  if (action.type === 'pos-void') {
    if (s.sale) {
      s.sale.payments = s.sale.payments.filter((payment) => payment.id !== action.id)
    }
    return
  }

  if (action.type === 'pos-pay') {
    const sale = s.sale
    if (!sale || sale.payments.some((payment) => payment.id === action.id)) {
      return
    }

    if (!Number.isSafeInteger(action.tendered) || action.tendered <= 0 || action.tendered > 100000000) {
      fail('결제 금액을 확인해주세요.')
      return
    }

    if (!orderMatchesRequest(s)) {
      fail('손님 요청과 메뉴·사이즈·컵·수량·커스텀이 달라요. 주문을 확인해주세요.')
      return
    }

    const remaining = saleTotal(sale) - salePaid(sale)

    if (remaining <= 0 || sale.payments.length >= 20) {
      fail('결제 내역을 확인해주세요.')
      return
    }

    if (action.method === 'card' && action.tendered > remaining) {
      fail('카드 결제 금액은 남은 금액을 넘을 수 없어요.')
      return
    }

    sale.payments.push({
      id: action.id,
      method: action.method,
      amount: Math.min(remaining, action.tendered),
      tendered: action.tendered,
    })

    if (salePaid(sale) === saleTotal(sale)) {
      sale.paidAt = s.time
      const total = saleTotal(sale)
      s.cash += total
      s.totals.revenue += total

      for (const payment of sale.payments)
        s.totals[payment.method === 'cash' ? 'cashSales' : 'cardSales'] += payment.amount

      customerToPickup(s.customer)
      say(s, '결제가 완료됐어요. 주문한 음료를 한 잔씩 제조해주세요.', 'success')
    }

    return
  }

  if (s.sale?.payments.length) {
    fail('결제 내역을 취소한 뒤 주문을 수정해주세요.')
    return
  }

  if (action.type === 'pos-clear') {
    s.sale = null
    return
  }

  if (action.type === 'pos-remove') {
    if (s.sale) {
      s.sale.lines = s.sale.lines.filter((line) => line.id !== action.id)
      if (!s.sale.lines.length) {
        s.sale = null
      }
    }
    return
  }

  if (action.type === 'pos-split') {
    const line = s.sale?.lines.find((line) => line.id === action.id)
    if (!s.sale || !line || line.quantity <= 1 || s.sale.lines.length >= 50) {
      return
    }
    line.quantity--
    s.sale.lines.splice(s.sale.lines.indexOf(line) + 1, 0, { ...structuredClone(line), id: uid(), quantity: 1 })
    return
  }

  const parsed = customizationSchema.safeParse(action.item.customizations)

  if (!parsed.success) {
    fail('커스텀 선택을 확인해주세요.')
    return
  }

  const item = {
    recipe: action.item.recipe,
    service: action.item.service,
    size: action.item.size,
    customizations: parsed.data,
  }

  try {
    itemPrice(item)
  } catch (error) {
    fail(error instanceof Error ? error.message : '주문할 수 없는 메뉴예요.')
    return
  }

  if (action.type === 'pos-add') {
    if (s.sale && s.sale.lines.length >= 50) {
      fail('한 주문에 50개 항목까지 담을 수 있어요.')
      return
    }

    s.sale ??= { customerId: s.customer.id, lines: [], payments: [], paidAt: null }
    s.sale.lines.push({ ...item, id: uid(), quantity: 1, served: 0 })
  } else {
    if (!Number.isInteger(action.quantity) || action.quantity < 1 || action.quantity > 99) {
      fail('수량은 1~99잔으로 입력해주세요.')
      return
    }

    const line = s.sale?.lines.find((line) => line.id === action.id)
    if (line) {
      Object.assign(line, item, { quantity: action.quantity })
    }
  }
}
