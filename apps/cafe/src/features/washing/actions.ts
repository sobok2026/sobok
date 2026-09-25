import { uid } from '../../shared/id'
import type { Action } from '../../simulation/actions'
import { say } from '../../simulation/feedback'
import { craftingHandsBusy } from '../../simulation/hands'
import type { WorkContext } from '../../simulation/work-context'
import { WASH_NAMES, WASH_STEPS, washDestination, washStock } from './rules'

export function handleWashingActions(
  work: WorkContext,
  action: Extract<
    Action,
    { type: 'wash' | 'wash-tool' | 'wash-use' | 'wash-confirm' | 'take-washed' | 'leave-wash' | 'store-washed' }
  >,
) {
  const s = work.state
  const fail = (text: string) => say(s, text, 'error')
  switch (action.type) {
    case 'wash':
      if (s.washing) {
        fail('세척 중인 용기를 먼저 마무리하거나 세척대에 내려놓아주세요.')
        break
      }
      if (craftingHandsBusy(s)) {
        fail('컵과 제조 도구를 바에 내려놓은 뒤 세척해주세요.')
        break
      }
      if (!washStock(s, action.item).dirty) {
        fail('씻을 용기가 없어요.')
        break
      }
      washStock(s, action.item).dirty--
      s.washing = { id: uid(), item: action.item, stage: 'scrub', progress: 0, spongeHeld: false }
      say(s, `${WASH_NAMES[action.item]}를 세척대에 놓았어요.`)
      break
    case 'wash-tool':
      if (s.washing?.stage !== 'scrub') break
      if (craftingHandsBusy(s)) {
        fail('컵과 제조 도구를 먼저 내려놓아주세요.')
        break
      }
      s.washing.spongeHeld = !s.washing.spongeHeld
      say(s, s.washing.spongeHeld ? '스펀지를 집었어요.' : '스펀지를 내려놓았어요.')
      break
    case 'wash-use': {
      const washing = s.washing
      if (!washing || !['scrub', 'rinse'].includes(washing.stage)) break
      if (craftingHandsBusy(s)) {
        fail('컵과 제조 도구를 먼저 내려놓아주세요.')
        break
      }
      if (washing.stage === 'scrub' && !washing.spongeHeld) {
        fail('G로 스펀지를 먼저 집어주세요.')
        break
      }
      work.input = { kind: 'wash', washingId: washing.id, stage: washing.stage as 'scrub' | 'rinse', station: 'wash' }
      break
    }
    case 'wash-confirm': {
      const washing = s.washing
      if (!washing || (washing.stage !== 'scrub' && washing.stage !== 'rinse')) break
      if (craftingHandsBusy(s)) {
        fail('컵과 제조 도구를 먼저 내려놓아주세요.')
        break
      }
      if (washing.spongeHeld) {
        fail('G로 스펀지를 내려놓은 뒤 확인해주세요.')
        break
      }
      if (washing.progress < WASH_STEPS[washing.stage].seconds) {
        fail('아직 세척이 덜 끝났어요. 누르고 작업을 이어가세요.')
        break
      }
      if (washing.stage === 'scrub') {
        washing.stage = 'rinse'
        washing.progress = 0
        say(s, '문지르기를 마쳤어요.', 'success')
      } else {
        washing.stage = 'ready'
        washing.progress = 0
        washStock(s, washing.item).washed++
        s.totals.washed++
        say(s, `${WASH_NAMES[washing.item]}를 깨끗하게 씻었어요.`, 'success')
      }
      break
    }
    case 'take-washed':
      if (s.washing && s.washing.stage !== 'ready') {
        fail('세척 중인 용기를 먼저 마무리해주세요.')
        break
      }
      if (craftingHandsBusy(s)) {
        fail('컵과 제조 도구를 내려놓으면 용기를 집을 수 있어요.')
        break
      }
      if (s.washing && s.washing.item !== action.item) {
        fail('세척 중인 용기를 먼저 정리해주세요.')
        break
      }
      if (!washStock(s, action.item).washed) {
        fail('씻은 용기가 없어요. 먼저 세척해주세요.')
        break
      }
      washStock(s, action.item).washed--
      s.washing = { id: uid(), item: action.item, stage: 'carrying', progress: 0, spongeHeld: false }
      say(s, `씻은 ${WASH_NAMES[action.item]}를 집었어요.`)
      break
    case 'leave-wash':
      if (!s.washing) break
      if (s.washing.stage === 'carrying') washStock(s, s.washing.item).washed++
      else if (s.washing.stage !== 'ready') washStock(s, s.washing.item).dirty++
      s.washing = null
      say(s, '용기를 세척대에 내려놓았어요. 미완료 세척은 다시 시작해야 해요.')
      break
    case 'store-washed':
      if (s.washing?.stage !== 'carrying' || action.station !== washDestination(s.washing.item)) {
        fail('씻은 피처는 도구 선반에, 다회용 컵은 컵 보관대에 가져와주세요.')
        break
      }
      washStock(s, s.washing.item).clean++
      s.washing = null
      say(s, '씻은 용기를 정리했어요. 이제 다시 사용할 수 있어요.', 'success')
      break
  }
}
