import { STATIONS } from '../content/stations'
import { cleaningHandsBusy } from '../features/cleaning/rules'
import { carriedBatch } from '../features/inventory/batches'
import { cupCount } from '../features/inventory/cups'
import { washingHandsBusy } from '../features/washing/rules'
import type { Action } from './actions'
import { say } from './feedback'
import { craftingHandsBusy } from './hands'
import type { WorkContext } from './work-context'

export function canDispatch(work: WorkContext, action: Action) {
  const s = work.state
  const fail = (text: string) => say(s, text, 'error')

  if (
    carriedBatch(s) &&
    ![
      'return-batch',
      'store-batch',
      'pos-add',
      'pos-update',
      'pos-remove',
      'pos-split',
      'pos-clear',
      'pos-pay',
      'pos-void',
      'close',
    ].includes(action.type)
  ) {
    fail('들고 있는 배합 용기를 보관하거나 원래 작업대에 먼저 내려놓아주세요.')
    return false
  }

  if (
    s.coldBrew?.tool &&
    ![
      'cold-tool',
      'cold-use',
      'cold-confirm',
      'discard-cold-brew',
      'pos-add',
      'pos-update',
      'pos-remove',
      'pos-split',
      'pos-clear',
      'pos-pay',
      'pos-void',
      'close',
    ].includes(action.type)
  ) {
    fail('콜드 브루 계량 도구를 G로 먼저 내려놓아주세요.')
    return false
  }

  if (
    s.supplyDelivery &&
    ![
      'place-supply',
      'return-supply',
      'pos-add',
      'pos-update',
      'pos-remove',
      'pos-split',
      'pos-clear',
      'pos-pay',
      'pos-void',
      'close',
    ].includes(action.type)
  ) {
    fail('들고 있는 소모품을 컨디먼트 바에 채우거나 창고에 먼저 내려놓아주세요.')
    return false
  }

  const cleaningAction = [
    'start-cleaning',
    'collect-cup',
    'drop-used-cups',
    'clean-tool',
    'clean-use',
    'clean-confirm',
    'leave-cleaning',
  ].includes(action.type)

  if (
    cleaningHandsBusy(s.cleaning) &&
    !cleaningAction &&
    !['pos-add', 'pos-update', 'pos-remove', 'pos-split', 'pos-clear', 'pos-pay', 'pos-void', 'close'].includes(
      action.type,
    )
  ) {
    fail(
      cupCount(s.cleaning!.heldCups)
        ? '회수한 컵을 세척대에 먼저 내려놓아주세요.'
        : `${STATIONS[s.cleaning!.station].name}에서 G로 청소용 천을 내려놓아주세요.`,
    )
    return false
  }

  if (cleaningAction && (craftingHandsBusy(s) || washingHandsBusy(s.washing))) {
    fail('컵과 제조·세척 도구를 먼저 내려놓은 뒤 청소해주세요.')
    return false
  }

  if (
    washingHandsBusy(s.washing) &&
    [
      'take-cup',
      'pick-cup',
      'tool',
      'use-start',
      'confirm-craft',
      'serve',
      'start-preparation',
      'prep-tool',
      'prep-use',
      'prep-confirm',
      'take-batch',
      'start-cold-brew',
      'cold-tool',
      'cold-use',
      'cold-confirm',
      'collect-cold-brew',
    ].includes(action.type)
  ) {
    fail(
      s.washing?.stage === 'carrying'
        ? '씻은 용기를 제자리에 먼저 놓아주세요.'
        : '세척대에서 G로 스펀지를 먼저 내려놓아주세요.',
    )
    return false
  }

  return true
}
