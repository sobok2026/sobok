import { staffStartPosition } from '../../content/stations'
import type { Action } from '../../simulation/actions'
import { say } from '../../simulation/feedback'
import { completeJobs } from '../../simulation/jobs'
import type { WorkContext } from '../../simulation/work-context'
import { createCustomer, customerLeave } from '../service/customer'
import { currentTicket } from '../service/orders'
import { closingTasks, emptyTotals } from './rules'

export function handleShiftActions(
  work: WorkContext,
  action: Extract<Action, { type: 'close' | 'finish' | 'next-day' }>,
) {
  const s = work.state
  const fail = (text: string) => say(s, text, 'error')

  switch (action.type) {
    case 'close':
      if (s.sale?.paidAt === null && s.sale.payments.length) {
        fail('진행 중인 결제를 완료하거나 취소한 뒤 마감해주세요.')
        break
      }

      s.phase = 'closing'

      if (s.customer && !s.customer.visit && !currentTicket(s)) {
        s.sale = null
        customerLeave(s.customer)
      }

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
      s.customer = createCustomer(s.orderNumber)
      s.sale = null
      s.totals = emptyTotals(s.cash)
      s.position = staffStartPosition()
      s.batches = s.batches.filter((b) => b.amount > 0)
      completeJobs(work)
      say(s, '새 근무일이에요. 냉장고의 라벨과 준비된 재료를 확인해주세요.', 'success')
      break
    }
  }
}
