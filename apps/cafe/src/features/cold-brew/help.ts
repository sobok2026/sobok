import { INGREDIENTS } from '../../content/ingredients'
import { expiryAt } from '../../content/lifetime'
import type { WorkTip as Tip } from '../../shared/work-tip'
import type { ColdBrew, GameState } from '../../simulation/state'
import { COLD_BREW_HOURS } from '../cold-brew/rules'
import { materialTip } from '../inventory/help'
import { COLD_BREW_TOOL_NAMES, coldBrewStep } from './rules'

export function coldBrewTip(state: GameState, brew: ColdBrew): Tip {
  if (brew.completedAt !== null && expiryAt(brew.completedAt, INGREDIENTS.coldBrew.lifetime) <= state.time) {
    return {
      title: '추출액의 기한이 지났어요',
      action: '추출대에서 F로 폐기한 뒤 다시 준비하세요.',
      reason: '회수하거나 라벨을 붙여도 기한은 늘어나지 않아요.',
      fault: true,
    }
  }
  if (brew.fault) {
    return {
      title: '콜드 브루를 다시 준비하세요',
      action: '추출대에서 F로 한 배치분을 폐기하세요.',
      reason: brew.fault,
      fault: true,
    }
  }
  if (brew.stage === 'finished') {
    return {
      title: '추출액을 회수하세요',
      action: '추출대에서 E로 용기에 회수하고 F로 라벨을 붙이세요.',
      reason: '추출 완료 시각부터 기한이 계산돼요. 회수한 뒤 냉장고로 운반해야 사용할 수 있어요.',
    }
  }
  if (brew.stage === 'ready') {
    return materialTip(state, 'coldBrew')
  }
  if (brew.stage === 'extracting') {
    return {
      title: '콜드 브루 추출 중이에요',
      action: '기다리는 동안 주문·정리를 이어가거나 마감할 수 있어요.',
      reason: '다음 날로 넘어간 시간도 추출에 반영돼요. 완료 후에는 직접 회수하세요.',
    }
  }
  const step = coldBrewStep(brew)
  const ready = brew.progress + 0.0001 >= step.target * (1 - step.tolerance)

  return {
    title: step.label,
    action: measuringAction(brew, step, ready),
    reason: '추출이 끝나면 회수·라벨·냉장고 운반까지 마쳐야 사용할 수 있어요.',
  }
}

function measuringAction(brew: ColdBrew, step: ReturnType<typeof coldBrewStep>, ready: boolean) {
  if (brew.tool && ready) {
    return 'G로 도구를 내려놓고 F로 계량을 확인하세요.'
  }
  if (brew.step === 2) {
    return `Space로 ${COLD_BREW_HOURS}시간 추출을 시작하세요.`
  }
  if (ready) {
    return 'F로 계량을 확인하세요.'
  }
  if (!brew.tool) {
    return `G로 ${COLD_BREW_TOOL_NAMES[step.tool!]}를 집으세요.`
  }
  if (brew.step === 0) {
    return 'Space를 누르고 원두 한 봉을 모두 담으세요.'
  }
  return 'Space로 물을 붓다가 초록 목표 구간에서 손을 떼세요.'
}
