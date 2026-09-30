import { useState } from 'react'
import { DRINK_SIZES } from '../../content/drink-sizes'
import { RECIPES } from '../../content/recipes'
import { money } from '../../shared/format'
import type { Action } from '../../simulation/actions'
import type { GameState, Sale } from '../../simulation/state'
import { FOODS } from '../food/catalog'
import { benefitsError, couponUnavailable } from './benefits'
import type { Coupon, SaleBenefits } from './checkout-model'
import { findPresentedMember, telecomAvailable } from './members'
import { NumericPad, PosButton, PosDialog } from './PosControls'
import { couponAmount, quoteSale, telecomAmount } from './pricing'

export type BenefitView = 'sr' | 'paper' | 'employee' | 'manual' | 'telecom'
const titles: Record<BenefitView, string> = {
  sr: 'SR 쿠폰',
  paper: '종이쿠폰',
  employee: '임직원 할인',
  manual: '금액/메뉴 할인',
  telecom: '통신사 제휴',
}

export function saleItemNames(sale: Sale) {
  return [
    ...sale.lines.map((line, index) => ({
      id: line.id,
      name: `${index + 1}. ${RECIPES[line.recipe].temperature.toUpperCase()} ${RECIPES[line.recipe].name} · ${DRINK_SIZES[line.size].name}`,
      quantity: line.quantity,
    })),
    ...sale.foodLines.map((line) => ({ id: line.id, name: FOODS[line.productId].name, quantity: line.quantity })),
  ]
}

export function PosBenefits({
  state,
  act,
  view,
  onClose,
}: {
  state: GameState
  act: (action: Action) => void
  view: BenefitView
  onClose: () => void
}) {
  const sale = state.sale
  if (!sale) return null

  return (
    <BenefitEditor
      key={`${sale.customerId}-${view}`}
      state={state}
      sale={sale}
      act={act}
      view={view}
      onClose={onClose}
    />
  )
}

function BenefitEditor({
  state,
  sale,
  act,
  view,
  onClose,
}: {
  state: GameState
  sale: Sale
  act: (action: Action) => void
  view: BenefitView
  onClose: () => void
}) {
  const [draft, setDraft] = useState(() => structuredClone(sale.benefits))
  const [error, setError] = useState('')
  const member = findPresentedMember(state)
  const recognized = !!member && draft.memberId === member.id

  function confirm() {
    const error = benefitsError(state, sale, draft)

    if (error) {
      setError(error)
      return
    }

    act({ type: 'pos-benefits', benefits: draft })
    onClose()
  }

  return (
    <PosDialog title={titles[view]} onClose={onClose} wide>
      <div className="space-y-4">
        {view !== 'manual' && view !== 'paper' && (
          <div className="grid grid-cols-2 gap-2">
            <PosButton
              tone="active"
              disabled={!member}
              onClick={() => {
                if (member) setDraft({ ...draft, memberId: member.id })
                setError('')
              }}
            >
              리더기 / 스캐너
            </PosButton>
            <p role="status" className="rounded bg-pos-soft p-3 text-sm">
              {recognized ? `${member.nickname} · ${member.level}` : '회원 카드를 인식해주세요'}
            </p>
          </div>
        )}
        {(view === 'sr' || view === 'paper') && (
          <CouponChoices
            state={state}
            sale={sale}
            draft={draft}
            onChange={setDraft}
            source={view}
            recognized={recognized}
          />
        )}
        {view === 'employee' && (
          <>
            <div className="grid grid-cols-3 gap-1">
              {(['partner', 'employee', 'mobile'] as const).map((kind, index) => (
                <PosButton
                  key={kind}
                  aria-pressed={draft.employee === kind}
                  disabled={!recognized || !member.employee}
                  onClick={() => setDraft({ ...draft, employee: kind })}
                >
                  {['파트너 할인', '통합사원증 할인', '모바일사원증 할인'][index]}
                </PosButton>
              ))}
            </div>
            {recognized && (
              <p className="rounded bg-control p-3 text-sm">
                {member.employee
                  ? '임직원 인증이 완료됐습니다. 음료 35% · 푸드 30%'
                  : '임직원 할인 대상 회원이 아닙니다.'}
              </p>
            )}
            <p className="text-sm text-pos-panel">쿠폰을 적용한 상품 한 개는 임직원 할인에서 제외됩니다.</p>
            <PosButton onClick={() => setDraft({ ...draft, employee: null })}>임직원 할인 해제</PosButton>
          </>
        )}
        {view === 'manual' && <ManualDiscount sale={sale} draft={draft} onChange={setDraft} />}
        {view === 'telecom' && (
          <TelecomChoices state={state} sale={sale} draft={draft} onChange={setDraft} recognized={recognized} />
        )}
        <div className="flex justify-between border-t border-pos-soft pt-4 text-sm">
          <span>총 할인 {money(quoteSale({ ...sale, benefits: draft }).discount)}</span>
          <strong>결제할 금액 {money(quoteSale({ ...sale, benefits: draft }).total)}</strong>
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <PosButton
          tone="active"
          className="w-full min-h-12"
          disabled={sale.payments.length > 0 || sale.paidAt !== null}
          onClick={confirm}
        >
          확정
        </PosButton>
      </div>
    </PosDialog>
  )
}

