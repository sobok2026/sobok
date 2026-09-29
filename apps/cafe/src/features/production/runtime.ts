import { recipeCatalog } from '../../content/catalog'
import { type Costs, INGREDIENTS, type IngredientId } from '../../content/ingredients'
import type { StationId } from '../../content/stations'
import { buildStockEffect, projectStockEffect, scaleStockEffect } from '../../content/stock-amounts'
import { josa } from '../../shared/format'
import { say, startJob } from '../../simulation/feedback'
import type { GameState } from '../../simulation/state'
import type { WorkContext } from '../../simulation/work-context'
import type { DripBean } from '../drip-coffee/rules'
import { addAmounts, available, batchIdsFor, consume } from '../inventory/inventory'
import { observationStep } from './conditions'
import { PRODUCTION_EPSILON, type ProductionState, type WorkStep } from './workflow'

export type WorkOwner = { kind: 'drink' | 'preparation'; id: string; station: StationId; vessel?: string }
export const continuousWork = (step: WorkStep) => step.kind === 'pour' || step.kind === 'mix'
/** Held pours and timings pass within this share of the recipe amount. Counts must match exactly. */
export const MEASURE_TOLERANCE = 0.05
/** Timed equipment runs by itself once started, so the step never waits for a confirmation. */
export const backgroundWork = (step: WorkStep) => step.kind === 'machine' && step.seconds !== null

export type Judgement = 'under' | 'pass' | 'over'

export function judgeWork(step: WorkStep, progress: number): Judgement {
  if (step.kind === 'condition') {
    return 'pass'
  }
  const slack = continuousWork(step) ? MEASURE_TOLERANCE : 0
  const low = step.target * (1 - slack)
  const high = step.maximum === null ? Infinity : step.maximum * (1 + slack)
  if (progress + PRODUCTION_EPSILON < low) {
    return 'under'
  }
  return progress - PRODUCTION_EPSILON > high ? 'over' : 'pass'
}

export const readyWork = (step: WorkStep, progress: number) => judgeWork(step, progress) !== 'under'

const transfersAll = (step: WorkStep) =>
  step.operation.action === 'transfer' && step.operation.amount.kind === 'all' && step.portion === undefined

/**
 * How far input can go before the vessel or source physically stops it. The recipe target is not a stop:
 * the player decides when to stop and the confirmation judges it.
 */
function progressCap(step: WorkStep) {
  const limit = step.maximum ?? step.target
  if (transfersAll(step) || step.kind === 'confirm' || step.kind === 'machine') {
    return limit
  }
  return continuousWork(step) ? limit * 1.5 : limit + 10
}

function judgementText(step: WorkStep, judgement: Exclude<Judgement, 'pass'>) {
  if (step.kind === 'count') {
    return judgement === 'under' ? '횟수가 모자라요.' : '횟수가 많아요. 다시 만들어주세요.'
  }
  if (step.kind === 'mix') {
    return judgement === 'under' ? '시간이 모자라요.' : '너무 오래 했어요. 다시 만들어주세요.'
  }
  if (step.kind === 'pour') {
    return judgement === 'under' ? '아직 덜 부었어요.' : '너무 많이 부었어요. 다시 만들어주세요.'
  }
  return '아직 동작하지 않았어요.'
}

/** Checks the picks for this step. Unset or wrong picks are refused before anything is consumed. */
export function checkChoices(work: WorkContext, session: ProductionState, step: WorkStep) {
  for (const choice of step.choices) {
    const picked = session.choices[choice.key]
    if (!picked) {
      say(work.state, `${josa(choice.label, '을', '를')} 먼저 고르세요.`, 'error')
      return false
    }
    if (picked !== choice.answer) {
      say(work.state, `${josa(choice.label, '이', '가')} 달라요.`, 'error')
      return false
    }
  }
  return true
}

export function chooseSetting(session: ProductionState, step: WorkStep, key: string, value: string) {
  const choice = step.choices.find((item) => item.key === key)
  // A pick locks once the step has started so a count cannot switch beans halfway.
  if (!choice?.options.some((option) => option.value === value) || session.progress > PRODUCTION_EPSILON) {
    return false
  }
  session.choices[key] = value
  return true
}

