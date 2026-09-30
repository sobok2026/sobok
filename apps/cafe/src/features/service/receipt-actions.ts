import type { ReceiptAction } from '../../simulation/actions'
import { say } from '../../simulation/feedback'
import type { WorkContext } from '../../simulation/work-context'
import { transactionCash } from './transactions'

export function handleReceiptActions({ state }: WorkContext, action: ReceiptAction) {
  const transaction = state.transactions.find((item) => item.id === action.transactionId)
  if (!transaction) return

  if (action.type === 'pos-print-receipt') {
    if (transaction.printCount >= 100000) return
    transaction.printCount++
    transaction.lastPrintedAt = state.time
    return
  }

  if (!transactionCash(transaction)) {
    say(state, '현금 결제가 있는 거래에서 발행해주세요.', 'error')
    return
  }

  if (transaction.cashReceipts.some((receipt) => receipt.id === action.id)) return

  const validLastFour = action.kind === 'unissued' ? action.lastFour === null : /^\d{4}$/.test(action.lastFour ?? '')

  if (!validLastFour || !action.id || action.id.length > 100) {
    say(state, '현금영수증 발행 정보를 확인해주세요.', 'error')
    return
  }

  transaction.cashReceipts.push({
    id: action.id,
    kind: action.kind,
    lastFour: action.lastFour,
    issuedAt: state.time,
    amount: transactionCash(transaction),
  })
}