type EditorProps = { sale: Sale; draft: SaleBenefits; onChange: (benefits: SaleBenefits) => void }

function CouponChoices({
  state,
  sale,
  draft,
  onChange,
  source,
  recognized,
}: EditorProps & { state: GameState; source: 'sr' | 'paper'; recognized: boolean }) {
  const [scanned, setScanned] = useState(false)
  const [selected, setSelected] = useState<Coupon | null>(null)
  const member = findPresentedMember(state)
  const available = source === 'paper' ? (state.customer?.paperCoupons ?? []) : (member?.coupons ?? [])
  const visible = source === 'paper' ? scanned : recognized
  const items = saleItemNames(sale)

  return (
    <>
      {source === 'paper' && (
        <PosButton tone="active" onClick={() => setScanned(true)}>
          종이쿠폰 바코드 스캔
        </PosButton>
      )}
      {visible && (
        <div className="grid grid-cols-2 gap-3">
          <fieldset className="max-h-72 space-y-2 overflow-auto" aria-label="보유 쿠폰">
            {available.map((coupon) => {
              const applied = draft.coupons.find((item) => item.coupon.id === coupon.id)
              const unavailable = couponUnavailable(state, coupon, { ...sale, benefits: draft })

              return (
                <div key={coupon.id} className="rounded border border-pos-soft p-2">
                  <PosButton
                    className="w-full text-left"
                    aria-pressed={selected?.id === coupon.id}
                    disabled={!!unavailable}
                    onClick={() => setSelected(coupon)}
                  >
                    {coupon.name}
                    <span className="mt-1 block text-xs">
                      {new Date(coupon.expiresAt * 1000).toISOString().slice(0, 10)}까지
                    </span>
                  </PosButton>
                  {unavailable && <p className="mt-1 text-xs text-pos-panel">{unavailable}</p>}
                  {applied && (
                    <PosButton
                      className="mt-1 w-full"
                      onClick={() =>
                        onChange({ ...draft, coupons: draft.coupons.filter((item) => item.coupon.id !== coupon.id) })
                      }
                    >
                      적용 해제
                    </PosButton>
                  )}
                </div>
              )
            })}
            {!available.length && <p className="p-3 text-sm">보유한 쿠폰이 없습니다.</p>}
          </fieldset>
          <fieldset className="max-h-72 space-y-2 overflow-auto" aria-label="쿠폰 적용 상품">
            <h3 className="text-sm font-semibold">
              {selected ? `${selected.name} · 적용할 상품` : '사용할 쿠폰을 선택해주세요'}
            </h3>
            {selected &&
              [...sale.lines, ...sale.foodLines].map((line) => {
                const amount = couponAmount(selected, line)
                const applied = draft.coupons.filter((item) => item.lineId === line.id).length

                return (
                  <PosButton
                    key={line.id}
                    disabled={!amount || applied >= line.quantity}
                    className="w-full text-left"
                    onClick={() => {
                      onChange({ ...draft, coupons: [...draft.coupons, { coupon: selected, lineId: line.id }] })
                      setSelected(null)
                    }}
                  >
                    {items.find((item) => item.id === line.id)?.name}
                    <span className="mt-1 block text-xs">
                      {money(amount)} 할인 · 적용 {applied}/{line.quantity}개
                    </span>
                  </PosButton>
                )
              })}
          </fieldset>
        </div>
      )}
      <p className="text-xs text-pos-panel">
        한 개당 쿠폰 한 장 · 무료음료는 Tall 기준 · 크기 차액과 유료 옵션은 별도입니다.
      </p>
    </>
  )
}

