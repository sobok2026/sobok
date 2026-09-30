import { createPortal } from 'react-dom'
import { money } from '../../shared/format'
import type { Action } from '../../simulation/actions'
import type { Transaction } from '../../simulation/state'
import { paymentCaption } from './checkout-model'
import { PosButton, PosDialog } from './PosControls'
import { outstandingCredit } from './payments'
import {
  cashReceiptLabel,
  receiptItemName,
  receiptNumber,
  receiptTime,
  transactionCash,
  transactionTotal,
} from './transactions'

export function Receipt({ transaction }: { transaction: Transaction }) {
  const receipt = transaction.cashReceipts.at(-1)
  const change = [...transaction.payments, ...transaction.settlements].reduce(
    (sum, payment) => sum + payment.tendered - payment.amount,
    0,
  )

  return (
    <article className="mx-auto w-full max-w-sm bg-white p-5 text-sm text-pos-ink" aria-label="영수증 내용">
      <header className="mb-5 text-center">
        <p className="text-xl font-bold tracking-widest">소복다방</p>
        <h3 className="mt-2 font-semibold">소복점 · 영수증</h3>
        <p className="mt-2 text-xs tabular-nums">{receiptTime(transaction.paidAt)}</p>
        <p className="mt-1 text-xs">거래 번호 {receiptNumber(transaction)}</p>
      </header>
      <div className="space-y-4 border-y border-dashed border-pos-panel py-4">
        {transaction.lines.map((line) => (
          <div key={line.id}>
            <div className="flex justify-between gap-4 font-semibold">
              <span>{receiptItemName(line.name)}</span>
              <span className="shrink-0 tabular-nums">
                {money(line.unitPrice * line.quantity - line.discount + line.deposit)}
              </span>
            </div>
            <p className="mt-1 text-xs">{line.specification}</p>
            <p className="mt-1 text-xs tabular-nums">
              {money(line.unitPrice)} × {line.quantity}
            </p>
            {line.customizations.map((label, index) => (
              <p key={`${index}-${label}`} className="mt-1 text-xs">
                + {label}
              </p>
            ))}
            {line.discounts.map((detail, index) => (
              <p key={index} className="mt-1 flex justify-between gap-2 text-xs text-pos-panel">
                <span>{detail.label}</span>
                <span>−{money(detail.amount)}</span>
              </p>
            ))}
            {line.deposit > 0 && <p className="mt-1 text-xs">컵보증금 {money(line.deposit)}</p>}
          </div>
        ))}
      </div>
      <div className="flex justify-between py-4 text-lg font-semibold tabular-nums">
        <span>합계</span>
        <span>{money(transactionTotal(transaction))}</span>
      </div>
      <dl className="space-y-2 border-b border-dashed border-pos-panel pb-4">
        {transaction.payments.map((payment, index) => (
          <div key={payment.id} className="flex justify-between gap-4">
            <dt>
              {index + 1}. {paymentCaption(payment)}
            </dt>
            <dd className="tabular-nums">{money(payment.amount)}</dd>
          </div>
        ))}
        {change > 0 && (
          <div className="flex justify-between gap-4">
            <dt>거스름돈</dt>
            <dd className="tabular-nums">{money(change)}</dd>
          </div>
        )}
      </dl>
      {transaction.payments.some((payment) => payment.method === 'credit') && (
        <section className="mt-4 border-b border-dashed border-pos-panel pb-4 text-sm">
          <h4 className="font-semibold">외상 정산</h4>
          {transaction.settlements.map((payment) => (
            <p key={payment.id} className="mt-2 flex justify-between gap-2">
              <span>
                {paymentCaption(payment)}
                <small className="block text-xs text-pos-panel">{receiptTime(payment.at)}</small>
              </span>
              <span>{money(payment.amount)}</span>
            </p>
          ))}
          <p className="mt-3 flex justify-between gap-2 font-semibold">
            <span>미수금</span>
            <span>{money(outstandingCredit(transaction))}</span>
          </p>
        </section>
      )}
      {transactionCash(transaction) > 0 && (
        <div className="mt-4 space-y-1 text-xs">
          <p className="font-semibold">현금영수증 · {cashReceiptLabel(transaction)}</p>
          {receipt && receipt.kind !== 'unissued' && (
            <p>
              발행금액 {money(receipt.amount)} · {receiptTime(receipt.issuedAt)}
            </p>
          )}
        </div>
      )}
      <footer className="mt-6 text-center text-xs text-pos-panel">
        이용해 주셔서 감사합니다.
        <br />
        소복다방 · 게임 내 거래 기록
      </footer>
    </article>
  )
}

export function ReceiptPreview({
  transaction,
  act,
  onClose,
}: {
  transaction: Transaction
  act: (action: Action) => void
  onClose: () => void
}) {
  return (
    <>
      <PosDialog title="영수증 미리보기" onClose={onClose}>
        <Receipt transaction={transaction} />
        <PosButton
          tone="active"
          className="mt-4 w-full"
          onClick={() => {
            act({ type: 'pos-print-receipt', transactionId: transaction.id })
            window.print()
          }}
        >
          {transaction.printCount ? '영수증 재출력' : '영수증 출력'}
        </PosButton>
        {transaction.printCount > 0 && (
          <p className="mt-2 text-center text-xs text-pos-panel">출력 요청 {transaction.printCount}회</p>
        )}
      </PosDialog>
      {createPortal(
        <div id="cafe-receipt-print">
          <Receipt transaction={transaction} />
        </div>,
        document.body,
      )}
    </>
  )
}
