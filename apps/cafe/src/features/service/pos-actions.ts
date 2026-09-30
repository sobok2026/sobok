import { customizationSchema } from '../../content/customizations'
import { recipeFor } from '../../content/recipes'
import { uid } from '../../shared/id'
import type { PosAction } from '../../simulation/actions'
import { say } from '../../simulation/feedback'
import type { GameState, OrderItem, Sale } from '../../simulation/state'
import type { WorkContext } from '../../simulation/work-context'
import { dripMenuTemperature } from '../drip-coffee/rules'
import { FOODS } from '../food/catalog'
import { foodOrderSchema } from '../food/model'
import { foodOrderAvailable } from '../food/rules'
import { benefitsError } from './benefits'
import { orderOptionsSchema, saleBenefitsSchema } from './checkout-model'
import { acceptOrder, holdOrder, newSale, resumeOrder } from './order-flow'
import { itemPrice, orderMatchesRequest } from './orders'
import { completeSale, paySale, reversePendingPayment, settleCredit } from './payments'

function itemError(item: OrderItem) {
  if (
    !customizationSchema.safeParse(item.customizations).success ||
    !orderOptionsSchema.safeParse(item.options).success
  )
    return '주문 옵션을 확인해주세요.'

  try {
    const recipe = recipeFor(item.recipe, item.size, item.service, item.customizations)
    if (item.options.personalCup && recipe.vesselId !== 'serving-cup')
      return '전용 잔으로 제공하는 메뉴에는 개인컵을 선택할 수 없어요.'
    if (item.options.personalCup && item.options.cupDeposit) return '개인컵에는 컵보증금을 적용하지 않아요.'
    if (item.service === 'dine-in' && !item.options.personalCup && item.customizations.lid === 'with')
      return '매장용 잔에는 리드를 덮을 수 없어요.'
    itemPrice(item)
    return null
  } catch (error) {
    return error instanceof Error ? error.message : '주문할 수 없는 메뉴예요.'
  }
}

function clearLineBenefits(sale: Sale, id: string) {
  sale.benefits.coupons = sale.benefits.coupons.filter((applied) => applied.lineId !== id)
  if (sale.benefits.telecom?.lineId === id) sale.benefits.telecom = null
  if (sale.benefits.manual?.lineId === id) sale.benefits.manual = null
}

function updateItem(state: GameState, id: string, item: OrderItem, quantity?: number) {
  const line = state.sale?.lines.find((line) => line.id === id)
  if (!line || !state.sale) return
  const temperature = dripMenuTemperature(item.recipe)
  const dripBean = line.recipe === item.recipe ? line.dripBean : temperature && state.cow[temperature]
  Object.assign(line, {
    recipe: item.recipe,
    size: item.size,
    service: item.service,
    customizations: structuredClone(item.customizations),
    options: structuredClone(item.options),
    dripBean: dripBean || null,
    quantity: quantity ?? line.quantity,
  })
  clearLineBenefits(state.sale, id)
}

