import { batchDestination, batchOrigin, carriedBatch } from './batches'
import {
  COLD_BREW_HOURS,
  type Costs,
  type CupSurfaceId,
  INGREDIENTS,
  type IngredientId,
  ingredientIds,
  isCupSurface,
  orderSequence,
  RECIPES,
  type RecipeId,
  recipeLabel,
  STATIONS,
  type StationId,
  staffStartPosition,
  tableIds,
} from './catalog'
import { CLEANING_SECONDS, type CleaningStation, cleaningHandsBusy, cupSurface, dirtyTableCount } from './cleaning'
import { COLD_BREW_BEANS, COLD_BREW_COST, coldBrewStep, createColdBrew } from './cold-brew'
import {
  type CraftOperation,
  craftStations,
  createCraft,
  isContinuous,
  isMetered,
  operationFor,
  readyToConfirm,
  TOOL_NAMES,
} from './crafting'
import {
  CUP_NAMES,
  cleanCupCount,
  cupCount,
  cupKindFor,
  type DisposableCupKind,
  emptyCupCounts,
  isReusableCup,
  type ReusableCupKind,
  reusableCupFor,
  reusableCupKinds,
  SERVICE_NAMES,
  type ServiceMode,
} from './cups'
import {
  CUSTOMER_SECONDS,
  CUSTOMER_STATUS,
  createCustomer,
  customerLeave,
  customerToCondiment,
  customerToPickup,
  customerToReturn,
  customerToTable,
  customerWait,
  customerWalking,
  moveCustomer,
} from './customer'
import {
  continuousPreparation,
  createPreparation,
  PREP_TOOL_NAMES,
  PREPARATIONS,
  type PreparationId,
  type PrepStep,
  preparationStep,
} from './preparation'
import { expiryAt } from './quality'
import { type Batch, emptyTotals, type GameState, type Job, uid } from './state'
import {
  CUSTOMER_HABITS,
  SUPPLIES,
  SUPPLY_CAPACITY,
  SUPPLY_PACK,
  SUPPLY_PRICE,
  type SupplyId,
  supplyIds,
} from './supplies'
import {
  WASH_NAMES,
  WASH_STEPS,
  type WashItem,
  washDestination,
  washItems,
  washingHandsBusy,
  washStock,
} from './washing'

