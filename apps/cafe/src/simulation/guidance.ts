import { INGREDIENTS, type IngredientId } from '../content/ingredients'
import { expiryAt } from '../content/lifetime'
import { STATIONS, type StationId, tableIds } from '../content/stations'
import { cleaningHandsBusy } from '../features/cleaning/rules'
import { coldBrewStep } from '../features/cold-brew/rules'
import {
  cupRecipe,
  heldVessel,
  misplacedVessels,
  nextCupStation,
  nextStep,
  nextVesselStation,
  stepVessels,
  vesselName,
} from '../features/crafting/rules'
import { dripStation, dripTemperatures, isDripIngredient } from '../features/drip-coffee/rules'
import {
  BAR_BATCH_CAPACITY,
  barBatchCount,
  batchHome,
  batchOrigin,
  carriedBatch,
  deliveryDestination,
  isSealed,
  materialSource,
} from '../features/inventory/batches'
import { CUP_NAMES, cupCount } from '../features/inventory/cups'
import { materialTip } from '../features/inventory/help'
import type { StockArea } from '../features/inventory/inventory'
import { SUPPLIES, type SupplyId, supplyIds } from '../features/inventory/supplies'
import {
  PREPARATIONS,
  preparationForMaterial,
  preparationStation,
  preparationStep,
} from '../features/preparation/rules'
import { workTitle } from '../features/production/presentation'
import { missingInput, readyWork, requiredInput } from '../features/production/runtime'
import type { WorkStep } from '../features/production/workflow'
import { currentTicket } from '../features/service/orders'
import { WASH_NAMES, washDestination, washItems, washStock } from '../features/washing/rules'
import { craftingHandsBusy, cupHandsBusy } from './hands'
import type { Cleaning, CraftState, GameState, Preparation } from './state'

export type Subject = { ingredient: IngredientId; area?: StockArea; amount?: number } | { supply: SupplyId }

/** Only mistakes are faults; routine prerequisites such as opening a pack are normal work. */
export type Blocker = { station: StationId; reason: string; fix: string; subject?: Subject; fault?: boolean }

export type Objective = {
  station: StationId | null
  particle: '에' | '에서'
  task: string
  blocker?: Blocker
  subject?: Subject
}

const at = (station: StationId, task: string): Objective => ({ station, particle: '에서', task })
const to = (station: StationId, task: string): Objective => ({ station, particle: '에', task })
const blocked = (blocker: Blocker): Objective => ({ station: blocker.station, particle: '에서', task: '', blocker })

function materialStation(state: GameState, ingredient: IngredientId, area: StockArea, amount: number): StationId {
  if (ingredient === 'todays-coffee') return 'urn'

  if (area === 'bar' && barBatchCount(state, ingredient) >= BAR_BATCH_CAPACITY) {
    const batch = state.batches.find(
      (item) => item.ingredient === ingredient && item.location === 'bar' && item.amount > 0,
    )!
    return batchHome(batch)!
  }

  const source = materialSource(state, ingredient, area, amount, state.cup?.craft.dripBean ?? null)
  if (source) return batchHome(source) ?? 'stock'
  if (isDripIngredient(ingredient)) return 'urn'
  const preparation = preparationForMaterial(ingredient)
  if (preparation) return state.tools.clean ? preparation.steps[0].station : 'wash'
  return ingredient === 'cold-brew' ? 'cold-prep' : 'stock'
}