export function advanceStep(session: ProductionState) {
  session.cursor++
  session.progress = 0
  session.stepStart = null
  session.choices = {}
}

export function requiredInput(step: WorkStep, ingredient: IngredientId, progress: number) {
  const remaining = step.inputRequirements ? 1 : Math.max(0, 1 - progress / step.target)
  return ((step.inputRequirements ?? step.costs)[ingredient] ?? 0) * remaining
}

export function missingInput(
  state: GameState,
  step: WorkStep,
  progress: number,
  dripBean: DripBean | null = null,
): IngredientId | undefined {
  return Object.keys(step.inputRequirements ?? step.costs).find(
    (id) =>
      available(state, id, undefined, step.stockArea, dripBean) + PRODUCTION_EPSILON <
      requiredInput(step, id, progress),
  )
}

export const workIsBusy = (work: WorkContext, owner: WorkOwner) =>
  work.state.jobs.some((job) => (owner.kind === 'drink' ? job.cupId === owner.id : job.preparationId === owner.id))

export function currentWorkStep(steps: WorkStep[], session: ProductionState): WorkStep | undefined {
  const source = steps[session.cursor]
  if (!source) {
    return undefined
  }
  const step = stockAwareWorkStep(session, observationStep(source, session))
  if (step.kind === 'condition' || session.resumeProgress === null) {
    return step
  }
  const operation = step.operation
  if (operation.action !== 'add') {
    throw new Error('재혼합 대상 재료가 없습니다.')
  }
  const mixing = steps.slice(0, session.cursor).findLast((item) => item.mixesMaterialId === operation.materialId)
  if (!mixing) {
    throw new Error('원문의 재혼합 단계를 찾을 수 없습니다.')
  }

  return {
    ...mixing,
    id: `${step.id}:mix-input`,
    station: step.station,
    label: `${INGREDIENTS[operation.materialId]?.name ?? operation.materialId} 재혼합`,
    costs: {},
    requiresMixedMaterialId: null,
    inputRequirements: Object.fromEntries(
      Object.entries(step.costs).map(([id, amount]) => [
        id,
        amount * Math.max(0, 1 - session.resumeProgress! / step.target),
      ]),
    ),
  }
}

function stockEffect(session: ProductionState, step: WorkStep) {
  if (session.stepStart?.stepId === step.id) {
    return session.stepStart.effect
  }
  const effect = buildStockEffect(
    recipeCatalog,
    session,
    step.operation,
    step.stockContext,
    step.nextStockAdd ?? undefined,
  )
  const portion = step.portion ?? step.foamPortion
  return portion === undefined ? effect : scaleStockEffect(session, effect, step.stockContext, portion)
}

export function stockAwareWorkStep(session: ProductionState, step: WorkStep): WorkStep {
  if (step.kind === 'condition') {
    return step
  }

  if (step.mixesMaterialId) {
    if (session.resumeProgress !== null) {
      return step
    }
    const effect = step.nextStockAdd
      ? buildStockEffect(recipeCatalog, session, step.nextStockAdd, step.stockContext)
      : null
    const inputRequirements = effect
      ? (step.nextStockPortion === undefined
          ? effect
          : scaleStockEffect(session, effect, step.stockContext, step.nextStockPortion)
        ).costs
      : step.inputRequirements
    return { ...step, inputRequirements }
  }

  return { ...step, costs: stockEffect(session, step).costs }
}

function enoughToTransfer(work: WorkContext, session: ProductionState, step: WorkStep) {
  if (step.mixesMaterialId || step.kind === 'condition') {
    return true
  }
  const transfer = stockEffect(session, step).transfer
  if (
    !transfer ||
    transfer.requiredMilliliters === null ||
    transfer.availableMilliliters + PRODUCTION_EPSILON >= transfer.requiredMilliliters
  ) {
    return true
  }
  session.fault = '옮길 내용물이 부족해서 원문의 계량 목표를 채울 수 없어요.'
  work.input = null
  say(work.state, session.fault, 'error')
  return false
}

