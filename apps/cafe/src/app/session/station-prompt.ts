import { INGREDIENTS } from '../../content/ingredients'
import { isCupSurface, STATIONS, type StationId } from '../../content/stations'
import { cupSurface } from '../../features/cleaning/rules'
import { craftStations, craftWorkStation, heldVessel, vesselName } from '../../features/crafting/rules'
import { carriedBatch, deliveryDestination, isSealed } from '../../features/inventory/batches'
import { CUP_NAMES, cupCount } from '../../features/inventory/cups'
import { SUPPLIES, supplyIds } from '../../features/inventory/supplies'
import { currentTicket, pendingStickers } from '../../features/service/orders'
import { WASH_NAMES } from '../../features/washing/rules'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { interactionAt } from './station-interactions'

export type StationPrompt = { verb: string; object: string } | { status: string }

export function stationPrompt(state: GameState, target: StationId): StationPrompt {
  const interaction = interactionAt(state, target)
  if (interaction === null) {
    return { status: stationStatus(state, target) }
  }
  if (interaction === 'panel') {
    return { verb: panelVerb(state, target), object: STATIONS[target].name }
  }
  if (interaction === 'work') {
    return { verb: craftWorkStation(state) === target ? '작업하기' : '이어서 하기', object: STATIONS[target].name }
  }
  return actionPrompt(state, interaction, target)
}

function actionPrompt(state: GameState, action: Action, target: StationId) {
  const station = STATIONS[target].name
  const held = carriedBatch(state)
  const heldName = held ? INGREDIENTS[held.ingredient].name : ''

  switch (action.type) {
    case 'place-cup':
      return { verb: '컵 놓기', object: station }
    case 'pick-cup':
      return { verb: '컵 집기', object: station }
    case 'place-vessel':
      return { verb: `${vesselName(state.cup!, heldVessel(state.cup)!)} 놓기`, object: station }
    case 'pick-vessel':
      return { verb: `${vesselName(state.cup!, action.vessel)} 집기`, object: station }
    case 'attach-sticker':
      return { verb: '스티커 붙이기', object: '주문 스티커' }
    case 'start-cleaning':
      return { verb: '정리 시작', object: cleaningNote(state, target) }
    case 'collect-cup':
      return { verb: '컵 회수', object: station }
    case 'drop-used-cups':
      return { verb: '컵 내려놓기', object: `사용한 컵 ${cupCount(state.cleaning?.heldCups)}개` }
    case 'wash':
      return { verb: '세척 시작', object: WASH_NAMES[action.item] }
    case 'take-washed':
      return { verb: '집기', object: `씻은 ${WASH_NAMES[action.item]}` }
    case 'leave-wash':
      return { verb: '다시 놓기', object: `씻은 ${WASH_NAMES[state.washing!.item]}` }
    case 'store-washed':
      return { verb: '제자리에 놓기', object: `씻은 ${WASH_NAMES[state.washing!.item]}` }
    case 'store-batch':
      return { verb: '보관', object: heldName }
    case 'return-batch':
      return { verb: '용기 내려놓기', object: heldName }
    case 'shelve-pack':
      return { verb: '보관', object: `${heldName} 원팩` }
    case 'place-supply':
      return { verb: '보충', object: SUPPLIES[state.supplyDelivery!.supply].name }
    case 'place-cups':
      return { verb: '컵 보충', object: `${CUP_NAMES[state.cupDelivery!.kind]} ${state.cupDelivery!.amount}개` }
    case 'return-cups':
      return { verb: '컵 묶음 내려놓기', object: `${state.cupDelivery!.amount}개` }
    case 'return-supply':
      return { verb: '보충품 내려놓기', object: SUPPLIES[state.supplyDelivery!.supply].name }
    case 'take-batch':
      return { verb: '용기 집기', object: station }
    case 'collect-cold-brew':
      return { verb: '추출액 회수', object: station }
    default:
      return { verb: '열기', object: station }
  }
}

function cleaningNote(state: GameState, target: StationId) {
  if (target === 'trash') {
    return `쓰레기 ${state.trash}개`
  }
  if (!isCupSurface(target)) {
    return '작업대 얼룩'
  }
  const surface = cupSurface(state, target)
  const cups = cupCount(surface.cups)
  if (cups && surface.dirty) {
    return `컵 ${cups}개 · 얼룩`
  }
  return cups ? `컵 ${cups}개` : '얼룩'
}

function stationStatus(state: GameState, target: StationId) {
  const held = carriedBatch(state)
  if (state.cupDelivery) return '컵 묶음은 바 컵 보관대나 백룸 창고에 내려놓아요'
  if (state.supplyDelivery) return '소모품은 컨디먼트 바에 보충해요'
  if (held) {
    return isSealed(held)
      ? '원팩은 냉장고나 창고에 보관해요'
      : `용기는 ${STATIONS[deliveryDestination(state, held)].name}에 보관해요`
  }
  if (target === 'printer') {
    return printerStatus(state)
  }
  if (craftStations.includes(target)) {
    return craftStatus(state, target)
  }
  if (target === 'rack') {
    return `깨끗한 피처 ${state.tools.clean}개`
  }
  if (target === 'shelf') {
    return '보관된 배합이 없어요'
  }
  if (target === 'wash') {
    return '씻을 용기가 없어요'
  }

  if (target === 'supplies') {
    const low = supplyIds.filter((id) => state.supplies[id].bar <= 5)
    if (low.length) return `${low.map((id) => SUPPLIES[id].name).join(' · ')} 보충 필요`
    return supplyIds.map((id) => `${SUPPLIES[id].name} ${state.supplies[id].bar}${SUPPLIES[id].unit}`).join(' · ')
  }

  return '정리할 것이 없어요'
}

function craftStatus(state: GameState, target: StationId) {
  const location = state.cup?.craft.location
  if (location && location !== 'hand') {
    return `컵은 ${STATIONS[location].name}에 있어요`
  }
  return target === 'pickup' ? '전달할 음료가 없어요' : '놓을 컵이 없어요'
}

function printerStatus(state: GameState) {
  const waiting = pendingStickers(state)
  if (!waiting) {
    return '출력된 스티커가 없어요'
  }
  if (state.cup?.craft.sticker) {
    return '이 컵에는 스티커를 붙였어요'
  }
  return `스티커 ${waiting}장 · 컵을 들고 와서 붙여요`
}

function panelVerb(state: GameState, target: StationId) {
  if (target === 'pos') {
    return posAction(state)
  }
  return target === 'cups' && currentTicket(state) && !state.cup ? '컵 고르기' : '열기'
}

function posAction(state: GameState) {
  if (state.customer?.stage === 'payment') return '선제공 주문 정산'
  if (state.phase === 'closing') {
    return '마감 관리'
  }
  return state.customer?.stage === 'ordering' && !state.customer.visit ? '주문 입력' : '주문 확인'
}
