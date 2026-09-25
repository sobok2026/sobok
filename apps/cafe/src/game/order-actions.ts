import type { Action } from './actions'
import { RECIPES, recipeLabel, staffStartPosition, tableIds } from './catalog'
import { cupKindFor, SERVICE_NAMES } from './cups'
import { createCustomer, customerLeave, customerToCondiment, customerToPickup } from './customer'
import { say } from './feedback'
import { completeJobs } from './jobs'
import { closingTasks, nextStep } from './progress'
import { emptyTotals } from './state'
import { CUSTOMER_HABITS } from './supplies'
import type { WorkContext } from './work-context'

export function handleOrderActions(
  work: WorkContext,
  action: Extract<Action, { type: 'ticket' | 'serve' | 'close' | 'finish' | 'next-day' }>,
) {
  const s = work.state
  const fail = (text: string) => say(s, text, 'error')
  switch (action.type) {
    case 'ticket':
      if (s.phase !== 'open' && !s.ticket) {
        fail('새 주문은 마감했어요.')
        break
      }
      if (s.cup) {
        fail('제조 중인 컵을 정리한 뒤 주문을 수정해주세요.')
        break
      }
      if (!s.customer || s.customer.visit || (!s.ticket && s.customer.stage !== 'ordering')) {
        fail(
          s.customer?.stage === 'entering'
            ? '손님이 POS에 도착하면 주문을 받아주세요.'
            : '응대 중인 손님이 나가면 다음 주문을 받을 수 있어요.',
        )
        break
      }
      s.ticket = { recipe: action.recipe, service: action.service }
      if (s.customer.stage === 'ordering') customerToPickup(s.customer)
      say(s, `${SERVICE_NAMES[action.service]} · ${recipeLabel(action.recipe)} 주문을 접수했어요.`, 'success')
      break
    case 'serve': {
      if (
        s.customer?.stage !== 'pickup' ||
        s.customer.visit ||
        s.customer.orderNumber !== s.orderNumber ||
        s.customer.recipe !== s.request
      ) {
        fail(
          s.customer?.stage === 'to-pickup'
            ? '손님이 픽업대로 오고 있어요. 도착하면 전달해주세요.'
            : '현재 주문의 손님이 픽업대에 도착해야 전달할 수 있어요.',
        )
        break
      }
      if (!s.ticket || !s.cup || nextStep(s)) {
        fail('아직 완성된 음료가 없어요.')
        break
      }
      if (s.cup.craft.location !== 'pickup' || s.cup.craft.tool || s.preparation?.tool) {
        fail('픽업대에 컵을 내려놓고 도구를 정리해주세요.')
        break
      }
      if (s.cup.craft.fault) {
        fail('계량이 맞지 않는 음료예요. 컵을 정리하고 다시 만들어주세요.')
        break
      }
      if (s.cup.recipe !== s.request || s.cup.craft.kind !== cupKindFor(s.request, s.customer.service)) {
        fail('손님이 요청한 메뉴 또는 매장·포장 컵과 달라요. 컵을 정리하고 POS 주문을 수정해주세요.')
        break
      }
      s.cash += RECIPES[s.cup.recipe].price
      s.totals.revenue += RECIPES[s.cup.recipe].price
      s.totals.served++
      s.ticket = null
      s.cup = null
      s.customer.visit = {
        table: s.customer.service === 'dine-in' ? tableIds[Math.floor(Math.random() * tableIds.length)] : null,
        returnCup: s.customer.service === 'dine-in' && Math.random() < CUSTOMER_HABITS.returnCup,
        dirtyTable: s.customer.service === 'dine-in' && Math.random() < CUSTOMER_HABITS.stain,
        dirtyReturn: s.customer.service === 'dine-in' && Math.random() < CUSTOMER_HABITS.stain,
        usesSugar: Math.random() < CUSTOMER_HABITS.sugar,
      }
      if (Math.random() < CUSTOMER_HABITS.stain) {
        s.dirtyBar = Math.min(3, s.dirtyBar + 1)
        if (s.cleaning?.station === 'mix') s.cleaning.progress = 0
      }
      customerToCondiment(s.customer)
      say(
        s,
        s.customer.service === 'takeout'
          ? '포장 손님이 음료를 받았어요. 소모품을 챙긴 뒤 나가요.'
          : '매장 손님이 음료를 받았어요. 소모품을 챙기고 테이블을 이용해요.',
        'success',
      )
      break
    }
    case 'close':
      s.phase = 'closing'
      if (s.customer && !s.customer.visit && !s.ticket) customerLeave(s.customer)
      say(s, '신규 주문을 마감했어요. 남은 주문과 정리 업무를 마쳐주세요.')
      break
    case 'finish': {
      const tasks = closingTasks(s)
      if (s.phase !== 'closing') {
        fail('POS에서 신규 주문을 먼저 마감해주세요.')
        break
      }
      if (tasks.length) {
        fail(`남은 업무: ${tasks.join(', ')}`)
        break
      }
      s.phase = 'summary'
      say(s, '오늘의 근무를 마쳤어요. 수고하셨습니다.', 'success')
      break
    }
    case 'next-day': {
      const next = Date.UTC(2026, 8, 1 + s.day, 9) / 1000
      s.day++
      s.time = Math.max(next, s.time + 3600)
      s.phase = 'open'
      s.customer = createCustomer(s.orderNumber, s.request)
      s.totals = emptyTotals(s.cash)
      s.position = staffStartPosition()
      s.batches = s.batches.filter((b) => b.amount > 0)
      completeJobs(work)
      say(s, '새 근무일이에요. 냉장고의 라벨과 준비된 재료를 확인해주세요.', 'success')
      break
    }
  }
}
