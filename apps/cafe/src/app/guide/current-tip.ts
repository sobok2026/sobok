import { STATIONS, type StationId, toward } from '../../content/stations'
import { cleaningTip } from '../../features/cleaning/help'
import { coldBrewTip } from '../../features/cold-brew/help'
import { craftTip } from '../../features/crafting/help'
import { nextStep } from '../../features/crafting/rules'
import { dripHandsBusy } from '../../features/drip-coffee/rules'
import { batchOrigin, carriedBatch, deliveryDestination } from '../../features/inventory/batches'
import { CUP_NAMES, cupCount } from '../../features/inventory/cups'
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

  if (state.ice.bucketHeld && state.ice.bucket === 0) {
    return {
      title: '빈 얼음통을 돌려놓으세요',
      action: '백룸 제빙기 옆에 얼음통을 걸어주세요.',
      reason: '빈 통까지 정리하면 다시 다른 도구를 집을 수 있어요.',
    }
  }
  if (state.ice.bucketHeld || panel === 'ice-machine' || panel === 'ice') {
    return {
      title: state.ice.bucketHeld ? '얼음통을 바에 운반하세요' : '제빙기와 바 아이스 빈',
      action: '제빙기에서 얼음통에 담고, 바 아이스 빈을 보고 작업 버튼을 눌러 보충하세요.',
      reason: '바에 부은 얼음만 음료와 ICED 드립에 사용해요. 남은 얼음은 제빙기 옆 배수구에 비우고 통을 걸어요.',
    }
  }
  if (panel === 'dishwasher') {
    return {
      title: '랙에 담아 세척하세요',
      action: '후드 올리기 → 랙 적재 → 후드 내리고 운전 → 완료 후 건조대에 꺼내기 순서예요.',
      reason: '꺼낸 용기는 건조대에서 집어 피처는 도구 선반, 컵은 컵 보관대로 옮겨요.',
    }
  }

  if (carrying?.openedAt === null) {
    return {
      title: '입고한 원팩을 보관하세요',
      action: '보관 방식에 맞는 곳을 보고 작업 버튼을 눌러 보관하세요.',
      reason: '냉장 보관 재료는 냉장고, 실온 보관 재료는 창고에 둬요. 잘못 넣으면 다시 넣어야 해요.',
    }
  }
  if (carrying) {
    const expired = carrying.expiresAt !== null && carrying.expiresAt <= state.time
    return {
      title: expired ? '기한이 지난 용기예요' : '배합 용기를 보관하세요',
      action: expired
        ? `${STATIONS[batchOrigin(carrying)].name}에 내려놓고 폐기하세요.`
        : `${STATIONS[deliveryDestination(state, carrying)].name}까지 운반해 보관하세요.`,
      reason: `다시 놓으려면 ${toward(STATIONS[batchOrigin(carrying)].name)} 가세요. 이동해도 잔량·기한은 바뀌지 않아요.`,
    }
  }

  if (state.cupDelivery) {
    return {
      title: `${CUP_NAMES[state.cupDelivery.kind]} ${state.cupDelivery.amount}개 운반 중`,
      action: '바 컵 보관대에서 보충하세요.',
      reason: '백룸 창고에서 다시 내려놓을 수 있어요.',
    }
  }

  if (panel === 'cold-prep' && !state.coldBrew) {
    return {
      title: '콜드 브루 한 배치를 준비하세요',
      action: '추출 준비 버튼을 누른 뒤 BUNN G3에서 COARSE로 분쇄하세요.',
      reason: '분쇄한 원두를 추출대로 가져가 물을 계량하고, 추출 후 회수·라벨·냉장 보관을 마쳐주세요.',
    }
  }
  if (panel === 'grinder') {
    return {
      title: 'BUNN G3 원두 분쇄',
      action: '분쇄할 작업과 분쇄도를 고르고 원두를 넣으세요. 드립은 DRIP, 콜드 브루는 COARSE, 칩은 ESPRESSO예요.',
      reason: '드립 원두 용기는 URN으로, 콜드 브루 원두 봉투는 추출대로 가져가요. 칩은 그라인더에서 라벨을 써요.',
    }
  }
  if (panel === 'urn' || dripHandsBusy(state)) {
    return {
      title: 'URN Digital 드립 추출',
      action: '필터를 넣고 BUNN G3에서 원두를 계량·DRIP 분쇄하세요. 분쇄 원두 용기를 URN에 가져와 필터에 부어요.',
      reason:
        '추출은 5분 동안 자동으로 진행돼요. HOT은 완료부터 1시간 보온하고, ICED는 얼음 혼합·라벨·냉장 보관을 마쳐요.',
    }
  }
  if (state.supplyDelivery) {
    return {
      title: '보충품을 먼저 놓으세요',
      action: '컨디먼트 바에서 소모품을 보충하세요.',
      reason: '창고에서 다시 내려놓을 수도 있어요. 손을 비워야 다른 도구를 집을 수 있어요.',
    }
  }
  if (cup?.craft.location === 'hand' && (state.preparation || state.washing || state.coldBrew)) {
    return {
      title: '컵을 먼저 내려놓으세요',
      action: `${STATIONS[nextStep(state)?.station ?? 'pickup'].name}를 보고 작업 버튼을 누르세요.`,
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
      action: `${panel ? '창을 닫고 ' : ''}컵이 있는 작업대에서 폐기 버튼을 길게 눌러 정리한 뒤 새 컵을 집으세요.`,
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
  return {
    title: '주문에 맞는 컵을 고르세요',
    action: '컵 보관대에서 작업 버튼을 누르고 주문의 매장·포장, 온도, 사이즈를 보고 컵을 고르세요.',
    reason:
      '매장은 HOT 머그·ICED 유리잔, 포장은 HOT 종이컵·ICED 일회용 컵이에요. 비어 있으면 그 자리에서 보충 방법을 알려줘요.',
  }
}

function orderEntryAction(state: GameState, panel: StationId | null) {
  if (panel !== 'pos') {
    return 'POS로 이동해 화면 가운데에 맞추고 작업 버튼을 누르세요.'
  }
  if (state.customer?.stage === 'ordering') {
    return '메뉴·온도·사이즈·매장/포장을 확인하고 음료를 담고 결제를 완료하세요.'
  }
  return '손님이 POS에 도착할 때까지 기다려주세요.'
}