function mixedInputReady(work: WorkContext, session: ProductionState, step: WorkStep): boolean {
  if (!step.requiresMixedMaterialId || readyWork(step, session.progress)) {
    return true
  }
  const id = step.requiresMixedMaterialId
  const remaining = (step.costs[id] ?? 0) * Math.max(0, 1 - session.progress / step.target)
  const selected = session.mixedInputs[id]
  if (
    remaining <= PRODUCTION_EPSILON ||
    (selected?.length &&
      available(work.state, id, selected, step.stockArea, session.dripBean) + PRODUCTION_EPSILON >= remaining)
  ) {
    return true
  }
  session.resumeProgress = session.progress
  session.progress = 0
  delete session.mixedInputs[id]
  work.input = null
  say(work.state, '사용할 재료 배치가 바뀌었어요. 다시 혼합한 뒤 이어 부어주세요.')
  return false
}

export function applyProduction(work: WorkContext, session: ProductionState, step: WorkStep, delta: number) {
  if (step.kind === 'condition') {
    work.input = null
    return
  }

  step = stockAwareWorkStep(session, step)

  if (session.fault || !mixedInputReady(work, session, step)) {
    work.input = null
    return
  }

  if (!enoughToTransfer(work, session, step)) {
    return
  }

  if (step.mixesMaterialId) {
    const id = step.mixesMaterialId
    const needed = step.inputRequirements?.[id] ?? 0

    if (
      available(work.state, id, undefined, step.stockArea, session.dripBean) + PRODUCTION_EPSILON < needed ||
      needed <= 0
    ) {
      say(work.state, `${INGREDIENTS[id].name}를 먼저 준비해주세요.`, 'error')
      return
    }

    if (session.progress <= PRODUCTION_EPSILON) {
      session.mixedInputs[id] = batchIdsFor(work.state, id, needed, step.stockArea, session.dripBean)
    }

    if (
      available(work.state, id, session.mixedInputs[id], step.stockArea, session.dripBean) + PRODUCTION_EPSILON <
      needed
    ) {
      session.progress = 0
      delete session.mixedInputs[id]
      say(work.state, '혼합할 배치를 다시 선택해주세요.', 'error')
      return
    }
  }

  const effect = step.mixesMaterialId ? null : stockEffect(session, step)
  const target = session.stepStart?.stepId === step.id ? session.stepStart.target : step.target
  const transfer = effect?.transfer
  const sourceCap =
    transfer && transfer.movedMilliliters > PRODUCTION_EPSILON
      ? (target * transfer.availableMilliliters) / transfer.movedMilliliters
      : Infinity
  const cap = Math.min(progressCap(step), sourceCap)
  delta = Math.min(delta, Math.max(0, cap - session.progress))

  if (delta <= PRODUCTION_EPSILON) {
    work.input = null
    return
  }

  const nextStock = effect
    ? projectStockEffect(
        session,
        effect,
        step.stockContext,
        session.progress / target,
        (session.progress + delta) / target,
      )
    : null
  const costs: Costs = Object.fromEntries(
    Object.entries(step.costs).map(([id, amount]) => [id, ((amount ?? 0) * delta) / step.target]),
  )
  const result = consume(
    work.state,
    costs,
    step.requiresMixedMaterialId ? session.mixedInputs[step.requiresMixedMaterialId] : undefined,
    step.stockArea,
    session.dripBean,
  )

  if (!result) {
    work.input = null
    return
  }

  addAmounts(session.consumed, costs)
  if (result.earliestExpiry !== null) {
    session.ingredientExpiresAt = Math.min(session.ingredientExpiresAt ?? result.earliestExpiry, result.earliestExpiry)
  }

  if (effect && nextStock) {
    session.stepStart ??= {
      stepId: step.id,
      target,
      effect,
      fills: Object.fromEntries(Object.keys(effect.targetFills).map((id) => [id, session.vessels[id]?.fill ?? 0])),
    }
    session.vessels = nextStock.vessels
    session.stockHeld = nextStock.stockHeld
  }

  session.progress += delta
  if (Math.abs(session.progress - (step.maximum ?? Infinity)) < PRODUCTION_EPSILON) {
    session.progress = step.maximum ?? session.progress
  }
  if (session.progress + PRODUCTION_EPSILON >= cap) work.input = null
}

