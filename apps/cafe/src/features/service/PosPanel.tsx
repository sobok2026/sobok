import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { noCustomizations } from '../../content/customizations'
import { DRINK_SIZES, type DrinkSize, drinkSizeIds } from '../../content/drink-sizes'
import { RECIPES, type RecipeId, recipeLabel, recipeSizes } from '../../content/recipes'
import { money } from '../../shared/format'
import type { Action } from '../../simulation/actions'
import type { GameState, OrderItem, OrderLine } from '../../simulation/state'
import { SERVICE_NAMES, type ServiceMode } from '../inventory/cups'
import ShiftControls from '../shift/ShiftControls'
import ShiftLedger from '../shift/ShiftLedger'
import { CUSTOMER_STATUS } from './customer'
import { currentTicket, itemCustomizations, itemPrice, salePaid, saleQuantity, saleTotal } from './orders'
import { PosCheckout } from './PosCheckout'
import { NumericPad, PosButton, PosDialog } from './PosControls'
import { PosCustomize } from './PosCustomize'
import { PosMenu, temperatureVariant } from './PosMenu'

type View = 'order' | 'custom' | 'checkout'
type Dialog = 'request' | 'quantity' | 'clear' | 'store' | 'calculator' | null

export default function PosPanel({
  state,
  act,
  onClose,
  onEscape,
}: {
  state: GameState
  act: (action: Action) => void
  onClose: () => void
  onEscape: () => void
}) {
  const [view, setView] = useState<View>(
    state.sale?.payments.length || state.sale?.paidAt != null ? 'checkout' : 'order',
  )
  const [dialog, setDialog] = useState<Dialog>(null)
  const [selectedId, setSelectedId] = useState<string | null>('new')
  const [temperature, setTemperature] = useState<'hot' | 'iced'>('iced')
  const [size, setSize] = useState<DrinkSize>('tall')
  const [service, setService] = useState<ServiceMode>('dine-in')
  const [quantity, setQuantity] = useState('1')
  const screen = useRef<HTMLElement>(null)
  const list = useRef<HTMLFieldSetElement>(null)

  const sale = state.sale
  const selected =
    selectedId === 'new'
      ? null
      : (sale?.lines.find((line) => line.id === selectedId) ?? currentTicket(state) ?? sale?.lines.at(-1) ?? null)
  const paid = !!sale && sale.paidAt !== null
  const editable = state.phase === 'open' && state.customer?.stage === 'ordering' && !paid && !sale?.payments.length
  const total = saleTotal(sale)
  const count = saleQuantity(sale)

  useEffect(() => {
    screen.current?.focus()
  }, [])

  function update(line: OrderLine, item: OrderItem = line, quantity = line.quantity) {
    act({ type: 'pos-update', id: line.id, item, quantity })
  }

  function select(line: OrderLine) {
    setSelectedId(line.id)
    setTemperature(RECIPES[line.recipe].temperature)
    setSize(line.size)
    setService(line.service)
  }

  function add(recipe: RecipeId, chosenSize: DrinkSize, chosenService: ServiceMode) {
    act({
      type: 'pos-add',
      item: { recipe, size: chosenSize, service: chosenService, customizations: noCustomizations() },
    })
    setSelectedId(null)
    setSize(chosenSize)
    setService(chosenService)
    requestAnimationFrame(() => list.current?.scrollTo({ top: list.current.scrollHeight }))
  }

  const availableSizes = selected ? recipeSizes(selected.recipe, selected.service) : drinkSizeIds
  const shownTemperature = selected ? RECIPES[selected.recipe].temperature : temperature
  const shownSize = selected?.size ?? size
  const shownService = selected?.service ?? service
  const nextTemperature = shownTemperature === 'hot' ? 'iced' : 'hot'
  const otherTemperature = selected ? temperatureVariant(selected.recipe, nextTemperature) : null
  const date = new Date(state.time * 1000).toISOString().slice(5, 10).replace('-', '.')
  const closeDialog = () => setDialog(null)

  return (
    <div className="absolute inset-0 z-12 bg-black/35 p-3 compact:p-2">
      <section
        ref={screen}
        role="dialog"
        aria-modal="true"
        aria-label="POS 주문"
        tabIndex={-1}
        className={clsx(
          'relative grid h-full min-h-0 grid-cols-[minmax(15rem,0.95fr)_minmax(0,2fr)] gap-2 overflow-hidden',
          'rounded-lg bg-pos-shell p-2 text-pos-ink shadow-2xl outline-none',
          'max-md:grid-cols-[minmax(11rem,0.7fr)_minmax(0,2fr)]',
        )}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            if (view !== 'order' && !paid) {
              setView('order')
            } else {
              onEscape()
            }
          } else if (event.key === 'Tab') {
            const controls = [
              ...event.currentTarget.querySelectorAll<HTMLElement>(
                'button:not(:disabled), input:not(:disabled), summary',
              ),
            ].filter((item) => item.checkVisibility())
            if (
              event.shiftKey &&
              (document.activeElement === controls[0] || document.activeElement === screen.current)
            ) {
              event.preventDefault()
              controls.at(-1)?.focus()
            } else if (
              !event.shiftKey &&
              (document.activeElement === controls.at(-1) || document.activeElement === screen.current)
            ) {
              event.preventDefault()
              controls[0]?.focus()
            }
          } else if (!['KeyH', 'KeyM'].includes(event.code)) {
            event.stopPropagation()
          }
        }}
      >
        <aside className="flex min-h-0 min-w-0 flex-col rounded-md bg-white p-2.5">
          <header className="shrink-0 pb-3">
            <div className="flex justify-between text-xs text-pos-panel">
              <span>소복점 · POS 01</span>
              <span>영업일 {date}</span>
            </div>
            <div className="py-3 text-center text-2xl font-bold tracking-widest">소복다방</div>
            <div className="flex justify-between text-xs">
              <span>주문 {String(state.orderNumber).padStart(3, '0')}</span>
              <span>{state.customer ? CUSTOMER_STATUS[state.customer.stage] : '응대 중인 손님 없음'}</span>
            </div>
          </header>
          {state.customer && !state.customer.visit && (
            <div className="mb-3 rounded bg-pos-soft/70 p-2.5 text-xs">
              <button
                type="button"
                onClick={() => setDialog('request')}
                className="mb-1 flex w-full items-center justify-between text-left font-semibold"
              >
                <span>손님 요청</span>
                <span>상세 보기 ›</span>
              </button>
              {state.customer.items.map((item, index) => (
                <p key={`${index}-${item.recipe}`} className="mt-1 leading-relaxed">
                  {recipeLabel(item.recipe, item.size)} · {SERVICE_NAMES[item.service]} {item.quantity}잔
                  {itemCustomizations(item).length ? ` · ${itemCustomizations(item).join(', ')}` : ''}
                </p>
              ))}
            </div>
          )}
          <fieldset ref={list} className="min-h-0 flex-1 space-y-1 overflow-y-auto" aria-label="주문 목록">
            {sale?.lines.map((line, index) => (
              <div
                key={line.id}
                className={clsx(
                  'rounded border',
                  selected?.id === line.id ? 'border-pos-active bg-pos-active text-white' : 'border-pos-soft bg-white',
                )}
              >
                <button
                  type="button"
                  onClick={() => select(line)}
                  aria-pressed={selected?.id === line.id}
                  aria-label={`주문 ${index + 1} ${RECIPES[line.recipe].name} 선택`}
                  className="w-full p-2.5 text-left"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-xs opacity-75">{String(index + 1).padStart(2, '0')}</span>
                    <span
                      className={clsx(
                        'shrink-0 rounded px-1.5 py-1 text-xs text-white',
                        RECIPES[line.recipe].temperature === 'hot' ? 'bg-pos-hot' : 'bg-pos-iced',
                      )}
                    >
                      {DRINK_SIZES[line.size].name.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">
                      {RECIPES[line.recipe].name}
                    </span>
                    <span className="text-sm tabular-nums">{line.quantity}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-2 text-xs">
                    <span>
                      {RECIPES[line.recipe].temperature.toUpperCase()} · {DRINK_SIZES[line.size].name} ·{' '}
                      {SERVICE_NAMES[line.service]}
                    </span>
                    <strong className="text-sm tabular-nums">
                      {(itemPrice(line) * line.quantity).toLocaleString('ko-KR')}
                    </strong>
                  </div>
                  {itemCustomizations(line).map((label) => (
                    <p key={label} className="mt-1 pl-6 text-xs leading-snug">
                      {label}
                    </p>
                  ))}
                  {paid && (
                    <p className="mt-2 text-xs">
                      전달 {line.served} / {line.quantity}잔 {line.served === line.quantity ? '✓' : ''}
                    </p>
                  )}
                </button>
                {selected?.id === line.id && editable && (
                  <div className="flex justify-end px-2 pb-2">
                    <button
                      type="button"
                      className="rounded bg-white/90 px-2 py-1 text-xs text-pos-ink"
                      onClick={() => act({ type: 'pos-remove', id: line.id })}
                    >
                      항목 삭제 ×
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!sale && (
              <p className="flex h-full items-center justify-center text-sm text-pos-panel">선택된 메뉴가 없습니다.</p>
            )}
          </fieldset>
          <div className="mt-3 grid shrink-0 grid-cols-5 gap-1">
            <PosButton disabled={!editable || !sale} onClick={() => setDialog('clear')} className="px-1 text-xs">
              전체
              <br />
              삭제
            </PosButton>
            <PosButton
              disabled={!editable || !selected || selected.quantity < 2}
              onClick={() => selected && act({ type: 'pos-split', id: selected.id })}
              className="px-1 text-xs"
            >
              수량
              <br />
              나누기
            </PosButton>
            <PosButton
              disabled={!editable || !selected}
              onClick={() => {
                setQuantity(String(selected?.quantity ?? 1))
                setDialog('quantity')
              }}
              className="px-1 text-xs"
            >
              수량
              <br />
              변경
            </PosButton>
            <div className="grid gap-1">
              <PosButton
                disabled={!editable || !selected || selected.quantity >= 99}
                onClick={() => selected && update(selected, selected, selected.quantity + 1)}
                className="min-h-8 py-1 text-lg"
                aria-label="수량 늘리기"
              >
                +
              </PosButton>
              <PosButton
                disabled={!editable || !selected || selected.quantity <= 1}
                onClick={() => selected && update(selected, selected, selected.quantity - 1)}
                className="min-h-8 py-1 text-lg"
                aria-label="수량 줄이기"
              >
                −
              </PosButton>
            </div>
            <div className="grid gap-1">
              <PosButton
                tone="dark"
                onClick={() => list.current?.scrollBy({ top: -200, behavior: 'smooth' })}
                className="min-h-8 py-1"
                aria-label="주문 목록 위로"
              >
                ⌃
              </PosButton>
              <PosButton
                tone="dark"
                onClick={() => list.current?.scrollBy({ top: 200, behavior: 'smooth' })}
                className="min-h-8 py-1"
                aria-label="주문 목록 아래로"
              >
                ⌄
              </PosButton>
            </div>
          </div>
          <div className="flex shrink-0 justify-between gap-2 py-3 text-sm">
            <span>
              총계 <strong className="ml-2 tabular-nums">{total.toLocaleString('ko-KR')}</strong>
            </span>
            <span>
              할인 <span className="ml-1 text-pos-hot">0</span>
            </span>
          </div>
          <PosButton
            tone="dark"
            disabled={!sale}
            onClick={() => setView(view === 'checkout' && !paid ? 'order' : 'checkout')}
            className="flex min-h-16 shrink-0 items-center justify-between gap-2 px-2"
          >
            <span className="rounded bg-white px-2 py-3 text-sm text-pos-ink">
              음료 <strong>{count}잔</strong>
            </span>
            <span className="text-lg tabular-nums">{checkoutButtonLabel(paid, view, total)}</span>
          </PosButton>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-col gap-2">
          <header className="flex min-h-10 shrink-0 items-center justify-between gap-3 px-2 text-sm text-white">
            <span>
              제조중{' '}
              <strong className="ml-2">
                {paid ? sale!.lines.reduce((sum, line) => sum + line.quantity - line.served, 0) : 0}
              </strong>
            </span>
            <span className="text-xs text-white/75">{orderStatus(paid, salePaid(sale), total)}</span>
            <PosButton tone="dark" onClick={onClose} aria-label="POS 닫기" className="min-h-9">
              ×
            </PosButton>
          </header>
          <div className="flex min-h-0 flex-1 gap-1.5">
            {view === 'checkout' ? (
              <PosCheckout state={state} act={act} onBack={() => setView('order')} onClose={onClose} />
            ) : (
              <>
                {view === 'order' && (
                  <nav className="flex w-22 shrink-0 flex-col gap-1" aria-label="주문 규격">
                    <PosButton
                      tone="active"
                      disabled={!selected}
                      onClick={() => setView('custom')}
                      className="min-h-16"
                    >
                      주문
                      <br />
                      커스텀
                    </PosButton>
                    <PosButton
                      tone={shownTemperature}
                      disabled={
                        !editable ||
                        (!!selected &&
                          (!otherTemperature ||
                            !recipeSizes(otherTemperature, selected.service).includes(selected.size)))
                      }
                      className="min-h-16"
                      onClick={() => {
                        const next = nextTemperature
                        setTemperature(next)

                        if (selected) {
                          const other = temperatureVariant(selected.recipe, next)
                          if (other && recipeSizes(other, selected.service).includes(selected.size)) {
                            update(selected, { ...selected, recipe: other, customizations: noCustomizations() })
                          }
                        }
                      }}
                    >
                      HOT ICED
                      <br />
                      <span className="text-xs">{shownTemperature === 'hot' ? '● HOT' : '● ICED'}</span>
                    </PosButton>
                    <div className="my-1 h-px bg-white/15" />
                    {drinkSizeIds
                      .filter((id) => id !== 'single' || selected?.size === 'single')
                      .map((id) => (
                        <PosButton
                          key={id}
                          tone="dark"
                          aria-pressed={shownSize === id}
                          disabled={!editable || !availableSizes.includes(id)}
                          className="min-h-9 flex-1 px-1"
                          onClick={() => {
                            setSize(id)
                            if (selected) {
                              update(selected, { ...selected, size: id })
                            }
                          }}
                        >
                          {DRINK_SIZES[id].name}
                        </PosButton>
                      ))}
                    <div className="my-1 h-px bg-white/15" />
                    {(['dine-in', 'takeout'] as const).map((mode) => (
                      <PosButton
                        key={mode}
                        tone="dark"
                        aria-pressed={shownService === mode}
                        disabled={
                          !editable || (!!selected && !recipeSizes(selected.recipe, mode).includes(selected.size))
                        }
                        className="min-h-13 px-1"
                        onClick={() => {
                          setService(mode)
                          if (selected) {
                            update(selected, { ...selected, service: mode })
                          }
                        }}
                      >
                        {mode === 'dine-in' ? '매장컵' : '일회용컵'}
                      </PosButton>
                    ))}
                  </nav>
                )}
                {view === 'custom' ? (
                  <PosCustomize
                    onBack={() => setView('order')}
                    line={selected}
                    disabled={!editable}
                    onChange={(customizations) => selected && update(selected, { ...selected, customizations })}
                  />
                ) : (
                  <PosMenu
                    temperature={shownTemperature}
                    size={shownSize}
                    service={shownService}
                    disabled={!editable}
                    onAdd={add}
                  />
                )}
              </>
            )}
            <nav className="flex w-16 shrink-0 flex-col gap-1" aria-label="POS 도구">
              <PosButton tone="dark" className="flex-1 px-1" onClick={() => setDialog('store')}>
                매장
                <br />
                현황
              </PosButton>
              <PosButton tone="dark" className="flex-1 px-1" onClick={() => setDialog('request')}>
                손님
                <br />
                요청
              </PosButton>
              <PosButton tone="dark" className="flex-1 px-1" onClick={() => setDialog('calculator')}>
                계산기
              </PosButton>
            </nav>
          </div>
          <footer className="grid min-h-14 shrink-0 grid-cols-5 gap-1">
            <PosButton
              tone="dark"
              disabled={!editable}
              onClick={() => {
                setSelectedId('new')
                setView('order')
              }}
            >
              + 새 음료
            </PosButton>
            <PosButton tone="dark" aria-pressed={view === 'order'} onClick={() => setView('order')}>
              주문
            </PosButton>
            <PosButton
              tone="dark"
              disabled={!selected}
              aria-pressed={view === 'custom'}
              onClick={() => setView('custom')}
            >
              커스텀
            </PosButton>
            <PosButton
              tone="dark"
              disabled={!sale}
              aria-pressed={view === 'checkout'}
              onClick={() => setView('checkout')}
            >
              결제
            </PosButton>
            <PosButton tone="dark" onClick={() => setDialog('store')}>
              영업 관리
            </PosButton>
          </footer>
        </div>
        {dialog === 'request' && (
          <PosDialog title="손님 요청" onClose={closeDialog}>
            {state.customer?.items.map((item, index) => (
              <div key={`${index}-${item.recipe}`} className="border-b border-pos-soft py-3">
                <p className="font-semibold">
                  {recipeLabel(item.recipe, item.size)} · {SERVICE_NAMES[item.service]} {item.quantity}잔
                </p>
                <p className="mt-2 text-sm">{itemCustomizations(item).join(' · ') || '기본 레시피'}</p>
              </div>
            )) ?? <p>응대 중인 손님이 없습니다.</p>}
          </PosDialog>
        )}
        {dialog === 'store' && (
          <PosDialog title="매장 현황 · 영업 관리" onClose={closeDialog} wide>
            <ShiftLedger state={state} />
            <ShiftControls state={state} act={act} />
          </PosDialog>
        )}
        {dialog === 'clear' && (
          <PosDialog title="주문 전체 삭제" onClose={closeDialog}>
            <p className="mb-6">담은 음료 {count}잔을 모두 삭제할까요?</p>
            <div className="grid grid-cols-2 gap-2">
              <PosButton onClick={closeDialog}>취소</PosButton>
              <PosButton
                tone="active"
                onClick={() => {
                  act({ type: 'pos-clear' })
                  setSelectedId(null)
                  closeDialog()
                }}
              >
                전체 삭제
              </PosButton>
            </div>
          </PosDialog>
        )}
        {dialog === 'quantity' && selected && (
          <PosDialog title="수량 변경" onClose={closeDialog}>
            <input
              aria-label="주문 수량"
              inputMode="numeric"
              value={quantity}
              onChange={(event) => {
                if (/^\d{0,2}$/.test(event.target.value)) {
                  setQuantity(event.target.value)
                }
              }}
              className="mb-3 min-h-13 w-full rounded border-2 border-pos-active bg-amber-100 px-3 text-xl"
            />
            <NumericPad
              value={quantity}
              onChange={setQuantity}
              onConfirm={() => {
                if (Number(quantity) >= 1 && Number(quantity) <= 99) {
                  update(selected, selected, Number(quantity))
                  closeDialog()
                }
              }}
            />
          </PosDialog>
        )}
        {dialog === 'calculator' && (
          <PosDialog title="계산기" onClose={closeDialog}>
            <PosCalculator />
          </PosDialog>
        )}
      </section>
    </div>
  )
}

function checkoutButtonLabel(paid: boolean, view: View, total: number) {
  if (paid) {
    return '결제 완료'
  }
  return view === 'checkout' ? '‹ 주문으로 돌아가기' : `${total.toLocaleString('ko-KR')} 결제`
}

function orderStatus(paid: boolean, paidAmount: number, total: number) {
  if (paid) {
    return '결제한 주문을 제조해주세요.'
  }
  return paidAmount ? `남은 결제금액 ${money(total - paidAmount)}` : '주문 · 커스텀 · 결제'
}

type Operator = '+' | '−' | '×' | '÷'

function calculate(left: number, operator: Operator, right: number) {
  if (operator === '+') {
    return left + right
  }
  if (operator === '−') {
    return left - right
  }
  if (operator === '×') {
    return left * right
  }
  return right ? left / right : 0
}

function PosCalculator() {
  const [value, setValue] = useState('')
  const [left, setLeft] = useState<number | null>(null)
  const [operator, setOperator] = useState<Operator>('+')

  const compute = () => {
    if (left === null) {
      return
    }
    const right = Number(value)
    const result = calculate(left, operator, right)
    setValue(String(Math.round(result * 100) / 100))
    setLeft(null)
  }

  return (
    <>
      <output className="mb-3 block min-h-14 rounded bg-pos-soft p-3 text-right text-2xl tabular-nums">
        {value || '0'}
      </output>
      <div className="mb-2 grid grid-cols-4 gap-1">
        {(['+', '−', '×', '÷'] as const).map((op) => (
          <PosButton
            key={op}
            onClick={() => {
              setLeft(Number(value))
              setOperator(op)
              setValue('')
            }}
          >
            {op}
          </PosButton>
        ))}
      </div>
      <NumericPad value={value} onChange={setValue} onConfirm={compute} />
    </>
  )
}
