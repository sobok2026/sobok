import { STATIONS } from '../../content/stations'
import type { WorkTip as Tip } from '../../shared/work-tip'
import type { Cleaning } from '../../simulation/state'
import { cupCount } from '../inventory/cups'
import { CLEANING_SECONDS } from './rules'

export function cleaningTip(work: Cleaning): Tip {
  if (cupCount(work.heldCups))
    return {
      title: '회수한 컵을 세척대로 옮기세요',
      action: '세척대로 가져가 E로 내려놓으세요.',
      reason: '얼룩이 남아 있으면 원래 자리로 돌아가 닦아주세요.',
    }
  if (work.stage === 'collect')
    return {
      title: '사용한 컵을 회수하세요',
      action: `${STATIONS[work.station].name}에서 E로 컵을 집으세요.`,
      reason: '컵을 모두 세척대로 옮긴 뒤 얼룩을 닦아요.',
    }
  const ready = work.progress >= CLEANING_SECONDS[work.stage]

  return {
    title: work.stage === 'bag' ? '쓰레기를 정리하세요' : '얼룩을 닦으세요',
    action: cleaningAction(work, ready),
    reason: '손을 떼거나 자리를 떠나도 진행량은 남아 있어요.',
  }
}

function cleaningAction(work: Cleaning, ready: boolean) {
  if (ready) return work.clothHeld ? 'G로 천을 놓고 F로 정리를 확인하세요.' : 'F로 정리를 마치세요.'
  if (work.stage === 'wipe' && !work.clothHeld) return 'G로 청소용 천을 집으세요.'
  return 'Space나 작업 버튼을 누르고 있으면 진행돼요.'
}