const START = Date.UTC(2026, 8, 1, 9) / 1000
function addAmounts(target: Costs, amounts: Costs) {
  for (const id of ingredientIds) {
    const amount = amounts[id] ?? 0
    if (amount > 0) target[id] = (target[id] ?? 0) + amount
  }
}
function newBatch(ingredient: IngredientId, amount: number, now: number, location: Batch['location'] = 'bar'): Batch {
  return {
    id: uid(),
    ingredient,
    amount,
    location,
    openedAt: location !== 'stock' ? now : null,
    expiresAt: location !== 'stock' ? expiryAt(now, INGREDIENTS[ingredient].lifetime) : null,
    labelled: location === 'bar',
  }
}
export function initialState(): GameState {
  const amounts: Record<IngredientId, number> = {
    beans: 100,
    milk: 100,
    cream: 400,
    glaze: 500,
    powder: 40,
    mochaPowder: 1,
    mocha: 0,
    foam: 0,
    coldBrew: 600,
    classic: 0,
    hojichaPowder: 0,
    hojicha: 0,
  }
  return {
    day: 1,
    time: START,
    phase: 'open',
    cash: 50000,
    orderNumber: 1,
    request: 'cold-brew',
    customer: createCustomer(1, 'cold-brew'),
    ticket: null,
    cup: null,
    preparation: null,
    coldBrew: null,
    washing: null,
    cleaning: null,
    batches: ingredientIds.flatMap((ingredient) => [
      newBatch(ingredient, amounts[ingredient], START),
      ...(!INGREDIENTS[ingredient].prepared
        ? [newBatch(ingredient, INGREDIENTS[ingredient].pack, START, 'stock')]
        : []),
    ]),
    jobs: [],
    tools: { clean: 2, dirty: 1, washed: 0 },
    disposableCups: { 'hot-paper': { bar: 2, reserve: 12 }, 'iced-plastic': { bar: 2, reserve: 12 } },
    reusableCups: { 'hot-mug': { clean: 4, dirty: 0, washed: 0 }, 'iced-glass': { clean: 4, dirty: 0, washed: 0 } },
    tables: { table: { cups: emptyCupCounts(), dirty: false }, 'table-left': { cups: emptyCupCounts(), dirty: false } },
    condiment: { cups: emptyCupCounts(), dirty: false },
    supplies: {
      napkins: { bar: SUPPLY_CAPACITY, stock: SUPPLY_PACK },
      straws: { bar: SUPPLY_CAPACITY, stock: SUPPLY_PACK },
      sugar: { bar: SUPPLY_CAPACITY, stock: SUPPLY_PACK },
    },
    supplyDelivery: null,
    dirtyBar: 0,
    trash: 0,
    totals: emptyTotals(50000),
    messages: [{ id: uid(), text: '첫 손님이 들어오고 있어요. 매장을 둘러보세요.', tone: 'info' }],
    position: staffStartPosition(),
  }
}
export function available(state: GameState, ingredient: IngredientId) {
  return state.batches
    .filter(
      (batch) =>
        batch.ingredient === ingredient &&
        batch.location === 'bar' &&
        batch.labelled &&
        (batch.expiresAt === null || batch.expiresAt > state.time),
    )
    .reduce((sum, batch) => sum + batch.amount, 0)
}
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
  const toolStation = () => 'wash' as const
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
    if ((step.usesPitcher || op.tool === 'pitcher') && !craft.pitcherReserved && !state.tools.clean)
      return toolStation()
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
      if (key === 'foam' || key === 'mocha' || key === 'hojicha') return state.tools.clean ? 'prep' : toolStation()
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
export function suggestedInstruction(state: GameState): string | null {
  const destination = plannedStation(state)
  const carrying = carriedBatch(state)
  if (carrying)
    return carrying.expiresAt !== null && carrying.expiresAt <= state.time
      ? `기한이 지난 용기를 ${STATIONS[batchOrigin(carrying)].name}에 E로 내려놓고 폐기하세요.`
      : `${INGREDIENTS[carrying.ingredient].name} 용기를 ${STATIONS[batchDestination(carrying)].name}에 E로 보관하세요.`
  if (state.supplyDelivery)
    return `${SUPPLIES[state.supplyDelivery.supply].name} 보충품을 컨디먼트 바에 가져가 E로 채우세요.`
  if (
    state.cleaning &&
    (destination === state.cleaning.station || (cupCount(state.cleaning.heldCups) && destination === 'wash'))
  ) {
    const cleaning = state.cleaning
    if (cupCount(cleaning.heldCups)) return '회수한 다회용 컵을 세척대에 가져가 E로 내려놓으세요.'
    if (cleaning.stage === 'collect') return `E로 ${STATIONS[cleaning.station].name}의 컵을 집어 세척대로 옮기세요.`
    if (cleaning.stage === 'bag') return '누르고 쓰레기를 모은 뒤 F로 봉투를 비우세요.'
    return cleaning.clothHeld
      ? '누르고 닦은 뒤 천을 놓고 F로 확인하세요.'
      : 'G로 청소용 천을 집고 누르는 동안 닦으세요.'
  }
  if (state.cup?.craft.location === 'hand' && ['prep', 'cold-prep', 'wash', 'rack'].includes(destination))
    return `먼저 E로 컵을 내려놓으세요. ${destination === 'prep' || destination === 'cold-prep' ? '재료 준비' : '피처 세척·정리'}에는 빈손이 필요해요.`
  if (state.washing) {
    const name = WASH_NAMES[state.washing.item]
    const destinationName = STATIONS[washDestination(state.washing.item)].name
    if (state.washing.stage === 'carrying') return `씻은 ${name}를 ${destinationName}에 E로 놓으세요.`
    if (state.washing.stage === 'ready') return `E로 씻은 ${name}를 집어 ${destinationName}로 가져가세요.`
    if (state.washing.stage === 'scrub') {
      if (!state.washing.spongeHeld) return '스펀지를 집어 용기를 문질러주세요.'
      return state.washing.progress >= WASH_STEPS.scrub.seconds
        ? '스펀지를 놓고 헹구기로 넘어가세요.'
        : '스펀지로 용기를 문질러주세요.'
    }
    return state.washing.progress >= WASH_STEPS.rinse.seconds
      ? '세척을 마치고 용기를 제자리에 정리하세요.'
      : '용기를 물로 헹궈주세요.'
  }
  if (destination === 'wash' && washItems.some((item) => washStock(state, item).washed))
    return '씻은 용기를 집어 제자리에 정리하면 다시 쓸 수 있어요.'
  if (destination === 'wash' && !state.tools.clean) return '깨끗한 피처가 필요해요. 하나 씻고 선반에 정리해주세요.'
  if (state.customer?.stage === 'entering') return '손님이 POS에 도착하면 주문을 받을 수 있어요.'
  if (state.customer?.visit || state.customer?.stage === 'leaving')
    return state.phase === 'closing'
      ? `손님 ${CUSTOMER_STATUS[state.customer.stage]}. 퇴장한 뒤 남은 정리를 마치세요.`
      : `손님 ${CUSTOMER_STATUS[state.customer.stage]}. 다음 손님이 오기 전에 정리·보충할 수 있어요.`
  return null
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
export type Action =
  | { type: 'ticket'; recipe: RecipeId; service: ServiceMode }
  | { type: 'start-preparation'; recipe: PreparationId }
  | { type: 'prep-tool' | 'prep-use' | 'prep-confirm' | 'discard-preparation' }
  | { type: 'wash-tool' | 'wash-use' | 'wash-confirm' | 'leave-wash' }
  | { type: 'wash' | 'take-washed'; item: WashItem }
  | { type: 'store-washed'; station: StationId }
  | { type: 'cups' | 'buy-cups'; kind: DisposableCupKind }
  | { type: 'start-cleaning'; station: CleaningStation }
  | { type: 'take-supply' | 'buy-supply'; supply: SupplyId }
  | { type: 'place-supply' | 'return-supply' }
  | { type: 'collect-cup' | 'drop-used-cups' | 'clean-tool' | 'clean-use' | 'clean-confirm' | 'leave-cleaning' }
  | { type: 'label-batch' | 'take-batch' | 'discard-batch'; id: string; station: StationId }
  | { type: 'return-batch'; station: StationId }
  | { type: 'store-batch'; id: string; storage: 'room' | 'fridge'; station: StationId }
  | { type: 'start-cold-brew' | 'cold-tool' | 'cold-use' | 'cold-confirm' | 'collect-cold-brew' | 'discard-cold-brew' }
  | { type: 'place-cup' | 'pick-cup' | 'tool' | 'use-start' | 'confirm-craft'; station: StationId }
  | { type: 'open-batch'; id: string }
  | { type: 'buy'; ingredient: IngredientId }
  | {
      type: 'take-cup' | 'discard-cup' | 'serve' | 'close' | 'finish' | 'next-day'
    }

export class CafeStore {
  private state: GameState
  private listeners = new Set<() => void>()
  private input:
    | { kind: 'drink'; cupId: string; step: number; station: StationId; operation: string }
    | { kind: 'prep'; preparationId: string; step: number; station: 'prep' }
    | { kind: 'cold'; preparationId: string; step: number; station: 'cold-prep' }
    | { kind: 'wash'; washingId: string; stage: 'scrub' | 'rinse'; station: 'wash' }
    | { kind: 'clean'; cleaningId: string; station: CleaningStation }
    | null = null
  constructor(state: GameState) {
    this.state = state
  }
  getSnapshot = () => this.state
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  replace(state: GameState) {
    this.input = null
    this.state = state
    this.emit()
  }
  getActiveInput = () => this.input
  stopActiveInput = () => {
    this.input = null
  }
  private emit() {
    for (const listener of this.listeners) listener()
  }
  private say(state: GameState, text: string, tone: 'info' | 'success' | 'error' = 'info') {
    state.messages = [...state.messages.slice(-5), { id: uid(), text, tone }]
  }
  private consume(state: GameState, costs: Costs): { earliestExpiry: number | null } | null {
    for (const [key, amount] of Object.entries(costs)) {
      const ingredient = key as IngredientId
      if (available(state, ingredient) + 0.0001 < amount) {
        this.say(state, `${INGREDIENTS[ingredient].name}가 부족해요. 준비대 또는 창고에서 보충해주세요.`, 'error')
        return null
      }
    }
    let earliestExpiry: number | null = null
    for (const [key, amount] of Object.entries(costs)) {
      let remaining = amount
      const batches = state.batches
        .filter(
          (b) =>
            b.ingredient === key &&
            b.location === 'bar' &&
            b.labelled &&
            (b.expiresAt === null || b.expiresAt > state.time),
        )
        .sort((a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity))
      for (const batch of batches) {
        const used = Math.min(batch.amount, remaining)
        if (used > 0 && batch.expiresAt !== null)
          earliestExpiry = Math.min(earliestExpiry ?? batch.expiresAt, batch.expiresAt)
        batch.amount -= used
        remaining -= used
        if (remaining <= 0) break
      }
    }
    return { earliestExpiry }
  }
  private job(
    state: GameState,
    kind: Job['kind'],
    station: StationId,
    label: string,
    seconds: number,
    extra: Partial<Job> = {},
  ) {
    state.jobs.push({ id: uid(), kind, station, label, startedAt: state.time, endsAt: state.time + seconds, ...extra })
    this.say(state, `${label} 시작. 기다리는 동안 다른 업무를 할 수 있어요.`)
  }
  dispatch(action: Action) {
    this.input = null
    const s = structuredClone(this.state)
    const busy = (station: StationId) => s.jobs.some((j) => j.station === station)
    const fail = (text: string) => this.say(s, text, 'error')
    if (s.phase === 'summary' && action.type !== 'next-day') return
    this.completeJobs(s)
    this.expirePreparation(s, s.time)
    if (carriedBatch(s) && !['return-batch', 'store-batch', 'ticket', 'close'].includes(action.type)) {
      fail('들고 있는 배합 용기를 보관하거나 원래 작업대에 먼저 내려놓아주세요.')
      this.state = s
      this.emit()
      return
    }
    if (
      s.coldBrew?.tool &&
      !['cold-tool', 'cold-use', 'cold-confirm', 'discard-cold-brew', 'ticket', 'close'].includes(action.type)
    ) {
      fail('콜드 브루 계량 도구를 G로 먼저 내려놓아주세요.')
      this.state = s
      this.emit()
      return
    }
    if (s.supplyDelivery && !['place-supply', 'return-supply', 'ticket', 'close'].includes(action.type)) {
      fail('들고 있는 소모품을 컨디먼트 바에 채우거나 창고에 먼저 내려놓아주세요.')
      this.state = s
      this.emit()
      return
    }
    const cleaningAction = [
      'start-cleaning',
      'collect-cup',
      'drop-used-cups',
      'clean-tool',
      'clean-use',
      'clean-confirm',
      'leave-cleaning',
    ].includes(action.type)
    if (cleaningHandsBusy(s.cleaning) && !cleaningAction && !['ticket', 'close'].includes(action.type)) {
      fail(
        cupCount(s.cleaning!.heldCups)
          ? '회수한 컵을 세척대에 먼저 내려놓아주세요.'
          : `${STATIONS[s.cleaning!.station].name}에서 G로 청소용 천을 내려놓아주세요.`,
      )
      this.state = s
      this.emit()
      return
    }
    if (
      cleaningAction &&
      ((s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool)) ||
        s.preparation?.tool ||
        washingHandsBusy(s.washing))
    ) {
      fail('컵과 제조·세척 도구를 먼저 내려놓은 뒤 청소해주세요.')
      this.state = s
      this.emit()
      return
    }
    if (
      washingHandsBusy(s.washing) &&
      [
        'take-cup',
        'pick-cup',
        'tool',
        'use-start',
        'confirm-craft',
        'serve',
        'start-preparation',
        'prep-tool',
        'prep-use',
        'prep-confirm',
        'take-batch',
        'start-cold-brew',
        'cold-tool',
        'cold-use',
        'cold-confirm',
        'collect-cold-brew',
      ].includes(action.type)
    ) {
      fail(
        s.washing?.stage === 'carrying'
          ? '씻은 용기를 제자리에 먼저 놓아주세요.'
          : '세척대에서 G로 스펀지를 먼저 내려놓아주세요.',
      )
      this.state = s
      this.emit()
      return
    }
    switch (action.type) {
      case 'ticket':
        if (s.phase !== 'open' && !s.ticket) {
          fail('새 주문은 마감했어요.')
          break
        }
        if (s.cup) {
          fail('제조 중인 컵을 정리한 뒤 주문을 수정해주세요.')
          break
        }
        if (!s.customer || s.customer.visit || (!s.ticket && s.customer.stage !== 'ordering')) {
          fail(
            s.customer?.stage === 'entering'
              ? '손님이 POS에 도착하면 주문을 받아주세요.'
              : '응대 중인 손님이 나가면 다음 주문을 받을 수 있어요.',
          )
          break
        }
        s.ticket = { recipe: action.recipe, service: action.service }
        if (s.customer.stage === 'ordering') customerToPickup(s.customer)
        this.say(s, `${SERVICE_NAMES[action.service]} · ${recipeLabel(action.recipe)} 주문을 접수했어요.`, 'success')
        break
      case 'take-cup': {
        if (s.preparation?.tool) {
          fail('준비대의 도구를 먼저 내려놓아주세요.')
          break
        }
        if (!s.ticket) {
          fail('먼저 POS에서 주문을 입력해주세요.')
          break
        }
        if (s.cup) {
          fail('이미 컵을 들고 있어요.')
          break
        }
        const kind = cupKindFor(s.ticket.recipe, s.ticket.service)
        if (!cleanCupCount(s, kind)) {
          fail(
            isReusableCup(kind)
              ? `${CUP_NAMES[kind]}가 없어요. 회수·세척 후 컵 보관대에 돌려놓아주세요.`
              : `${CUP_NAMES[kind]}가 없어요. 창고에서 보충해주세요.`,
          )
          break
        }
        if (isReusableCup(kind)) s.reusableCups[kind].clean--
        else s.disposableCups[kind].bar--
        s.cup = { id: uid(), recipe: s.ticket.recipe, step: 0, craft: createCraft(kind) }
        this.say(s, `${CUP_NAMES[kind]}를 집었어요.`)
        break
      }
      case 'place-cup': {
        if (!s.cup || !craftStations.includes(action.station)) break
        if (action.station === 'mix' && s.cleaning?.station === 'mix') {
          fail('혼합 작업대의 청소를 마치거나 취소한 뒤 컵을 놓아주세요.')
          break
        }
        if (s.jobs.some((j) => j.cupId === s.cup?.id)) {
          fail('장비 작업이 끝나면 컵을 움직일 수 있어요.')
          break
        }
        if (s.cup.craft.location !== 'hand') {
          fail('다른 작업대의 컵을 먼저 집어주세요.')
          break
        }
        s.cup.craft.location = action.station
        this.say(s, '컵을 내려놓았어요.')
        break
      }
      case 'pick-cup': {
        if (!s.cup || s.cup.craft.location !== action.station) break
        if (s.preparation?.tool) {
          fail('준비대의 도구를 먼저 내려놓아주세요.')
          break
        }
        if (s.cup.craft.tool) {
          fail(`${TOOL_NAMES[s.cup.craft.tool]}를 G로 내려놓아주세요.`)
          break
        }
        if (s.jobs.some((j) => j.cupId === s.cup?.id)) {
          fail('장비 작업이 끝날 때까지 기다려주세요.')
          break
        }
        s.cup.craft.location = 'hand'
        this.say(s, '컵을 집었어요.')
        break
      }
      case 'tool': {
        if (s.preparation?.tool) {
          fail('준비대의 도구를 먼저 내려놓아주세요.')
          break
        }
        if (!s.cup || s.cup.craft.location !== action.station) {
          fail('이 작업대에 컵을 먼저 내려놓아주세요.')
          break
        }
        const c = s.cup.craft
        if (s.jobs.some((j) => j.cupId === s.cup?.id)) {
          fail('장비가 작동 중이에요.')
          break
        }
        if (c.tool) {
          const name = TOOL_NAMES[c.tool]
          c.tool = null
          this.say(s, `${name}를 내려놓았어요.`)
          break
        }
        const op = operationFor(s.cup.recipe, s.cup.step, c)
        if (!op?.tool || nextStep(s)?.station !== action.station) {
          fail('여기서 사용할 도구가 없어요.')
          break
        }
        if (c.fault) {
          fail(c.fault)
          break
        }
        if ((op.kind === 'steam' || op.tool === 'pitcher') && !c.pitcherReserved) {
          if (!s.tools.clean) {
            fail('깨끗한 피처를 먼저 준비해주세요.')
            break
          }
          s.tools.clean--
          c.pitcherReserved = true
        }
        c.tool = op.tool
        this.say(s, `${TOOL_NAMES[op.tool]}를 집었어요.`)
        break
      }
      case 'use-start': {
        if (s.preparation?.tool) {
          fail('준비대의 도구를 먼저 내려놓아주세요.')
          break
        }
        if (!s.cup || s.cup.craft.location !== action.station || nextStep(s)?.station !== action.station) {
          fail('현재 단계의 작업대에 컵을 놓아주세요.')
          break
        }
        const c = s.cup.craft
        const op = operationFor(s.cup.recipe, s.cup.step, c)!
        if (c.fault) {
          fail(c.fault)
          break
        }
        if (op.kind === 'shake' && available(s, 'hojicha') < (nextStep(s)!.costs.hojicha ?? 0)) {
          fail('호지차 샷을 먼저 준비하고 보관해주세요.')
          break
        }
        if (s.jobs.some((j) => j.cupId === s.cup?.id) || busy(action.station)) {
          fail('장비가 작동 중이에요.')
          break
        }
        if (op.tool !== c.tool) {
          fail(op.tool ? `G로 ${TOOL_NAMES[op.tool]}를 먼저 집어주세요.` : '도구를 먼저 내려놓아주세요.')
          break
        }
        if (op.kind === 'machine') {
          if (!this.consume(s, op.costs)) break
          addAmounts(c.consumed, op.costs)
          this.job(s, 'craft-machine', action.station, '에스프레소 추출', nextStep(s)!.seconds, {
            cupId: s.cup.id,
            stepIndex: s.cup.step,
            machine: 'espresso',
          })
        } else if (isContinuous(op)) {
          this.input = { kind: 'drink', cupId: s.cup.id, step: s.cup.step, station: action.station, operation: op.id }
        } else this.applyCraft(s, op, 1)
        break
      }
      case 'confirm-craft': {
        if (s.preparation?.tool) {
          fail('준비대의 도구를 먼저 내려놓아주세요.')
          break
        }
        if (!s.cup || s.cup.craft.location !== action.station || nextStep(s)?.station !== action.station) break
        const c = s.cup.craft
        const op = operationFor(s.cup.recipe, s.cup.step, c)!
        if (c.fault) {
          fail(c.fault)
          break
        }
        if (s.jobs.some((j) => j.cupId === s.cup?.id)) {
          fail('장비가 작동 중이에요.')
          break
        }
        if (!readyToConfirm(op, c.progress)) {
          fail('아직 목표량에 못 미쳤어요. 조금 더 진행해주세요.')
          break
        }
        if (c.tool) {
          fail(`${TOOL_NAMES[c.tool]}를 G로 내려놓은 뒤 확인해주세요.`)
          break
        }
        if (op.kind === 'steam') {
          this.job(s, 'craft-machine', action.station, '우유 스팀', 5, {
            cupId: s.cup.id,
            stepIndex: s.cup.step,
            machine: 'steam',
          })
        } else if (op.kind === 'transfer') {
          c.shotTransferred = true
          c.progress = 0
          this.say(s, '샷을 옮겼어요.', 'success')
        } else if (op.kind === 'shake') {
          if (available(s, 'hojicha') < (nextStep(s)!.costs.hojicha ?? 0)) {
            fail('사용할 호지차 샷이 부족해요. 먼저 준비하고 다시 섞어주세요.')
            break
          }
          c.teaMixed = true
          c.progress = 0
          this.say(s, '호지차 샷을 다시 섞었어요. 같은 보틀로 계량해 부어주세요.', 'success')
        } else {
          if (op.kind === 'stir') c.mixed = true
          if (op.kind === 'lid') c.lidded = true
          if (op.tool === 'pitcher' && c.pitcherReserved) {
            c.pitcherReserved = false
            if (c.pitcherMilk > 0) {
              addAmounts(s.totals.disposed, { milk: c.pitcherMilk })
              c.consumed.milk = Math.max(0, (c.consumed.milk ?? 0) - c.pitcherMilk)
            }
            c.pitcherMilk = 0
            s.tools.dirty++
          }
          s.cup.step++
          if (isReusableCup(c.kind) && RECIPES[s.cup.recipe].steps[s.cup.step]?.label === '제공') s.cup.step++
          c.progress = 0
          this.say(s, nextStep(s) ? `${op.label} 완료.` : '음료가 완성됐어요.', 'success')
        }
        break
      }
      case 'discard-cup':
        if (!s.cup) break
        addAmounts(s.totals.disposed, s.cup.craft.consumed)
        if (s.cup.craft.pitcherReserved) s.tools.dirty++
        s.jobs = s.jobs.filter((j) => j.cupId !== s.cup?.id)
        if (isReusableCup(s.cup.craft.kind)) {
          s.reusableCups[s.cup.craft.kind].dirty++
          this.say(s, '내용물을 비우고 다회용 컵을 세척 대상으로 보냈어요.')
        } else {
          s.trash++
          s.totals.wastedCups++
          this.say(s, '일회용 컵을 폐기했어요. 이미 사용한 재료는 돌아오지 않아요.')
        }
        s.cup = null
        break
      case 'serve': {
        if (
          s.customer?.stage !== 'pickup' ||
          s.customer.visit ||
          s.customer.orderNumber !== s.orderNumber ||
          s.customer.recipe !== s.request
        ) {
          fail(
            s.customer?.stage === 'to-pickup'
              ? '손님이 픽업대로 오고 있어요. 도착하면 전달해주세요.'
              : '현재 주문의 손님이 픽업대에 도착해야 전달할 수 있어요.',
          )
          break
        }
        if (!s.ticket || !s.cup || nextStep(s)) {
          fail('아직 완성된 음료가 없어요.')
          break
        }
        if (s.cup.craft.location !== 'pickup' || s.cup.craft.tool || s.preparation?.tool) {
          fail('픽업대에 컵을 내려놓고 도구를 정리해주세요.')
          break
        }
        if (s.cup.craft.fault) {
          fail('계량이 맞지 않는 음료예요. 컵을 정리하고 다시 만들어주세요.')
          break
        }
        if (s.cup.recipe !== s.request || s.cup.craft.kind !== cupKindFor(s.request, s.customer.service)) {
          s.totals.mistakes++
          fail('손님이 요청한 메뉴 또는 매장·포장 컵과 달라요. 컵을 정리하고 POS 주문을 수정해주세요.')
          break
        }
        s.cash += RECIPES[s.cup.recipe].price
        s.totals.revenue += RECIPES[s.cup.recipe].price
        s.totals.served++
        s.ticket = null
        s.cup = null
        s.customer.visit = {
          table: s.customer.service === 'dine-in' ? tableIds[Math.floor(Math.random() * tableIds.length)] : null,
          returnCup: s.customer.service === 'dine-in' && Math.random() < CUSTOMER_HABITS.returnCup,
          dirtyTable: s.customer.service === 'dine-in' && Math.random() < CUSTOMER_HABITS.stain,
          dirtyReturn: s.customer.service === 'dine-in' && Math.random() < CUSTOMER_HABITS.stain,
          usesSugar: Math.random() < CUSTOMER_HABITS.sugar,
        }
        if (Math.random() < CUSTOMER_HABITS.stain) {
          s.dirtyBar = Math.min(3, s.dirtyBar + 1)
          if (s.cleaning?.station === 'mix') s.cleaning.progress = 0
        }
        customerToCondiment(s.customer)
        this.say(
          s,
          s.customer.service === 'takeout'
            ? '포장 손님이 음료를 받았어요. 소모품을 챙긴 뒤 나가요.'
            : '매장 손님이 음료를 받았어요. 소모품을 챙기고 테이블을 이용해요.',
          'success',
        )
        break
      }
      case 'wash':
        if (s.washing) {
          fail('세척 중인 용기를 먼저 마무리하거나 세척대에 내려놓아주세요.')
          break
        }
        if ((s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool)) || s.preparation?.tool) {
          fail('컵과 제조 도구를 바에 내려놓은 뒤 세척해주세요.')
          break
        }
        if (!washStock(s, action.item).dirty) {
          fail('씻을 용기가 없어요.')
          break
        }
        washStock(s, action.item).dirty--
        s.washing = { id: uid(), item: action.item, stage: 'scrub', progress: 0, spongeHeld: false }
        this.say(s, `${WASH_NAMES[action.item]}를 세척대에 놓았어요.`)
        break
      case 'wash-tool':
        if (s.washing?.stage !== 'scrub') break
        if ((s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool)) || s.preparation?.tool) {
          fail('컵과 제조 도구를 먼저 내려놓아주세요.')
          break
        }
        s.washing.spongeHeld = !s.washing.spongeHeld
        this.say(s, s.washing.spongeHeld ? '스펀지를 집었어요.' : '스펀지를 내려놓았어요.')
        break
      case 'wash-use': {
        const washing = s.washing
        if (!washing || !['scrub', 'rinse'].includes(washing.stage)) break
        if ((s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool)) || s.preparation?.tool) {
          fail('컵과 제조 도구를 먼저 내려놓아주세요.')
          break
        }
        if (washing.stage === 'scrub' && !washing.spongeHeld) {
          fail('G로 스펀지를 먼저 집어주세요.')
          break
        }
        this.input = { kind: 'wash', washingId: washing.id, stage: washing.stage as 'scrub' | 'rinse', station: 'wash' }
        break
      }
      case 'wash-confirm': {
        const washing = s.washing
        if (!washing || (washing.stage !== 'scrub' && washing.stage !== 'rinse')) break
        if ((s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool)) || s.preparation?.tool) {
          fail('컵과 제조 도구를 먼저 내려놓아주세요.')
          break
        }
        if (washing.spongeHeld) {
          fail('G로 스펀지를 내려놓은 뒤 확인해주세요.')
          break
        }
        if (washing.progress < WASH_STEPS[washing.stage].seconds) {
          fail('아직 세척이 덜 끝났어요. 누르고 작업을 이어가세요.')
          break
        }
        if (washing.stage === 'scrub') {
          washing.stage = 'rinse'
          washing.progress = 0
          this.say(s, '문지르기를 마쳤어요.', 'success')
        } else {
          washing.stage = 'ready'
          washing.progress = 0
          washStock(s, washing.item).washed++
          s.totals.washed++
          this.say(s, `${WASH_NAMES[washing.item]}를 깨끗하게 씻었어요.`, 'success')
        }
        break
      }
      case 'take-washed':
        if (s.washing && s.washing.stage !== 'ready') {
          fail('세척 중인 용기를 먼저 마무리해주세요.')
          break
        }
        if ((s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool)) || s.preparation?.tool) {
          fail('컵과 제조 도구를 내려놓으면 용기를 집을 수 있어요.')
          break
        }
        if (s.washing && s.washing.item !== action.item) {
          fail('세척 중인 용기를 먼저 정리해주세요.')
          break
        }
        if (!washStock(s, action.item).washed) {
          fail('씻은 용기가 없어요. 먼저 세척해주세요.')
          break
        }
        washStock(s, action.item).washed--
        s.washing = { id: uid(), item: action.item, stage: 'carrying', progress: 0, spongeHeld: false }
        this.say(s, `씻은 ${WASH_NAMES[action.item]}를 집었어요.`)
        break
      case 'leave-wash':
        if (!s.washing) break
        if (s.washing.stage === 'carrying') washStock(s, s.washing.item).washed++
        else if (s.washing.stage !== 'ready') washStock(s, s.washing.item).dirty++
        s.washing = null
        this.say(s, '용기를 세척대에 내려놓았어요. 미완료 세척은 다시 시작해야 해요.')
        break
      case 'store-washed':
        if (s.washing?.stage !== 'carrying' || action.station !== washDestination(s.washing.item)) {
          fail('씻은 피처는 도구 선반에, 다회용 컵은 컵 보관대에 가져와주세요.')
          break
        }
        washStock(s, s.washing.item).clean++
        s.washing = null
        this.say(s, '씻은 용기를 정리했어요. 이제 다시 사용할 수 있어요.', 'success')
        break
      case 'start-cleaning': {
        if (s.cleaning) {
          fail(`${STATIONS[s.cleaning.station].name}의 청소를 먼저 마치거나 작업 안내에서 취소해주세요.`)
          break
        }
        const station = action.station
        if (station === 'mix' && s.cup?.craft.location === 'mix') {
          fail('컵을 다른 작업대에 놓은 뒤 닦아주세요.')
          break
        }
        if (
          isCupSurface(station)
            ? !cupSurface(s, station).dirty && !cupCount(cupSurface(s, station).cups)
            : station === 'mix'
              ? !s.dirtyBar
              : !s.trash
        ) {
          fail('이미 깨끗하게 정리됐어요.')
          break
        }
        s.cleaning = {
          id: uid(),
          station,
          stage:
            station === 'trash'
              ? 'bag'
              : isCupSurface(station) && cupCount(cupSurface(s, station).cups)
                ? 'collect'
                : 'wipe',
          progress: 0,
          clothHeld: false,
          heldCups: emptyCupCounts(),
          trashCount: station === 'trash' ? s.trash : 0,
        }
        this.say(
          s,
          station === 'trash' ? '누르고 쓰레기를 모아 봉투를 묶으세요.' : '컵을 비운 뒤 천을 집어 직접 닦아주세요.',
        )
        break
      }
      case 'collect-cup': {
        const cleaning = s.cleaning
        if (!cleaning || !isCupSurface(cleaning.station) || cleaning.stage !== 'collect') break
        const table = cupSurface(s, cleaning.station)
        const kind = reusableCupKinds.find((kind) => table.cups[kind] > 0)
        if (!kind) break
        table.cups[kind]--
        cleaning.heldCups[kind]++
        this.say(s, `사용한 컵 ${cupCount(cleaning.heldCups)}개를 들고 있어요. 세척대로 가져가세요.`)
        break
      }
      case 'drop-used-cups': {
        const cleaning = s.cleaning
        if (!cleaning || !cupCount(cleaning.heldCups) || !isCupSurface(cleaning.station)) break
        for (const kind of reusableCupKinds) s.reusableCups[kind].dirty += cleaning.heldCups[kind]
        cleaning.heldCups = emptyCupCounts()
        const surface = cupSurface(s, cleaning.station)
        if (!cupCount(surface.cups) && !surface.dirty) {
          s.cleaning = null
          s.totals.cleaned++
          this.say(s, `${STATIONS[cleaning.station].name}의 컵을 모두 정리했어요.`, 'success')
          break
        }
        if (!cupCount(surface.cups)) cleaning.stage = 'wipe'
        this.say(
          s,
          `${STATIONS[cleaning.station].name}로 돌아가 ${cleaning.stage === 'wipe' ? '닦아주세요.' : '남은 컵을 회수해주세요.'}`,
          'success',
        )
        break
      }
      case 'clean-tool':
        if (s.cleaning?.stage !== 'wipe' || cupCount(s.cleaning.heldCups)) break
        s.cleaning.clothHeld = !s.cleaning.clothHeld
        this.say(s, s.cleaning.clothHeld ? '청소용 천을 집었어요.' : '청소용 천을 내려놓았어요.')
        break
      case 'clean-use': {
        const cleaning = s.cleaning
        if (!cleaning || cleaning.stage === 'collect') break
        if (cleaning.stage === 'wipe' && !cleaning.clothHeld) {
          fail('G로 청소용 천을 먼저 집어주세요.')
          break
        }
        this.input = { kind: 'clean', cleaningId: cleaning.id, station: cleaning.station }
        break
      }
      case 'clean-confirm': {
        const cleaning = s.cleaning
        if (!cleaning || cleaning.stage === 'collect') break
        if (cleaning.clothHeld) {
          fail('G로 청소용 천을 내려놓은 뒤 확인해주세요.')
          break
        }
        if (cleaning.progress < CLEANING_SECONDS[cleaning.stage]) {
          fail('아직 정리가 끝나지 않았어요. 누르고 작업을 이어가세요.')
          break
        }
        if (isCupSurface(cleaning.station)) {
          const surface = cupSurface(s, cleaning.station)
          surface.dirty = false
          if (cupCount(surface.cups) > 0) {
            cleaning.stage = 'collect'
            cleaning.progress = 0
            this.say(s, '닦기는 끝났어요. 새로 남은 컵도 회수해주세요.', 'success')
            break
          }
        } else if (cleaning.station === 'mix') s.dirtyBar = 0
        else s.trash = Math.max(0, s.trash - cleaning.trashCount)
        s.totals.cleaned++
        s.cleaning = null
        this.say(
          s,
          cleaning.station === 'trash' ? '봉투를 비우고 분리수거함을 정리했어요.' : '깨끗하게 닦았어요.',
          'success',
        )
        break
      }
      case 'leave-cleaning':
        if (cleaningHandsBusy(s.cleaning)) {
          fail('회수한 컵을 비우고 청소용 천을 내려놓은 뒤 취소해주세요.')
          break
        }
        s.cleaning = null
        this.say(s, '청소를 취소했어요. 다시 시작하면 처음부터 닦아요.')
        break
      case 'cups': {
        const stock = s.disposableCups[action.kind]
        const amount = Math.min(6, stock.reserve, Math.max(0, 12 - stock.bar))
        if (!amount) {
          fail('보충할 컵이 없거나 보관대가 가득 찼어요.')
          break
        }
        stock.reserve -= amount
        stock.bar += amount
        s.totals.restocked++
        this.say(s, `${CUP_NAMES[action.kind]} ${amount}개를 보충했어요.`, 'success')
        break
      }
      case 'take-supply': {
        if (
          (s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool)) ||
          s.preparation?.tool ||
          washingHandsBusy(s.washing)
        ) {
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
        this.say(
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
        s.totals.restocked++
        this.say(
          s,
          `${SUPPLIES[delivery.supply].name} ${amount}${SUPPLIES[delivery.supply].unit} 보충 완료.`,
          'success',
        )
        break
      }
      case 'return-supply':
        if (!s.supplyDelivery) break
        s.supplies[s.supplyDelivery.supply].stock += s.supplyDelivery.amount
        s.supplyDelivery = null
        this.say(s, '소모품을 창고에 다시 내려놓았어요.')
        break
      case 'buy-supply':
        if (s.cash < SUPPLY_PRICE) {
          fail('소모품 입고비가 부족해요.')
          break
        }
        s.cash -= SUPPLY_PRICE
        s.supplies[action.supply].stock += SUPPLY_PACK
        s.totals.supplyPurchases[action.supply] = (s.totals.supplyPurchases[action.supply] ?? 0) + SUPPLY_PRICE
        this.say(
          s,
          `${SUPPLIES[action.supply].name} ${SUPPLY_PACK}${SUPPLIES[action.supply].unit} 입고 완료.`,
          'success',
        )
        break
      case 'buy-cups':
        if (s.cash < 2000) {
          fail('컵 입고비가 부족해요.')
          break
        }
        if (s.disposableCups[action.kind].reserve >= 48) {
          fail('후방에 충분한 컵이 있어요.')
          break
        }
        s.cash -= 2000
        s.totals.cupPurchases += 2000
        s.disposableCups[action.kind].reserve += 24
        this.say(s, `${CUP_NAMES[action.kind]} 24개를 입고했어요.`, 'success')
        break
      case 'open-batch': {
        const batch = s.batches.find((b) => b.id === action.id)
        if (batch?.location !== 'stock' || batch.openedAt !== null) break
        batch.openedAt = s.time
        batch.expiresAt = expiryAt(s.time, INGREDIENTS[batch.ingredient].lifetime)
        batch.labelled = false
        this.say(s, `${INGREDIENTS[batch.ingredient].name} 개봉 완료. 라벨을 붙이고 보관 위치를 선택해주세요.`)
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
        this.say(
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
        if ((s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool)) || s.preparation?.tool) {
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
        this.say(
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
        this.say(s, '배합 용기를 원래 자리에 내려놓았어요. 잔량·라벨·기한은 그대로예요.')
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
        s.totals.restocked++
        if (s.preparation?.batchId === batch.id) s.preparation = null
        if (s.coldBrew?.batchId === batch.id) s.coldBrew = null
        this.say(
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
        this.say(s, '선택한 배치를 폐기했어요.')
        break
      }
      case 'buy': {
        const ingredient = INGREDIENTS[action.ingredient]
        if (ingredient.prepared) {
          fail('준비대에서 제조하는 재료예요.')
          break
        }
        if (
          s.batches.filter((b) => b.location === 'stock' && b.ingredient === action.ingredient && b.amount > 0)
            .length >= 3
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
        this.say(s, '원팩을 입고했어요. 사용할 때 개봉해주세요.', 'success')
        break
      }
      case 'start-preparation': {
        if (busy('prep') || s.preparation) {
          fail('준비대를 사용 중이에요.')
          break
        }
        if (s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool)) {
          fail('음료 컵과 도구를 제조 바에 내려놓은 뒤 준비해주세요.')
          break
        }
        if (!s.tools.clean) {
          fail('깨끗한 피처를 먼저 준비해주세요.')
          break
        }
        s.tools.clean--
        s.preparation = createPreparation(action.recipe)
        this.say(s, `${PREPARATIONS[action.recipe].name} 준비를 시작했어요.`)
        break
      }
      case 'prep-tool': {
        const prep = s.preparation
        if (prep?.stage !== 'measuring') break
        if (prep.tool) {
          prep.tool = null
          this.say(s, '준비 도구를 내려놓았어요.')
          break
        }
        if (prep.fault || (s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool))) {
          fail(prep.fault ?? '음료 컵과 도구를 먼저 내려놓아주세요.')
          break
        }
        prep.tool = preparationStep(prep).tool
        if (prep.tool) this.say(s, `${PREP_TOOL_NAMES[prep.tool]}를 집었어요.`)
        break
      }
      case 'prep-use': {
        const prep = s.preparation
        if (prep?.stage !== 'measuring' || prep.fault) break
        const step = preparationStep(prep)
        if (s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool)) {
          fail('음료 컵과 도구를 먼저 내려놓아주세요.')
          break
        }
        if (prep.tool !== step.tool) {
          fail('G로 현재 단계의 도구를 먼저 집어주세요.')
          break
        }
        if (step.kind === 'machine') {
          prep.stage = 'processing'
          this.job(
            s,
            prep.recipe,
            'prep',
            `${PREPARATIONS[prep.recipe].name} 블렌딩`,
            PREPARATIONS[prep.recipe].seconds,
            { preparationId: prep.id },
          )
        } else if (continuousPreparation(step)) {
          this.input = { kind: 'prep', preparationId: prep.id, step: prep.step, station: 'prep' }
        } else this.applyPreparation(s, step, 1)
        break
      }
      case 'prep-confirm': {
        const prep = s.preparation
        if (prep?.stage !== 'measuring' || prep.fault) break
        const step = preparationStep(prep)
        if (prep.tool) {
          fail('G로 도구를 놓은 뒤 확인해주세요.')
          break
        }
        if (step.kind === 'machine' || prep.progress + 0.0001 < step.target * (1 - step.tolerance)) {
          fail('아직 목표량에 못 미쳤어요. 계량을 이어가세요.')
          break
        }
        if (prep.step === PREPARATIONS[prep.recipe].steps.length - 1) this.finishPreparation(s, s.time)
        else {
          prep.step++
          prep.progress = 0
          this.say(s, `계량을 확인했어요.`, 'success')
        }
        break
      }
      case 'discard-preparation': {
        const prep = s.preparation
        if (!prep) break
        if (prep.toolReserved) s.tools.dirty++
        if (prep.batchId) {
          const batch = s.batches.find((b) => b.id === prep.batchId)
          if (batch) {
            addAmounts(s.totals.disposed, { [batch.ingredient]: batch.amount })
            batch.amount = 0
          }
        } else addAmounts(s.totals.disposed, prep.amounts)
        s.jobs = s.jobs.filter((job) => job.preparationId !== prep.id)
        s.preparation = null
        s.trash++
        this.say(s, '준비 중인 배합을 폐기했어요. 사용한 재료는 돌아오지 않고 피처는 세척해야 해요.')
        break
      }
      case 'start-cold-brew':
        if (s.coldBrew) {
          fail('진행 중인 콜드 브루를 먼저 마무리해주세요.')
          break
        }
        if ((s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool)) || s.preparation?.tool) {
          fail('컵과 도구를 먼저 내려놓아주세요.')
          break
        }
        if (s.cash < COLD_BREW_COST) {
          fail('추출용 원두 입고비가 부족해요.')
          break
        }
        s.cash -= COLD_BREW_COST
        s.totals.coldBrewPurchases += COLD_BREW_COST
        s.coldBrew = createColdBrew()
        this.say(s, '한 배치분의 콜드 브루 원두를 준비했어요. 원두와 물을 직접 계량해주세요.')
        break
      case 'cold-tool': {
        const brew = s.coldBrew
        if (brew?.stage !== 'measuring') break
        if (brew.tool) brew.tool = null
        else if (
          !brew.fault &&
          !(s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool)) &&
          !s.preparation?.tool
        )
          brew.tool = coldBrewStep(brew).tool
        else {
          fail('컵과 다른 도구를 먼저 내려놓거나 실패한 배합을 폐기해주세요.')
          break
        }
        this.say(s, brew.tool ? '콜드 브루 계량 도구를 집었어요.' : '콜드 브루 계량 도구를 내려놓았어요.')
        break
      }
      case 'cold-use': {
        const brew = s.coldBrew
        if (brew?.stage !== 'measuring' || brew.fault) break
        if (s.preparation?.tool || (s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool))) {
          fail('컵과 다른 도구를 먼저 내려놓아주세요.')
          break
        }
        const step = coldBrewStep(brew)
        if (brew.tool !== step.tool) {
          fail('G로 필요한 도구를 집거나 내려놓아주세요.')
          break
        }
        if (brew.step === 2) {
          brew.stage = 'extracting'
          this.job(s, 'cold-brew', 'cold-prep', '콜드 브루 추출', COLD_BREW_HOURS * 3600, { preparationId: brew.id })
        } else this.input = { kind: 'cold', preparationId: brew.id, step: brew.step, station: 'cold-prep' }
        break
      }
      case 'cold-confirm': {
        const brew = s.coldBrew
        if (brew?.stage !== 'measuring' || brew.fault || brew.step === 2) break
        const step = coldBrewStep(brew)
        if (brew.tool) {
          fail('G로 계량 도구를 내려놓은 뒤 확인해주세요.')
          break
        }
        if (brew.progress + 0.0001 < step.target * (1 - step.tolerance)) {
          fail('아직 목표량에 못 미쳤어요. 계량을 이어가세요.')
          break
        }
        brew.step++
        brew.progress = 0
        this.say(s, '콜드 브루 계량을 확인했어요.', 'success')
        break
      }
      case 'collect-cold-brew': {
        const brew = s.coldBrew
        if (brew?.stage !== 'finished' || brew.completedAt === null) break
        if (s.preparation?.tool || (s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool))) {
          fail('컵과 도구를 먼저 내려놓아주세요.')
          break
        }
        const batch = newBatch('coldBrew', INGREDIENTS.coldBrew.pack, brew.completedAt, 'cold-prep')
        s.batches.push(batch)
        brew.batchId = batch.id
        brew.stage = 'ready'
        this.say(s, '추출액을 용기에 회수했어요. 추출 완료 시각을 확인해 라벨을 붙여주세요.', 'success')
        break
      }
      case 'discard-cold-brew': {
        const brew = s.coldBrew
        if (!brew) break
        if (brew.batchId) {
          const batch = s.batches.find((item) => item.id === brew.batchId)
          if (batch) {
            addAmounts(s.totals.disposed, { coldBrew: batch.amount })
            batch.amount = 0
          }
        } else if (brew.stage === 'finished') addAmounts(s.totals.disposed, { coldBrew: INGREDIENTS.coldBrew.pack })
        else s.totals.coldBrewDiscardedBeans += COLD_BREW_BEANS
        s.jobs = s.jobs.filter((job) => job.preparationId !== brew.id)
        s.coldBrew = null
        s.trash++
        this.say(s, '콜드 브루 준비를 정리했어요. 한 배치분의 준비비는 반환되지 않아요.')
        break
      }
      case 'close':
        s.phase = 'closing'
        if (s.customer && !s.customer.visit && !s.ticket) customerLeave(s.customer)
        this.say(s, '신규 주문을 마감했어요. 남은 주문과 정리 업무를 마쳐주세요.')
        break
      case 'finish': {
        const tasks = closingTasks(s)
        if (s.phase !== 'closing') {
          fail('POS에서 신규 주문을 먼저 마감해주세요.')
          break
        }
        if (tasks.length) {
          fail(`남은 업무: ${tasks.join(', ')}`)
          break
        }
        s.phase = 'summary'
        this.say(s, '오늘의 근무를 마쳤어요. 수고하셨습니다.', 'success')
        break
      }
      case 'next-day': {
        const next = Date.UTC(2026, 8, 1 + s.day, 9) / 1000
        s.day++
        s.time = Math.max(next, s.time + 3600)
        s.phase = 'open'
        s.customer = createCustomer(s.orderNumber, s.request)
        s.totals = emptyTotals(s.cash)
        s.position = staffStartPosition()
        s.batches = s.batches.filter((b) => b.amount > 0)
        this.completeJobs(s)
        this.say(s, '새 근무일이에요. 냉장고의 라벨과 준비된 재료를 확인해주세요.', 'success')
        break
      }
    }
    s.batches = s.batches.filter((b) => b.amount > 0 || b.location === 'stock')
    this.state = s
    this.emit()
  }
  private customerSurface(s: GameState, station: CupSurfaceId, cup: ReusableCupKind | null, dirty: boolean) {
    const surface = cupSurface(s, station)
    if (cup) surface.cups[cup]++
    if (dirty) {
      surface.dirty = true
      if (s.cleaning?.station === station) s.cleaning.progress = 0
    }
  }
  private advanceCustomer(s: GameState, seconds: number) {
    const customer = s.customer
    if (!customer) return
    if (customerWalking(customer)) {
      if (!moveCustomer(customer, seconds)) return
      switch (customer.stage) {
        case 'entering':
          customerWait(customer, 'ordering')
          customer.yaw = Math.PI
          this.say(s, '손님이 POS에 도착했어요. 주문을 받아주세요.')
          break
        case 'to-pickup':
          customerWait(customer, 'pickup')
          customer.yaw = Math.PI
          this.say(s, '손님이 픽업대에서 기다리고 있어요.')
          break
        case 'to-condiment':
          customerWait(customer, 'condiment')
          break
        case 'to-table':
          customerWait(customer, 'drinking')
          customer.yaw = 0
          break
        case 'to-return':
          customerWait(customer, 'returning')
          break
        case 'leaving':
          if (customer.visit) {
            s.orderNumber++
            s.request = orderSequence[(s.orderNumber - 1) % orderSequence.length]
          }
          s.customer = s.phase === 'open' ? createCustomer(s.orderNumber, s.request) : null
          this.say(s, s.customer ? '다음 손님이 들어오고 있어요.' : '마지막 손님이 나갔어요. 남은 정리를 마쳐주세요.')
          break
      }
      return
    }
    if (!customer.visit) return
    customer.elapsed += seconds
    if (customer.stage === 'condiment' && customer.elapsed >= CUSTOMER_SECONDS.condiment) {
      const supplies: SupplyId[] = ['napkins']
      if (RECIPES[customer.recipe].variant === 'ICED') supplies.push('straws')
      if (customer.visit.usesSugar) supplies.push('sugar')
      const missing: string[] = []
      for (const id of supplies) {
        if (s.supplies[id].bar > 0) {
          s.supplies[id].bar--
          s.totals.suppliesUsed[id] = (s.totals.suppliesUsed[id] ?? 0) + 1
        } else missing.push(SUPPLIES[id].name)
      }
      if (missing.length) this.say(s, `컨디먼트 바에 ${missing.join('·')} 보충이 필요해요. 손님은 이용을 계속해요.`)
      if (customer.service === 'takeout') customerLeave(customer)
      else customerToTable(customer)
    } else if (customer.stage === 'drinking' && customer.visit.table && customer.elapsed >= CUSTOMER_SECONDS.drinking) {
      this.customerSurface(
        s,
        customer.visit.table,
        customer.visit.returnCup ? null : reusableCupFor(customer.recipe),
        customer.visit.dirtyTable,
      )
      if (customer.visit.returnCup) customerToReturn(customer)
      else {
        this.say(s, `손님이 ${STATIONS[customer.visit.table].name}에 컵을 남겼어요.`)
        customerLeave(customer)
      }
    } else if (customer.stage === 'returning' && customer.elapsed >= CUSTOMER_SECONDS.returning) {
      this.customerSurface(s, 'condiment', reusableCupFor(customer.recipe), customer.visit.dirtyReturn)
      this.say(s, '손님이 컨디먼트 바에 컵을 반납했어요.')
      customerLeave(customer)
    }
  }
  private completeJobs(s: GameState) {
    const finished = s.jobs.filter((job) => job.endsAt <= s.time)
    s.jobs = s.jobs.filter((job) => job.endsAt > s.time)
    for (const job of finished) {
      if (job.kind === 'cold-brew') {
        const brew = s.coldBrew
        if (brew && brew.id === job.preparationId && brew.stage === 'extracting') {
          brew.stage = 'finished'
          brew.completedAt = job.endsAt
          s.totals.prepared++
          this.say(
            s,
            '콜드 브루 추출이 끝났어요. 추출대에서 용기에 회수한 뒤 라벨을 붙이고 냉장 보관해주세요.',
            'success',
          )
        }
        continue
      }
      if (job.preparationId) {
        if (s.preparation?.id === job.preparationId && s.preparation.stage === 'processing')
          this.finishPreparation(s, job.endsAt)
        continue
      }
      if (job.kind === 'craft-machine' && s.cup?.id === job.cupId && s.cup && s.cup.step === job.stepIndex) {
        const c = s.cup.craft
        const op = operationFor(s.cup.recipe, s.cup.step, c)
        if (job.machine === 'steam') c.steamed = true
        else if (s.cup.recipe === 'glazed-iced') c.shotReady = true
        else if (op) c.contents.coffee += op.weight
        s.cup.step++
        c.progress = 0
        this.say(s, `${job.label} 완료.`, 'success')
      }
    }
  }
  private expirePreparation(s: GameState, at: number) {
    const prep = s.preparation
    if (!prep || prep.fault) return false
    const ingredientExpiry = prep.ingredientExpiresAt
    if (prep.stage === 'ready' || ingredientExpiry === null || ingredientExpiry > at) return false
    prep.fault = '투입한 원재료의 기한이 지났어요. 이 배합을 폐기하고 다시 준비해주세요.'
    prep.tool = null
    s.jobs = s.jobs.filter((job) => job.preparationId !== prep.id)
    if (this.input?.kind === 'prep') this.input = null
    this.say(s, prep.fault, 'error')
    return true
  }
  private finishPreparation(s: GameState, completedAt: number) {
    const prep = s.preparation
    if (!prep || prep.stage === 'ready' || prep.fault || this.expirePreparation(s, completedAt)) return
    const batch = newBatch(prep.recipe, INGREDIENTS[prep.recipe].pack, completedAt, 'prep')
    if (prep.ingredientExpiresAt != null) batch.expiresAt = Math.min(batch.expiresAt!, prep.ingredientExpiresAt)
    s.batches.push(batch)
    prep.stage = 'ready'
    prep.batchId = batch.id
    prep.tool = null
    if (prep.toolReserved) s.tools.dirty++
    prep.toolReserved = false
    s.totals.prepared++
    const expired = batch.expiresAt! <= s.time
    this.say(
      s,
      expired
        ? `${PREPARATIONS[prep.recipe].name} 제조는 끝났지만 기한이 지났어요. 이 배합을 폐기해주세요.`
        : `${PREPARATIONS[prep.recipe].name} 제조 완료. 라벨을 붙이고 보관해야 사용할 수 있어요.`,
      expired ? 'error' : 'success',
    )
  }
  private applyPreparation(s: GameState, step: PrepStep, delta: number) {
    const prep = s.preparation
    if (prep?.stage !== 'measuring' || prep.fault) {
      this.input = null
      return
    }
    if (step.kind === 'stir' || step.kind === 'shake') delta = Math.min(delta, Math.max(0, step.target - prep.progress))
    if (delta <= 0) {
      this.input = null
      return
    }
    const amount = delta * (step.perUnit ?? 1)
    if (step.ingredient) {
      const consumed = this.consume(s, { [step.ingredient]: amount })
      if (!consumed) {
        this.input = null
        return
      }
      if (consumed.earliestExpiry !== null)
        prep.ingredientExpiresAt = Math.min(
          prep.ingredientExpiresAt ?? consumed.earliestExpiry,
          consumed.earliestExpiry,
        )
    }
    prep.progress += delta
    if (step.ingredient && step.ingredient in prep.amounts)
      prep.amounts[step.ingredient as keyof typeof prep.amounts] += amount
    else if (step.tool === 'water-jug' || step.tool === 'cold-water-jug') prep.amounts.water += delta
    if (!['stir', 'shake'].includes(step.kind) && prep.progress > step.target * (1 + step.tolerance) + 0.0001) {
      prep.fault = `${step.label} 계량을 초과했어요. 배합을 폐기하고 다시 준비해주세요.`
      s.totals.mistakes++
      this.input = null
      this.say(s, prep.fault, 'error')
    }
  }
  private applyColdBrew(s: GameState, seconds: number) {
    const brew = s.coldBrew
    if (brew?.stage !== 'measuring' || brew.fault || brew.step === 2) {
      this.input = null
      return
    }
    const step = coldBrewStep(brew)
    const delta =
      brew.step === 0 ? Math.min(seconds * step.rate, Math.max(0, step.target - brew.progress)) : seconds * step.rate
    brew.progress += delta
    if (brew.step === 0) {
      brew.beans += delta
      if (brew.progress >= step.target) this.input = null
    } else brew.water += delta
    if (brew.progress > step.target * (1 + step.tolerance) + 0.0001) {
      brew.fault = '콜드 브루 물 계량을 초과했어요. 배합을 폐기하고 다시 준비해주세요.'
      this.input = null
      s.totals.mistakes++
      this.say(s, brew.fault, 'error')
    }
  }
  private applyCraft(s: GameState, op: CraftOperation, delta: number) {
    if (!s.cup) return
    const c = s.cup.craft
    if (c.fault) {
      this.input = null
      return
    }
    if (!isMetered(op)) delta = Math.min(delta, Math.max(0, op.target - c.progress))
    if (op.tool === 'pitcher') delta = Math.min(delta, c.pitcherMilk / 200)
    if (delta <= 0) {
      this.input = null
      return
    }
    const costs: Costs = {}
    for (const [key, amount] of Object.entries(op.costs)) costs[key as IngredientId] = (amount * delta) / op.target
    if (!this.consume(s, costs)) {
      this.input = null
      return
    }
    addAmounts(c.consumed, costs)
    c.progress += delta
    if (op.kind === 'steam') c.pitcherMilk += ((op.costs.milk ?? 200) * delta) / op.target
    if (op.tool === 'pitcher') c.pitcherMilk = Math.max(0, c.pitcherMilk - 200 * delta)
    if (op.content) c.contents[op.content] += (op.weight * delta) / op.target
    if (op.kind === 'lid') {
      c.lidded = true
      c.tool = null
    }
    if (isMetered(op) && c.progress > op.target * (1 + op.tolerance) + 0.0001) {
      c.fault = `${op.label} 계량을 초과했어요. 이 컵은 다시 만들어주세요.`
      s.totals.mistakes++
      s.dirtyBar = Math.min(3, s.dirtyBar + 1)
      if (s.cleaning?.station === 'mix') s.cleaning.progress = 0
      this.input = null
      this.say(s, c.fault, 'error')
    }
  }
  tick(seconds: number) {
    if (this.state.phase === 'summary') return
    const s = structuredClone(this.state)
    const dt = Math.max(0, Math.min(seconds, 2))
    s.time += dt
    // Complete scheduled work at its own timestamp before checking expiry at the current time.
    this.completeJobs(s)
    this.expirePreparation(s, s.time)
    if (this.input?.kind === 'clean') {
      const cleaning = s.cleaning
      if (!cleaning || cleaning.id !== this.input.cleaningId || cleaning.stage === 'collect') this.input = null
      else {
        const duration = CLEANING_SECONDS[cleaning.stage]
        cleaning.progress = Math.min(duration, cleaning.progress + Math.min(dt, 0.15))
        if (cleaning.progress >= duration) this.input = null
      }
    } else if (this.input?.kind === 'wash') {
      const washing = s.washing
      if (!washing || washing.id !== this.input.washingId || washing.stage !== this.input.stage) this.input = null
      else {
        const seconds = WASH_STEPS[this.input.stage].seconds
        washing.progress = Math.min(seconds, washing.progress + Math.min(dt, 0.15))
        if (washing.progress >= seconds) this.input = null
      }
    } else if (this.input?.kind === 'prep') {
      const prep = s.preparation
      if (!prep || prep.id !== this.input.preparationId || prep.step !== this.input.step || prep.stage !== 'measuring')
        this.input = null
      else this.applyPreparation(s, preparationStep(prep), Math.min(dt, 0.15) * preparationStep(prep).rate)
    } else if (this.input?.kind === 'cold') {
      if (s.coldBrew?.id !== this.input.preparationId || s.coldBrew.step !== this.input.step) this.input = null
      else this.applyColdBrew(s, Math.min(dt, 0.15))
    } else if (this.input?.kind === 'drink') {
      const c = s.cup
      const op = c ? operationFor(c.recipe, c.step, c.craft) : null
      if (
        !c ||
        c.id !== this.input.cupId ||
        c.step !== this.input.step ||
        c.craft.location !== this.input.station ||
        op?.id !== this.input.operation
      )
        this.input = null
      else this.applyCraft(s, op, Math.min(dt, 0.15) * op.rate)
    }
    this.advanceCustomer(s, dt)
    this.state = s
    this.emit()
  }
}
