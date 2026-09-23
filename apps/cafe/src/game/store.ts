import {
  type Costs,
  INGREDIENTS,
  type IngredientId,
  ingredientIds,
  orderSequence,
  RECIPES,
  type RecipeId,
  recipeLabel,
  type StationId,
} from './catalog'
import { type Batch, emptyTotals, type GameState, type Job, uid } from './state'

const START = Date.UTC(2026, 8, 1, 9) / 1000
function newBatch(ingredient: IngredientId, amount: number, now: number, location: 'bar' | 'stock' = 'bar'): Batch {
  return {
    id: uid(),
    ingredient,
    amount,
    location,
    openedAt: location === 'bar' ? now : null,
    expiresAt: location === 'bar' ? now + INGREDIENTS[ingredient].lifetime : null,
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
    version: 1,
    day: 1,
    time: START,
    phase: 'open',
    cash: 50000,
    orderNumber: 1,
    request: 'cold-brew',
    ticket: null,
    cup: null,
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
    dirtyTables: 1,
    dirtyBar: 0,
    trash: 0,
    totals: emptyTotals(),
    messages: [{ id: uid(), text: '첫 손님이 기다리고 있어요. POS에서 주문을 받아보세요.', tone: 'info' }],
    position: [0, 2.7, 0, -0.12],
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
export function suggestedStation(state: GameState): StationId {
  const toolStation = () => (state.tools.washed ? ('rack' as const) : ('wash' as const))
  const step = nextStep(state)
  if (step) {
    if (step.usesPitcher && !state.tools.clean) return toolStation()
    for (const [key, amount] of Object.entries(step.costs)) {
      if (available(state, key as IngredientId) + 0.0001 >= amount) continue
      if (key === 'foam' || key === 'mocha') return state.tools.clean ? 'prep' : toolStation()
      return 'stock'
    }
    return step.station
  }
  if (state.cup) return 'pickup'
  if (state.ticket) return state.cups ? 'cups' : 'stock'
  if (state.phase === 'closing') {
    if (state.tools.dirty) return 'wash'
    if (state.tools.washed) return 'rack'
    if (state.dirtyTables) return 'table'
    if (state.dirtyBar) return 'mix'
    if (state.trash) return 'trash'
    if (state.batches.some((b) => b.amount > 0 && b.expiresAt !== null && b.expiresAt <= state.time)) return 'stock'
  }
  return 'pos'
}
export function closingTasks(state: GameState) {
  return [
    state.ticket || state.cup ? '남은 주문 마무리' : '',
    state.tools.dirty ? '도구 세척' : '',
    state.tools.washed ? '도구 선반 정리' : '',
    state.dirtyTables ? '고객 테이블 청소' : '',
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
  | { type: 'step'; station: StationId }
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
        | 'clean-table'
        | 'wipe'
        | 'trash'
        | 'cups'
        | 'buy-cups'
        | 'foam'
        | 'mocha'
        | 'cold-brew'
        | 'close'
        | 'finish'
        | 'next-day'
    }

export class CafeStore {
  private state: GameState
  private listeners = new Set<() => void>()
  constructor(state: GameState) {
    this.state = state
  }
  getSnapshot = () => this.state
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  replace(state: GameState) {
    this.state = state
    this.emit()
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
    const s = structuredClone(this.state)
    const busy = (station: StationId) => s.jobs.some((j) => j.station === station)
    const fail = (text: string) => this.say(s, text, 'error')
    if (s.phase === 'summary' && action.type !== 'next-day') return
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
        s.ticket = action.recipe
        this.say(s, `${recipeLabel(action.recipe)} 주문표를 출력했어요. 컵 보관대로 이동하세요.`, 'success')
        break
      case 'take-cup':
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
        s.cup = { id: uid(), recipe: s.ticket, step: 0 }
        this.say(s, 'Tall 컵을 준비했어요. 주문표의 첫 작업대로 가보세요.')
        break
      case 'step': {
        const step = nextStep(s)
        if (!s.cup || !step) {
          fail(s.cup ? '제조가 끝났어요. 픽업대에서 전달해주세요.' : '먼저 주문을 받고 컵을 준비해주세요.')
          break
        }
        if (s.jobs.some((j) => j.cupId === s.cup?.id)) {
          fail('이 컵의 작업이 진행 중이에요.')
          break
        }
        if (step.station !== action.station) {
          fail(`지금은 ${step.label} 단계예요. 주문표의 작업대를 확인해주세요.`)
          break
        }
        if (busy(action.station)) {
          fail('이 작업대는 사용 중이에요.')
          break
        }
        if (step.usesPitcher && !s.tools.clean) {
          fail('깨끗한 피처가 없어요. 세척대와 도구 선반을 확인해주세요.')
          break
        }
        if (!this.consume(s, step.costs)) break
        if (step.usesPitcher) {
          s.tools.clean--
        }
        this.job(s, 'step', action.station, step.label, step.seconds, {
          cupId: s.cup.id,
          stepIndex: s.cup.step,
          usesTool: step.usesPitcher,
        })
        break
      }
      case 'discard-cup':
        if (!s.cup) break
        s.tools.dirty += s.jobs.filter((j) => j.cupId === s.cup?.id && j.usesTool).length
        s.jobs = s.jobs.filter((j) => j.cupId !== s.cup?.id)
        s.cup = null
        s.trash++
        s.totals.wastedCups++
        this.say(s, '컵을 폐기했어요. 이미 사용한 재료는 돌아오지 않아요.')
        break
      case 'serve':
        if (!s.ticket || !s.cup || nextStep(s)) {
          fail('아직 완성된 음료가 없어요.')
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
        s.dirtyTables = Math.min(3, s.dirtyTables + 1)
        s.dirtyBar = Math.min(3, s.dirtyBar + 1)
        s.orderNumber++
        s.request = orderSequence[(s.orderNumber - 1) % orderSequence.length]
        this.say(s, '잘 받았습니다! 사용한 자리와 도구를 정리하고 다음 손님을 맞아주세요.', 'success')
        break
      case 'wash':
        if (!s.tools.dirty) {
          fail('씻을 도구가 없어요.')
          break
        }
        if (busy('wash')) {
          fail('세척 중이에요.')
          break
        }
        s.tools.dirty--
        this.job(s, 'wash', 'wash', '피처 세척', 4)
        break
      case 'rack':
        if (!s.tools.washed) {
          fail('세척 완료된 도구가 없어요.')
          break
        }
        s.tools.clean += s.tools.washed
        s.tools.washed = 0
        this.say(s, '깨끗한 도구를 선반에 정리했어요.', 'success')
        break
      case 'clean-table':
        if (!s.dirtyTables) {
          fail('테이블이 깨끗해요.')
          break
        }
        if (!busy('table')) this.job(s, 'clean-table', 'table', '테이블 닦기', 3)
        break
      case 'wipe':
        if (!s.dirtyBar) {
          fail('작업대가 깨끗해요.')
          break
        }
        if (!busy('mix')) this.job(s, 'wipe', 'mix', '작업대 닦기', 3)
        break
      case 'trash':
        s.trash = 0
        this.say(s, '분리수거함을 비웠어요.', 'success')
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
        s.reserveCups += 24
        this.say(s, '컵 24개를 입고했어요.', 'success')
        break
      case 'open-batch': {
        const batch = s.batches.find((b) => b.id === action.id)
        if (batch?.location !== 'stock') break
        batch.location = 'bar'
        batch.openedAt = s.time
        batch.expiresAt = s.time + INGREDIENTS[batch.ingredient].lifetime
        batch.labelled = true
        s.totals.restocked++
        this.say(s, `${INGREDIENTS[batch.ingredient].name} 개봉일·기한 라벨을 붙이고 보충했어요.`, 'success')
        break
      }
      case 'discard-batch': {
        const batch = s.batches.find((b) => b.id === action.id)
        if (!batch || batch.amount <= 0) break
        batch.amount = 0
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
        s.batches.push(newBatch(action.ingredient, ingredient.pack, s.time, 'stock'))
        this.say(s, '원팩을 입고했어요. 사용할 때 개봉해주세요.', 'success')
        break
      }
      case 'foam':
      case 'mocha': {
        if (busy('prep')) {
          fail('준비대를 사용 중이에요.')
          break
        }
        if (!s.tools.clean) {
          fail('깨끗한 피처를 먼저 준비해주세요.')
          break
        }
        const foam = action.type === 'foam'
        if (!this.consume(s, foam ? { cream: 200, milk: 50, glaze: 7 * 10.2 } : { mochaPowder: 1 })) break
        s.tools.clean--
        this.job(s, action.type, 'prep', foam ? '글레이즈드 폼 제조' : '바모카 배합', foam ? 25 : 6, { usesTool: true })
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
        this.job(s, 'cold-brew', 'stock', '다음 날 콜드 브루 추출', 20 * 3600)
        break
      case 'close':
        s.phase = 'closing'
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
        s.totals = emptyTotals()
        s.position = [0, 2.7, 0, -0.12]
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
  private completeJobs(s: GameState) {
    const finished = s.jobs.filter((job) => job.endsAt <= s.time)
    s.jobs = s.jobs.filter((job) => job.endsAt > s.time)
    for (const job of finished) {
      if (job.usesTool) s.tools.dirty++
      if (job.kind === 'step' && s.cup && s.cup.id === job.cupId && s.cup.step === job.stepIndex) {
        s.cup.step++
        this.say(
          s,
          nextStep(s)
            ? `${job.label} 완료. 다음은 ${nextStep(s)?.label}예요.`
            : '음료가 완성됐어요. 픽업대에서 전달해주세요.',
          'success',
        )
      } else if (job.kind === 'wash') {
        s.tools.washed++
        s.totals.washed++
        this.say(s, '세척 완료! 도구 선반에 정리해주세요.', 'success')
      } else if (job.kind === 'clean-table') {
        s.dirtyTables = Math.max(0, s.dirtyTables - 1)
        s.trash++
        s.totals.cleaned++
        this.say(s, '테이블이 깨끗해졌어요.', 'success')
      } else if (job.kind === 'wipe') {
        s.dirtyBar = Math.max(0, s.dirtyBar - 1)
        s.totals.cleaned++
        this.say(s, '작업대를 정리했어요.', 'success')
      } else if (job.kind === 'foam' || job.kind === 'mocha' || job.kind === 'cold-brew') {
        const ingredient = job.kind === 'cold-brew' ? 'coldBrew' : job.kind
        s.batches.push(newBatch(ingredient, INGREDIENTS[ingredient].pack, job.endsAt))
        s.totals.prepared++
        this.say(s, `${INGREDIENTS[ingredient].name} 준비 완료. 새 배치에 라벨을 붙여 보관했어요.`, 'success')
      }
    }
  }
  tick(seconds: number) {
    if (this.state.phase === 'summary') return
    const s = structuredClone(this.state)
    s.time += Math.max(0, Math.min(seconds, 2))
    this.completeJobs(s)
    this.state = s
    this.emit()
  }
}
