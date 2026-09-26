import { RECIPES } from '../../content/recipes'
import { STATIONS, type StationId, toward } from '../../content/stations'
import { cleaningTip } from '../../features/cleaning/help'
import { coldBrewTip } from '../../features/cold-brew/help'
import { craftTip } from '../../features/crafting/help'
import { nextStep } from '../../features/crafting/rules'
import { batchDestination, batchOrigin, carriedBatch } from '../../features/inventory/batches'
import { CUP_NAMES, cleanCupCount, cupCount, cupKindFor, SERVICE_NAMES } from '../../features/inventory/cups'
import { cupRestockAction } from '../../features/inventory/help'
import { preparationTip } from '../../features/preparation/help'
import { currentTicket } from '../../features/service/orders'
import { closingTasks } from '../../features/shift/rules'
import { washingTip } from '../../features/washing/help'
import type { WorkTip as Tip } from '../../shared/work-tip'
import type { GameState } from '../../simulation/state'

export function currentTip(state: GameState, panel: StationId | null): Tip {
  const ticket = currentTicket(state)
  const cup = state.cup
  const carrying = carriedBatch(state)

  if (carrying?.openedAt === null) {
    return {
      title: '입고한 원팩을 보관하세요',
      action: '보관 방식에 맞는 곳을 보고 E를 눌러 넣으세요.',
      reason: '냉장 보관 재료는 냉장고, 실온 보관 재료는 창고에 둬요. 잘못 넣으면 다시 넣어야 해요.',
    }
  }
  if (carrying) {
    const expired = carrying.expiresAt !== null && carrying.expiresAt <= state.time
    return {
      title: expired ? '기한이 지난 용기예요' : '배합 용기를 보관하세요',
      action: expired
        ? `${STATIONS[batchOrigin(carrying)].name}에 E로 내려놓고 폐기하세요.`
        : `${STATIONS[batchDestination(carrying)].name}까지 운반해 E로 보관하세요.`,
      reason: `다시 놓으려면 ${toward(STATIONS[batchOrigin(carrying)].name)} 가세요. 이동해도 잔량·기한은 바뀌지 않아요.`,
    }
  }

  if (panel === 'cold-prep' && !state.coldBrew) {
    return {
      title: '콜드 브루 한 배치를 준비하세요',
      action: '원두 한 배치 준비 버튼을 누르면 직접 계량을 시작해요.',
      reason: '원두와 물을 계량하고 추출이 끝나면 회수·라벨·냉장 보관을 마쳐주세요.',
    }
  }
  if (state.supplyDelivery) {
    return {
      title: '보충품을 먼저 놓으세요',
      action: '컨디먼트 바에서 E로 소모품을 채우세요.',
      reason: '창고에서 E로 다시 내려놓을 수도 있어요. 손을 비워야 다른 도구를 집을 수 있어요.',
    }
  }
  if (cup?.craft.location === 'hand' && (state.preparation || state.washing || state.coldBrew)) {
    return {
      title: '컵을 먼저 내려놓으세요',
      action: `${STATIONS[nextStep(state)?.station ?? 'pickup'].name}를 보고 E를 누르세요.`,
      reason: '컵을 내려놓은 뒤 부재료 준비나 피처 세척을 이어갈 수 있어요.',
    }
  }
  if (state.washing && !cupCount(state.cleaning?.heldCups)) {
    return washingTip(state.washing)
  }
  if (state.cleaning) {
    return cleaningTip(state.cleaning)
  }
  const brew = state.coldBrew
  if (brew && (brew.tool || (!state.preparation && !cup))) {
    return coldBrewTip(state, brew)
  }
  if (state.preparation) {
    return preparationTip(state, state.preparation)
  }
  if (cup?.craft.fault) {
    return {
      title: '이 컵은 다시 만들어야 해요',
      action: `${panel ? 'Esc로 창을 닫고 ' : ''}컵이 있는 작업대에서 Q를 길게 눌러 정리한 뒤 새 컵을 집으세요.`,
      reason: cup.craft.fault,
      fault: true,
    }
  }
  if (cup) {
    return craftTip(state, cup)
  }
  if (state.phase === 'closing') {
    return {
      title: '마감할 준비를 해요',
      action: closingTasks(state).length
        ? 'M으로 남은 손님과 정리할 일을 확인하세요.'
        : 'POS에서 근무를 마치고 결산하세요.',
      reason: '마감해도 재료와 기한은 다음 날로 이어져요.',
    }
  }
  if (state.customer?.visit) {
    return {
      title: '음료 전달을 마쳤어요',
      action: '손님이 나가면 다음 손님이 들어와요. 피처 세척·재료 보충을 해두세요.',
      reason: '라떼에 쓸 우유·폼과 메뉴에 맞는 바모카·호지차 샷을 준비해두세요.',
    }
  }
  if (!ticket) {
    return {
      title: '손님 요청을 POS에 입력하세요',
      action: orderEntryAction(state, panel),
      reason: '손님 요청과 주문표는 별개예요. 카운터 안쪽에서 주문을 받아요.',
    }
  }
  const kind = cupKindFor(ticket.recipe, ticket.service, ticket.size)
  if (!cleanCupCount(state, kind)) {
    return {
      title: `${CUP_NAMES[kind]}를 준비하세요`,
      action: cupRestockAction(state, kind),
      reason: '매장은 다회용, 포장은 일회용 컵을 사용해요. HOT·ICED와 사이즈별 컵도 구분해요.',
    }
  }

  return {
    title: `${CUP_NAMES[kind]}를 집으세요`,
    action: '컵 보관대를 보고 E를 누르세요.',
    reason: `${SERVICE_NAMES[ticket.service]} · ${RECIPES[ticket.recipe].shortName} 제조를 시작해요.`,
  }
}

function orderEntryAction(state: GameState, panel: StationId | null) {
  if (panel !== 'pos') {
    return 'WASD로 이동하고 마우스로 POS를 본 뒤 E를 누르세요.'
  }
  if (state.customer?.stage === 'ordering') {
    return '메뉴·온도·사이즈·매장/포장을 확인하고 음료를 담고 결제를 완료하세요.'
  }
  return '손님이 POS에 도착할 때까지 기다려주세요.'
}