function ManualDiscount({ sale, draft, onChange }: EditorProps) {
  const [value, setValue] = useState(String(draft.manual?.value ?? 0))
  const [kind, setKind] = useState<'amount' | 'percent'>(draft.manual?.kind ?? 'amount')
  const [lineId, setLineId] = useState(draft.manual?.lineId ?? '')
  const valid = Number(value) > 0 && (kind !== 'percent' || Number(value) <= 100)

  function apply() {
    if (valid) onChange({ ...draft, manual: { kind, value: Number(value), lineId: lineId || null } })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <label className="grid gap-2 text-sm">
          할인 대상
          <select
            aria-label="할인 대상"
            className="min-h-12 rounded border border-pos-soft px-2"
            value={lineId}
            onChange={(event) => setLineId(event.target.value)}
          >
            <option value="">전체 상품</option>
            {saleItemNames(sale).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-1">
          <PosButton aria-pressed={kind === 'amount'} onClick={() => setKind('amount')}>
            금액(원)
          </PosButton>
          <PosButton aria-pressed={kind === 'percent'} onClick={() => setKind('percent')}>
            비율(%)
          </PosButton>
        </div>
        <p className="text-sm">쿠폰이 적용되지 않은 상품의 남은 금액에 적용합니다. 컵보증금은 제외됩니다.</p>
        {draft.manual && (
          <p className="text-sm text-pos-active">
            설정됨 · {draft.manual.kind === 'percent' ? `${draft.manual.value}%` : money(draft.manual.value)}
          </p>
        )}
        <PosButton onClick={() => onChange({ ...draft, manual: null })}>금액/메뉴 할인 해제</PosButton>
      </div>
      <div className="space-y-2">
        <input
          aria-label="할인값"
          inputMode="numeric"
          value={value}
          onChange={(event) => {
            if (/^\d{0,8}$/.test(event.target.value)) setValue(event.target.value)
          }}
          className="min-h-12 w-full rounded border border-pos-panel bg-pos-input px-3 text-right text-xl"
        />
        <NumericPad value={value} onChange={setValue} onConfirm={apply} />
        <PosButton tone="active" disabled={!valid} className="w-full" onClick={apply}>
          할인 설정
        </PosButton>
      </div>
    </div>
  )
}

function TelecomChoices({
  state,
  sale,
  draft,
  onChange,
  recognized,
}: EditorProps & { state: GameState; recognized: boolean }) {
  const [carrier, setCarrier] = useState<'kt' | 'lgu'>(draft.telecom?.carrier ?? 'kt')
  const [service, setService] = useState<'size-up' | 'americano'>(draft.telecom?.service ?? 'size-up')
  const member = findPresentedMember(state)
  const available = recognized && member && telecomAvailable(member, carrier, service, state.time)
  const items = saleItemNames(sale)

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <PosButton aria-pressed={carrier === 'kt'} onClick={() => setCarrier('kt')}>
          KT 멤버십
        </PosButton>
        <PosButton aria-pressed={carrier === 'lgu'} onClick={() => setCarrier('lgu')}>
          LG U+ 멤버십
        </PosButton>
        <PosButton aria-pressed={service === 'size-up'} onClick={() => setService('size-up')}>
          {carrier === 'lgu' ? '더블 사이즈업 · 최대 1,400원' : '일반 서비스 · 사이즈업'}
        </PosButton>
        <PosButton aria-pressed={service === 'americano'} onClick={() => setService('americano')}>
          {carrier === 'lgu' ? 'VVIP · Tall 아메리카노' : 'VIP · Short 아메리카노'}
        </PosButton>
      </div>
      {recognized && member && (
        <p role="status" className="rounded bg-control p-3 text-sm">
          등급 {member.telecom[carrier]} · {available ? '이번 달 사용 가능' : '등급 또는 이용 한도 초과'}
        </p>
      )}
      <div className="grid max-h-60 grid-cols-2 gap-2 overflow-auto">
        {sale.lines.map((line) => {
          const amount = telecomAmount({ carrier, service, lineId: line.id }, line)
          const coupons = draft.coupons.filter((item) => item.lineId === line.id).length
          const selected =
            draft.telecom?.lineId === line.id && draft.telecom.carrier === carrier && draft.telecom.service === service

          return (
            <PosButton
              key={line.id}
              disabled={!available || !amount || coupons >= line.quantity}
              aria-pressed={selected}
              className="text-left"
              onClick={() => onChange({ ...draft, telecom: { carrier, service, lineId: line.id } })}
            >
              {items.find((item) => item.id === line.id)?.name}
              <span className="mt-1 block text-xs">{money(amount)} 혜택 · 1잔</span>
            </PosButton>
          )
        })}
      </div>
      <PosButton onClick={() => onChange({ ...draft, telecom: null })}>통신사 혜택 해제</PosButton>
    </>
  )
}
