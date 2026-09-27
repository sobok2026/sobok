import { STATIONS } from '../../content/stations'
import type { WorkTip as Tip } from '../../shared/work-tip'
import type { CraftState, GameState } from '../../simulation/state'
import { materialTip } from '../inventory/help'
import { workTitle } from '../production/presentation'
import { backgroundWork, continuousWork, missingInput, readyWork, requiredInput } from '../production/runtime'
import type { WorkStep } from '../production/workflow'
import {
  cupRecipe,
  heldVessel,
  misplacedVessels,
  nextCupStation,
  nextVesselStation,
  operationFor,
  stepVessels,
  vesselName,
} from './rules'

export function craftTip(state: GameState, cup: NonNullable<GameState['cup']>): Tip {
  const craft = cup.craft
  if (craft.fault) {
    return {
      title: '제조한 음료를 정리해주세요',
      action: '컵이 놓인 작업대에서 Q를 길게 눌러 정리하고 새 컵으로 다시 시작하세요.',
      reason: craft.fault,
    }
  }
  const step = operationFor(cup.recipe, craft)
  if (!step) {
    return {
      title: '완성한 음료를 전달하세요',
      action: handoffAction(state, craft),
      reason: '한 잔씩 전달하고, 마지막 잔을 받으면 손님이 매장을 이용해요.',
    }
  }
  if (!craft.sticker) {
    return {
      title: '컵에 주문 스티커를 붙이세요',
      action: '컵을 든 채 스티커 프린터를 보고 E를 누르세요.',
      reason: '결제하면 음료마다 스티커가 나와요. 스티커를 보고 만들어요.',
    }
  }
  const held = heldVessel(cup)
  if (held) {
    const station = nextVesselStation(cup, held) ?? step.station
    return {
      title: `${vesselName(cup, held)}를 내려놓으세요`,
      action: `${STATIONS[station].name}를 보고 E를 누르세요.`,
      reason: '용기는 한 번에 하나만 들 수 있어요.',
    }
  }
  if (craft.location === 'hand') {
    return {
      title: `${STATIONS[nextCupStation(cup)].name} 쪽으로 이동하세요`,
      action: '작업대를 보고 E로 컵을 내려놓으세요.',
      reason: '컵이 필요 없는 단계는 그 용기로 진행해요. 우유 계량과 스팀은 스팀 완드의 피처로 해요.',
    }
  }
  const misplaced = misplacedVessels(cup, step)[0]
  if (misplaced?.place && misplaced.place !== 'hand') {
    return {
      title: `${vesselName(cup, misplaced.id)}를 옮기세요`,
      action: `${STATIONS[misplaced.place].name}에서 E로 집고 ${STATIONS[step.station].name}에 E로 놓으세요.`,
      reason: `다음 단계는 ${workTitle(step)}예요.`,
    }
  }
  const job = state.jobs.find(
    (item) => item.cupId === cup.id && item.vessel && stepVessels(step, cupRecipe(cup).vesselId).includes(item.vessel),
  )
  if (job) {
    return {
      title: `${job.label} 중이에요`,
      action: '끝나면 이어서 할 수 있어요.',
      reason: '장비는 시작하면 스스로 멈춰요. 기다리는 동안 다른 단계를 먼저 해도 돼요.',
    }
  }
  if (step.kind === 'condition' && step.condition) {
    return {
      title: '제조 상태를 확인하세요',
      action: `작업 패널에서 ${step.condition.property}: ${step.condition.value}에 해당하는지 선택하세요.`,
      reason: '선택한 상태에 맞는 제조 순서로 진행해요.',
    }
  }
  if (step.requiresReusableTool && !craft.reservedTool && !state.tools.clean) {
    return {
      title: '깨끗한 작업 용기가 필요해요',
      action: state.tools.washed
        ? '세척대에서 씻은 용기를 집어 도구 선반에 놓으세요.'
        : '세척대에서 작업 용기를 씻고 도구 선반에 정리하세요.',
      reason: '세척 후 도구 선반에 정리해야 제조에 사용할 수 있어요.',
    }
  }

  const missing = readyWork(step, craft.progress)
    ? undefined
    : missingInput(state, step, craft.progress, craft.dripBean)
  if (missing) {
    return materialTip(state, missing, 'bar', requiredInput(step, missing, craft.progress))
  }

  return {
    title: workTitle(step),
    action: stepAction(craft, step),
    reason: `원문: ${step.instruction}${step.note ? ` ${step.note}` : ''}`,
  }
}

function handoffAction(state: GameState, craft: CraftState) {
  if (craft.location === 'hand') {
    return '픽업대에서 E로 컵을 내려놓으세요.'
  }
  if (craft.location !== 'pickup') {
    return 'E로 컵을 집어 픽업대로 옮기세요.'
  }
  if (state.customer?.stage === 'pickup') {
    return '손님 요청을 확인하고 F로 전달하세요.'
  }
  return '손님이 픽업대에 도착하면 F로 전달하세요.'
}

function stepAction(craft: CraftState, step: WorkStep) {
  if (craft.tool && craft.tool !== step.tool?.id) {
    return 'G로 들고 있는 도구를 내려놓으세요.'
  }
  if (step.tool && !craft.tool) {
    return `G로 ${step.tool.name}를 집으세요.`
  }
  if (step.choices.some((choice) => !craft.choices[choice.key])) {
    return step.operation.action === 'serve'
      ? '리드를 고르고 F로 확인하세요.'
      : '숫자 키나 버튼으로 장비 설정을 고른 뒤 Space로 시작하세요.'
  }
  if (backgroundWork(step)) {
    return 'Space로 시작하면 장비가 스스로 멈춰요.'
  }
  if (continuousWork(step)) {
    return 'Space를 누른 채 진행하고 알맞은 양에서 손을 떼세요. 도구를 내려놓고 F로 확인하면 판정해요.'
  }
  return 'Space를 한 번씩 눌러 횟수를 맞추고 F로 확인하세요. 모자라면 이어서 하고 넘치면 다시 만들어요.'
}
