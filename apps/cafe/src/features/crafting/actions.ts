import { recipeCup } from '../../content/recipes'
import { STATIONS, type StationId } from '../../content/stations'
import { josa } from '../../shared/format'
import { uid } from '../../shared/id'
import type { Action } from '../../simulation/actions'
import { say } from '../../simulation/feedback'
import { cupHandsBusy } from '../../simulation/hands'
import type { WorkContext } from '../../simulation/work-context'
import { CUP_NAMES, cleanCupCount, isReusableCup } from '../inventory/cups'
import { addAmounts } from '../inventory/inventory'
import { decideObservation, skipObservedSteps } from '../production/conditions'
import {
  applyProduction,
  beginProduction,
  chooseSetting,
  confirmProduction,
  releaseProductionTool,
} from '../production/runtime'
import type { WorkStep } from '../production/workflow'
import { currentTicket } from '../service/orders'
import {
  craftStations,
  createCraft,
  cupRecipe,
  heldVessel,
  misplacedVessels,
  nextStep,
  operationFor,
  stepVessels,
  toolName,
  vesselBusy,
  vesselName,
  vesselPlace,
} from './rules'

type CraftAction = Extract<
  Action,
  {
    type:
      | 'take-cup'
      | 'place-cup'
      | 'pick-cup'
      | 'place-vessel'
      | 'pick-vessel'
      | 'attach-sticker'
      | 'choose'
      | 'tool'
      | 'use-start'
      | 'confirm-craft'
      | 'discard-cup'
  }
>

/** The vessel a machine works on, which stays busy while the machine runs. */
function machineVessel(step: WorkStep) {
  const operation = step.operation
  if ('vessel' in operation) {
    return operation.vessel
  }
  return 'into' in operation ? operation.into : undefined
}

const heldCup = (cup: NonNullable<WorkContext['state']['cup']>, servingId: string) =>
  cup.craft.location === 'hand' ? servingId : null

