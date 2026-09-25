import { batchDestination, batchOrigin, carriedBatch } from './batches'
import { type IngredientId, RECIPES, type StationId, tableIds } from './catalog'
import { cleaningHandsBusy, dirtyTableCount } from './cleaning'
import { operationFor } from './crafting'
import { cleanCupCount, cupCount, cupKindFor, isReusableCup } from './cups'
import { CUSTOMER_STATUS } from './customer'
import { available } from './inventory'
import { preparationStep } from './preparation'
import type { GameState } from './state'
import { supplyIds } from './supplies'
import { washDestination, washItems, washStock } from './washing'

export function nextStep(state: GameState) {
  const cup = state.cup
  return cup && operationFor(cup.recipe, cup.step, cup.craft) ? RECIPES[cup.recipe].steps[cup.step] : undefined
}
function plannedStation(state: GameState): StationId {
  const carrying = carriedBatch(state)
  if (carrying)
    return carrying.expiresAt !== null && carrying.expiresAt <= state.time
      ? batchOrigin(carrying)
      : batchDestination(carrying)
  if (state.supplyDelivery) return 'condiment'
  if (cleaningHandsBusy(state.cleaning)) return cupCount(state.cleaning!.heldCups) ? 'wash' : state.cleaning!.station
  if (state.washing) return state.washing.stage === 'carrying' ? washDestination(state.washing.item) : 'wash'
  if (state.cleaning && state.cup?.craft.location !== 'hand' && !state.cup?.craft.tool && !state.preparation?.tool)
    return state.cleaning.station
  if (state.preparation) {
    const prep = state.preparation
    const operation = preparationStep(prep)
    if (
      prep.stage === 'measuring' &&
      !prep.fault &&
      operation.ingredient &&
      available(state, operation.ingredient) + 0.0001 <
        Math.max(0, operation.target - prep.progress) * (operation.perUnit ?? 1)
    )
      return 'stock'
    return 'prep'
  }
  if (state.coldBrew && state.coldBrew.stage !== 'extracting') return 'cold-prep'
  const step = nextStep(state)
  if (step) {
    const craft = state.cup!.craft
    const op = operationFor(state.cup!.recipe, state.cup!.step, craft)!
    if (craft.fault) return craft.location === 'hand' ? 'trash' : craft.location
    if (craft.location !== 'hand' && craft.location !== step.station) return craft.location
    if ((step.usesPitcher || op.tool === 'pitcher') && !craft.pitcherReserved && !state.tools.clean) return 'wash'
    for (const [key, fullAmount] of Object.entries(step.costs)) {
      const amount = fullAmount * (op.kind === 'shake' ? 1 : Math.max(0, 1 - craft.progress / op.target))
      if (available(state, key as IngredientId) + 0.0001 >= amount) continue
      const pending = state.batches.find(
        (batch) =>
          batch.ingredient === key &&
          batch.amount > 0 &&
          batch.openedAt !== null &&
          batch.location !== 'bar' &&
          batch.expiresAt !== null &&
          batch.expiresAt > state.time,
      )
      if (pending)
        return pending.location === 'prep' ? 'prep' : pending.location === 'cold-prep' ? 'cold-prep' : 'stock'
      if (key === 'foam' || key === 'mocha' || key === 'hojicha') return state.tools.clean ? 'prep' : 'wash'
      if (key === 'coldBrew') return 'cold-prep'
      return 'stock'
    }
    return step.station
  }
  if (state.cup)
    return state.cup.craft.location !== 'hand' && state.cup.craft.location !== 'pickup'
      ? state.cup.craft.location
      : 'pickup'
  if (state.ticket) {
    const kind = cupKindFor(state.ticket.recipe, state.ticket.service)
    if (cleanCupCount(state, kind)) return 'cups'
    if (!isReusableCup(kind)) return 'stock'
    if (state.reusableCups[kind].dirty || state.reusableCups[kind].washed) return 'wash'
    if (state.condiment.cups[kind]) return 'condiment'
    return tableIds.find((id) => state.tables[id].cups[kind]) ?? 'wash'
  }
  if (state.phase === 'closing') {
    if (washItems.some((item) => washStock(state, item).dirty)) return 'wash'
    if (washItems.some((item) => washStock(state, item).washed)) return 'wash'
    const dirtyTable = tableIds.find((id) => state.tables[id].dirty || cupCount(state.tables[id].cups))
    if (dirtyTable) return dirtyTable
    if (cupCount(state.condiment.cups) || state.condiment.dirty) return 'condiment'
    if (state.dirtyBar) return 'mix'
    if (state.trash) return 'trash'
    if (state.batches.some((b) => b.amount > 0 && b.expiresAt !== null && b.expiresAt <= state.time)) return 'stock'
    if (state.batches.some((b) => b.amount > 0 && b.openedAt !== null && b.location !== 'bar')) return 'stock'
    if (state.customer) return 'pos'
  }
  if (state.phase === 'open' && supplyIds.some((id) => !state.supplies[id].bar)) return 'stock'
  if (state.customer?.visit || state.customer?.stage === 'leaving') {
    if (washItems.some((item) => washStock(state, item).dirty || washStock(state, item).washed)) return 'wash'
    const dirtyTable = tableIds.find((id) => state.tables[id].dirty || cupCount(state.tables[id].cups))
    if (dirtyTable) return dirtyTable
    if (cupCount(state.condiment.cups) || state.condiment.dirty) return 'condiment'
    if (state.dirtyBar) return 'mix'
    if (state.trash) return 'trash'
    return 'stock'
  }
  return 'pos'
}
export function suggestedStation(state: GameState): StationId {
  const destination = plannedStation(state)
  if (state.cup?.craft.location === 'hand' && ['prep', 'cold-prep', 'wash', 'rack'].includes(destination))
    return nextStep(state)?.station ?? 'pickup'
  return destination
}
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
