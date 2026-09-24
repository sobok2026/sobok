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
import { WASH_STEPS, washingHandsBusy } from './washing'

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
    expiresAt: location !== 'stock' ? now + INGREDIENTS[ingredient].lifetime : null,
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
    cups: 4,
    reserveCups: 24,
    tables: { table: { cups: 0, dirty: false }, 'table-left': { cups: 0, dirty: false } },
    condiment: { cups: 0, dirty: false },
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
  return state.cup ? RECIPES[state.cup.recipe].steps[state.cup.step] : undefined
}
function plannedStation(state: GameState): StationId {
  if (state.supplyDelivery) return 'condiment'
  if (cleaningHandsBusy(state.cleaning)) return state.cleaning!.heldCups ? 'trash' : state.cleaning!.station
  if (state.washing) return state.washing.stage === 'carrying' ? 'rack' : 'wash'
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
  const step = nextStep(state)
  if (step) {
    const craft = state.cup!.craft
    const op = operationFor(state.cup!.recipe, state.cup!.step, craft)!
    if (craft.fault) return craft.location === 'hand' ? 'trash' : craft.location
    if (craft.location !== 'hand' && craft.location !== step.station) return craft.location
    if ((step.usesPitcher || op.tool === 'pitcher') && !craft.pitcherReserved && !state.tools.clean)
      return toolStation()
    for (const [key, fullAmount] of Object.entries(step.costs)) {
      const amount = fullAmount * Math.max(0, 1 - craft.progress / op.target)
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
      if (pending) return pending.location === 'prep' ? 'prep' : 'stock'
      if (key === 'foam' || key === 'mocha') return state.tools.clean ? 'prep' : toolStation()
      return 'stock'
    }
    return step.station
  }
  if (state.cup)
    return state.cup.craft.location !== 'hand' && state.cup.craft.location !== 'pickup'
      ? state.cup.craft.location
      : 'pickup'
  if (state.ticket) return state.cups ? 'cups' : 'stock'
  if (state.phase === 'closing') {
    if (state.tools.dirty) return 'wash'
    if (state.tools.washed) return 'wash'
    const dirtyTable = tableIds.find((id) => state.tables[id].dirty || state.tables[id].cups)
    if (dirtyTable) return dirtyTable
    if (state.condiment.cups || state.condiment.dirty) return 'condiment'
    if (state.dirtyBar) return 'mix'
    if (state.trash) return 'trash'
    if (state.batches.some((b) => b.amount > 0 && b.expiresAt !== null && b.expiresAt <= state.time)) return 'stock'
    if (state.batches.some((b) => b.amount > 0 && b.openedAt !== null && b.location !== 'bar')) return 'stock'
    if (state.customer) return 'pos'
  }
  if (state.phase === 'open' && supplyIds.some((id) => !state.supplies[id].bar)) return 'stock'
  if (state.customer?.visit || state.customer?.stage === 'leaving') {
    if (state.tools.dirty || state.tools.washed) return 'wash'
    const dirtyTable = tableIds.find((id) => state.tables[id].dirty || state.tables[id].cups)
    if (dirtyTable) return dirtyTable
    if (state.condiment.cups || state.condiment.dirty) return 'condiment'
    if (state.dirtyBar) return 'mix'
    if (state.trash) return 'trash'
    return 'stock'
  }
  return 'pos'
}
export function suggestedStation(state: GameState): StationId {
  const destination = plannedStation(state)
  if (state.cup?.craft.location === 'hand' && ['prep', 'wash', 'rack'].includes(destination))
    return nextStep(state)?.station ?? 'pickup'
  return destination
}
export function suggestedInstruction(state: GameState): string | null {
  const destination = plannedStation(state)
  if (state.supplyDelivery)
    return `${SUPPLIES[state.supplyDelivery.supply].name} 보충품을 컨디먼트 바에 가져가 E로 채우세요.`
  if (
    state.cleaning &&
    (destination === state.cleaning.station || (state.cleaning.heldCups && destination === 'trash'))
  ) {
    const cleaning = state.cleaning
    if (cleaning.heldCups) return '회수한 컵을 분리수거함에 가져가 E로 넣으세요.'
    if (cleaning.stage === 'collect')
      return `E로 ${STATIONS[cleaning.station].name}의 컵을 집어 분리수거함으로 옮기세요.`
    if (cleaning.stage === 'bag') return '누르고 쓰레기를 모은 뒤 F로 봉투를 비우세요.'
    return cleaning.clothHeld
      ? '누르고 닦은 뒤 천을 놓고 F로 확인하세요.'
      : 'G로 청소용 천을 집고 누르는 동안 닦으세요.'
  }
  if (state.cup?.craft.location === 'hand' && ['prep', 'wash', 'rack'].includes(destination))
    return `먼저 E로 컵을 내려놓으세요. ${destination === 'prep' ? '부재료 준비' : '피처 세척·정리'}에는 빈손이 필요해요.`
  if (state.washing) {
    if (state.washing.stage === 'carrying') return '씻은 피처를 들고 선반으로 가서 E로 놓으세요.'
    if (state.washing.stage === 'ready') return 'E로 씻은 피처를 집어 선반으로 가져가세요.'
    if (state.washing.stage === 'scrub') {
      if (!state.washing.spongeHeld) return '스펀지를 집어 피처를 문질러주세요.'
      return state.washing.progress >= WASH_STEPS.scrub.seconds
        ? '스펀지를 놓고 헹구기로 넘어가세요.'
        : '스펀지로 피처를 문질러주세요.'
    }
    return state.washing.progress >= WASH_STEPS.rinse.seconds
      ? '세척을 마치고 피처를 선반에 정리하세요.'
      : '피처를 물로 헹궈주세요.'
  }
  if (destination === 'wash' && state.tools.washed) return '씻은 피처를 집어 선반에 정리하면 다시 쓸 수 있어요.'
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
    state.washing ? '세척 중인 피처·들고 있는 피처 정리' : '',
    state.cleaning ? '진행 중인 청소·회수한 컵 정리' : '',
    state.supplyDelivery ? '들고 있는 소모품 정리' : '',
    state.batches.some((b) => b.amount > 0 && b.openedAt !== null && b.location !== 'bar')
      ? '개봉·제조한 재료 라벨·보관'
      : '',
    state.tools.dirty ? '도구 세척' : '',
    state.tools.washed ? '도구 선반 정리' : '',
    dirtyTableCount(state.tables) ? '고객 테이블 청소' : '',
    state.condiment.cups || state.condiment.dirty ? '컨디먼트 바 반납 컵·청소' : '',
    state.dirtyBar ? '작업대 청소' : '',
    state.trash ? '쓰레기 비우기' : '',
    state.batches.some((b) => b.amount > 0 && b.expiresAt !== null && b.expiresAt <= state.time)
      ? '기한 지난 재료 폐기'
      : '',
    state.jobs.some((j) => j.kind !== 'cold-brew') ? '진행 중인 작업 마무리' : '',
  ].filter(Boolean)
}
export type Action =
  | { type: 'ticket'; recipe: RecipeId }
  | { type: 'start-preparation'; recipe: PreparationId }
  | { type: 'prep-tool' | 'prep-use' | 'prep-confirm' | 'discard-preparation' }
  | { type: 'wash-tool' | 'wash-use' | 'wash-confirm' | 'take-washed' | 'leave-wash' }
  | { type: 'start-cleaning'; station: CleaningStation }
  | { type: 'take-supply' | 'buy-supply'; supply: SupplyId }
  | { type: 'place-supply' | 'return-supply' }
  | { type: 'collect-cup' | 'drop-used-cups' | 'clean-tool' | 'clean-use' | 'clean-confirm' | 'leave-cleaning' }
  | { type: 'label-batch'; id: string }
  | { type: 'store-batch'; id: string; storage: 'room' | 'fridge' }
  | { type: 'place-cup' | 'pick-cup' | 'tool' | 'use-start' | 'confirm-craft'; station: StationId }
  | { type: 'open-batch'; id: string }
  | { type: 'discard-batch'; id: string }
  | { type: 'buy'; ingredient: IngredientId }
  | {
      type:
        | 'take-cup'
        | 'discard-cup'
        | 'serve'
        | 'wash'
        | 'rack'
        | 'cups'
        | 'buy-cups'
        | 'cold-brew'
        | 'close'
        | 'finish'
        | 'next-day'
    }

