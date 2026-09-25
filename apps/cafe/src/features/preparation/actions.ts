import type { StationId } from '../../content/stations'
import { estimatedPreparationMilliliters } from '../../content/stock-amounts'
import type { Action } from '../../simulation/actions'
import { say, startJob } from '../../simulation/feedback'
import { cupHandsBusy } from '../../simulation/hands'
import type { WorkContext } from '../../simulation/work-context'
import { addAmounts, consume, newBatch } from '../inventory/inventory'
import {
  continuousPreparation,
  createPreparation,
  PREP_TOOL_NAMES,
  PREPARATIONS,
  type PrepStep,
  preparationStep,
} from './rules'

export function handlePreparationActions(
  work: WorkContext,
  action: Extract<
    Action,
    { type: 'start-preparation' | 'prep-tool' | 'prep-use' | 'prep-confirm' | 'discard-preparation' }
  >,
) {
  const s = work.state
  const fail = (text: string) => say(s, text, 'error')
  const busy = (station: StationId) => s.jobs.some((job) => job.station === station)
  switch (action.type) {
    case 'start-preparation': {
      if (busy('prep') || s.preparation) {
        fail('준비대를 사용 중이에요.')
        break
      }
      if (cupHandsBusy(s.cup)) {
        fail('음료 컵과 도구를 제조 바에 내려놓은 뒤 준비해주세요.')
        break
      }
      if (!s.tools.clean) {
        fail('깨끗한 피처를 먼저 준비해주세요.')
        break
      }
      s.tools.clean--
      s.preparation = createPreparation(action.recipe)
      say(s, `${PREPARATIONS[action.recipe].name} 준비를 시작했어요.`)
      break
    }
    case 'prep-tool': {
      const prep = s.preparation
      if (prep?.stage !== 'measuring') break
      if (prep.tool) {
        prep.tool = null
        say(s, '준비 도구를 내려놓았어요.')
        break
      }
      if (prep.fault || cupHandsBusy(s.cup)) {
        fail(prep.fault ?? '음료 컵과 도구를 먼저 내려놓아주세요.')
        break
      }
      prep.tool = preparationStep(prep).tool
      if (prep.tool) say(s, `${PREP_TOOL_NAMES[prep.tool]}를 집었어요.`)
      break
    }
    case 'prep-use': {
      const prep = s.preparation
      if (prep?.stage !== 'measuring' || prep.fault) break
      const step = preparationStep(prep)
      if (cupHandsBusy(s.cup)) {
        fail('음료 컵과 도구를 먼저 내려놓아주세요.')
        break
      }
      if (prep.tool !== step.tool) {
        fail('G로 현재 단계의 도구를 먼저 집어주세요.')
        break
      }
      if (step.kind === 'machine') {
        prep.stage = 'processing'
        startJob(
          s,
          prep.recipe,
          'prep',
          `${PREPARATIONS[prep.recipe].name} 블렌딩`,
          PREPARATIONS[prep.recipe].seconds,
          { preparationId: prep.id },
        )
      } else if (continuousPreparation(step)) {
        work.input = { kind: 'prep', preparationId: prep.id, step: prep.step, station: 'prep' }
      } else applyPreparation(work, step, 1)
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
      if (step.kind === 'machine' || prep.progress + 1e-9 < step.target * (1 - step.tolerance)) {
        fail('아직 목표량에 못 미쳤어요. 계량을 이어가세요.')
        break
      }
      if (prep.step === PREPARATIONS[prep.recipe].steps.length - 1) finishPreparation(work, s.time)
      else {
        prep.step++
        prep.progress = 0
        say(s, `계량을 확인했어요.`, 'success')
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
      say(s, '준비 중인 배합을 폐기했어요. 사용한 재료는 돌아오지 않고 피처는 세척해야 해요.')
      break
    }
  }
}

export function expirePreparation(work: WorkContext, at: number) {
  const s = work.state
  const prep = s.preparation
  if (!prep || prep.fault) return false
  const ingredientExpiry = prep.ingredientExpiresAt
  if (prep.stage === 'ready' || ingredientExpiry === null || ingredientExpiry > at) return false
  prep.fault = '투입한 원재료의 기한이 지났어요. 이 배합을 폐기하고 다시 준비해주세요.'
  prep.tool = null
  s.jobs = s.jobs.filter((job) => job.preparationId !== prep.id)
  if (work.input?.kind === 'prep') work.input = null
  say(s, prep.fault, 'error')
  return true
}

export function finishPreparation(work: WorkContext, completedAt: number) {
  const s = work.state
  const prep = s.preparation
  if (!prep || prep.stage === 'ready' || prep.fault || expirePreparation(work, completedAt)) return
  const batch = newBatch(prep.recipe, estimatedPreparationMilliliters[prep.recipe], completedAt, 'prep')
  if (prep.ingredientExpiresAt != null) batch.expiresAt = Math.min(batch.expiresAt!, prep.ingredientExpiresAt)
  s.batches.push(batch)
  prep.stage = 'ready'
  prep.batchId = batch.id
  prep.tool = null
  if (prep.toolReserved) s.tools.dirty++
  prep.toolReserved = false
  s.totals.prepared++
  const expired = batch.expiresAt! <= s.time
  say(
    s,
    expired
      ? `${PREPARATIONS[prep.recipe].name} 제조는 끝났지만 기한이 지났어요. 이 배합을 폐기해주세요.`
      : `${PREPARATIONS[prep.recipe].name} 제조 완료. 라벨을 붙이고 보관해야 사용할 수 있어요.`,
    expired ? 'error' : 'success',
  )
}

export function applyPreparation(work: WorkContext, step: PrepStep, delta: number) {
  const s = work.state
  const prep = s.preparation
  if (prep?.stage !== 'measuring' || prep.fault) {
    work.input = null
    return
  }
  if (step.kind === 'stir' || step.kind === 'shake' || step.kind === 'pour')
    delta = Math.min(delta, Math.max(0, step.target - prep.progress))
  if (delta <= 0) {
    work.input = null
    return
  }
  const amount = delta * (step.perUnit ?? 1)
  if (step.ingredient) {
    const consumed = consume(s, { [step.ingredient]: amount })
    if (!consumed) {
      work.input = null
      return
    }
    if (consumed.earliestExpiry !== null)
      prep.ingredientExpiresAt = Math.min(prep.ingredientExpiresAt ?? consumed.earliestExpiry, consumed.earliestExpiry)
  }
  prep.progress += delta
  if (step.ingredient && step.ingredient in prep.amounts)
    prep.amounts[step.ingredient as keyof typeof prep.amounts] += amount
  else if (step.tool === 'water-jug' || step.tool === 'cold-water-jug') prep.amounts.water += delta
  if (!['stir', 'shake'].includes(step.kind) && prep.progress > step.target * (1 + step.tolerance) + 1e-9) {
    prep.fault = `${step.label} 계량을 초과했어요. 배합을 폐기하고 다시 준비해주세요.`
    work.input = null
    say(s, prep.fault, 'error')
  }
}
