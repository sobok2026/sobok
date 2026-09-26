import { INGREDIENTS, type IngredientId } from '../content/ingredients'
import { expiryAt } from '../content/lifetime'
import { STATIONS, type StationId, tableIds } from '../content/stations'
import { cleaningHandsBusy } from '../features/cleaning/rules'
import { coldBrewStep } from '../features/cold-brew/rules'
import { nextStep } from '../features/crafting/rules'
import { batchDestination, batchOrigin, carriedBatch } from '../features/inventory/batches'
import { CUP_NAMES, cleanCupCount, cupCount, cupKindFor, isReusableCup } from '../features/inventory/cups'
import { cupRestockAction, materialTip } from '../features/inventory/help'
import { SUPPLIES, supplyIds } from '../features/inventory/supplies'
import { PREPARATIONS, preparationForMaterial, preparationStep } from '../features/preparation/rules'
import { missingInput, readyWork } from '../features/production/runtime'
import type { WorkStep } from '../features/production/workflow'
import { currentTicket } from '../features/service/orders'
import { WASH_NAMES, washDestination, washItems, washStock } from '../features/washing/rules'
import { cupHandsBusy } from './hands'
import type { Cleaning, CraftState, GameState, Preparation } from './state'

export type Blocker = { station: StationId; reason: string; fix: string }

/**
 * The single answer to "where do I go next and why". The order rail, the 3D marker, the off-screen arrow
 * and the work HUD blockers all read this so they never disagree.
 */
export type Objective = { station: StationId; particle: '에' | '에서'; task: string; blocker?: Blocker }

const at = (station: StationId, task: string): Objective => ({ station, particle: '에서', task })
const to = (station: StationId, task: string): Objective => ({ station, particle: '에', task })
const blocked = (blocker: Blocker): Objective => ({ station: blocker.station, particle: '에서', task: '', blocker })

function materialStation(state: GameState, ingredient: IngredientId): StationId {
  const pending = state.batches.find(
    (batch) =>
      batch.ingredient === ingredient &&
      batch.amount > 0 &&
      batch.openedAt !== null &&
      batch.location !== 'bar' &&
      (batch.expiresAt === null || batch.expiresAt > state.time),
  )
  if (pending?.location === 'hand') {
    return batchDestination(pending)
  }
  if (pending?.location === 'prep' || pending?.location === 'cold-prep') {
    return pending.location
  }
  if (pending) {
    return 'stock'
  }
  if (preparationForMaterial(ingredient)) {
    return state.tools.clean ? 'prep' : 'wash'
  }
  return ingredient === 'coldBrew' ? 'cold-prep' : 'stock'
}

function materialBlocker(state: GameState, ingredient: IngredientId): Blocker {
  const name = INGREDIENTS[ingredient].name
  const pending = state.batches.some(
    (batch) =>
      batch.ingredient === ingredient && batch.amount > 0 && batch.openedAt !== null && batch.location !== 'bar',
  )

  return {
    station: materialStation(state, ingredient),
    reason: pending ? `${name} 사용 준비 전` : `${name} 없음`,
    fix: materialTip(state, ingredient).action,
  }
}

function toolBlocker(state: GameState): Blocker {
  return {
    station: 'wash',
    reason: '깨끗한 작업 용기 없음',
    fix: state.tools.washed
      ? '세척대에서 씻은 용기를 집어 도구 선반에 놓으세요.'
      : '세척대에서 작업 용기를 씻고 도구 선반에 정리하세요.',
  }
}

export function craftBlocker(state: GameState, craft: CraftState, step: WorkStep): Blocker | null {
  if (step.requiresReusableTool && !craft.reservedTool && !state.tools.clean) {
    return toolBlocker(state)
  }
  if (readyWork(step, craft.progress)) {
    return null
  }
  const missing = missingInput(state, step, craft.progress)

  return missing ? materialBlocker(state, missing) : null
}

export function preparationBlocker(state: GameState, prep: Preparation, step: WorkStep): Blocker | null {
  const missing = missingInput(state, step, prep.progress)
  if (missing) {
    return materialBlocker(state, missing)
  }
  if (step.requiresReusableTool && !prep.reservedTool && !state.tools.clean) {
    return toolBlocker(state)
  }
  return null
}

const cleaningTasks = { collect: '컵 회수', bag: '쓰레기 묶기', wipe: '얼룩 닦기' } as const