export function handleCraftActions(work: WorkContext, action: CraftAction) {
  const s = work.state
  const fail = (message: string) => say(s, message, 'error')

  if (action.type === 'take-cup') {
    const ticket = currentTicket(s)

    if (!ticket || s.cup || s.preparation?.tool) {
      fail('주문표와 들고 있는 도구를 확인해주세요.')
      return
    }

    const kind = action.kind

    if (kind !== recipeCup(ticket.recipe, ticket.size, ticket.service)) {
      fail('주문과 맞지 않는 컵이에요. 매장·포장, 온도, 사이즈나 잔 종류를 확인해주세요.')
      return
    }

    if (!cleanCupCount(s, kind)) {
      fail('고른 컵이 비어 있어요. 컵 보관대에서 보충하거나 씻어 와주세요.')
      return
    }

    if (isReusableCup(kind)) {
      s.reusableCups[kind].clean--
    } else {
      s.disposableCups[kind].bar--
    }
    s.cup = {
      id: uid(),
      recipe: ticket.recipe,
      orderLineId: ticket.id,
      craft: { ...createCraft(kind, ticket.size, ticket.customizations), dripBean: ticket.dripBean },
    }
    say(s, `${josa(CUP_NAMES[kind], '을', '를')} 집었어요.`)
    return
  }

  const cup = s.cup
  if (!cup) {
    return
  }
  const session = cup.craft
  const { steps, vesselId: servingId } = cupRecipe(cup)

  if (action.type === 'discard-cup') {
    addAmounts(s.totals.disposed, session.consumed)
    releaseProductionTool(work, session)
    s.jobs = s.jobs.filter((job) => job.cupId !== cup.id)

    if (isReusableCup(session.kind)) {
      s.reusableCups[session.kind].dirty++
    } else {
      s.trash++
      s.totals.wastedCups++
    }

    s.cup = null
    say(s, '내용물을 폐기하고 컵을 정리했어요.')
    return
  }

  if (action.type === 'attach-sticker') {
    if (session.sticker) {
      fail('이 컵에는 이미 스티커를 붙였어요.')
      return
    }
    if (session.location !== 'hand') {
      fail('컵을 들고 와서 스티커를 붙여주세요.')
      return
    }
    session.sticker = true
    say(s, '주문 스티커를 붙였어요.')
    return
  }

  const step = operationFor(cup.recipe, session)
  const occupied = (station: StationId) =>
    (station === 'mix' && s.cleaning?.station === 'mix') || (station === 'prep' && !!s.preparation)

  if (action.type === 'place-cup' || action.type === 'place-vessel') {
    const held = action.type === 'place-cup' ? heldCup(cup, servingId) : heldVessel(cup)
    if (!held || !craftStations.includes(action.station)) {
      return
    }
    if (occupied(action.station)) {
      fail('이 작업대를 사용 중이에요.')
      return
    }
    if (held === servingId) {
      session.location = action.station
    } else {
      session.places[held] = action.station
    }
    say(s, `${josa(vesselName(cup, held), '을', '를')} 내려놓았어요.`)
    return
  }

  if (action.type === 'pick-cup' || action.type === 'pick-vessel') {
    const id = action.type === 'pick-cup' ? servingId : action.vessel
    if (vesselPlace(cup, id, step) !== action.station || (id !== servingId && !session.places[id])) {
      return
    }
    if (vesselBusy(s, cup, id)) {
      fail('장비가 아직 작동 중이에요.')
      return
    }
    if (cupHandsBusy(cup) || s.preparation?.tool) {
      fail('들고 있는 것을 먼저 내려놓아주세요.')
      return
    }
    if (id === servingId) {
      session.location = 'hand'
    } else {
      session.places[id] = 'hand'
    }
    say(s, `${josa(vesselName(cup, id), '을', '를')} 집었어요.`)
    return
  }

  if (action.type === 'tool' && session.tool) {
    const name = toolName(session.tool)
    session.tool = null
    say(s, `${name}를 내려놓았어요.`)
    return
  }

  if (!step || step.station !== action.station || session.fault) {
    return
  }

  if (!session.sticker) {
    fail('컵에 주문 스티커를 먼저 붙여주세요.')
    return
  }

  if (session.location === 'hand' || heldVessel(cup) || s.preparation?.tool) {
    fail('들고 있는 용기와 도구를 먼저 내려놓아주세요.')
    return
  }

  const misplaced = misplacedVessels(cup, step)[0]
  if (misplaced) {
    fail(`${josa(vesselName(cup, misplaced.id), '을', '를')} ${STATIONS[step.station].name}에 먼저 놓아주세요.`)
    return
  }

  const busy = stepVessels(step, servingId).find((id) => vesselBusy(s, cup, id))
  if (busy) {
    fail(`${josa(vesselName(cup, busy), '이', '가')} 아직 장비에서 작동 중이에요.`)
    return
  }

  if (action.type === 'choose') {
    chooseSetting(session, step, action.key, action.value)
    return
  }

  if (action.type === 'confirm-craft' && step.kind === 'condition') {
    if (!action.observation || !decideObservation(steps, session, action.observation.id, action.observation.value)) {
      fail('현재 단계에서 관찰한 상태를 선택해주세요.')
      return
    }

    if (work.input?.kind === 'drink' && work.input.cupId === cup.id) {
      work.input = null
    }
    if (!nextStep(s)) {
      releaseProductionTool(work, session)
    }
    say(s, nextStep(s) ? '관찰한 상태를 반영했어요.' : '음료가 완성됐어요.', 'success')
    return
  }

  if (action.type === 'confirm-craft' && action.observation) {
    return
  }

  if (step.requiresReusableTool && !session.reservedTool) {
    if (!s.tools.clean) {
      fail('깨끗한 제조 도구를 먼저 준비해주세요.')
      return
    }

    s.tools.clean--
    session.reservedTool = true
  }

  // A helper vessel comes out at the station of its first step and stays there until the player moves it.
  for (const id of stepVessels(step, servingId)) {
    if (id !== servingId && !session.places[id]) {
      session.places[id] = step.station
    }
  }

  const owner = { kind: 'drink' as const, id: cup.id, station: action.station, vessel: machineVessel(step) }

  if (action.type === 'tool') {
    if (step.tool) {
      session.tool = step.tool.id
      say(s, `${step.tool.name}를 집었어요.`)
    }
  } else if (action.type === 'use-start') {
    if (beginProduction(work, session, step, owner)) {
      skipObservedSteps(steps, session)
    }
  } else if (action.type === 'confirm-craft') {
    const lid = session.choices.lid
    if (!confirmProduction(work, session, step, owner)) {
      return
    }
    skipObservedSteps(steps, session)
    if (step.operation.action === 'serve') {
      session.lidded = lid !== undefined && lid !== 'none'
    }
    if (!nextStep(s)) {
      releaseProductionTool(work, session)
    }
    say(s, nextStep(s) ? `${step.label} 완료.` : '음료가 완성됐어요.', 'success')
  }
}

export function applyCraft(work: WorkContext, step: WorkStep, delta: number) {
  if (work.state.cup) {
    applyProduction(work, work.state.cup.craft, step, delta)
  }
}

export function expireDrink(work: WorkContext, time: number) {
  const cup = work.state.cup
  if (!cup || cup.craft.fault || cup.craft.ingredientExpiresAt === null || cup.craft.ingredientExpiresAt > time) {
    return
  }
  cup.craft.fault = '제조에 사용한 재료의 사용 기한이 지났어요.'
  work.state.jobs = work.state.jobs.filter((job) => job.cupId !== cup.id)
  if (work.input?.kind === 'drink') {
    work.input = null
  }
  say(work.state, '사용한 재료의 기한이 지났어요. 음료를 정리하고 다시 만들어주세요.', 'error')
}
