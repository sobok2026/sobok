import { INGREDIENTS } from '../../content/ingredients'
import { expiryAt } from '../../content/lifetime'
import { STATIONS } from '../../content/stations'
import type { Action } from '../../simulation/actions'
import { say } from '../../simulation/feedback'
import { craftingHandsBusy } from '../../simulation/hands'
import type { WorkContext } from '../../simulation/work-context'
import { washingHandsBusy } from '../washing/rules'
import { batchDestination, batchOrigin, carriedBatch } from './batches'
import { CUP_NAMES, CUP_SUPPLY } from './cups'
import { addAmounts, newBatch } from './inventory'
import { SUPPLIES, SUPPLY_CAPACITY, SUPPLY_PACK, SUPPLY_PRICE } from './supplies'

export function handleStockActions(
  work: WorkContext,
  action: Extract<
    Action,
    {
      type:
        | 'cups'
        | 'buy-cups'
        | 'take-supply'
        | 'place-supply'
        | 'return-supply'
        | 'buy-supply'
        | 'open-batch'
        | 'label-batch'
        | 'take-batch'
        | 'return-batch'
        | 'store-batch'
        | 'discard-batch'
        | 'buy'
    }
  >,
) {
  const s = work.state
  const fail = (text: string) => say(s, text, 'error')
  switch (action.type) {
    case 'cups': {
      const stock = s.disposableCups[action.kind]
      const amount = Math.min(CUP_SUPPLY.refill, stock.reserve, Math.max(0, CUP_SUPPLY.barCapacity - stock.bar))
      if (!amount) {
        fail('보충할 컵이 없거나 보관대가 가득 찼어요.')
        break
      }
      stock.reserve -= amount
      stock.bar += amount
      say(s, `${CUP_NAMES[action.kind]} ${amount}개를 보충했어요.`, 'success')
      break
    }
    case 'buy-cups':
      if (s.cash < CUP_SUPPLY.price) {
        fail('컵 입고비가 부족해요.')
        break
      }
      if (s.disposableCups[action.kind].reserve >= CUP_SUPPLY.reserveLimit) {
        fail('후방에 충분한 컵이 있어요.')
        break
      }
      s.cash -= CUP_SUPPLY.price
      s.totals.cupPurchases += CUP_SUPPLY.price
      s.disposableCups[action.kind].reserve += CUP_SUPPLY.pack
      say(s, `${CUP_NAMES[action.kind]} ${CUP_SUPPLY.pack}개를 입고했어요.`, 'success')
      break
    case 'take-supply': {
      if (craftingHandsBusy(s) || washingHandsBusy(s.washing)) {
        fail('컵과 제조·세척 도구를 먼저 내려놓아주세요.')
        break
      }
      const supply = s.supplies[action.supply]
      const amount = Math.min(SUPPLY_CAPACITY - supply.bar, supply.stock)
      if (!amount) {
        fail(
          supply.bar >= SUPPLY_CAPACITY
            ? '컨디먼트 바에 충분히 채워져 있어요.'
            : '창고 재고가 없어요. 소모품을 입고해주세요.',
        )
        break
      }
      supply.stock -= amount
      s.supplyDelivery = { supply: action.supply, amount }
      say(
        s,
        `보충품 집기 완료 · ${SUPPLIES[action.supply].name} ${amount}${SUPPLIES[action.supply].unit}. 컨디먼트 바에 가져가세요.`,
      )
      break
    }
    case 'place-supply': {
      const delivery = s.supplyDelivery
      if (!delivery) break
      const supply = s.supplies[delivery.supply]
      const amount = Math.min(SUPPLY_CAPACITY - supply.bar, delivery.amount)
      supply.bar += amount
      supply.stock += delivery.amount - amount
      s.supplyDelivery = null
      say(s, `${SUPPLIES[delivery.supply].name} ${amount}${SUPPLIES[delivery.supply].unit} 보충 완료.`, 'success')
      break
    }
    case 'return-supply':
      if (!s.supplyDelivery) break
      s.supplies[s.supplyDelivery.supply].stock += s.supplyDelivery.amount
      s.supplyDelivery = null
      say(s, '소모품을 창고에 다시 내려놓았어요.')
      break
    case 'buy-supply':
      if (s.cash < SUPPLY_PRICE) {
        fail('소모품 입고비가 부족해요.')
        break
      }
      s.cash -= SUPPLY_PRICE
      s.supplies[action.supply].stock += SUPPLY_PACK
      s.totals.supplyPurchases[action.supply] = (s.totals.supplyPurchases[action.supply] ?? 0) + SUPPLY_PRICE
      say(s, `${SUPPLIES[action.supply].name} ${SUPPLY_PACK}${SUPPLIES[action.supply].unit} 입고 완료.`, 'success')
      break
    case 'open-batch': {
      const batch = s.batches.find((b) => b.id === action.id)
      if (batch?.location !== 'stock' || batch.openedAt !== null) break
      batch.openedAt = s.time
      batch.expiresAt = expiryAt(s.time, INGREDIENTS[batch.ingredient].lifetime)
      batch.labelled = false
      say(s, `${INGREDIENTS[batch.ingredient].name} 개봉 완료. 라벨을 붙이고 보관 위치를 선택해주세요.`)
      break
    }
    case 'label-batch': {
      const batch = s.batches.find((b) => b.id === action.id)
      if (!batch || batch.amount <= 0 || batch.openedAt === null || batch.labelled) break
      if (
        batch.location !== action.station ||
        action.station !== (batch.location === 'stock' ? 'stock' : batchOrigin(batch)) ||
        !['stock', 'prep', 'cold-prep'].includes(batch.location)
      ) {
        fail('용기가 놓인 작업대에서 라벨을 붙여주세요.')
        break
      }
      if (batch.expiresAt !== null && batch.expiresAt <= s.time) {
        fail('기한이 지난 재료는 새 라벨로 연장할 수 없어요. 폐기해주세요.')
        break
      }
      batch.labelled = true
      say(
        s,
        INGREDIENTS[batch.ingredient].prepared
          ? '기한 라벨을 붙였어요. E로 용기를 집어 보관 장소로 운반해주세요.'
          : '개봉 시각과 기한 라벨을 붙였어요. 보관 위치를 선택해주세요.',
        'success',
      )
      break
    }
    case 'take-batch': {
      const batch = s.batches.find((item) => item.id === action.id)
      if (
        !batch ||
        !['prep', 'cold-prep'].includes(batch.location) ||
        batch.location !== action.station ||
        action.station !== batchOrigin(batch)
      )
        break
      if (craftingHandsBusy(s)) {
        fail('컵과 도구를 먼저 내려놓아주세요.')
        break
      }
      if (!batch.labelled || batch.expiresAt === null || batch.expiresAt <= s.time || batch.amount <= 0) {
        fail(
          batch.expiresAt !== null && batch.expiresAt <= s.time
            ? '기한이 지난 배합은 여기서 폐기해주세요.'
            : '날짜 라벨을 먼저 붙여주세요.',
        )
        break
      }
      batch.location = 'hand'
      say(
        s,
        `${INGREDIENTS[batch.ingredient].name} 용기를 집었어요. ${STATIONS[batchDestination(batch)].name}로 가져가주세요.`,
      )
      break
    }
    case 'return-batch': {
      const batch = carriedBatch(s)
      if (!batch || action.station !== batchOrigin(batch)) {
        fail('용기를 집었던 작업대에 다시 내려놓아주세요.')
        break
      }
      batch.location = batchOrigin(batch)
      say(s, '배합 용기를 원래 자리에 내려놓았어요. 잔량·라벨·기한은 그대로예요.')
      break
    }
    case 'store-batch': {
      const batch = s.batches.find((b) => b.id === action.id)
      if (!batch || batch.amount <= 0 || batch.location === 'bar' || batch.openedAt === null) break
      if (
        INGREDIENTS[batch.ingredient].prepared
          ? batch.location !== 'hand' || action.station !== batchDestination(batch)
          : batch.location !== 'stock' || action.station !== 'stock'
      ) {
        fail(
          INGREDIENTS[batch.ingredient].prepared
            ? `용기를 들고 ${STATIONS[batchDestination(batch)].name}로 가져가주세요.`
            : '창고에서 원팩을 보관해주세요.',
        )
        break
      }
      if (batch.expiresAt !== null && batch.expiresAt <= s.time) {
        fail('기한이 지난 재료는 폐기해주세요.')
        break
      }
      if (!batch.labelled) {
        fail('날짜 라벨을 먼저 붙여주세요.')
        break
      }
      const definition = INGREDIENTS[batch.ingredient]
      if (action.storage !== definition.storage) {
        fail(
          `${definition.name}: ${definition.storage === 'fridge' ? '냉장' : '실온'} 보관이 필요해요. 라벨을 다시 확인해주세요.`,
        )
        break
      }
      batch.location = 'bar'
      if (s.preparation?.batchId === batch.id) s.preparation = null
      if (s.coldBrew?.batchId === batch.id) s.coldBrew = null
      say(
        s,
        `${definition.name} ${definition.storage === 'fridge' ? '냉장' : '실온'} 보관 완료. 이제 음료에 사용할 수 있어요.`,
        'success',
      )
      break
    }
    case 'discard-batch': {
      const batch = s.batches.find((b) => b.id === action.id)
      if (!batch || batch.amount <= 0) break
      if (
        batch.location === 'hand' ||
        (['prep', 'cold-prep'].includes(batch.location)
          ? action.station !== batchOrigin(batch)
          : action.station !== 'stock' && action.station !== 'shelf')
      ) {
        fail('용기가 놓인 작업대에서 폐기해주세요.')
        break
      }
      addAmounts(s.totals.disposed, { [batch.ingredient]: batch.amount })
      batch.amount = 0
      if (s.preparation?.batchId === batch.id) s.preparation = null
      if (s.coldBrew?.batchId === batch.id) s.coldBrew = null
      s.trash++
      say(s, '선택한 배치를 폐기했어요.')
      break
    }
    case 'buy': {
      const ingredient = INGREDIENTS[action.ingredient]
      if (ingredient.prepared) {
        fail('준비대에서 제조하는 재료예요.')
        break
      }
      if (
        s.batches.filter((b) => b.location === 'stock' && b.ingredient === action.ingredient && b.amount > 0).length >=
        3
      ) {
        fail('이 품목은 창고에 충분해요.')
        break
      }
      if (s.cash < ingredient.price) {
        fail('운영비가 부족해요.')
        break
      }
      s.cash -= ingredient.price
      addAmounts(s.totals.purchases, { [action.ingredient]: ingredient.price })
      s.batches.push(newBatch(action.ingredient, ingredient.pack, s.time, 'stock'))
      say(s, '원팩을 입고했어요. 사용할 때 개봉해주세요.', 'success')
      break
    }
  }
}