export function handlePosActions({ state }: WorkContext, action: PosAction) {
  const fail = (text: string) => say(state, text, 'error')

  if (action.type === 'pos-credit-payment') {
    settleCredit(state, action.transactionId, action.payment)
    return
  }

  if (action.type === 'pos-hold') {
    holdOrder(state)
    return
  }

  if (action.type === 'pos-resume') {
    resumeOrder(state, action.customerId)
    return
  }

  const customer = state.customer
  const sale = state.sale
  if (!customer || (sale && (sale.customerId !== customer.id || sale.paidAt !== null))) return
  if (!['ordering', 'pickup', 'to-pickup', 'payment', 'to-payment'].includes(customer.stage))
    return fail('손님이 POS에 도착하면 주문을 받아주세요.')

  if (action.type === 'pos-void') {
    reversePendingPayment(state, action.id)
    return
  }

  if (action.type === 'pos-pay') {
    paySale(state, action)
    return
  }

  if (action.type === 'pos-complete') {
    if (sale?.acceptedAt === null && !foodOrderAvailable(state)) return fail('주문할 푸드 재고를 먼저 준비해주세요.')
    completeSale(state)
    return
  }

  if (action.type === 'pos-accept') {
    if (!sale || sale.acceptedAt !== null) return
    if (!orderMatchesRequest(state)) return fail('선제공 전에 손님 요청과 주문을 확인해주세요.')
    if (!foodOrderAvailable(state)) return fail('주문할 푸드 재고를 먼저 준비해주세요.')
    const error = benefitsError(state, sale, sale.benefits)
    if (error) return fail(error)
    acceptOrder(state)
    say(state, '주문을 선제공으로 접수했어요. 제조·전달 후 POS에서 정산해주세요.')
    return
  }

  if (action.type === 'pos-benefits') {
    if (!sale || sale.payments.length) return fail('결제를 시작하기 전에 쿠폰과 할인을 선택해주세요.')
    const parsed = saleBenefitsSchema.safeParse(action.benefits)
    if (!parsed.success) return fail('쿠폰과 할인 정보를 확인해주세요.')
    const error = benefitsError(state, sale, parsed.data)
    if (error) return fail(error)
    sale.benefits = parsed.data
    sale.benefitsCheckedAt = null
    return
  }

  if (state.phase !== 'open' || customer.stage !== 'ordering' || sale?.acceptedAt != null || sale?.payments.length)
    return fail('접수·결제를 시작한 주문의 상품을 변경할 수 없어요.')

  if (action.type === 'pos-clear') {
    state.sale = null
    return
  }

  if (action.type === 'pos-remove') {
    if (!sale) return
    sale.lines = sale.lines.filter((line) => line.id !== action.id)
    sale.foodLines = sale.foodLines.filter((line) => line.id !== action.id)
    clearLineBenefits(sale, action.id)
    if (!sale.lines.length && !sale.foodLines.length) state.sale = null
    return
  }

  if (action.type === 'pos-split') {
    if (!sale || sale.lines.length + sale.foodLines.length >= 50) return
    const drink = sale.lines.find((line) => line.id === action.id)
    const food = sale.foodLines.find((line) => line.id === action.id)
    const line = drink ?? food
    if (!line || line.quantity <= 1) return
    line.quantity--
    if (drink)
      sale.lines.splice(sale.lines.indexOf(drink) + 1, 0, { ...structuredClone(drink), id: uid(), quantity: 1 })
    if (food)
      sale.foodLines.splice(sale.foodLines.indexOf(food) + 1, 0, { ...structuredClone(food), id: uid(), quantity: 1 })
    clearLineBenefits(sale, line.id)
    return
  }

  if (action.type === 'pos-bulk') {
    if (!sale || new Set(action.items.map((entry) => entry.id)).size !== action.items.length) return

    for (const entry of action.items) {
      if (!sale.lines.some((line) => line.id === entry.id)) return
      const error = itemError(entry.item)
      if (error) return fail(error)
    }

    for (const entry of action.items) updateItem(state, entry.id, entry.item)
    return
  }

  if (action.type === 'pos-food-add' || action.type === 'pos-food-update') {
    const parsed = foodOrderSchema.safeParse(action.item)
    const product = FOODS[action.item.productId]
    if (
      !parsed.success ||
      !product ||
      (parsed.data.warmed && !product.heatingSeconds) ||
      parsed.data.options.personalCup ||
      parsed.data.options.cupDeposit
    )
      return fail('푸드 상품과 가열·포장 선택을 확인해주세요.')

    if (action.type === 'pos-food-add') {
      if (sale && sale.lines.length + sale.foodLines.length >= 50)
        return fail('한 주문에 50개 항목까지 담을 수 있어요.')
      state.sale ??= newSale(customer.id)
      state.sale.foodLines.push({ ...parsed.data, id: uid(), served: 0, unitPrice: product.price })
    } else {
      const line = sale?.foodLines.find((line) => line.id === action.id)
      if (!line || !sale) return
      Object.assign(line, parsed.data, { unitPrice: product.price })
      clearLineBenefits(sale, line.id)
    }

    return
  }

  const error = itemError(action.item)
  if (error) return fail(error)

  if (action.type === 'pos-add') {
    if (sale && sale.lines.length + sale.foodLines.length >= 50) return fail('한 주문에 50개 항목까지 담을 수 있어요.')
    const temperature = dripMenuTemperature(action.item.recipe)
    state.sale ??= newSale(customer.id)
    state.sale.lines.push({
      ...structuredClone(action.item),
      id: uid(),
      quantity: 1,
      served: 0,
      dripBean: temperature ? state.cow[temperature] : null,
    })
    return
  }

  if (!Number.isInteger(action.quantity) || action.quantity < 1 || action.quantity > 99)
    return fail('수량은 1~99개로 입력해주세요.')
  updateItem(state, action.id, action.item, action.quantity)
}
