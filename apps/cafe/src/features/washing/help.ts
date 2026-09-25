import { STATIONS } from '../../content/stations'
import type { WorkTip as Tip } from '../../shared/work-tip'
import type { Washing } from '../../simulation/state'
import { WASH_NAMES, WASH_STEPS, washDestination } from './rules'

export function washingTip(wash: Washing): Tip {
  const name = WASH_NAMES[wash.item]
  const destination = STATIONS[washDestination(wash.item)].name
  if (wash.stage === 'carrying')
    return {
      title: `${name}를 정리하세요`,
      action: `${destination}로 가져가 E로 놓으세요.`,
      reason: '씻기만 해서는 재사용할 수 없어요. 제자리에 놓으면 준비가 끝나요.',
    }
  if (wash.stage === 'ready')
    return {
      title: `씻은 ${name}를 옮기세요`,
      action: `세척대에서 E로 집고 ${destination}로 가세요.`,
      reason: '용기를 다시 사용할 수 있게 정리하는 단계예요.',
    }
  const ready = wash.progress >= WASH_STEPS[wash.stage].seconds
  return {
    title: `${name} ${wash.stage === 'scrub' ? '문지르기' : '헹구기'}`,
    action: ready
      ? wash.spongeHeld
        ? 'G로 스펀지를 놓고 F를 누르세요.'
        : 'F로 완료를 확인하세요.'
      : wash.stage === 'scrub' && !wash.spongeHeld
        ? 'G로 스펀지를 먼저 집으세요.'
        : 'Space나 작업 버튼을 누르고 있으면 진행돼요.',
    reason: '문지르기 → 헹구기 → 보관대 정리 순서예요.',
  }
}
