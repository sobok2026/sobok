import { money } from '../../shared/format'
import { uid } from '../../shared/id'
import type { FoodAction } from '../../simulation/actions'
import { say } from '../../simulation/feedback'
import { craftingHandsBusy } from '../../simulation/hands'
import type { GameState } from '../../simulation/state'
import type { WorkContext } from '../../simulation/work-context'
import { carriedBatch } from '../inventory/batches'
import { cupCount } from '../inventory/cups'
import { finishServing } from '../service/order-flow'
import { FOODS, SHOWCASE_CAPACITY } from './catalog'
import { currentFood } from './rules'

function handsBusy(state: GameState) {
  return (
    craftingHandsBusy(state) ||
    !!carriedBatch(state) ||
    !!state.cupDelivery ||
    !!state.supplyDelivery ||
    !!state.coldBrew?.tool ||
    state.washing?.stage === 'carrying' ||
    !!state.washing?.spongeHeld ||
    !!state.cleaning?.clothHeld ||
    cupCount(state.cleaning?.heldCups) > 0 ||
    Object.values(state.drip).some((brew) => brew?.tool)
  )
}

export function handleFoodActions({ state }: WorkContext, action: FoodAction) {
  const fail = (message: string) => say(state, message, 'error')

  if (action.type === 'food-buy') {
    const product = FOODS[action.productId]
    if (!product || state.foodBatches.length >= 1000) return
    if (state.cash < product.purchasePrice) return fail('푸드 입고에 필요한 운영 자금이 부족해요.')
    state.cash -= product.purchasePrice
    state.totals.foodPurchases += product.purchasePrice
    state.foodBatches.push({
      id: uid(),
      productId: product.id,
      quantity: product.purchaseQuantity,
      location: 'stock',
      receivedAt: state.time,
      expiresAt: state.time + product.storageHours * 3600,
      displayedAt: null,
    })
    say(
      state,
      `${product.name} ${product.purchaseQuantity}개를 냉장 입고했어요. ${money(product.purchasePrice)}`,
      'success',
    )
    return
  }

  if (action.type === 'food-display' || action.type === 'food-return' || action.type === 'food-discard') {
    const batch = state.foodBatches.find((batch) => batch.id === action.batchId)
    if (!batch || !Number.isInteger(action.quantity) || action.quantity < 1 || action.quantity > batch.quantity) return
    const product = FOODS[batch.productId]
    if (!product) return

    if (action.type === 'food-discard') {
      batch.quantity -= action.quantity
      state.totals.foodDisposed[product.id] = (state.totals.foodDisposed[product.id] ?? 0) + action.quantity
      state.trash += action.quantity
      state.foodBatches = state.foodBatches.filter((batch) => batch.quantity > 0)
      say(state, `${product.name} ${action.quantity}개를 폐기했어요.`)
      return
    }

    if (batch.expiresAt <= state.time) return fail('기한이 지난 푸드는 폐기해주세요.')
    const location = action.type === 'food-display' ? 'showcase' : 'stock'
    if (batch.location === location) return
    const displayed = state.foodBatches
      .filter((batch) => batch.location === 'showcase')
      .reduce((sum, batch) => sum + batch.quantity, 0)
    if (location === 'showcase' && displayed + action.quantity > SHOWCASE_CAPACITY)
      return fail(`쇼케이스에는 ${SHOWCASE_CAPACITY}개까지 진열할 수 있어요.`)

    if (batch.quantity > action.quantity && state.foodBatches.length >= 1000)
      return fail('입고 내역이 가득 찼어요. 남은 재고를 정리해주세요.')
    batch.quantity -= action.quantity
    const endOfDay = Math.floor(state.time / 86400) * 86400 + 86400
    state.foodBatches.push({
      ...batch,
      id: uid(),
      quantity: action.quantity,
      location,
      displayedAt: batch.displayedAt ?? (location === 'showcase' ? state.time : null),
      expiresAt: location === 'showcase' ? Math.min(batch.expiresAt, endOfDay) : batch.expiresAt,
    })
    state.foodBatches = state.foodBatches.filter((batch) => batch.quantity > 0)
    say(
      state,
      `${product.name} ${action.quantity}개를 ${location === 'showcase' ? '진열했어요.' : '냉장고로 옮겼어요. 진열한 푸드의 기한은 유지돼요.'}`,
    )
    return
  }

  const line = currentFood(state)

  if (action.type === 'food-pick') {
    if (!line || state.foodWork || handsBusy(state)) return fail('현재 푸드 주문과 들고 있는 물건을 확인해주세요.')
    const batch = state.foodBatches.find((batch) => batch.id === action.batchId)
    if (batch?.location !== 'showcase' || batch.productId !== line.productId || batch.quantity < 1)
      return fail('주문에 맞는 푸드를 쇼케이스에서 골라주세요.')
    if (batch.expiresAt <= state.time) return fail('기한이 지난 푸드는 제공할 수 없어요.')
    batch.quantity--
    state.foodWork = {
      lineId: line.id,
      productId: line.productId,
      expiresAt: batch.expiresAt,
      stage: 'picked',
      location: 'hand',
      heatingEndsAt: null,
      packaging: null,
    }
    state.foodBatches = state.foodBatches.filter((batch) => batch.quantity > 0)
    say(state, `${FOODS[line.productId].name}을 집었어요.`)
    return
  }

  const food = state.foodWork
  if (!food || !line || food.lineId !== line.id) return

  if (action.type === 'food-discard-work') {
    state.totals.foodDisposed[food.productId] = (state.totals.foodDisposed[food.productId] ?? 0) + 1
    state.trash++
    state.foodWork = null
    say(state, '준비 중인 푸드를 폐기했어요. 새 푸드를 준비해주세요.')
    return
  }

  if (food.expiresAt <= state.time) return fail('기한이 지난 푸드는 폐기하고 새로 준비해주세요.')

  if (action.type === 'food-move') {
    if (food.stage === 'heating') return fail('가열이 끝날 때까지 기다려주세요.')
    if (action.location === 'hand' && handsBusy(state)) return fail('들고 있는 물건을 먼저 내려놓아주세요.')
    if (food.location !== 'hand' && action.location !== 'hand') return fail('푸드를 먼저 집어 옮겨주세요.')
    food.location = action.location
    say(state, action.location === 'hand' ? '푸드를 집었어요.' : '푸드를 내려놓았어요.')
    return
  }

  if (action.type === 'food-heat') {
    if (
      food.location !== 'food-oven' ||
      food.stage !== 'picked' ||
      !line.warmed ||
      !FOODS[food.productId].heatingSeconds
    )
      return fail('가열할 푸드를 오븐에 먼저 넣어주세요.')
    food.stage = 'heating'
    food.heatingEndsAt = state.time + FOODS[food.productId].heatingSeconds
    say(state, '푸드 가열을 시작했어요. 다른 작업을 하며 기다릴 수 있어요.')
    return
  }

  if (action.type === 'food-pack') {
    if (food.location !== 'pickup' || food.stage === 'heating' || (line.warmed && food.stage !== 'heated'))
      return fail('요청한 가열을 마치고 픽업대에 놓아주세요.')
    if (action.packaging !== line.options.packaging) return fail('POS에서 선택한 포장 방식에 맞춰 준비해주세요.')
    food.packaging = action.packaging
    food.stage = 'packed'
    say(
      state,
      line.service === 'dine-in' && action.packaging === 'none' ? '접시에 푸드를 준비했어요.' : '푸드 포장을 마쳤어요.',
    )
    return
  }

  if (action.type === 'food-serve') {
    if (food.location !== 'pickup' || food.stage !== 'packed' || state.customer?.stage !== 'pickup')
      return fail('푸드 준비를 마치고 손님이 픽업대에 도착하면 전달해주세요.')
    line.served++
    state.totals.foodServed++
    state.foodWork = null
    say(state, '푸드를 전달했어요.', 'success')
    finishServing(state)
  }
}
