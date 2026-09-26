import { STATIONS } from '../../content/stations'
import type { WorkTip as Tip } from '../../shared/work-tip'
import type { CraftState, GameState } from '../../simulation/state'
import { materialTip } from '../inventory/help'
import { available } from '../inventory/inventory'
import { continuousWork, readyWork } from '../production/runtime'
import { PRODUCTION_EPSILON, type WorkStep } from '../production/workflow'
import { nextStep, operationFor } from './rules'

export function craftTip(state: GameState, cup: NonNullable<GameState['cup']>): Tip {
  const craft = cup.craft
  if (craft.fault) {
    return {
      title: '제조한 음료를 정리해주세요',
      action: '컵이 놓인 작업대에서 F로 정리하고 새 컵으로 다시 시작하세요.',
      reason: craft.fault,
    }
  }
  const step = operationFor(cup.recipe, craft)
  const source = nextStep(state)
  if (!step || !source) {
    return {
      title: '완성한 음료를 전달하세요',
      action: handoffAction(state, craft),
      reason: '한 잔씩 전달하고, 마지막 잔을 받으면 손님이 매장을 이용해요.',
    }
  }
  const job = state.jobs.find((item) => item.cupId === cup.id)
  if (job) {
    return {
      title: `${job.label} 중이에요`,
      action: '작동이 끝나면 횟수를 확인하세요. 목표 횟수까지 작동한 뒤 F로 완료를 확인하세요.',
      reason: '작동 중에는 컵이 고정돼요. 장비 종료 후에도 완료 확인 전에는 같은 단계예요.',
    }
  }
  if (craft.location === 'hand') {
    return {
      title: `${STATIONS[source.station].name} 쪽으로 이동하세요`,
      action: '작업대를 보고 E로 컵을 내려놓으세요.',
      reason: '컵은 정해진 자리에 자동으로 놓여요. 제조는 카운터 안쪽에서 진행해요.',
    }
  }
  if (craft.location !== source.station) {
    return {
      title: '다음 작업대로 컵을 옮기세요',
      action: `${STATIONS[craft.location].name}에서 E로 집고 ${STATIONS[source.station].name}에 E로 놓으세요.`,
      reason: `다음 단계는 ${step.label}예요.`,
    }
  }
  const ready = readyWork(step, craft.progress)
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
        : '컵은 여기에 두고 세척대에서 작업 용기를 씻으세요.',
      reason: '세척 후 도구 선반에 정리해야 제조에 사용할 수 있어요.',
    }
  }

  if (!ready) {
    for (const [id, amount] of Object.entries(step.inputRequirements ?? step.costs)) {
      const needed = (amount ?? 0) * (step.inputRequirements ? 1 : Math.max(0, 1 - craft.progress / step.target))
      if (available(state, id) + PRODUCTION_EPSILON < needed) {
        return materialTip(state, id)
      }
    }
  }

  return {
    title: step.label,
    action: stepAction(craft, step, ready),
    reason: step.measurement
      ? `계량 목표: ${step.measurement}. ${step.note || '도구를 놓고 F로 확인하기 전까지는 같은 단계예요.'}`
      : step.note || step.instruction,
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

function stepAction(craft: CraftState, step: WorkStep, ready: boolean) {
  if (craft.tool && (ready || craft.tool !== step.tool?.id)) {
    return 'G로 들고 있는 도구를 내려놓으세요.'
  }
  if (ready) {
    return 'F로 현재 단계의 완료를 확인하세요.'
  }
  if (step.tool && craft.tool !== step.tool.id) {
    return `G로 ${step.tool.name}를 집으세요.`
  }

  if (step.kind === 'machine') {
    if (step.seconds === null) {
      return 'Space로 작동을 확인하세요. 목표 횟수를 맞춘 뒤 F로 다음 단계로 넘어가세요.'
    }
    return 'Space로 장비를 한 번 작동하세요. 목표 횟수까지 반복한 뒤 F로 완료를 확인하세요.'
  }

  if (continuousWork(step)) {
    return 'Space나 작업 버튼을 누르고 표시된 목표까지 진행하세요.'
  }
  return 'Space를 한 번씩 눌러 표시된 동작과 횟수를 맞추세요.'
}
