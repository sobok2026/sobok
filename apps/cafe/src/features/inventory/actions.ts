import { INGREDIENTS, ingredientLifetime } from '../../content/ingredients'
import { expiryAt } from '../../content/lifetime'
import { STATIONS, toward } from '../../content/stations'
import type { Action } from '../../simulation/actions'
import { say } from '../../simulation/feedback'
import { craftingHandsBusy } from '../../simulation/hands'
import type { WorkContext } from '../../simulation/work-context'
import { washingHandsBusy } from '../washing/rules'
import {
  BAR_BATCH_CAPACITY,
  barBatchCount,
  batchDestination,
  batchHome,
  batchOrigin,
  carriedBatch,
  isSealed,
  materialHome,
  packStorage,
  reserveStorage,
} from './batches'
import { CUP_NAMES, CUP_SUPPLY } from './cups'
import { addAmounts, newBatch } from './inventory'
import { checkLabel } from './labels'
import { SUPPLIES, SUPPLY_CAPACITY, SUPPLY_PACK, SUPPLY_PRICE } from './supplies'

export function handleStockActions(
  work: WorkContext,
  action: Extract<
    Action,
    {
      type:
        | 'take-cups'
        | 'place-cups'
        | 'return-cups'
        | 'buy-cups'
        | 'take-supply'
        | 'place-supply'
        | 'return-supply'
        | 'buy-supply'
        | 'open-batch'
        | 'label-batch'
        | 'set-batch-storage'
        | 'take-batch'
        | 'return-batch'
        | 'store-batch'
        | 'shelve-pack'
        | 'discard-batch'
        | 'buy'
    }
  >,
) {
  const s = work.state
  const fail = (text: string) => say(s, text, 'error')

  switch (action.type) {
    case 'take-cups': {
      if (craftingHandsBusy(s) || washingHandsBusy(s.washing)) {
        fail('컵과 제조·세척 도구를 먼저 내려놓아주세요.')
        break
      }
      const stock = s.disposableCups[action.kind]
      const amount = Math.min(CUP_SUPPLY.refill, stock.reserve, Math.max(0, CUP_SUPPLY.barCapacity - stock.bar))

      if (!amount) {
        fail('보충할 컵이 없거나 보관대가 가득 찼어요.')
        break
      }

      stock.reserve -= amount
      s.cupDelivery = { kind: action.kind, amount }
      say(s, `${CUP_NAMES[action.kind]} ${amount}개를 집었어요. 바 컵 보관대로 운반해주세요.`)
      break
    }
    case 'place-cups': {
      const delivery = s.cupDelivery
      if (!delivery) break
      const stock = s.disposableCups[delivery.kind]
      const amount = Math.min(delivery.amount, Math.max(0, CUP_SUPPLY.barCapacity - stock.bar))
      if (!amount) {
        fail('컵 보관대가 가득 찼어요. 들고 있는 컵을 백룸 창고에 돌려놓아주세요.')
        break
      }

      stock.bar += amount
      delivery.amount -= amount
      say(s, `${CUP_NAMES[delivery.kind]} ${amount}개를 보충했어요.`, 'success')
      if (!delivery.amount) s.cupDelivery = null
      break
    }
    case 'return-cups': {
      if (!s.cupDelivery) break
      s.disposableCups[s.cupDelivery.kind].reserve += s.cupDelivery.amount
      s.cupDelivery = null
      say(s, '컵 묶음을 백룸 창고에 돌려놓았어요.')
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
      if (!delivery) {
        break
      }
      const supply = s.supplies[delivery.supply]
      const amount = Math.min(SUPPLY_CAPACITY - supply.bar, delivery.amount)
      if (!amount) {
        fail('컨디먼트 바가 가득 찼어요. 들고 있는 소모품을 백룸 창고에 돌려놓아주세요.')
        break
      }
      supply.bar += amount
      delivery.amount -= amount
      if (!delivery.amount) s.supplyDelivery = null
      say(s, `${SUPPLIES[delivery.supply].name} ${amount}${SUPPLIES[delivery.supply].unit} 보충 완료.`, 'success')
      break
    }
    case 'return-supply':
      if (!s.supplyDelivery) {
        break
      }
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
      if (!batch || !isSealed(batch) || (batch.location !== 'fridge' && batch.location !== 'stock')) {
        break
      }
      batch.openedAt = s.time
      batch.expiresAt = expiryAt(s.time, INGREDIENTS[batch.ingredient].lifetime)
      batch.labelled = false
      say(s, `${INGREDIENTS[batch.ingredient].name} 개봉 완료. 라벨을 써서 붙여주세요.`)
      break
    }
    case 'set-batch-storage': {
      const batch = s.batches.find((item) => item.id === action.id)
      if (!batch || isSealed(batch) || batch.amount <= 0 || batch.openedAt === null) break
      if (batch.location === 'hand' || batch.location === 'bar' || batchHome(batch) !== action.station) {
        fail('URN이나 백룸에 용기를 내려놓고 보관 방식을 바꿔주세요.')
        break
      }
      if (!INGREDIENTS[batch.ingredient].storageLifetimes?.[action.storage] || batch.storage === action.storage) break
      if (batch.expiresAt !== null && batch.expiresAt <= s.time) {
        fail('이미 기한이 지난 배치는 보관 방식을 바꿔 사용할 수 없어요.')
        break
      }
      const expiresAt = Math.min(
        expiryAt(batch.openedAt, ingredientLifetime(batch.ingredient, action.storage)),
        batch.ingredientExpiresAt ?? Infinity,
      )
      if (expiresAt <= s.time) {
        fail('선택한 보관 방식의 사용 기한이 이미 지났어요.')
        break
      }

      batch.storage = action.storage
      // A longer cold-storage deadline starts applying only once the container is put away.
      batch.expiresAt = Math.min(batch.expiresAt ?? expiresAt, expiresAt)
      batch.labelled = false
      say(s, '보관 방식을 바꿨어요. 처음 제조한 시각을 기준으로 라벨을 다시 써주세요.')
      break
    }
    case 'label-batch': {
      const batch = s.batches.find((b) => b.id === action.id)
      if (!batch || batch.amount <= 0 || isSealed(batch) || batch.labelled) {
        break
      }

      if (
        batch.location !== action.station ||
        !['fridge', 'stock', 'prep', 'cold-prep', 'urn', 'grinder'].includes(batch.location)
      ) {
        fail('용기가 놓인 작업대에서 라벨을 붙여주세요.')
        break
      }

      if (batch.expiresAt !== null && batch.expiresAt <= s.time) {
        fail('기한이 지난 재료는 새 라벨로 연장할 수 없어요. 폐기해주세요.')
        break
      }

      const wrong = checkLabel(batch, action.until)
      if (wrong) {
        fail(`${wrong.title}. 기한표를 확인해주세요.`)
        break
      }

      batch.labelled = true
      say(
        s,
        INGREDIENTS[batch.ingredient].prepared
          ? '라벨을 붙였어요. 용기를 집어 보관 장소로 운반해주세요.'
          : '라벨을 붙였어요. 백룸 준비에 사용하거나 용기를 집어 바에 보충하세요.',
        'success',
      )
      break
    }
    case 'take-batch': {
      const batch = s.batches.find((item) => item.id === action.id)
      if (!batch || batch.location === 'hand' || batchHome(batch) !== action.station) {
        break
      }
      if (batch.ingredient === 'todays-coffee') {
        fail('HOT 드립은 URN에서 보온하며 컵에 직접 따라주세요.')
        break
      }

      if (craftingHandsBusy(s)) {
        fail('컵과 도구를 먼저 내려놓아주세요.')
        break
      }

      if (
        isSealed(batch) ||
        !batch.labelled ||
        (batch.expiresAt !== null && batch.expiresAt <= s.time) ||
        batch.amount <= 0
      ) {
        fail(
          batch.expiresAt !== null && batch.expiresAt <= s.time
            ? '기한이 지난 배합은 여기서 폐기해주세요.'
            : '백룸에서 개봉하고 라벨을 먼저 써서 붙여주세요.',
        )
        break
      }

      batch.carryFrom = batch.location
      batch.location = 'hand'
      say(
        s,
        `${INGREDIENTS[batch.ingredient].name} 용기를 집었어요. ${toward(STATIONS[batchDestination(batch)].name)} 가져가주세요.`,
      )
      break
    }
    case 'return-batch': {
      const batch = carriedBatch(s)

      if (!batch || action.station !== batchOrigin(batch)) {
        fail('용기를 집었던 작업대에 다시 내려놓아주세요.')
        break
      }

      batch.location = batch.carryFrom ?? (batch.ingredient === 'cold-brew' ? 'cold-prep' : 'prep')
      batch.carryFrom = null
      say(s, '용기를 원래 자리에 내려놓았어요. 잔량·라벨·기한은 그대로예요.')
      break
    }
    case 'store-batch': {
      const batch = s.batches.find((b) => b.id === action.id)
      if (!batch || batch.amount <= 0 || batch.location !== 'hand' || isSealed(batch)) {
        break
      }

      const barPlace = materialHome(batch.ingredient, batch.storage)
      const reservePlace = reserveStorage(batch)
      if (action.station !== barPlace && action.station !== reservePlace) {
        fail(`용기를 들고 ${toward(STATIONS[batchDestination(batch)].name)} 가져가주세요.`)
        break
      }

      if (batch.expiresAt !== null && batch.expiresAt <= s.time) {
        fail('기한이 지난 재료는 폐기해주세요.')
        break
      }

      if (action.station === barPlace && barBatchCount(s, batch.ingredient) >= BAR_BATCH_CAPACITY) {
        fail(
          `바에는 ${INGREDIENTS[batch.ingredient].name} 용기를 ${BAR_BATCH_CAPACITY}개까지 둘 수 있어요. 백룸에 보관해주세요.`,
        )
        break
      }
      if (!batch.labelled) {
        fail('백룸에서 라벨을 먼저 써서 붙여주세요.')
        break
      }

      batch.location = action.station === barPlace ? 'bar' : reservePlace
      if (batch.openedAt !== null && INGREDIENTS[batch.ingredient].storageLifetimes) {
        batch.expiresAt = Math.min(
          expiryAt(batch.openedAt, ingredientLifetime(batch.ingredient, batch.storage)),
          batch.ingredientExpiresAt ?? Infinity,
        )
      }
      batch.carryFrom = null
      if (s.preparation?.batchId === batch.id) {
        s.preparation = null
      }
      if (s.coldBrew?.batchId === batch.id) {
        s.coldBrew = null
      }
      const destination = batch.location === 'bar' ? '바 보충' : '백룸 보관'
      say(s, `${INGREDIENTS[batch.ingredient].name} ${destination} 완료.`, 'success')
      break
    }
    case 'shelve-pack': {
      const pack = carriedBatch(s)
      if (!pack || !isSealed(pack)) {
        break
      }
      const definition = INGREDIENTS[pack.ingredient]
      const place = packStorage(pack.ingredient)

      if (action.station !== 'fridge' && action.station !== 'stock') {
        fail('원팩은 냉장고나 창고에 넣어주세요.')
        break
      }

      if (action.station !== place) {
        fail(
          `${definition.storage === 'fridge' ? '냉장' : '실온'} 보관 재료예요. ${STATIONS[place].name}에 넣어주세요.`,
        )
        break
      }

      pack.location = place
      pack.carryFrom = null
      say(s, `${definition.name} 원팩을 ${STATIONS[place].name}에 넣었어요.`, 'success')
      break
    }
    case 'discard-batch': {
      const batch = s.batches.find((b) => b.id === action.id)
      if (!batch || batch.amount <= 0) {
        break
      }

      if (action.station !== batchHome(batch)) {
        fail('용기가 놓인 작업대에서 폐기해주세요.')
        break
      }

      addAmounts(s.totals.disposed, { [batch.ingredient]: batch.amount })
      batch.amount = 0
      if (s.preparation?.batchId === batch.id) {
        s.preparation = null
      }
      if (s.coldBrew?.batchId === batch.id) {
        s.coldBrew = null
      }
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

      if (s.batches.filter((b) => isSealed(b) && b.ingredient === action.ingredient).length >= 3) {
        fail('이 품목의 미개봉 원팩이 충분해요.')
        break
      }

      if (craftingHandsBusy(s) || washingHandsBusy(s.washing)) {
        fail('컵과 제조·세척 도구를 먼저 내려놓아주세요.')
        break
      }

      if (s.cash < ingredient.price) {
        fail('운영비가 부족해요.')
        break
      }

      s.cash -= ingredient.price
      addAmounts(s.totals.purchases, { [action.ingredient]: ingredient.price })
      s.batches.push(newBatch(action.ingredient, ingredient.pack, s.time, 'hand', true))
      say(s, `${ingredient.name} 원팩을 입고했어요. 알맞은 보관 장소에 넣어주세요.`)
      break
    }
  }
}
