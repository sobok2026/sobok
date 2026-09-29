import { useState } from 'react'
import { money } from '../../shared/format'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { CashReceiptForm } from './CashReceiptForm'
import { PosButton, PosDialog } from './PosControls'
import { Receipt, ReceiptPreview } from './Receipt'
import {
  cashReceiptLabel,
  receiptItemName,
  receiptNumber,
  receiptTime,
  transactionCash,
  transactionTotal,
} from './transactions'

export function TransactionHistory({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const [today, setToday] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<'cash-receipt' | 'print' | null>(null)

  const transactions = [...state.transactions]
    .reverse()
    .filter(
      (transaction) =>
        (!today || transaction.day === state.day) &&
        (!query ||
          receiptNumber(transaction).includes(query) ||
          transaction.lines.some((line) => receiptItemName(line.name).includes(query))),
    )
  const selected = transactions.find((transaction) => transaction.id === selectedId) ?? transactions[0]
  const total = transactions.reduce((sum, transaction) => sum + transactionTotal(transaction), 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <PosButton aria-pressed={today} onClick={() => setToday(true)}>
          오늘
        </PosButton>
        <PosButton aria-pressed={!today} onClick={() => setToday(false)}>
          전체 기간
        </PosButton>
        <input
          aria-label="거래 검색"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="거래 번호 · 상품명 검색"
          className="min-h-10 min-w-0 flex-1 rounded border border-pos-soft px-3 text-sm"
        />
        <span className="text-sm tabular-nums">
          {transactions.length}건 · {money(total)}
        </span>
      </div>
      {!selected && <p className="py-16 text-center text-sm text-pos-panel">조회할 거래가 없습니다.</p>}
      {selected && (
        <div className="grid grid-cols-[minmax(11rem,0.85fr)_minmax(0,1.4fr)] gap-4 max-md:grid-cols-1">
          <section className="max-h-120 space-y-2 overflow-y-auto" aria-label="거래 목록">
            {transactions.map((transaction) => (
              <PosButton
                key={transaction.id}
                aria-pressed={selected.id === transaction.id}
                className="w-full text-left"
                onClick={() => {
                  setSelectedId(transaction.id)
                  setForm(null)
                }}
              >
                <span className="block">
                  주문 {String(transaction.orderNumber).padStart(3, '0')} · {transaction.day}일차
                </span>
                <span className="mt-1 block text-xs">{receiptTime(transaction.paidAt)}</span>
                <span className="mt-2 block text-right tabular-nums">{money(transactionTotal(transaction))}</span>
                <span className="mt-1 block text-xs">{cashReceiptLabel(transaction)}</span>
              </PosButton>
            ))}
          </section>
          <div className="min-w-0">
            <div className="max-h-96 overflow-auto rounded border border-pos-soft">
              <Receipt transaction={selected} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <PosButton tone="dark" onClick={() => setForm('print')}>
                영수증 {selected.printCount ? '재출력' : '출력'}
              </PosButton>
              <PosButton tone="active" disabled={!transactionCash(selected)} onClick={() => setForm('cash-receipt')}>
                현금영수증
              </PosButton>
            </div>
            <details className="mt-3 text-xs">
              <summary className="text-pos-panel">발행·출력 이력</summary>
              <div className="mt-2 space-y-2">
                {selected.cashReceipts.map((receipt) => (
                  <p key={receipt.id} className="flex flex-wrap justify-between gap-2 tabular-nums">
                    <span>
                      {{ personal: '소득공제', business: '지출증빙', unissued: '미발행' }[receipt.kind]}{' '}
                      {receipt.lastFour && `**** ${receipt.lastFour}`}
                    </span>
                    <span>{receiptTime(receipt.issuedAt)}</span>
                  </p>
                ))}
                <p>
                  출력 요청 {selected.printCount}회
                  {selected.lastPrintedAt !== null && ` · 마지막 ${receiptTime(selected.lastPrintedAt)}`}
                </p>
              </div>
            </details>
          </div>
        </div>
      )}
      {selected && form === 'cash-receipt' && (
        <PosDialog title="현금영수증 발행" onClose={() => setForm(null)}>
          <CashReceiptForm key={selected.id} transaction={selected} act={act} onDone={() => setForm(null)} />
        </PosDialog>
      )}
      {selected && form === 'print' && (
        <ReceiptPreview transaction={selected} act={act} onClose={() => setForm(null)} />
      )}
    </div>
  )
}
