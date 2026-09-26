import type { Action } from '../../simulation/actions'
import { say } from '../../simulation/feedback'
import { cupHandsBusy } from '../../simulation/hands'
import type { Preparation } from '../../simulation/state'
import type { WorkContext } from '../../simulation/work-context'
import { addAmounts, newBatch } from '../inventory/inventory'
import { decideObservation, skipObservedSteps } from '../production/conditions'
import {
  applyProduction,
  beginProduction,
  confirmProduction,
  releaseProductionTool,
  workIsBusy,
} from '../production/runtime'
import type { WorkStep } from '../production/workflow'
import { createPreparation, PREPARATIONS, preparationStep } from './rules'

const ownerFor = (prep: Preparation) => ({ kind: 'preparation' as const, id: prep.id, station: 'prep' as const })

function reserveTool(work: WorkContext, prep: Preparation, step: WorkStep) {
  if (!step.requiresReusableTool || prep.reservedTool) return true

  if (!work.state.tools.clean) {
    say(work.state, '깨끗한 제조 용기를 먼저 준비해주세요.', 'error')
    return false
  }

  work.state.tools.clean--
  prep.reservedTool = true
  return true
}

export function handlePreparationActions(
  work: WorkContext,
  action: Extract<
    Action,
    { type: 'start-preparation' | 'prep-tool' | 'prep-use' | 'prep-confirm' | 'discard-preparation' }
  >,
) {
  const s = work.state
  const fail = (text: string) => say(s, text, 'error')

  switch (action.type) {
    case 'start-preparation': {
      const definition = PREPARATIONS[action.recipe]

      if (!definition) {
        fail('이 제조법은 준비 경로를 먼저 확인해야 해요.')
        break
      }

      if (s.preparation || s.cup?.craft.location === 'prep' || s.jobs.some((job) => job.station === 'prep')) {
        fail('준비대를 사용 중이에요.')
        break
      }

      if (cupHandsBusy(s.cup)) {
        fail('음료 컵과 도구를 먼저 내려놓아주세요.')
        break
      }

      s.preparation = createPreparation(action.recipe)
      say(s, `${definition.name} 준비를 시작했어요.`)
      break
    }
    case 'prep-tool': {
      const prep = s.preparation
      if (!prep || prep.stage === 'ready') break

      if (prep.tool) {
        prep.tool = null
        if (work.input?.kind === 'prep' && work.input.preparationId === prep.id) work.input = null
        say(s, '준비 도구를 내려놓았어요.')
        break
      }

      if (prep.fault) {
        fail(prep.fault)
        break
      }

      if (expirePreparation(work, s.time)) break

      if (cupHandsBusy(s.cup)) {
        fail('음료 컵과 도구를 먼저 내려놓아주세요.')
        break
      }

      if (prep.stage !== 'measuring' || workIsBusy(work, ownerFor(prep))) break
      const step = preparationStep(prep)

      if (step?.tool && reserveTool(work, prep, step)) {
        prep.tool = step.tool.id
        say(s, `${step.tool.name}를 집었어요.`)
      }

      break
    }
    case 'prep-use': {
      const prep = s.preparation
      if (prep?.stage !== 'measuring' || prep.fault || expirePreparation(work, s.time)) break

      if (cupHandsBusy(s.cup)) {
        fail('음료 컵과 도구를 먼저 내려놓아주세요.')
        break
      }

      const step = preparationStep(prep)
      if (!step || !reserveTool(work, prep, step)) break
      beginProduction(work, prep, step, ownerFor(prep))
      if (workIsBusy(work, ownerFor(prep))) prep.stage = 'processing'
      break
    }
    case 'prep-confirm': {
      const prep = s.preparation
      if (prep?.stage !== 'measuring' || prep.fault || expirePreparation(work, s.time)) break
      if (workIsBusy(work, ownerFor(prep))) break

      if (cupHandsBusy(s.cup)) {
        fail('음료 컵과 도구를 먼저 내려놓아주세요.')
        break
      }

      const step = preparationStep(prep)
      const steps = PREPARATIONS[prep.recipe].steps

      if (step?.kind === 'condition') {
        if (!action.observation || !decideObservation(steps, prep, action.observation.id, action.observation.value)) {
          fail('현재 단계에서 관찰한 상태를 선택해주세요.')
          break
        }

        if (work.input?.kind === 'prep' && work.input.preparationId === prep.id) work.input = null
        if (prep.cursor === steps.length) finishPreparation(work, s.time)
        else say(s, '관찰한 상태를 반영했어요.', 'success')
        break
      }

      if (action.observation) break
      if (!step || !confirmProduction(work, prep, step, ownerFor(prep))) break
      skipObservedSteps(steps, prep)
      if (prep.cursor === PREPARATIONS[prep.recipe].steps.length) finishPreparation(work, s.time)
      else say(s, '현재 단계를 확인했어요.', 'success')
      break
    }
    case 'discard-preparation': {
      const prep = s.preparation
      if (!prep) break
      releaseProductionTool(work, prep)

      if (prep.batchId) {
        const batch = s.batches.find((item) => item.id === prep.batchId)
        if (batch) {
          addAmounts(s.totals.disposed, { [batch.ingredient]: batch.amount })
          batch.amount = 0
        }
      } else addAmounts(s.totals.disposed, prep.consumed)

      s.jobs = s.jobs.filter((job) => job.preparationId !== prep.id)
      if (work.input?.kind === 'prep' && work.input.preparationId === prep.id) work.input = null
      s.preparation = null
      s.trash++
      say(s, '배합을 폐기했어요. 사용한 재료는 돌아오지 않고 사용한 제조 용기는 세척해야 해요.')
      break
    }
  }
}

