import { useState } from 'react'
import { money } from '../../shared/format'
import { uid } from '../../shared/id'
import type { GameState } from '../../simulation/state'
import { type PaymentInput, type PaymentMethod, paymentAllowsChange, paymentNames } from './checkout-model'
import { cardOwner, findPresentedMember, maskedCard } from './members'
import { NumericPad, PosButton } from './PosControls'
import { paymentError } from './payments'

const creditTypes = ['일반신용', '신한제휴', '은련카드', '삼성블루 아멕스'] as const
const giftValues = [5000, 10000, 50000, 100000, 300000, 500000]
const integratedTypes = ['바코드', 'QR', 'IC카드'] as const

export function PaymentForm({
  state,
  method,
  remaining,
  onPay,
  onBack,
  freeExtra,
  onFreeExtra,
  onCoupons,
  creditSettlement = false,
  memberId,
}: {
  state: GameState
  method: PaymentMethod
  remaining: number
  onPay: (payment: PaymentInput) => void
  onBack: () => void
  freeExtra?: boolean
  onFreeExtra?: (enabled: boolean) => void
  onCoupons?: () => void
  creditSettlement?: boolean
  memberId?: string | null
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const [recognized, setRecognized] = useState(false)
  const [cardId, setCardId] = useState<string | null>(null)
  const [cardType, setCardType] = useState<string>('일반신용')
  const [integratedType, setIntegratedType] = useState<string>('바코드')
  const [installments, setInstallments] = useState(0)
  const presented =
    memberId === undefined ? findPresentedMember(state) : state.members.find((member) => member.id === memberId)
  const [debtor, setDebtor] = useState(presented?.nickname ?? `주문 ${state.orderNumber}`)
  const [error, setError] = useState('')
  const [keypad, setKeypad] = useState(method === 'cash')
  const [attempt] = useState(uid)
  const account = cardId ? cardOwner(state, cardId) : null
  const displayedAmount = method === 'gift-certificate' ? 5000 : remaining
  const value = draft ?? String(displayedAmount)
  const tendered = Number(value)
  const isCard = method === 'card'
  const isStoredCard = method === 'starbucks-card'

  function input(): PaymentInput {
    let label = paymentNames[method]
    if (method === 'credit') label = debtor.trim()
    if (method === 'card') label = `신용카드 · ${cardType}`
    if (method === 'integrated') label = `통합결제 · ${integratedType}`
    if (isStoredCard && account) label = `소복다방 카드 · ${maskedCard(account.card.number)}`

    return {
      id: attempt,
      method,
      tendered,
      label,
      reference: recognized ? `GAME-${method}-${state.orderNumber}` : null,
      cardId: isStoredCard ? cardId : null,
      installments: isCard && tendered >= 50000 ? installments : 0,
    }
  }

  function scan() {
    if (isStoredCard) {
      const card = presented?.cards[0]

      if (!card) {
        setError('손님이 제시할 수 있는 카드가 없어요.')
        return
      }

      setCardId(card.id)
    }

    setRecognized(true)
    setError('')
  }

  function pay() {
    const payment = input()
    const error = paymentError(state, payment, remaining)

    if (error) {
      setError(error)
      return
    }

    if (method === 'credit' && !payment.label) {
      setError('후불 계정명을 입력해주세요.')
      return
    }

    onPay(payment)
  }

  return (
    <form
      className="flex min-h-full flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        pay()
      }}
    >
      <div className="flex items-center gap-3">
        <PosButton onClick={onBack} aria-label="결제수단으로 돌아가기">
          ←
        </PosButton>
        <h2 className="text-lg font-semibold">
          {paymentNames[method]} {creditSettlement ? '정산' : '결제'}
        </h2>
      </div>
      {isCard && (
        <fieldset className="grid grid-cols-4 gap-1" aria-label="신용카드 종류">
          {creditTypes.map((type) => (
            <PosButton
              key={type}
              aria-pressed={cardType === type}
              onClick={() => {
                setCardType(type)
                setRecognized(false)
              }}
            >
              {type}
            </PosButton>
          ))}
        </fieldset>
      )}
      {method === 'integrated' && (
        <fieldset className="grid grid-cols-3 gap-1" aria-label="통합결제 방식">
          {integratedTypes.map((type) => (
            <PosButton
              key={type}
              aria-pressed={integratedType === type}
              onClick={() => {
                setIntegratedType(type)
                setRecognized(false)
              }}
            >
              {type}
            </PosButton>
          ))}
        </fieldset>
      )}
      {!['cash', 'credit'].includes(method) && (
        <div className="grid grid-cols-2 gap-2">
          <PosButton tone="active" onClick={scan}>
            리더기 / 스캐너
          </PosButton>
          <p role="status" className="flex items-center justify-center rounded bg-pos-soft px-2 text-sm">
            {readerLabel(recognized, account?.card.number)}
          </p>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 rounded bg-control px-3 py-3">
        <span className="text-sm">받을금액</span>
        <strong className="text-2xl text-pos-hot tabular-nums">{remaining.toLocaleString('ko-KR')}</strong>
      </div>
      {isStoredCard && (
        <>
          <div className="flex items-center justify-between gap-3 rounded bg-control px-3 py-3">
            <span className="text-sm">카드잔액</span>
            <strong className="text-xl tabular-nums">{account ? money(account.card.balance) : '—'}</strong>
          </div>
          {account && (
            <div className="rounded border border-pos-soft p-3 text-sm">
              <p>
                닉네임 <strong className="ml-2 text-pos-active">{account.member.nickname}</strong> · 등급{' '}
                {account.member.level}
              </p>
              <p className="mt-2">
                별 {account.member.stars}개 · 개인컵{' '}
                {account.member.ecoReward === 'discount' ? '400원 할인' : '에코별 적립'}
              </p>
            </div>
          )}
          {onFreeExtra && (
            <label className="flex items-center justify-between gap-3 rounded border border-pos-soft p-3 text-sm">
              Free Extra
              <input
                type="checkbox"
                checked={!!freeExtra}
                disabled={!recognized}
                onChange={(event) => {
                  setDraft(null)
                  onFreeExtra(event.target.checked)
                }}
                className="size-5 accent-pos-active"
              />
            </label>
          )}
          {onCoupons && <PosButton onClick={onCoupons}>보유 쿠폰 보기</PosButton>}
        </>
      )}
      {method === 'credit' && (
        <label className="grid gap-2 text-sm">
          후불 계정
          <input
            aria-label="후불 계정"
            value={debtor}
            maxLength={80}
            onChange={(event) => setDebtor(event.target.value)}
            className="min-h-12 rounded border border-pos-soft px-3"
          />
        </label>
      )}
      {method === 'gift-certificate' && (
        <fieldset className="grid grid-cols-3 gap-2">
          <legend className="mb-2 text-sm">상품권 권종</legend>
          {giftValues.map((amount) => (
            <PosButton key={amount} aria-pressed={tendered === amount} onClick={() => setDraft(String(amount))}>
              {money(amount)}
            </PosButton>
          ))}
        </fieldset>
      )}
      {method !== 'gift-certificate' && (
        <label className="grid gap-2 text-sm">
          {method === 'cash' ? '받은 현금' : '결제금액'}
          <input
            aria-label={method === 'cash' ? '받은 현금' : '결제금액'}
            inputMode="numeric"
            value={value}
            onChange={(event) => {
              if (/^\d{0,8}$/.test(event.target.value)) setDraft(event.target.value)
            }}
            className="min-h-13 rounded border-2 border-pos-active bg-amber-100 px-3 text-right text-xl tabular-nums"
          />
        </label>
      )}
      {isCard && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <p className="rounded bg-control p-3">유효기간 · **년 **월</p>
          <label className="flex items-center justify-between gap-2 rounded bg-control px-3">
            할부개월
            <select
              aria-label="할부개월"
              value={tendered >= 50000 ? installments : 0}
              disabled={tendered < 50000}
              onChange={(event) => setInstallments(Number(event.target.value))}
              className="min-h-12 bg-transparent"
            >
              {[0, 2, 3, 6, 10, 12, 24].map((months) => (
                <option key={months} value={months}>
                  {months ? `${months}개월` : '일시불'}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {method !== 'gift-certificate' && method !== 'cash' && (
        <PosButton onClick={() => setKeypad(!keypad)}>{keypad ? '숫자 키패드 접기' : '숫자 키패드'}</PosButton>
      )}
      {keypad && method !== 'gift-certificate' && (
        <div className="mx-auto w-full max-w-sm">
          <NumericPad
            value={value}
            onChange={setDraft}
            onConfirm={() => {
              if (!value) setDraft(String(remaining))
            }}
            money={method === 'cash'}
          />
        </div>
      )}
      <p className="min-h-6 text-sm text-pos-panel" role={error ? 'alert' : 'status'}>
        {error || paymentSummary(method, tendered, remaining)}
      </p>
      <PosButton
        tone="active"
        disabled={!value || (!['cash', 'credit'].includes(method) && !recognized)}
        onClick={pay}
        className="mt-auto min-h-13 text-lg"
      >
        {method === 'credit' ? '외상으로 접수' : '결제'}
      </PosButton>
    </form>
  )
}

function readerLabel(recognized: boolean, number?: string) {
  if (!recognized) return '결제수단을 인식해주세요'
  return number ? maskedCard(number) : '인식 완료 · ···· 0000'
}

function paymentSummary(method: PaymentMethod, tendered: number, remaining: number) {
  if (!Number.isFinite(tendered) || tendered <= 0) return ''
  if (tendered > remaining)
    return paymentAllowsChange(method) ? `거스름돈 ${money(tendered - remaining)}` : '결제금액이 받을금액을 초과했어요.'
  if (tendered < remaining) return `결제 후 남은 금액 ${money(remaining - tendered)}`
  return '전액 결제'
}
