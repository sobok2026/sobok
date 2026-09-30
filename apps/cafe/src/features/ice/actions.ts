import type { Action } from '../../simulation/actions'
import { say } from '../../simulation/feedback'
import { craftingHandsBusy } from '../../simulation/hands'
import type { WorkContext } from '../../simulation/work-context'
import { washingHandsBusy } from '../washing/rules'
import { ICE, iceKilograms, settleIce } from './rules'

export function handleIceActions(
  { state }: WorkContext,
  action: Extract<Action, { type: 'ice-toggle' | 'ice-take' | 'ice-fill' | 'ice-return' }>,
) {
  const ice = state.ice
  const fail = (text: string) => say(state, text, 'error')
  if (craftingHandsBusy(state) || washingHandsBusy(state.washing)) {
    fail('컵과 작업 도구를 내려놓고 얼음통을 다뤄주세요.')
    return
  }

  switch (action.type) {
    case 'ice-toggle':
      ice.enabled = !ice.enabled
      ice.cycleStartedAt = null
      settleIce(state)
      say(state, ice.enabled ? '자동 제빙을 켰어요. 저장고가 차면 자동으로 멈춰요.' : '제빙을 껐어요.')
      break
    case 'ice-take': {
      if (ice.bucketHeld) {
        fail('운반 중인 얼음통을 먼저 비워주세요.')
        return
      }
      if (ice.stored <= 0) {
        fail(ice.enabled ? '아직 꺼낼 얼음이 없어요. 제빙이 끝날 때까지 기다려주세요.' : '제빙기를 먼저 켜주세요.')
        return
      }

      ice.bucket = Math.min(ICE.bucketCapacity, ice.stored)
      ice.bucketHeld = true
      ice.stored -= ice.bucket
      settleIce(state)
      say(state, `얼음 ${iceKilograms(ice.bucket)}를 담았어요. 바 아이스 빈까지 운반해주세요.`)
      break
    }
    case 'ice-fill': {
      if (!ice.bucketHeld || ice.bucket <= 0) return
      const amount = Math.min(ice.bucket, ICE.barCapacity - ice.bar)
      if (amount <= 0) {
        fail('바 아이스 빈이 가득 찼어요. 남은 얼음은 제빙기 옆에서 버리고 통을 걸어주세요.')
        return
      }

      ice.bar += amount
      ice.bucket = Math.max(0, ice.bucket - amount)
      say(
        state,
        `아이스 빈에 ${iceKilograms(amount)} 보충했어요.${ice.bucket ? ' 남은 얼음이 통에 있어요.' : ' 빈 통을 제빙기 옆에 걸어주세요.'}`,
        'success',
      )
      break
    }
    case 'ice-return':
      if (!ice.bucketHeld) return
      say(
        state,
        ice.bucket > 0 ? '남은 얼음을 배수구에 비우고 운반통을 걸었어요.' : '빈 얼음통을 제빙기 옆에 걸었어요.',
      )
      ice.discarded += ice.bucket
      ice.bucket = 0
      ice.bucketHeld = false
      break
  }
}
