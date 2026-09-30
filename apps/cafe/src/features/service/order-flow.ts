import { CUSTOMER_HABITS } from '../../content/customers'
import { STATIONS, tableIds } from '../../content/stations'
import { say } from '../../simulation/feedback'
import type { GameState, Sale } from '../../simulation/state'
import { emptyBenefits } from './checkout-model'
import { createCustomer, customerToCondiment, customerToPickup, customerToSettlement, customerWait } from './customer'

export function newSale(customerId: string): Sale {
  return {
    customerId,
    lines: [],
    foodLines: [],
    payments: [],
    benefits: emptyBenefits(),
    benefitsCheckedAt: null,
    acceptedAt: null,
    paidAt: null,
  }
}

export function orderUnserved(sale: Sale | null) {
  return sale ? [...sale.lines, ...sale.foodLines].reduce((sum, line) => sum + line.quantity - line.served, 0) : 0
}

export function acceptOrder(state: GameState) {
  if (!state.sale || !state.customer) return
  state.sale.acceptedAt ??= state.time

  if (orderUnserved(state.sale) && !['pickup', 'to-pickup'].includes(state.customer.stage))
    customerToPickup(state.customer)
  else finishServing(state)
}

export function finishServing(state: GameState) {
  const customer = state.customer
  if (!customer || !state.sale || orderUnserved(state.sale)) return

  if (state.sale.paidAt === null) {
    customerToSettlement(customer)
    say(state, '선제공을 마쳤어요. 손님이 POS로 돌아오면 남은 금액을 정산해주세요.')
    return
  }

  if (customer.visit) return
  const dineIn = [...customer.items, ...customer.foodItems].some((item) => item.service === 'dine-in')
  customer.visit = {
    table: dineIn ? tableIds[Math.floor(Math.random() * tableIds.length)] : null,
    returnCup: dineIn && Math.random() < CUSTOMER_HABITS.returnCup,
    dirtyTable: dineIn && Math.random() < CUSTOMER_HABITS.stain,
    dirtyReturn: dineIn && Math.random() < CUSTOMER_HABITS.stain,
    usesSugar: customer.items.length > 0 && Math.random() < CUSTOMER_HABITS.sugar,
  }
  customerToCondiment(customer)
  say(state, dineIn ? '주문 전달과 정산을 마쳤어요. 손님이 매장을 이용해요.' : '포장 주문을 전달했어요.', 'success')
}

export function nextCustomer(state: GameState) {
  state.sale = null
  state.customer = null
  const waiting = state.waitingOrders.shift()

  if (waiting) {
    state.customer = waiting.customer
    state.sale = waiting.sale
    state.orderNumber = waiting.customer.orderNumber
    returnToRegister(state)
    return
  }

  if (state.phase !== 'open' || state.nextOrderNumber > 100000) return
  state.orderNumber = state.nextOrderNumber++
  state.customer = createCustomer(state.orderNumber, state.time)
}

function canSwitch(state: GameState) {
  return (
    !state.cup &&
    !state.foodWork &&
    (!state.sale || (state.sale.acceptedAt === null && !state.sale.payments.length)) &&
    (!state.customer || ['ordering', 'entering'].includes(state.customer.stage))
  )
}

function parkCustomer(state: GameState) {
  if (!state.customer) return
  const customer = state.customer
  customerWait(customer, 'ordering')
  customer.position = [
    STATIONS.pos.x + 0.65 * (state.waitingOrders.length % 5),
    2 + Math.floor(state.waitingOrders.length / 5) * 0.8,
    0,
  ]
  customer.yaw = Math.PI
  state.waitingOrders.push({ customer, sale: state.sale, heldAt: state.time })
  state.waitingOrders.forEach((order, index) => {
    order.customer.position = [STATIONS.pos.x + 0.65 * (index % 5), 2 + Math.floor(index / 5) * 0.8, 0]
  })
}

function returnToRegister(state: GameState) {
  if (!state.customer) return
  state.customer.stage = 'entering'
  state.customer.path = [
    [state.customer.position[0], 0.85, 0],
    [STATIONS.pos.x, 0.85, 0],
    [STATIONS.pos.x, 0.45, 0],
  ]
  state.customer.nextPoint = 0
  state.customer.elapsed = 0
}

export function holdOrder(state: GameState) {
  if (state.phase !== 'open' || !state.customer || !state.sale || !canSwitch(state)) {
    say(state, '결제·제조를 시작하기 전 주문을 보류할 수 있어요.', 'error')
    return
  }

  if (state.waitingOrders.length >= 10 || state.nextOrderNumber > 100000) {
    say(state, '보류 주문을 먼저 이어서 처리해주세요.', 'error')
    return
  }

  const next = createCustomer(state.nextOrderNumber, state.time)
  if (!next) return
  parkCustomer(state)
  state.customer = next
  state.sale = null
  state.orderNumber = state.nextOrderNumber++
  say(state, '주문을 보류했어요. 다음 손님을 응대하거나 보류 목록에서 주문을 재개하세요.')
}

export function resumeOrder(state: GameState, customerId: string) {
  const index = state.waitingOrders.findIndex((order) => order.customer.id === customerId)
  if (index < 0) return

  if (!canSwitch(state)) {
    say(state, '현재 손님의 결제와 제조·전달을 마친 뒤 보류 주문을 재개해주세요.', 'error')
    return
  }

  const [waiting] = state.waitingOrders.splice(index, 1)
  parkCustomer(state)
  state.customer = waiting.customer
  state.sale = waiting.sale
  state.orderNumber = waiting.customer.orderNumber
  returnToRegister(state)
  say(state, `보류한 주문 ${state.orderNumber}번을 이어서 받아주세요.`)
}