/**
 * Starts or continues the current step. Returns true when timed equipment took the step over, so the caller
 * moves on to the next step while the machine runs.
 */
export function beginProduction(
  work: WorkContext,
  session: ProductionState,
  step: WorkStep,
  owner: WorkOwner,
): boolean {
  if (step.kind === 'condition') {
    say(work.state, '관찰한 상태를 먼저 선택해주세요.', 'error')
    return false
  }

  if (session.fault) {
    return false
  }

  if (work.state.jobs.some((job) => job.station === step.station && job.kind !== 'drip-coffee')) {
    say(work.state, '장비를 사용 중이에요.', 'error')
    return false
  }

  if (session.tool !== (step.tool?.id ?? null)) {
    say(work.state, step.tool ? `${step.tool.name}를 먼저 집어주세요.` : '도구를 먼저 내려놓아주세요.', 'error')
    return false
  }

  if (step.choices.some((choice) => choice.key !== 'lid') && session.progress <= PRODUCTION_EPSILON) {
    if (!checkChoices(work, session, step)) {
      return false
    }
  }

  if (!mixedInputReady(work, session, step)) {
    return false
  }

  if (continuousWork(step)) {
    work.input =
      owner.kind === 'drink'
        ? { kind: 'drink', cupId: owner.id, step: session.cursor, station: owner.station, operation: step.id }
        : { kind: 'prep', preparationId: owner.id, step: session.cursor, station: 'prep' }
    return false
  }

  const before = session.progress
  applyProduction(work, session, step, step.increment)
  if (session.progress <= before || !backgroundWork(step)) {
    return false
  }
  startJob(work.state, 'production', owner.station, step.label, step.seconds!, {
    ...(owner.kind === 'drink' ? { cupId: owner.id } : { preparationId: owner.id }),
    stepIndex: session.cursor,
    equipmentId: step.equipmentId ?? undefined,
    vessel: owner.vessel,
  })
  advanceStep(session)
  return true
}

export function confirmProduction(
  work: WorkContext,
  session: ProductionState,
  step: WorkStep,
  owner: WorkOwner,
): boolean {
  if (step.kind === 'condition') {
    say(work.state, '관찰한 상태를 먼저 선택해주세요.', 'error')
    return false
  }

  if (session.fault || (owner.kind === 'preparation' && workIsBusy(work, owner)) || backgroundWork(step)) {
    return false
  }

  if (session.tool) {
    say(work.state, '도구를 내려놓은 뒤 확인해주세요.', 'error')
    return false
  }

  if (step.choices.some((choice) => choice.key === 'lid') && !checkChoices(work, session, step)) {
    return false
  }

  const judgement = step.choices.some((choice) => choice.key === 'lid') ? 'pass' : judgeWork(step, session.progress)
  if (judgement === 'under') {
    say(work.state, judgementText(step, judgement), 'error')
    return false
  }
  if (judgement === 'over') {
    session.fault = judgementText(step, judgement)
    work.input = null
    say(work.state, session.fault, 'error')
    return false
  }

  if (!enoughToTransfer(work, session, step)) {
    return false
  }

  if (step.mixesMaterialId) {
    const id = step.mixesMaterialId

    if (
      available(work.state, id, session.mixedInputs[id] ?? [], step.stockArea, session.dripBean) + PRODUCTION_EPSILON <
      (step.inputRequirements?.[id] ?? 0)
    ) {
      session.progress = 0
      delete session.mixedInputs[id]
      say(work.state, '재료 배치를 다시 혼합해주세요.', 'error')
      return false
    }

    if (session.resumeProgress !== null) {
      session.progress = session.resumeProgress
      session.resumeProgress = null
      return false
    }
  }

  if (step.requiresMixedMaterialId) {
    delete session.mixedInputs[step.requiresMixedMaterialId]
  }
  advanceStep(session)
  return true
}

export function releaseProductionTool(work: WorkContext, session: ProductionState) {
  if (session.reservedTool) {
    work.state.tools.dirty++
    session.reservedTool = false
  }
}
