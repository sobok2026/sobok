import clsx from 'clsx'
import { useRef, useState } from 'react'
import { money } from '../../shared/format'
import { uid } from '../../shared/id'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { orderMatchesRequest, saleChange, salePaid, saleQuantity, saleTotal } from './orders'
import { NumericPad, PosButton } from './PosControls'

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
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [value, setValue] = useState('')
  const [recognized, setRecognized] = useState(false)
  const [error, setError] = useState('')
  const attempt = useRef('')

  const sale = state.sale
  const total = saleTotal(sale),
    paid = salePaid(sale),
    remaining = total - paid,
    change = saleChange(sale)
  const complete = !!sale && sale.paidAt !== null
  const matches = orderMatchesRequest(state)

  const pay = () => {
    if (!method || complete) {
      return
    }
    const tendered = Number(value)

    if (!Number.isSafeInteger(tendered) || tendered <= 0 || (method === 'card' && tendered > remaining)) {
      setError('결제 금액을 확인해주세요.')
      return
    }

    if (method === 'card' && !recognized) {
      setError('카드를 먼저 인식해주세요.')
      return
    }

    act({ type: 'pos-pay', id: attempt.current, method, tendered })
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
        <h2 className="mb-3 font-semibold">결제수단</h2>
        <div className="min-h-0 flex-1 space-y-2 overflow-auto">
          {sale?.payments.map((payment) => (
            <div key={payment.id} className="border-b border-pos-soft pb-2 text-sm">
              <div className="flex flex-wrap justify-between gap-1">
                <span>{payment.method === 'cash' ? '현금' : '신용카드'}</span>
                <strong className="tabular-nums">{money(payment.amount)}</strong>
              </div>
              {payment.tendered > payment.amount && (
                <p className="mt-1 text-xs text-pos-panel">거스름돈 {money(payment.tendered - payment.amount)}</p>
              )}
              {!complete && (
                <button
                  type="button"
                  className="mt-2 text-xs text-danger underline underline-offset-2"
                  onClick={() => act({ type: 'pos-void', id: payment.id })}
                  aria-label={`${payment.method === 'cash' ? '현금' : '카드'} ${payment.amount}원 결제 취소`}
                >
                  결제 취소
                </button>
              )}
            </div>
          ))}
        </div>
        <dl className="mt-4 space-y-3 border-t border-pos-soft pt-4 text-sm tabular-nums">
          <div className="flex justify-between gap-1">
            <dt>받을금액</dt>
            <dd className="font-semibold">{remaining.toLocaleString('ko-KR')}</dd>
          </div>
          <div className="flex justify-between gap-1">
            <dt>받은금액</dt>
            <dd>{paid.toLocaleString('ko-KR')}</dd>
          </div>
          <div className="flex justify-between gap-1">
            <dt>거스름돈</dt>
            <dd>{change.toLocaleString('ko-KR')}</dd>
          </div>
        </dl>
      </section>
      <section
        className="flex min-h-0 min-w-0 flex-col overflow-y-auto rounded-md bg-white p-4 text-pos-ink"
        aria-label={checkoutLabel(complete, method)}
      >
        {complete && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <span
              className="grid size-18 place-items-center rounded-full bg-pos-active text-4xl text-white"
              aria-hidden="true"
            >
              ✓
            </span>
            <h2 className="text-2xl font-semibold">결제 완료</h2>
            <p className="text-sm">음료 {saleQuantity(sale)}잔 · 제조 주문이 접수되었습니다.</p>
            <p className="text-3xl font-semibold tabular-nums">{money(total)}</p>
            {change > 0 && <p className="text-lg text-danger">거스름돈 {money(change)}</p>}
            <PosButton tone="active" onClick={onClose} className="mt-4 w-full min-h-14">
              제조하러 가기 →
            </PosButton>
          </div>
        )}
        {!complete && method && (
          <form
            className="flex min-h-full flex-col gap-3 pos-compact:gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              pay()
            }}
          >
            <div className="flex items-center gap-3">
              <PosButton onClick={() => setMethod(null)} aria-label="결제수단으로 돌아가기">
                ←
              </PosButton>
              <h2 className="text-lg font-semibold">{method === 'cash' ? '현금결제' : '신용카드 결제'}</h2>
            </div>
            {method === 'card' && (
              <div className="grid grid-cols-2 gap-2">
                <PosButton
                  tone="active"
                  onClick={() => {
                    setRecognized(true)
                    setError('')
                  }}
                >
                  리더기 / 스캐너
                </PosButton>
                <div role="status" className="flex items-center justify-center rounded bg-pos-soft px-2 text-sm">
                  {recognized ? '카드 인식 완료' : '카드를 인식해주세요'}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 bg-control p-3 pos-compact:p-2">
              <span className="text-sm">받을금액</span>
              <strong className="text-xl text-pos-hot tabular-nums">{remaining.toLocaleString('ko-KR')}</strong>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <span className="shrink-0">{method === 'cash' ? '받은 현금' : '결제금액'}</span>
              <input
                aria-label={method === 'cash' ? '받은 현금' : '카드 결제금액'}
                inputMode="numeric"
                value={value}
                onChange={(event) => {
                  if (/^\d{0,8}$/.test(event.target.value)) {
                    setValue(event.target.value)
                  }
                }}
                className={clsx(
                  'min-h-12 min-w-0 flex-1',
                  'rounded border-2 border-pos-active bg-amber-100 px-3 text-right text-xl tabular-nums',
                  'pos-compact:min-h-10',
                )}
              />
            </label>
            <div className="mx-auto w-full max-w-sm">
              <NumericPad
                money={method === 'cash'}
                value={value}
                onChange={setValue}
                onConfirm={() => {
                  if (!value) {
                    setValue(String(remaining))
                  } else if (
                    !Number.isSafeInteger(Number(value)) ||
                    Number(value) <= 0 ||
                    (method === 'card' && Number(value) > remaining)
                  ) {
                    setError('결제 금액을 확인해주세요.')
                  } else {
                    setValue(String(Number(value)))
                    setError('')
                  }
                }}
              />
            </div>
            <div className="min-h-6 text-sm pos-compact:min-h-5" aria-live="polite">
              {error ? (
                <span role="alert" className="text-danger">
                  {error}
                </span>
              ) : (
                paymentNote(method, Number(value), remaining)
              )}
            </div>
            <PosButton
              tone="active"
              disabled={!matches || !value || (method === 'card' && !recognized)}
              onClick={pay}
              className="mt-auto min-h-13 text-lg pos-compact:min-h-11"
            >
              결제
            </PosButton>
          </form>
        )}
        {!complete && !method && (
          <>
            <h2 className="mb-5 text-lg font-semibold">결제</h2>
            {!matches && (
              <div className="mb-5 rounded bg-amber-100 p-3 text-sm" role="status">
                손님 요청과 주문 내역을 확인해주세요.
                <PosButton onClick={onBack} className="mt-3 w-full">
                  주문 확인
                </PosButton>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {(['cash', 'card'] as const).map((kind) => (
                <PosButton
                  key={kind}
                  disabled={!sale || !matches}
                  className="flex min-h-44 flex-col items-start justify-between p-4 text-lg"
                  onClick={() => {
                    attempt.current = uid()
                    setMethod(kind)
                    setValue(String(remaining))
                    setRecognized(false)
                    setError('')
                  }}
                >
                  <span>{kind === 'cash' ? '현금' : '신용카드'}</span>
                  <span aria-hidden="true" className="self-end text-5xl font-normal text-pos-panel">
                    {kind === 'cash' ? '₩' : '▰'}
                  </span>
                </PosButton>
              ))}
            </div>
            <p className="mt-5 text-sm text-pos-panel">결제금액을 나누어 입력하면 여러 수단으로 결제할 수 있습니다.</p>
            <PosButton tone="dark" className="mt-auto min-h-12" onClick={onBack}>
              ← 주문으로 돌아가기
            </PosButton>
          </>
        )}
      </section>
    </div>
  )
}

type PaymentMethod = 'cash' | 'card'

function checkoutLabel(complete: boolean, method: PaymentMethod | null) {
  if (complete) {
    return '결제 완료'
  }
  if (method === 'cash') {
    return '현금결제'
  }
  return method === 'card' ? '신용카드 결제' : '결제수단 선택'
}

function paymentNote(method: PaymentMethod, tendered: number, remaining: number) {
  if (method === 'cash' && tendered > remaining) {
    return `거스름돈 ${money(tendered - remaining)}`
  }
  if (tendered > 0 && tendered < remaining) {
    return `결제 후 남은 금액 ${money(remaining - tendered)}`
  }
  return ''
}
