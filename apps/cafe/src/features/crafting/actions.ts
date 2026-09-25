import { recipeFor } from '../../content/recipes'
import { uid } from '../../shared/id'
import type { Action } from '../../simulation/actions'
import { say } from '../../simulation/feedback'
import type { WorkContext } from '../../simulation/work-context'
import { CUP_NAMES, cleanCupCount, cupKindFor, cupService, cupSize, isReusableCup } from '../inventory/cups'
import { addAmounts } from '../inventory/inventory'
import { decideObservation, skipObservedSteps } from '../production/conditions'
import {
  applyProduction,
  beginProduction,
  confirmProduction,
  releaseProductionTool,
  workIsBusy,
} from '../production/runtime'
import type { WorkStep } from '../production/workflow'
import { craftStations, createCraft, nextStep, operationFor, toolName } from './rules'

export function handleCraftActions(
  work: WorkContext,
  action: Extract<
    Action,
    { type: 'take-cup' | 'place-cup' | 'pick-cup' | 'tool' | 'use-start' | 'confirm-craft' | 'discard-cup' }
  >,
) {
  const s = work.state
  const fail = (message: string) => say(s, message, 'error')
  if (action.type === 'take-cup') {
    if (!s.ticket || s.cup || s.preparation?.tool) {
      fail('주문표와 들고 있는 도구를 확인해주세요.')
      return
    }
    const kind = cupKindFor(s.ticket.recipe, s.ticket.service, s.ticket.size)
    if (!cleanCupCount(s, kind)) {
      fail(`${CUP_NAMES[kind]}를 먼저 준비해주세요.`)
      return
    }
    if (isReusableCup(kind)) s.reusableCups[kind].clean--
    else s.disposableCups[kind].bar--
    s.cup = { id: uid(), recipe: s.ticket.recipe, craft: createCraft(kind) }
    say(s, `${CUP_NAMES[kind]}를 집었어요.`)
    return
  }
  const cup = s.cup
  if (!cup) return
  const session = cup.craft
  const owner = {
    kind: 'drink' as const,
    id: cup.id,
    station: session.location === 'hand' ? ('pickup' as const) : session.location,
  }
  if (action.type === 'discard-cup') {
    addAmounts(s.totals.disposed, session.consumed)
    releaseProductionTool(work, session)
    s.jobs = s.jobs.filter((job) => job.cupId !== cup.id)
    if (isReusableCup(session.kind)) s.reusableCups[session.kind].dirty++
    else {
      s.trash++
      s.totals.wastedCups++
    }
    s.cup = null
    say(s, '내용물을 폐기하고 컵을 정리했어요.')
    return
  }
  if (action.type === 'place-cup') {
    if (!craftStations.includes(action.station) || session.location !== 'hand' || workIsBusy(work, owner)) return
    if ((action.station === 'mix' && s.cleaning?.station === 'mix') || (action.station === 'prep' && s.preparation)) {
      fail('이 작업대를 사용 중이에요.')
      return
    }
    session.location = action.station
    say(s, '컵을 내려놓았어요.')
    return
  }
  if (action.type === 'pick-cup') {
    if (session.location !== action.station || workIsBusy(work, owner)) return
    if (session.tool || s.preparation?.tool) {
      fail('도구를 먼저 내려놓아주세요.')
      return
    }
    session.location = 'hand'
    say(s, '컵을 집었어요.')
    return
  }
  if (session.location !== action.station || s.preparation?.tool) {
    fail('작업대에 컵을 놓고 다른 도구를 내려놓아주세요.')
    return
  }
  const step = operationFor(cup.recipe, session)
  if (action.type === 'tool' && session.tool) {
    const name = toolName(session.tool)
    session.tool = null
    say(s, `${name}를 내려놓았어요.`)
    return
  }
  if (!step || step.station !== action.station || session.fault || workIsBusy(work, owner)) return
  if (action.type === 'confirm-craft' && step.kind === 'condition') {
    const steps = recipeFor(cup.recipe, cupSize(session.kind), cupService(session.kind)).steps
    if (!action.observation || !decideObservation(steps, session, action.observation.id, action.observation.value)) {
      fail('현재 단계에서 관찰한 상태를 선택해주세요.')
      return
    }
    if (work.input?.kind === 'drink' && work.input.cupId === cup.id) work.input = null
    if (!nextStep(s)) releaseProductionTool(work, session)
    say(s, nextStep(s) ? '관찰한 상태를 반영했어요.' : '음료가 완성됐어요.', 'success')
    return
  }
  if (action.type === 'confirm-craft' && action.observation) return
  if (step.requiresReusableTool && !session.reservedTool) {
    if (!s.tools.clean) {
      fail('깨끗한 제조 도구를 먼저 준비해주세요.')
      return
    }
    s.tools.clean--
    session.reservedTool = true
  }
  if (action.type === 'tool') {
    if (step.tool) {
      session.tool = step.tool.id
      say(s, `${step.tool.name}를 집었어요.`)
    }
  } else if (action.type === 'use-start') beginProduction(work, session, step, { ...owner, station: action.station })
  else if (action.type === 'confirm-craft') {
    if (!confirmProduction(work, session, step, { ...owner, station: action.station })) return
    skipObservedSteps(recipeFor(cup.recipe, cupSize(session.kind), cupService(session.kind)).steps, session)
    if (step.operation.action === 'serve') session.lidded = step.operation.lid === 'always'
    if (!nextStep(s)) releaseProductionTool(work, session)
    say(s, nextStep(s) ? `${step.label} 완료.` : '음료가 완성됐어요.', 'success')
  }
}
export function applyCraft(work: WorkContext, step: WorkStep, delta: number) {
  if (work.state.cup) applyProduction(work, work.state.cup.craft, step, delta)
}

export function expireDrink(work: WorkContext, time: number) {
  const cup = work.state.cup
  if (!cup || cup.craft.fault || cup.craft.ingredientExpiresAt === null || cup.craft.ingredientExpiresAt > time) return
  cup.craft.fault = '제조에 사용한 재료의 사용 기한이 지났어요.'
  work.state.jobs = work.state.jobs.filter((job) => job.cupId !== cup.id)
  if (work.input?.kind === 'drink') work.input = null
  say(work.state, '사용한 재료의 기한이 지났어요. 음료를 정리하고 다시 만들어주세요.', 'error')
}
