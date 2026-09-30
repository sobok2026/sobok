import { useState } from 'react'
import { money } from '../../shared/format'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { benefitsError } from './benefits'
import { CashReceiptForm } from './CashReceiptForm'
import { type PaymentInput, type PaymentMethod, paymentCaption, paymentMethods, paymentNames } from './checkout-model'
import { findPresentedMember } from './members'
import { orderUnserved } from './order-flow'
import { orderMatchesRequest, saleChange, salePaid, saleQuantity, saleTotal } from './orders'
import { PaymentForm } from './PaymentForm'
import { type BenefitView, PosBenefits } from './PosBenefits'
import { PosButton } from './PosControls'
import { paymentError } from './payments'
import { quoteSale } from './pricing'
import { ReceiptPreview } from './Receipt'
import { transactionCash } from './transactions'

export function PosCheckout({
  state,
  act,
  onBack,
  onClose,
}: {
  state: GameState
  act: (action: Action) => void
  onBack: () => void
  onClose: () => void
}) {
  const [benefitView, setBenefitView] = useState<BenefitView | null>(null)
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [allMethods, setAllMethods] = useState(false)
  const [error, setError] = useState('')
  const [receiptView, setReceiptView] = useState<'cash' | 'preview' | null>(null)
  const sale = state.sale
  const quote = quoteSale(sale)
  const benefitsEditable = !!sale && !sale.payments.length && sale.paidAt === null
  const benefitError = sale && sale.paidAt === null ? benefitsError(state, sale, sale.benefits) : null
  const total = saleTotal(sale)
  const paid = salePaid(sale)
  const remaining = total - paid
  const change = saleChange(sale)
  const complete = !!sale && sale.paidAt !== null
  const transaction = state.transactions.find((item) => item.id === sale?.customerId)
  const credit =
    sale?.payments.reduce((sum, payment) => sum + (payment.method === 'credit' ? payment.amount : 0), 0) ?? 0
  const collected = transaction?.settlements.reduce((sum, payment) => sum + payment.amount, 0) ?? 0
  const received = paid - credit + collected
  const needsCashReceipt = !!transaction && transactionCash(transaction) > 0 && !transaction.cashReceipts.length
  const showingCashReceipt = complete && (needsCashReceipt || receiptView === 'cash')
  const matches = orderMatchesRequest(state)
  const methods = allMethods
    ? paymentMethods
    : (['cash', 'card', 'gift-certificate', 'integrated', 'starbucks-card'] as const)

  function pay(payment: PaymentInput) {
    const error = benefitError ?? paymentError(state, payment, remaining)

    if (error) {
      setError(error)
      return
    }

    act({ type: 'pos-pay', ...payment })
    setMethod(null)
    setError('')
  }

  return (
    <div
      className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(10rem,0.75fr)_minmax(0,1.5fr)] gap-1.5"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && method) {
          event.preventDefault()
          event.stopPropagation()
          setMethod(null)
        }
      }}
    >
      <section className="flex min-h-0 flex-col rounded-md bg-white p-3 text-pos-ink" aria-label="결제 내역">
        <h2 className="mb-3 font-semibold">쿠폰 및 할인</h2>
        <div className="max-h-48 shrink-0 space-y-2 overflow-auto border-b border-pos-soft pb-3">
          {quote.lines.flatMap((line) =>
            line.discounts.map((detail) => (
              <div key={`${line.id}-${detail.label}`} className="flex justify-between gap-2 text-xs">
                <span>{detail.label}</span>
                <strong>−{money(detail.amount)}</strong>
              </div>
            )),
          )}
          {!quote.discount && <p className="text-xs text-pos-panel">적용된 할인이 없습니다.</p>}
        </div>
        <h2 className="my-3 font-semibold">결제수단</h2>
        <div className="min-h-0 flex-1 space-y-2 overflow-auto">
          {sale?.payments.map((payment) => (
            <div key={payment.id} className="border-b border-pos-soft pb-2 text-sm">
              <div className="flex flex-wrap justify-between gap-1">
                <span>{paymentCaption(payment)}</span>
                <strong className="tabular-nums">{money(payment.amount)}</strong>
              </div>
              {payment.installments > 0 && <p className="mt-1 text-xs">할부 {payment.installments}개월</p>}
              {payment.tendered > payment.amount && (
                <p className="mt-1 text-xs text-pos-panel">거스름돈 {money(payment.tendered - payment.amount)}</p>
              )}
              {!complete && (
                <button
                  type="button"
                  className="mt-2 text-xs text-danger underline underline-offset-2"
                  onClick={() => act({ type: 'pos-void', id: payment.id })}
                >
                  결제 취소
                </button>
              )}
            </div>
          ))}
        </div>
        <dl className="mt-4 space-y-3 border-t border-pos-soft pt-4 text-sm tabular-nums">
          {[
            ['받을금액', remaining],
            ['받은금액', received],
            ['거스름돈', change],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-1">
              <dt>{label}</dt>
              <dd>{Number(value).toLocaleString('ko-KR')}</dd>
            </div>
          ))}
        </dl>
        {credit > 0 && (
          <p className="mt-3 flex justify-between gap-2 text-sm text-pos-hot">
            <span>미수금</span>
            <strong>{money(credit - collected)}</strong>
          </p>
        )}
      </section>
      <section
        className="flex min-h-0 min-w-0 flex-col overflow-y-auto rounded-md bg-white p-4 text-pos-ink"
        aria-label={complete ? '결제 완료' : '결제수단 선택'}
      >
        {showingCashReceipt && transaction && (
          <CashReceiptForm transaction={transaction} act={act} onDone={() => setReceiptView(null)} />
        )}
        {complete && !showingCashReceipt && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <span
              className="grid size-18 place-items-center rounded-full bg-pos-active text-4xl text-white"
              aria-hidden="true"
            >
              ✓
            </span>
            <h2 className="text-2xl font-semibold">결제 완료</h2>
            <p className="text-sm">
              음료 {saleQuantity(sale)}잔 · 푸드 {sale?.foodLines.reduce((sum, line) => sum + line.quantity, 0) ?? 0}개
            </p>
            <p className="text-3xl font-semibold tabular-nums">{money(total)}</p>
            {change > 0 && <p className="text-lg text-danger">거스름돈 {money(change)}</p>}
            {transaction && (
              <div className="grid w-full grid-cols-2 gap-2">
                <PosButton onClick={() => setReceiptView('preview')}>영수증 보기</PosButton>
                <PosButton disabled={!transactionCash(transaction)} onClick={() => setReceiptView('cash')}>
                  현금영수증
                </PosButton>
              </div>
            )}
            <PosButton tone="active" onClick={onClose} className="mt-4 w-full min-h-14">
              {orderUnserved(sale) ? '제조하러 가기 →' : '매장으로 돌아가기 →'}
            </PosButton>
          </div>
        )}
        {!complete && method && (
          <PaymentForm
            key={method}
            state={state}
            method={method}
            remaining={remaining}
            onPay={pay}
            onBack={() => setMethod(null)}
            freeExtra={sale?.benefits.freeExtra}
            onFreeExtra={
              benefitsEditable
                ? (enabled) => {
                    if (!sale) return
                    const benefits = {
                      ...sale.benefits,
                      memberId: findPresentedMember(state)?.id ?? null,
                      freeExtra: enabled,
                    }
                    const error = benefitsError(state, sale, benefits)

                    if (error) setError(error)
                    else {
                      act({ type: 'pos-benefits', benefits })
                      setError('')
                    }
                  }
                : undefined
            }
            onCoupons={benefitsEditable ? () => setBenefitView('sr') : undefined}
          />
        )}
        {!complete && !method && (
          <>
            <h2 className="mb-2 font-semibold">쿠폰</h2>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <PosButton
                className="min-h-16 text-left"
                disabled={!benefitsEditable}
                onClick={() => setBenefitView('sr')}
              >
                SR 쿠폰
              </PosButton>
              <PosButton
                className="min-h-16 text-left"
                disabled={!benefitsEditable}
                onClick={() => setBenefitView('paper')}
              >
                종이쿠폰
              </PosButton>
            </div>
            <h2 className="mb-2 font-semibold">할인</h2>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <PosButton
                className="min-h-16 text-left"
                disabled={!benefitsEditable}
                aria-pressed={!!sale?.benefits.employee}
                onClick={() => setBenefitView('employee')}
              >
                임직원 할인
              </PosButton>
              <PosButton
                className="min-h-16 text-left"
                disabled={!benefitsEditable}
                aria-pressed={!!sale?.benefits.manual}
                onClick={() => setBenefitView('manual')}
              >
                금액/메뉴 할인
              </PosButton>
              <PosButton
                className="min-h-16 text-left"
                disabled={!benefitsEditable}
                aria-pressed={!!sale?.benefits.telecom}
                onClick={() => setBenefitView('telecom')}
              >
                통신사 제휴
              </PosButton>
            </div>
            {benefitError && (
              <p role="alert" className="mb-3 rounded bg-amber-100 p-3 text-sm">
                {benefitError}
              </p>
            )}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">결제</h2>
              <PosButton tone="dark" onClick={() => setAllMethods(!allMethods)}>
                {allMethods ? '접기' : '전체보기'}
              </PosButton>
            </div>
            {!matches && (
              <div className="mb-4 rounded bg-amber-100 p-3 text-sm" role="status">
                손님 요청과 주문 내역을 확인해주세요.
                <PosButton onClick={onBack} className="mt-3 w-full">
                  주문 확인
                </PosButton>
              </div>
            )}
            {sale?.acceptedAt != null && (
              <p className="mb-4 rounded bg-amber-100 p-3 text-sm">선제공 주문 · 남은 금액 {money(remaining)}</p>
            )}
            {remaining === 0 && sale && !sale.payments.length && (
              <PosButton
                tone="active"
                disabled={!matches || !!benefitError}
                onClick={() => act({ type: 'pos-complete' })}
              >
                0원 결제 완료
              </PosButton>
            )}
            <div className="grid grid-cols-2 gap-2">
              {methods.map((kind) => (
                <PosButton
                  key={kind}
                  disabled={
                    !sale ||
                    !matches ||
                    remaining <= 0 ||
                    !!benefitError ||
                    (!!sale.benefits.freeExtra && kind !== 'starbucks-card')
                  }
                  className="flex min-h-25 flex-col items-start justify-between gap-3 p-4 text-left"
                  onClick={() => {
                    setMethod(kind)
                    setError('')
                  }}
                >
                  <strong>{paymentNames[kind]}</strong>
                  <span className="self-end text-xs text-pos-panel">
                    {kind === 'starbucks-card' ? '잔액 · 회원 정보' : '선택 →'}
                  </span>
                </PosButton>
              ))}
            </div>
            <p className="mt-5 text-sm text-pos-panel">금액을 나누어 입력하면 여러 수단으로 결제할 수 있습니다.</p>
            <PosButton tone="dark" className="mt-auto min-h-12" onClick={onBack}>
              ← 주문으로 돌아가기
            </PosButton>
          </>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
        {!complete && !method && sale?.benefits.freeExtra && benefitsEditable && (
          <PosButton
            className="mt-2"
            onClick={() => act({ type: 'pos-benefits', benefits: { ...sale.benefits, freeExtra: false } })}
          >
            Free Extra 해제 · 다른 수단으로 결제
          </PosButton>
        )}
      </section>
      {benefitView && <PosBenefits state={state} act={act} view={benefitView} onClose={() => setBenefitView(null)} />}
      {transaction && receiptView === 'preview' && (
        <ReceiptPreview transaction={transaction} act={act} onClose={() => setReceiptView(null)} />
      )}
    </div>
  )
}