export function expirePreparation(work: WorkContext, at: number) {
  const prep = work.state.preparation
  if (
    !prep ||
    prep.fault ||
    prep.stage === 'ready' ||
    prep.ingredientExpiresAt === null ||
    prep.ingredientExpiresAt > at
  )
    return false
  prep.fault = '투입한 원재료의 기한이 지났어요. 이 배합을 폐기하고 다시 준비해주세요.'
  prep.tool = null
  prep.stage = 'measuring'
  work.state.jobs = work.state.jobs.filter((job) => job.preparationId !== prep.id)
  if (work.input?.kind === 'prep' && work.input.preparationId === prep.id) work.input = null
  say(work.state, prep.fault, 'error')
  return true
}

export function finishPreparation(work: WorkContext, completedAt: number) {
  const s = work.state
  const prep = s.preparation
  if (!prep || prep.stage === 'ready' || prep.fault || expirePreparation(work, completedAt)) return
  const definition = PREPARATIONS[prep.recipe]
  if (prep.cursor !== definition.steps.length || workIsBusy(work, ownerFor(prep))) return
  const batch = newBatch(definition.output.materialId, definition.output.amount, completedAt, 'prep')
  if (prep.ingredientExpiresAt !== null)
    batch.expiresAt = Math.min(batch.expiresAt ?? prep.ingredientExpiresAt, prep.ingredientExpiresAt)
  s.batches.push(batch)
  prep.stage = 'ready'
  prep.batchId = batch.id
  prep.tool = null
  releaseProductionTool(work, prep)
  s.totals.prepared++
  const expired = batch.expiresAt !== null && batch.expiresAt <= s.time
  say(
    s,
    expired
      ? `${definition.name} 제조는 끝났지만 기한이 지났어요. 이 배합을 폐기해주세요.`
      : `${definition.name} 제조 완료. 라벨을 붙이고 보관해야 사용할 수 있어요.`,
    expired ? 'error' : 'success',
  )
}

export function applyPreparation(work: WorkContext, step: WorkStep, delta: number) {
  const prep = work.state.preparation

  if (
    prep?.stage !== 'measuring' ||
    prep.fault ||
    expirePreparation(work, work.state.time) ||
    preparationStep(prep)?.id !== step.id ||
    prep.tool !== (step.tool?.id ?? null) ||
    cupHandsBusy(work.state.cup)
  ) {
    work.input = null
    return
  }

  applyProduction(work, prep, step, delta)
}
