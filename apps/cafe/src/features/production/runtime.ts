import { recipeCatalog } from '../../content/catalog'
import { type Costs, INGREDIENTS, type IngredientId } from '../../content/ingredients'
import type { StationId } from '../../content/stations'
import { buildStockEffect, projectStockEffect, scaleStockEffect } from '../../content/stock-amounts'
import { say, startJob } from '../../simulation/feedback'
import type { GameState } from '../../simulation/state'
import type { WorkContext } from '../../simulation/work-context'
import { addAmounts, available, batchIdsFor, consume } from '../inventory/inventory'
import { observationStep } from './conditions'
import { PRODUCTION_EPSILON, type ProductionState, type WorkStep } from './workflow'

export type WorkOwner = { kind: 'drink' | 'preparation'; id: string; station: StationId }
export const continuousWork = (step: WorkStep) => step.kind === 'pour' || step.kind === 'mix'
export const readyWork = (step: WorkStep, progress: number) => progress + PRODUCTION_EPSILON >= step.target

export function missingInput(state: GameState, step: WorkStep, progress: number): IngredientId | undefined {
  const remaining = step.inputRequirements ? 1 : Math.max(0, 1 - progress / step.target)

  return Object.entries(step.inputRequirements ?? step.costs).find(
    ([id, amount]) => available(state, id) + PRODUCTION_EPSILON < (amount ?? 0) * remaining,
  )?.[0]
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
  return step.portion === undefined ? effect : scaleStockEffect(session, effect, step.stockContext, step.portion)
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

export function productionTargetFill(session: ProductionState, step: WorkStep, vesselId: string) {
  if (step.kind === 'condition' || step.mixesMaterialId) {
    return undefined
  }
  return stockEffect(session, step).targetFills[vesselId]
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
    (selected?.length && available(work.state, id, selected) + PRODUCTION_EPSILON >= remaining)
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

    if (available(work.state, id) + PRODUCTION_EPSILON < needed || needed <= 0) {
      say(work.state, `${INGREDIENTS[id].name}를 먼저 준비해주세요.`, 'error')
      return
    }

    if (session.progress <= PRODUCTION_EPSILON) {
      session.mixedInputs[id] = batchIdsFor(work.state, id, needed)
    }

    if (available(work.state, id, session.mixedInputs[id]) + PRODUCTION_EPSILON < needed) {
      session.progress = 0
      delete session.mixedInputs[id]
      say(work.state, '혼합할 배치를 다시 선택해주세요.', 'error')
      return
    }
  }

  if (continuousWork(step) || step.kind === 'confirm') {
    delta = Math.min(delta, Math.max(0, (step.maximum ?? Infinity) - session.progress))
  }

  if (delta <= 0) {
    work.input = null
    return
  }

  if (session.progress + delta > (step.maximum ?? Infinity) + PRODUCTION_EPSILON) {
    session.fault = `${step.label}의 목표량을 초과했어요.`
    work.input = null
    say(work.state, session.fault, 'error')
    return
  }

  const effect = step.mixesMaterialId ? null : stockEffect(session, step)
  const target = session.stepStart?.stepId === step.id ? session.stepStart.target : step.target
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
    session.stepStart ??= { stepId: step.id, target, effect }
    session.vessels = nextStock.vessels
    session.stockHeld = nextStock.stockHeld
  }

  session.progress += delta
  if (Math.abs(session.progress - (step.maximum ?? Infinity)) < PRODUCTION_EPSILON) {
    session.progress = step.maximum ?? session.progress
  }
}

export function beginProduction(work: WorkContext, session: ProductionState, step: WorkStep, owner: WorkOwner) {
  if (step.kind === 'condition') {
    say(work.state, '관찰한 상태를 먼저 선택해주세요.', 'error')
    return
  }

  if (session.fault || workIsBusy(work, owner)) {
    return
  }

  if (work.state.jobs.some((job) => job.station === step.station)) {
    say(work.state, '장비를 사용 중이에요.', 'error')
    return
  }

  if (session.tool !== (step.tool?.id ?? null)) {
    say(work.state, step.tool ? `${step.tool.name}를 먼저 집어주세요.` : '도구를 먼저 내려놓아주세요.', 'error')
    return
  }

  if (!mixedInputReady(work, session, step)) {
    return
  }

  if (continuousWork(step)) {
    work.input =
      owner.kind === 'drink'
        ? { kind: 'drink', cupId: owner.id, step: session.cursor, station: owner.station, operation: step.id }
        : { kind: 'prep', preparationId: owner.id, step: session.cursor, station: 'prep' }
    return
  }

  if (step.kind === 'machine' && session.progress + PRODUCTION_EPSILON >= (step.maximum ?? Infinity)) {
    return
  }
  const before = session.progress
  applyProduction(work, session, step, step.increment)
  if (session.progress <= before || step.kind !== 'machine' || step.seconds === null) {
    return
  }
  startJob(work.state, 'production', owner.station, step.label, step.seconds, {
    ...(owner.kind === 'drink' ? { cupId: owner.id } : { preparationId: owner.id }),
    stepIndex: session.cursor,
    equipmentId: step.equipmentId ?? undefined,
  })
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

  if (session.fault || workIsBusy(work, owner)) {
    return false
  }

  if (!readyWork(step, session.progress)) {
    say(work.state, '현재 단계의 목표까지 진행해주세요.', 'error')
    return false
  }

  if (!enoughToTransfer(work, session, step)) {
    return false
  }

  if (session.tool) {
    say(work.state, '도구를 내려놓은 뒤 확인해주세요.', 'error')
    return false
  }

  if (step.mixesMaterialId) {
    const id = step.mixesMaterialId

    if (
      available(work.state, id, session.mixedInputs[id] ?? []) + PRODUCTION_EPSILON <
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
  session.cursor++
  session.progress = 0
  session.stepStart = null
  return true
}

export function releaseProductionTool(work: WorkContext, session: ProductionState) {
  if (session.reservedTool) {
    work.state.tools.dirty++
    session.reservedTool = false
  }
}
