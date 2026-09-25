import type { GameState } from '../../simulation/state'
import { dirtyTableCount } from '../cleaning/rules'
import { carriedBatch } from '../inventory/batches'
import { cupCount } from '../inventory/cups'
import { CUSTOMER_STATUS } from '../service/customer'
import { washItems, washStock } from '../washing/rules'
export function closingTasks(state: GameState) {
  return [
    state.ticket || state.cup ? '남은 주문 마무리' : '',
    state.customer ? `손님 ${CUSTOMER_STATUS[state.customer.stage]} · 퇴장까지 응대` : '',
    state.preparation ? '부재료 준비 마무리' : '',
    state.coldBrew && state.coldBrew.stage !== 'extracting' ? '콜드 브루 계량·회수·보관 마무리' : '',
    carriedBatch(state) ? '운반 중인 배합 용기 보관·반납' : '',
    state.washing ? '세척 중인 용기·들고 있는 용기 정리' : '',
    state.cleaning ? '진행 중인 청소·회수한 컵 정리' : '',
    state.supplyDelivery ? '들고 있는 소모품 정리' : '',
    state.batches.some((b) => b.amount > 0 && b.openedAt !== null && b.location !== 'bar')
      ? '개봉·제조한 재료 라벨·보관'
      : '',
    washItems.some((item) => washStock(state, item).dirty) ? '피처·다회용 컵 세척' : '',
    washItems.some((item) => washStock(state, item).washed) ? '피처·다회용 컵 보관대 정리' : '',
    dirtyTableCount(state.tables) ? '고객 테이블 청소' : '',
    cupCount(state.condiment.cups) || state.condiment.dirty ? '컨디먼트 바 반납 컵·청소' : '',
    state.dirtyBar ? '작업대 청소' : '',
    state.trash ? '쓰레기 비우기' : '',
    state.batches.some((b) => b.amount > 0 && b.expiresAt !== null && b.expiresAt <= state.time)
      ? '기한 지난 재료 폐기'
      : '',
    state.jobs.some((j) => j.kind !== 'cold-brew') ? '진행 중인 작업 마무리' : '',
  ].filter(Boolean)
}

export const emptyTotals = (openingCash: number): GameState['totals'] => ({
  openingCash,
  purchases: {},
  cupPurchases: 0,
  coldBrewPurchases: 0,
  coldBrewDiscardedBeans: 0,
  disposed: {},
  supplyPurchases: {},
  suppliesUsed: {},
  served: 0,
  revenue: 0,
  wastedCups: 0,
  cleaned: 0,
  washed: 0,
  prepared: 0,
})