function cleaningObjective(cleaning: Cleaning): Objective {
  const held = cupCount(cleaning.heldCups)

  return held ? to('wash', `사용한 컵 ${held}개 내려놓기`) : at(cleaning.station, cleaningTasks[cleaning.stage])
}

function surfaceTask(cups: number, dirty: boolean) {
  if (cups && dirty) {
    return '컵 회수·닦기'
  }
  return cups ? '컵 회수' : '얼룩 닦기'
}

function chore(state: GameState): Objective | null {
  const dirtyItem = washItems.find((item) => washStock(state, item).dirty)
  if (dirtyItem) {
    return at('wash', `${WASH_NAMES[dirtyItem]} 세척`)
  }
  const washedItem = washItems.find((item) => washStock(state, item).washed)
  if (washedItem) {
    return at('wash', `씻은 ${WASH_NAMES[washedItem]} 정리`)
  }
  const table = tableIds.find((id) => state.tables[id].dirty || cupCount(state.tables[id].cups))
  if (table) {
    return at(table, surfaceTask(cupCount(state.tables[table].cups), state.tables[table].dirty))
  }
  if (cupCount(state.condiment.cups) || state.condiment.dirty) {
    return at('condiment', surfaceTask(cupCount(state.condiment.cups), state.condiment.dirty))
  }
  if (state.dirtyBar) {
    return at('mix', '작업대 닦기')
  }
  return state.trash ? at('trash', '분리수거') : null
}

function preparationObjective(state: GameState, prep: Preparation): Objective {
  const definition = PREPARATIONS[prep.recipe]
  if (prep.fault) {
    return blocked({ station: 'prep', reason: '배합 실패', fix: prep.fault })
  }

  if (prep.stage === 'ready') {
    const batch = state.batches.find((item) => item.id === prep.batchId)
    if (batch?.expiresAt != null && batch.expiresAt <= state.time) {
      return blocked({ station: 'prep', reason: '배합 기한 만료', fix: '폐기하고 다시 준비하세요.' })
    }
    return at('prep', batch?.labelled ? `${definition.name} 용기 집기` : `${definition.name} 라벨 붙이기`)
  }

  const step = preparationStep(prep)
  if (!step) {
    return blocked({ station: 'prep', reason: '준비 상태 오류', fix: '배합을 정리하고 다시 시작하세요.' })
  }
  const cupPlace = state.cup?.craft.location
  if (cupHandsBusy(state.cup) && cupPlace && cupPlace !== 'hand') {
    return at(cupPlace, '도구 내려놓기')
  }
  const blocker =
    prep.stage === 'measuring' && !state.jobs.some((job) => job.preparationId === prep.id)
      ? preparationBlocker(state, prep, step)
      : null

  return blocker ? blocked(blocker) : at('prep', `${definition.name} · ${step.label}`)
}

function coldBrewObjective(state: GameState): Objective {
  const brew = state.coldBrew!
  const batch = state.batches.find((item) => item.id === brew.batchId)
  if (brew.fault) {
    return blocked({ station: 'cold-prep', reason: '추출 준비 실패', fix: brew.fault })
  }
  if (brew.stage === 'finished' && brew.completedAt !== null) {
    return expiryAt(brew.completedAt, INGREDIENTS.coldBrew.lifetime) <= state.time
      ? blocked({ station: 'cold-prep', reason: '추출액 기한 만료', fix: '폐기하고 다시 준비하세요.' })
      : at('cold-prep', '추출액 회수')
  }
  if (brew.stage === 'ready') {
    return at('cold-prep', batch?.labelled ? '콜드 브루 용기 집기' : '콜드 브루 라벨 붙이기')
  }
  return at('cold-prep', coldBrewStep(brew).label)
}

function craftObjective(state: GameState, step: WorkStep): Objective {
  const craft = state.cup!.craft
  if (craft.fault) {
    return blocked({
      station: craft.location === 'hand' ? 'trash' : craft.location,
      reason: '다시 만들어야 해요',
      fix: craft.fault,
    })
  }
  if (craft.location !== 'hand' && craft.location !== step.station) {
    return at(craft.location, `컵 집기 → ${STATIONS[step.station].name}`)
  }
  const blocker = craftBlocker(state, craft, step)
  if (blocker) {
    return blocked(blocker)
  }

  return craft.location === 'hand' ? to(step.station, '컵 놓기') : at(step.station, step.label)
}

