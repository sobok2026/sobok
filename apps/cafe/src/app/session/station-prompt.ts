import { INGREDIENTS } from '../../content/ingredients'
import { isCupSurface, STATIONS, type StationId } from '../../content/stations'
import { cupSurface } from '../../features/cleaning/rules'
import { craftStations } from '../../features/crafting/rules'
import { batchDestination, carriedBatch, isSealed } from '../../features/inventory/batches'
import { CUP_NAMES, cupCount, cupKindFor } from '../../features/inventory/cups'
import { SUPPLIES, supplyIds } from '../../features/inventory/supplies'
import { currentTicket } from '../../features/service/orders'
import { WASH_NAMES } from '../../features/washing/rules'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { interactionAt } from './station-interactions'

export type StationPrompt = { verb: string; object: string } | { status: string }

/** The words beside the crosshair say exactly what E will do at the aimed station, or why it will do nothing. */
export function stationPrompt(state: GameState, target: StationId): StationPrompt {
  const interaction = interactionAt(state, target)
  if (interaction === null) {
    return { status: stationStatus(state, target) }
  }
  if (interaction === 'panel') {
    return { verb: target === 'pos' ? posAction(state) : '열기', object: STATIONS[target].name }
  }
  if (interaction === 'work') {
    return { verb: '이어서 하기', object: STATIONS[target].name }
  }
  return actionPrompt(state, interaction, target)
}

function actionPrompt(state: GameState, action: Action, target: StationId) {
  const station = STATIONS[target].name
  const held = carriedBatch(state)
  const heldName = held ? INGREDIENTS[held.ingredient].name : ''

  switch (action.type) {
    case 'take-cup': {
      const ticket = currentTicket(state)!
      return { verb: '컵 집기', object: CUP_NAMES[cupKindFor(ticket.recipe, ticket.service, ticket.size)] }
    }
    case 'place-cup':
      return { verb: '컵 놓기', object: station }
    case 'pick-cup':
      return { verb: '컵 집기', object: station }
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
      return { verb: '넣기', object: `${heldName} 원팩` }
    case 'place-supply':
      return { verb: '채우기', object: SUPPLIES[state.supplyDelivery!.supply].name }
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
  if (held) {
    return isSealed(held)
      ? '원팩은 냉장고나 창고에 넣어요'
      : `용기는 ${STATIONS[batchDestination(held)].name}에 보관해요`
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
  const low = supplyIds.filter((id) => state.supplies[id].bar <= 5)
  if (target === 'condiment' && low.length) {
    return `${low.map((id) => SUPPLIES[id].name).join(' · ')} 보충 필요`
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

function posAction(state: GameState) {
  if (state.phase === 'closing') {
    return '마감 관리'
  }
  return state.customer?.stage === 'ordering' && !state.customer.visit ? '주문 입력' : '주문 확인'
}