export class CafeStore {
  private state: GameState
  private listeners = new Set<() => void>()
  private input:
    | { kind: 'drink'; cupId: string; step: number; station: StationId; operation: string }
    | { kind: 'prep'; preparationId: string; step: number; station: 'prep' }
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
  private consume(state: GameState, costs: Costs): boolean {
    for (const [key, amount] of Object.entries(costs)) {
      const ingredient = key as IngredientId
      if (available(state, ingredient) + 0.0001 < amount) {
        this.say(state, `${INGREDIENTS[ingredient].name}가 부족해요. 준비대 또는 창고에서 보충해주세요.`, 'error')
        return false
      }
    }
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
        batch.amount -= used
        remaining -= used
        if (remaining <= 0) break
      }
    }
    return true
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
        s.cleaning!.heldCups
          ? '회수한 컵을 분리수거함에 먼저 넣어주세요.'
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
      ].includes(action.type)
    ) {
      fail(
        s.washing?.stage === 'carrying'
          ? '들고 있는 피처를 선반에 먼저 놓아주세요.'
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
        s.ticket = action.recipe
        if (s.customer.stage === 'ordering') customerToPickup(s.customer)
        this.say(s, `${recipeLabel(action.recipe)} 주문을 접수했어요.`, 'success')
        break
      case 'take-cup':
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
        if (!s.cups) {
          fail('컵이 없어요. 창고에서 보충해주세요.')
          break
        }
        s.cups--
        s.cup = { id: uid(), recipe: s.ticket, step: 0, craft: createCraft() }
        this.say(s, '컵을 집었어요.')
        break
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
        s.cup = null
        s.trash++
        s.totals.wastedCups++
        this.say(s, '컵을 폐기했어요. 이미 사용한 재료는 돌아오지 않아요.')
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
        if (s.cup.recipe !== s.request) {
          s.totals.mistakes++
          fail('손님이 요청한 메뉴와 달라요. 컵을 정리하고 POS 주문을 수정해주세요.')
          break
        }
        s.cash += RECIPES[s.cup.recipe].price
        s.totals.revenue += RECIPES[s.cup.recipe].price
        s.totals.served++
        s.ticket = null
        s.cup = null
        s.customer.visit = {
          table: tableIds[Math.floor(Math.random() * tableIds.length)],
          returnCup: Math.random() < CUSTOMER_HABITS.returnCup,
          dirtyTable: Math.random() < CUSTOMER_HABITS.stain,
          dirtyReturn: Math.random() < CUSTOMER_HABITS.stain,
          usesSugar: Math.random() < CUSTOMER_HABITS.sugar,
        }
        if (Math.random() < CUSTOMER_HABITS.stain) {
          s.dirtyBar = Math.min(3, s.dirtyBar + 1)
          if (s.cleaning?.station === 'mix') s.cleaning.progress = 0
        }
        customerToCondiment(s.customer)
        this.say(s, '손님이 음료를 받았어요. 컨디먼트 바와 테이블을 이용한 뒤 나가요.', 'success')
        break
      }
      case 'wash':
        if (s.washing) {
          fail('세척 중인 피처를 먼저 마무리하거나 세척대에 내려놓아주세요.')
          break
        }
        if ((s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool)) || s.preparation?.tool) {
          fail('컵과 제조 도구를 바에 내려놓은 뒤 세척해주세요.')
          break
        }
        if (!s.tools.dirty) {
          fail('씻을 도구가 없어요.')
          break
        }
        s.tools.dirty--
        s.washing = { id: uid(), stage: 'scrub', progress: 0, spongeHeld: false }
        this.say(s, '피처를 세척대에 놓았어요.')
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
          s.tools.washed++
          s.totals.washed++
          this.say(s, '피처를 깨끗하게 씻었어요.', 'success')
        }
        break
      }
      case 'take-washed':
        if (s.washing && s.washing.stage !== 'ready') {
          fail('세척 중인 피처를 먼저 마무리해주세요.')
          break
        }
        if ((s.cup && (s.cup.craft.location === 'hand' || s.cup.craft.tool)) || s.preparation?.tool) {
          fail('컵과 제조 도구를 내려놓으면 피처를 집을 수 있어요.')
          break
        }
        if (!s.tools.washed) {
          fail('씻은 피처가 없어요. 먼저 세척해주세요.')
          break
        }
        s.tools.washed--
        s.washing = { id: uid(), stage: 'carrying', progress: 0, spongeHeld: false }
        this.say(s, '씻은 피처를 집었어요.')
        break
      case 'leave-wash':
        if (!s.washing) break
        if (s.washing.stage === 'carrying') s.tools.washed++
        else if (s.washing.stage !== 'ready') s.tools.dirty++
        s.washing = null
        this.say(s, '피처를 세척대에 내려놓았어요. 미완료 세척은 다시 시작해야 해요.')
        break
      case 'rack':
        if (s.washing?.stage !== 'carrying') {
          fail('세척대에서 씻은 피처를 집어 가져와주세요.')
          break
        }
        s.tools.clean++
        s.washing = null
        this.say(s, '피처를 선반에 정리했어요. 이제 제조에 다시 사용할 수 있어요.', 'success')
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
            ? !cupSurface(s, station).dirty && !cupSurface(s, station).cups
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
            station === 'trash' ? 'bag' : isCupSurface(station) && cupSurface(s, station).cups ? 'collect' : 'wipe',
          progress: 0,
          clothHeld: false,
          heldCups: 0,
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
        if (!table.cups) break
        table.cups--
        cleaning.heldCups++
        this.say(s, `사용한 컵 ${cleaning.heldCups}개를 들고 있어요. 분리수거함으로 가져가세요.`)
        break
      }
      case 'drop-used-cups': {
        const cleaning = s.cleaning
        if (!cleaning?.heldCups || !isCupSurface(cleaning.station)) break
        s.trash += cleaning.heldCups
        cleaning.heldCups = 0
        const surface = cupSurface(s, cleaning.station)
        if (!surface.cups && !surface.dirty) {
          s.cleaning = null
          s.totals.cleaned++
          this.say(s, `${STATIONS[cleaning.station].name}의 컵을 모두 정리했어요.`, 'success')
          break
        }
        if (!surface.cups) cleaning.stage = 'wipe'
        this.say(
          s,
          `${STATIONS[cleaning.station].name}로 돌아가 ${cleaning.stage === 'wipe' ? '닦아주세요.' : '남은 컵을 회수해주세요.'}`,
          'success',
        )
        break
      }
      case 'clean-tool':
        if (s.cleaning?.stage !== 'wipe' || s.cleaning.heldCups) break
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
          if (surface.cups > 0) {
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
        const amount = Math.min(6, s.reserveCups, Math.max(0, 12 - s.cups))
        if (!amount) {
          fail('보충할 컵이 없거나 보관대가 가득 찼어요.')
          break
        }
        s.reserveCups -= amount
        s.cups += amount
        s.totals.restocked++
        this.say(s, `컵 ${amount}개를 보충했어요.`, 'success')
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
        if (s.reserveCups >= 48) {
          fail('후방에 충분한 컵이 있어요.')
          break
        }
        s.cash -= 2000
        s.totals.cupPurchases += 2000
        s.reserveCups += 24
        this.say(s, '컵 24개를 입고했어요.', 'success')
        break
      case 'open-batch': {
        const batch = s.batches.find((b) => b.id === action.id)
        if (batch?.location !== 'stock' || batch.openedAt !== null) break
        batch.openedAt = s.time
        batch.expiresAt = s.time + INGREDIENTS[batch.ingredient].lifetime
        batch.labelled = false
        this.say(s, `${INGREDIENTS[batch.ingredient].name} 개봉 완료. 라벨을 붙이고 보관 위치를 선택해주세요.`)
        break
      }
      case 'label-batch': {
        const batch = s.batches.find((b) => b.id === action.id)
        if (!batch || batch.amount <= 0 || batch.openedAt === null || batch.labelled) break
        if (batch.expiresAt !== null && batch.expiresAt <= s.time) {
          fail('기한이 지난 재료는 새 라벨로 연장할 수 없어요. 폐기해주세요.')
          break
        }
        batch.labelled = true
        this.say(s, '개봉·제조 시각과 품질 기한 라벨을 붙였어요. 보관 위치를 선택해주세요.', 'success')
        break
      }
      case 'store-batch': {
        const batch = s.batches.find((b) => b.id === action.id)
        if (!batch || batch.amount <= 0 || batch.location === 'bar' || batch.openedAt === null) break
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
        addAmounts(s.totals.disposed, { [batch.ingredient]: batch.amount })
        batch.amount = 0
        if (s.preparation?.batchId === batch.id) s.preparation = null
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
      case 'cold-brew':
        if (s.jobs.some((j) => j.kind === 'cold-brew')) {
          fail('이미 추출 중이에요.')
          break
        }
        if (s.cash < 9000) {
          fail('추출용 원두 입고비가 부족해요.')
          break
        }
        s.cash -= 9000
        s.totals.coldBrewPurchases += 9000
        this.job(s, 'cold-brew', 'stock', '다음 날 콜드 브루 추출', COLD_BREW_HOURS * 3600)
        break
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
  private customerSurface(s: GameState, station: CupSurfaceId, cup: boolean, dirty: boolean) {
    const surface = cupSurface(s, station)
    if (cup) surface.cups++
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
      if (missing.length) this.say(s, `컨디먼트 바에 ${missing.join('·')} 보충이 필요해요. 손님은 테이블로 이동해요.`)
      customerToTable(customer)
    } else if (customer.stage === 'drinking' && customer.elapsed >= CUSTOMER_SECONDS.drinking) {
      this.customerSurface(s, customer.visit.table, !customer.visit.returnCup, customer.visit.dirtyTable)
      if (customer.visit.returnCup) customerToReturn(customer)
      else {
        this.say(s, `손님이 ${STATIONS[customer.visit.table].name}에 컵을 남겼어요.`)
        customerLeave(customer)
      }
    } else if (customer.stage === 'returning' && customer.elapsed >= CUSTOMER_SECONDS.returning) {
      this.customerSurface(s, 'condiment', true, customer.visit.dirtyReturn)
      this.say(s, '손님이 컨디먼트 바에 컵을 반납했어요.')
      customerLeave(customer)
    }
  }
  private completeJobs(s: GameState) {
    const finished = s.jobs.filter((job) => job.endsAt <= s.time)
    s.jobs = s.jobs.filter((job) => job.endsAt > s.time)
    for (const job of finished) {
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
      if (job.kind === 'cold-brew') {
        s.batches.push(newBatch('coldBrew', INGREDIENTS.coldBrew.pack, job.endsAt))
        s.totals.prepared++
        this.say(s, '콜드 브루 추출액 준비 완료. 새 배치에 라벨을 붙여 보관했어요.', 'success')
      }
    }
  }
  private finishPreparation(s: GameState, completedAt: number) {
    const prep = s.preparation
    if (!prep || prep.stage === 'ready') return
    const batch = newBatch(prep.recipe, INGREDIENTS[prep.recipe].pack, completedAt, 'prep')
    s.batches.push(batch)
    prep.stage = 'ready'
    prep.batchId = batch.id
    prep.tool = null
    if (prep.toolReserved) s.tools.dirty++
    prep.toolReserved = false
    s.totals.prepared++
    this.say(s, `${PREPARATIONS[prep.recipe].name} 제조 완료. 라벨을 붙이고 보관해야 사용할 수 있어요.`, 'success')
  }
  private applyPreparation(s: GameState, step: PrepStep, delta: number) {
    const prep = s.preparation
    if (prep?.stage !== 'measuring' || prep.fault) {
      this.input = null
      return
    }
    if (step.kind === 'stir') delta = Math.min(delta, Math.max(0, step.target - prep.progress))
    if (delta <= 0) {
      this.input = null
      return
    }
    const amount = delta * (step.perUnit ?? 1)
    if (step.ingredient && !this.consume(s, { [step.ingredient]: amount })) {
      this.input = null
      return
    }
    prep.progress += delta
    if (step.ingredient && step.ingredient in prep.amounts)
      prep.amounts[step.ingredient as keyof typeof prep.amounts] += amount
    else if (step.tool === 'water-jug') prep.amounts.water += delta
    if (step.kind !== 'stir' && prep.progress > step.target * (1 + step.tolerance) + 0.0001) {
      prep.fault = `${step.label} 계량을 초과했어요. 배합을 폐기하고 다시 준비해주세요.`
      s.totals.mistakes++
      this.input = null
      this.say(s, prep.fault, 'error')
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
    this.completeJobs(s)
    this.advanceCustomer(s, dt)
    this.state = s
    this.emit()
  }
}