function handoffObjective(state: GameState): Objective {
  const location = state.cup!.craft.location
  if (location === 'hand') {
    return to('pickup', '컵 놓기')
  }
  if (location !== 'pickup') {
    return at(location, '컵 집기 → 픽업대')
  }
  return at('pickup', state.customer?.stage === 'pickup' ? '음료 전달' : '손님 기다리기')
}

function cupObjective(state: GameState, ticket: NonNullable<ReturnType<typeof currentTicket>>): Objective {
  const kind = cupKindFor(ticket.recipe, ticket.service, ticket.size)
  if (cleanCupCount(state, kind)) {
    return at('cups', `${CUP_NAMES[kind]} 집기`)
  }
  const reason = `${CUP_NAMES[kind]} 없음`
  const fix = cupRestockAction(state, kind)
  if (!isReusableCup(kind)) {
    return blocked({ station: state.disposableCups[kind].reserve ? 'cups' : 'stock', reason, fix })
  }
  if (state.reusableCups[kind].dirty || state.reusableCups[kind].washed) {
    return blocked({ station: 'wash', reason, fix })
  }
  if (state.condiment.cups[kind]) {
    return blocked({ station: 'condiment', reason, fix })
  }

  return blocked({ station: tableIds.find((id) => state.tables[id].cups[kind]) ?? 'wash', reason, fix })
}

function closingObjective(state: GameState): Objective | null {
  const pending = chore(state)
  if (pending) {
    return pending
  }
  if (state.batches.some((b) => b.amount > 0 && b.expiresAt !== null && b.expiresAt <= state.time)) {
    return at('stock', '기한 지난 재료 폐기')
  }
  if (state.batches.some((b) => b.amount > 0 && b.openedAt !== null && b.location !== 'bar')) {
    return at('stock', '보관 전 재료 정리')
  }
  return state.customer ? at('pos', '남은 손님 확인') : null
}

function plannedObjective(state: GameState): Objective {
  const carrying = carriedBatch(state)
  if (carrying) {
    return carrying.expiresAt !== null && carrying.expiresAt <= state.time
      ? to(batchOrigin(carrying), '용기 내려놓고 폐기')
      : to(batchDestination(carrying), `${INGREDIENTS[carrying.ingredient].name} 보관`)
  }
  if (state.supplyDelivery) {
    return to('condiment', `${SUPPLIES[state.supplyDelivery.supply].name} 채우기`)
  }
  if (cleaningHandsBusy(state.cleaning)) {
    return cleaningObjective(state.cleaning!)
  }

  const washing = state.washing
  if (washing?.stage === 'carrying') {
    return to(washDestination(washing.item), `씻은 ${WASH_NAMES[washing.item]} 정리`)
  }
  if (washing) {
    return at(
      'wash',
      washing.stage === 'ready' ? `씻은 ${WASH_NAMES[washing.item]} 집기` : `${WASH_NAMES[washing.item]} 세척`,
    )
  }
  if (state.cleaning && state.cup?.craft.location !== 'hand' && !state.cup?.craft.tool && !state.preparation?.tool) {
    return cleaningObjective(state.cleaning)
  }
  if (state.preparation) {
    return preparationObjective(state, state.preparation)
  }
  if (state.coldBrew && state.coldBrew.stage !== 'extracting') {
    return coldBrewObjective(state)
  }

  const step = nextStep(state)
  if (step) {
    return craftObjective(state, step)
  }
  if (state.cup) {
    return handoffObjective(state)
  }
  const ticket = currentTicket(state)
  if (ticket) {
    return cupObjective(state, ticket)
  }

  if (state.phase === 'closing') {
    return closingObjective(state) ?? at('pos', '근무 마치고 결산')
  }
  const emptySupply = supplyIds.find((id) => !state.supplies[id].bar)
  if (state.phase === 'open' && emptySupply) {
    return at('stock', `${SUPPLIES[emptySupply].name} 보충품 가져오기`)
  }
  if (state.customer?.visit || state.customer?.stage === 'leaving') {
    return chore(state) ?? at('stock', '재료·소모품 점검')
  }
  return at('pos', state.customer?.stage === 'ordering' ? '주문 받기' : '손님 기다리기')
}

export function objective(state: GameState): Objective {
  const planned = plannedObjective(state)
  const needsFreeHands: StationId[] = ['prep', 'cold-prep', 'wash', 'rack']
  if (state.cup?.craft.location === 'hand' && needsFreeHands.includes(planned.station)) {
    return to(nextStep(state)?.station ?? 'pickup', '컵 먼저 내려놓기')
  }
  return planned
}