function materialBlocker(state: GameState, ingredient: IngredientId, area: StockArea = 'bar', amount = 0): Blocker {
  const place = area === 'bar' ? '바' : '백룸'

  return {
    station: materialStation(state, ingredient, area, amount),
    reason: `${place}에 ${INGREDIENTS[ingredient].name} 보충 필요`,
    fix: materialTip(state, ingredient, area, amount).action,
    subject: { ingredient, area, amount },
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
  const missing = missingInput(state, step, craft.progress, craft.dripBean)

  return missing ? materialBlocker(state, missing, 'bar', requiredInput(step, missing, craft.progress)) : null
}

export function preparationBlocker(state: GameState, prep: Preparation, step: WorkStep): Blocker | null {
  const missing = missingInput(state, step, prep.progress)
  if (missing) {
    return materialBlocker(state, missing, step.stockArea, requiredInput(step, missing, prep.progress))
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
  const station = preparationStation(prep)
  if (prep.fault) {
    return blocked({ station, reason: '배합 실패', fix: prep.fault, fault: true })
  }

  if (prep.stage === 'ready') {
    const batch = state.batches.find((item) => item.id === prep.batchId)
    if (batch?.expiresAt != null && batch.expiresAt <= state.time) {
      return blocked({ station, reason: '배합 기한 만료', fix: '폐기하고 다시 준비하세요.', fault: true })
    }
    return at(station, batch?.labelled ? `${definition.name} 용기 집기` : `${definition.name} 라벨 쓰기`)
  }

  const step = preparationStep(prep)
  if (!step) {
    return blocked({ station, reason: '준비 상태 오류', fix: '배합을 정리하고 다시 시작하세요.', fault: true })
  }
  const cupStep = nextStep(state)
  if (state.cup?.craft.tool && cupStep) {
    return at(cupStep.station, '도구 내려놓기')
  }
  const blocker =
    prep.stage === 'measuring' && !state.jobs.some((job) => job.preparationId === prep.id)
      ? preparationBlocker(state, prep, step)
      : null

  return blocker ? blocked(blocker) : at(station, `${definition.name} · ${step.label}`)
}

function coldBrewObjective(state: GameState): Objective {
  const brew = state.coldBrew!
  if (brew.stage === 'grind' || brew.stage === 'ground') {
    return at('grinder', brew.stage === 'grind' ? '콜드 브루 원두 COARSE 분쇄' : '분쇄 원두 봉투 집기')
  }

  const batch = state.batches.find((item) => item.id === brew.batchId)
  if (brew.fault) {
    return blocked({ station: 'cold-prep', reason: '추출 준비 실패', fix: brew.fault, fault: true })
  }
  if (brew.stage === 'finished' && brew.completedAt !== null) {
    return expiryAt(brew.completedAt, INGREDIENTS['cold-brew'].lifetime) <= state.time
      ? blocked({ station: 'cold-prep', reason: '추출액 기한 만료', fix: '폐기하고 다시 준비하세요.', fault: true })
      : at('cold-prep', '추출액 회수')
  }
  if (brew.stage === 'ready') {
    return at('cold-prep', batch?.labelled ? '콜드 브루 용기 집기' : '콜드 브루 라벨 쓰기')
  }
  return at('cold-prep', coldBrewStep(brew).label)
}

function craftObjective(state: GameState, step: WorkStep): Objective {
  const cup = state.cup!
  const craft = cup.craft
  if (craft.fault) {
    return blocked({
      station: craft.location === 'hand' ? 'trash' : craft.location,
      reason: '다시 만들어야 해요',
      fix: craft.fault,
      fault: true,
    })
  }
  if (!craft.sticker) {
    return at('printer', '주문 스티커 붙이기')
  }
  const held = heldVessel(cup)
  if (held) {
    return to(nextVesselStation(cup, held) ?? step.station, `${vesselName(cup, held)} 놓기`)
  }
  if (craft.location === 'hand') {
    return to(nextCupStation(cup), '컵 놓기')
  }
  const misplaced = misplacedVessels(cup, step)[0]
  if (misplaced?.place && misplaced.place !== 'hand') {
    return at(misplaced.place, `${vesselName(cup, misplaced.id)} 집기 → ${STATIONS[step.station].name}`)
  }
  const busy = state.jobs.find(
    (job) => job.cupId === cup.id && job.vessel && stepVessels(step, cupRecipe(cup).vesselId).includes(job.vessel),
  )
  if (busy) {
    return at(busy.station, `${busy.label} 끝나길 기다리기`)
  }
  const blocker = craftBlocker(state, craft, step)
  if (blocker) {
    return blocked(blocker)
  }

  return at(step.station, workTitle(step))
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

/** The rail names the rack, never the cup: reading the ticket and choosing the cup is what the player practises. */
function cupObjective(): Objective {
  return at('cups', '컵 고르기')
}

function closingObjective(state: GameState): Objective | null {
  const pending = chore(state)
  if (pending) {
    return pending
  }
  const expired = state.batches.find((b) => b.amount > 0 && b.expiresAt !== null && b.expiresAt <= state.time)
  const expiredHome = expired && batchHome(expired)
  if (expiredHome) {
    return at(expiredHome, `${INGREDIENTS[expired.ingredient].name} 폐기`)
  }
  const unlabelled = state.batches.find((b) => b.amount > 0 && !isSealed(b) && !b.labelled)
  const unlabelledHome = unlabelled && batchHome(unlabelled)
  if (unlabelledHome) {
    return at(unlabelledHome, `${INGREDIENTS[unlabelled.ingredient].name} 라벨 쓰기`)
  }
  const overnight = state.batches.find(
    (batch) =>
      batch.amount > 0 &&
      !isSealed(batch) &&
      INGREDIENTS[batch.ingredient].closingStorage === 'fridge' &&
      batch.location !== 'fridge',
  )
  const overnightHome = overnight && batchHome(overnight)
  if (overnightHome) {
    return at(overnightHome, `${INGREDIENTS[overnight.ingredient].name} 집어 백룸 냉장 보관`)
  }
  return state.customer ? at('pos', '남은 손님 확인') : null
}

function plannedObjective(state: GameState): Objective {
  const carrying = carriedBatch(state)
  if (carrying && isSealed(carrying)) {
    // Choosing the right storage is the player's call, so the guide does not point at it.
    return { station: null, particle: '에', task: `${INGREDIENTS[carrying.ingredient].name} 원팩을 알맞은 곳에 보관` }
  }
  if (carrying) {
    return carrying.expiresAt !== null && carrying.expiresAt <= state.time
      ? to(batchOrigin(carrying), '용기 내려놓고 폐기')
      : to(deliveryDestination(state, carrying), `${INGREDIENTS[carrying.ingredient].name} 보관`)
  }
  if (state.cupDelivery) {
    return to('cups', `${CUP_NAMES[state.cupDelivery.kind]} ${state.cupDelivery.amount}개 보충`)
  }
  if (state.supplyDelivery) {
    return to('supplies', `${SUPPLIES[state.supplyDelivery.supply].name} 보충`)
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
  if (state.cleaning && !cupHandsBusy(state.cup) && !state.preparation?.tool) {
    return cleaningObjective(state.cleaning)
  }
  if (state.preparation) {
    return preparationObjective(state, state.preparation)
  }
  if (state.coldBrew && state.coldBrew.stage !== 'extracting') {
    return coldBrewObjective(state)
  }

  const pendingDrip = dripTemperatures
    .map((id) => state.drip[id])
    .find((brew) => brew && ['filter', 'beans', 'grind', 'ground', 'loaded', 'ice', 'mix'].includes(brew.stage))

  if (pendingDrip && !craftingHandsBusy(state)) {
    return at(dripStation(pendingDrip), pendingDrip.fault ? '드립 배치 폐기' : '드립 배치 준비 이어가기')
  }

  const step = nextStep(state)
  if (step) {
    return craftObjective(state, step)
  }
  if (state.cup) {
    return handoffObjective(state)
  }
  if (currentTicket(state)) {
    return cupObjective()
  }

  if (state.phase === 'closing') {
    return closingObjective(state) ?? at('pos', '근무 마치고 결산')
  }
  const emptySupply = supplyIds.find((id) => !state.supplies[id].bar)
  if (state.phase === 'open' && emptySupply) {
    return { ...at('stock', `${SUPPLIES[emptySupply].name} 보충품 집기`), subject: { supply: emptySupply } }
  }
  if (state.customer?.visit || state.customer?.stage === 'leaving') {
    return chore(state) ?? at('pos', '다음 손님 기다리기')
  }
  return at('pos', state.customer?.stage === 'ordering' ? '주문 받기' : '손님 기다리기')
}

export function objective(state: GameState): Objective {
  if (state.foodWork) {
    const food = state.foodWork
    const line = state.sale?.foodLines.find((line) => line.id === food.lineId)
    if (food.expiresAt <= state.time)
      return at(food.location === 'food-oven' ? 'food-oven' : 'pickup', '기한 지난 푸드 폐기')
    if (food.location === 'hand')
      return at(line?.warmed && food.stage === 'picked' ? 'food-oven' : 'pickup', '들고 있는 푸드 내려놓기')
    if (food.stage === 'picked' && line?.warmed) return at('food-oven', '푸드 가열 시작')
    if (food.stage === 'heated' && food.location === 'food-oven') return at('food-oven', '가열한 푸드 집기')
    if (food.location === 'pickup') return at('pickup', food.stage === 'packed' ? '푸드 전달' : '푸드 포장·제공 준비')
  }

  if (
    !currentTicket(state) &&
    state.sale?.acceptedAt != null &&
    state.sale.foodLines.some((line) => line.served < line.quantity) &&
    !state.foodWork
  )
    return at('food-case', '주문한 푸드 집기')
  if (state.customer?.stage === 'payment' || state.customer?.stage === 'to-payment')
    return at('pos', '선제공 주문 정산')
  const heldDrip = dripTemperatures.map((id) => state.drip[id]).find((brew) => brew?.tool)
  if (heldDrip) {
    return at(
      heldDrip.stage === 'ground' ? 'urn' : dripStation(heldDrip),
      heldDrip.stage === 'ground' ? '분쇄 원두를 URN 필터에 붓기' : '계량 마치고 도구 내려놓기',
    )
  }

  if (state.coldBrew?.tool) return coldBrewObjective(state)
  const planned = plannedObjective(state)
  const needsFreeHands: StationId[] = ['prep', 'cold-prep', 'wash', 'rack', 'grinder']
  const cup = state.cup
  const held = heldVessel(cup)
  if (cup && (cup.craft.location === 'hand' || held) && planned.station && needsFreeHands.includes(planned.station)) {
    return held
      ? to(nextVesselStation(cup, held) ?? 'mix', `${vesselName(cup, held)} 먼저 내려놓기`)
      : to(nextCupStation(cup), '컵 먼저 내려놓기')
  }
  return planned
}
