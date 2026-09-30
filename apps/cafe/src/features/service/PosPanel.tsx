import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { noCustomizations } from '../../content/customizations'
import { DRINK_SIZES, type DrinkSize, drinkSizeIds } from '../../content/drink-sizes'
import { RECIPES, type RecipeId, recipeLabel, recipeSizes } from '../../content/recipes'
import { money } from '../../shared/format'
import type { Action } from '../../simulation/actions'
import type { GameState, OrderItem, OrderLine } from '../../simulation/state'
import CowSettings from '../drip-coffee/CowSettings'
import { dripMenuName } from '../drip-coffee/rules'
import { FOODS } from '../food/catalog'
import type { FoodOrder } from '../food/model'
import { foodDescription, foodOrderAvailable } from '../food/rules'
import { SERVICE_NAMES, type ServiceMode } from '../inventory/cups'
import ShiftControls from '../shift/ShiftControls'
import ShiftLedger from '../shift/ShiftLedger'
import { defaultOrderOptions, packagingNames } from './checkout-model'
import { CUSTOMER_STATUS } from './customer'
import { orderUnserved } from './order-flow'
import { currentTicket, itemCustomizations, orderMatchesRequest, salePaid, saleQuantity, saleTotal } from './orders'
import { PosCheckout } from './PosCheckout'
import { NumericPad, PosButton, PosDialog } from './PosControls'
import { PosCustomize } from './PosCustomize'
import { PosFoodMenu } from './PosFoodMenu'
import { PosMenu, temperatureVariant } from './PosMenu'
import { HeldOrders, PosBulkOptions, PosOrderOptions } from './PosOrderOptions'
import { quoteSale } from './pricing'
import { TransactionHistory } from './TransactionHistory'

type View = 'order' | 'custom' | 'checkout'
type Dialog =
  | 'request'
  | 'quantity'
  | 'clear'
  | 'store'
  | 'calculator'
  | 'transactions'
  | 'management'
  | 'options'
  | 'bulk'
  | 'held'
  | null

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
    state.sale?.payments.length || state.sale?.acceptedAt != null ? 'checkout' : 'order',
  )
  const [dialog, setDialog] = useState<Dialog>(null)
  const [selectedId, setSelectedId] = useState<string | null>('new')
  const [temperature, setTemperature] = useState<'hot' | 'iced'>('iced')
  const [size, setSize] = useState<DrinkSize>('tall')
  const [service, setService] = useState<ServiceMode>('dine-in')
  const [quantity, setQuantity] = useState('1')
  const [catalog, setCatalog] = useState<'drink' | 'food'>('drink')
  const screen = useRef<HTMLElement>(null)
  const list = useRef<HTMLFieldSetElement>(null)

  const sale = state.sale
  const selectedFood =
    selectedId === 'food-new' ? sale?.foodLines.at(-1) : sale?.foodLines.find((line) => line.id === selectedId)
  const selected =
    selectedId === 'new' || selectedFood
      ? null
      : (sale?.lines.find((line) => line.id === selectedId) ?? currentTicket(state) ?? sale?.lines.at(-1) ?? null)
  const paid = !!sale && sale.paidAt !== null
  const accepted = !!sale && sale.acceptedAt !== null
  const editable = state.phase === 'open' && state.customer?.stage === 'ordering' && !accepted && !sale?.payments.length
  const quote = quoteSale(sale)
  const linePrice = (id: string) => quote.lines.find((line) => line.id === id)
  const total = saleTotal(sale)
  const count = saleQuantity(sale)
  const foodCount = sale?.foodLines.reduce((sum, line) => sum + line.quantity, 0) ?? 0
  const activeLine = selected ?? selectedFood

  function updateQuantity(quantity: number) {
    if (selected) update(selected, selected, quantity)
    if (selectedFood) act({ type: 'pos-food-update', id: selectedFood.id, item: { ...selectedFood, quantity } })
  }

  function addFood(item: FoodOrder) {
    act({ type: 'pos-food-add', item })
    setSelectedId('food-new')
    requestAnimationFrame(() => list.current?.scrollTo({ top: list.current.scrollHeight }))
  }

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
      item: {
        recipe,
        size: chosenSize,
        service: chosenService,
        customizations: noCustomizations(),
        options: defaultOrderOptions(),
      },
    })
    setSelectedId(null)
    setSize(chosenSize)
    setService(chosenService)
    requestAnimationFrame(() => list.current?.scrollTo({ top: list.current.scrollHeight }))
  }

  const availableSizes = selected ? recipeSizes(selected.recipe, selected.service) : drinkSizeIds
  const shownTemperature = selected ? RECIPES[selected.recipe].temperature : temperature
  const shownSize = selected?.size ?? size
  const shownService = selected?.service ?? selectedFood?.service ?? service
  const nextTemperature = shownTemperature === 'hot' ? 'iced' : 'hot'
  const otherTemperature = selected ? temperatureVariant(selected.recipe, nextTemperature) : null
  const date = new Date(state.time * 1000).toISOString().slice(5, 10).replace('-', '.')
  const closeDialog = () => setDialog(null)

  return (
    <div
      className={clsx(
        'pointer-events-auto absolute inset-0 z-12 overflow-y-auto overscroll-contain bg-black/35 p-3',
        'compact:p-2',
      )}
    >
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
          'touch:min-h-150 touch:portrait:h-auto touch:portrait:grid-cols-1 touch:portrait:overflow-visible',
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
        <aside
          className={clsx(
            'flex min-h-0 min-w-0 flex-col rounded-md bg-white p-2.5',
            'touch:portrait:order-2 touch:portrait:min-h-96',
          )}
        >
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
              {state.customer.foodItems.map((item, index) => (
                <p key={index} className="mt-1 leading-relaxed">
                  {foodDescription(item)} · {SERVICE_NAMES[item.service]} {item.quantity}개
                </p>
              ))}
            </div>
          )}
          <fieldset
            ref={list}
            className="min-h-0 flex-1 space-y-1 overflow-y-auto touch:portrait:max-h-80"
            aria-label="주문 목록"
          >
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
                      {dripMenuName(line.recipe, RECIPES[line.recipe].name)}
                    </span>
                    <span className="text-sm tabular-nums">{line.quantity}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-2 text-xs">
                    <span>
                      {RECIPES[line.recipe].temperature.toUpperCase()} · {DRINK_SIZES[line.size].name} ·{' '}
                      {SERVICE_NAMES[line.service]}
                    </span>
                    <strong className="text-sm tabular-nums">
                      {(linePrice(line.id)?.net ?? 0).toLocaleString('ko-KR')}
                    </strong>
                  </div>
                  {itemCustomizations(line).map((label) => (
                    <p key={label} className="mt-1 pl-6 text-xs leading-snug">
                      {label}
                    </p>
                  ))}
                  {linePrice(line.id)?.discounts.map((detail) => (
                    <p key={detail.label} className="mt-1 pl-6 text-xs">
                      {detail.label} −{money(detail.amount)}
                    </p>
                  ))}
                  {accepted && (
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
            {sale?.foodLines.map((line, index) => (
              <div
                key={line.id}
                className={clsx(
                  'rounded border p-2.5',
                  selectedFood?.id === line.id
                    ? 'border-pos-active bg-pos-active text-white'
                    : 'border-pos-soft bg-white',
                )}
              >
                <button
                  type="button"
                  aria-pressed={selectedFood?.id === line.id}
                  className="w-full text-left"
                  onClick={() => {
                    setSelectedId(line.id)
                    setCatalog('food')
                    setView('order')
                  }}
                >
                  <span className="flex justify-between gap-2 text-sm font-semibold">
                    <span>
                      {String((sale?.lines.length ?? 0) + index + 1).padStart(2, '0')} · {FOODS[line.productId].name}
                    </span>
                    <span>{line.quantity}개</span>
                  </span>
                  <span className="mt-2 flex justify-between gap-2 text-xs">
                    <span>
                      {line.warmed ? '데워서' : '그대로'} · {SERVICE_NAMES[line.service]} ·{' '}
                      {packagingNames[line.options.packaging]}
                    </span>
                    <strong>{(linePrice(line.id)?.net ?? 0).toLocaleString('ko-KR')}</strong>
                  </span>
                  {accepted && (
                    <span className="mt-2 block text-xs">
                      전달 {line.served}/{line.quantity}개
                    </span>
                  )}
                </button>
                {selectedFood?.id === line.id && editable && (
                  <button
                    type="button"
                    className="mt-2 rounded bg-white/90 px-2 py-1 text-xs text-pos-ink"
                    onClick={() => act({ type: 'pos-remove', id: line.id })}
                  >
                    항목 삭제 ×
                  </button>
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
              disabled={!editable || !activeLine || activeLine.quantity < 2}
              onClick={() => activeLine && act({ type: 'pos-split', id: activeLine.id })}
              className="px-1 text-xs"
            >
              수량
              <br />
              나누기
            </PosButton>
            <PosButton
              disabled={!editable || !activeLine}
              onClick={() => {
                setQuantity(String(activeLine?.quantity ?? 1))
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
                disabled={!editable || !activeLine || activeLine.quantity >= 99}
                onClick={() => activeLine && updateQuantity(activeLine.quantity + 1)}
                className="min-h-8 py-1 text-lg"
                aria-label="수량 늘리기"
              >
                +
              </PosButton>
              <PosButton
                disabled={!editable || !activeLine || activeLine.quantity <= 1}
                onClick={() => activeLine && updateQuantity(activeLine.quantity - 1)}
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
              총계{' '}
              <strong className="ml-2 tabular-nums">{(quote.gross + quote.deposit).toLocaleString('ko-KR')}</strong>
            </span>
            <span>
              할인 <span className="ml-1 text-pos-hot">{quote.discount.toLocaleString('ko-KR')}</span>
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
              {foodCount > 0 && (
                <span className="block">
                  푸드 <strong>{foodCount}개</strong>
                </span>
              )}
            </span>
            <span className="text-lg tabular-nums">{checkoutButtonLabel(paid, view, total)}</span>
          </PosButton>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-col gap-2 touch:portrait:min-h-150">
          <header
            className={clsx(
              'flex min-h-10 shrink-0 items-center justify-between gap-3 px-2 text-sm text-white',
              'touch:sticky touch:top-0 touch:z-10 touch:bg-pos-shell',
            )}
          >
            <span>
              제조중 <strong className="ml-2">{accepted ? orderUnserved(sale) : 0}</strong>
            </span>
            <span className="text-xs text-white/75">
              {accepted && !paid ? '선제공 · 정산 필요' : orderStatus(paid, salePaid(sale), total)}
            </span>
            <PosButton tone="dark" onClick={onClose} aria-label="POS 닫기" className="min-h-9">
              ×
            </PosButton>
          </header>
          <div className="flex min-h-0 flex-1 gap-1.5 touch:portrait:flex-col">
            {view === 'checkout' ? (
              <PosCheckout state={state} act={act} onBack={() => setView('order')} onClose={onClose} />
            ) : (
              <>
                {view === 'order' && catalog === 'drink' && (
                  <nav
                    className={clsx(
                      'flex w-22 shrink-0 flex-col gap-1 overflow-y-auto',
                      'touch:portrait:w-auto touch:portrait:flex-row touch:portrait:flex-wrap',
                    )}
                    aria-label="주문 규격"
                  >
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
                {view === 'custom' && (
                  <PosCustomize
                    onBack={() => setView('order')}
                    line={selected}
                    disabled={!editable}
                    onChange={(customizations) => selected && update(selected, { ...selected, customizations })}
                  />
                )}
                {view !== 'custom' && catalog === 'food' && (
                  <PosFoodMenu
                    state={state}
                    service={shownService}
                    disabled={!editable}
                    onAdd={addFood}
                    onDrinks={() => setCatalog('drink')}
                    onService={(service) => {
                      setService(service)
                      if (selectedFood)
                        act({ type: 'pos-food-update', id: selectedFood.id, item: { ...selectedFood, service } })
                    }}
                  />
                )}
                {view !== 'custom' && catalog === 'drink' && (
                  <PosMenu
                    cow={state.cow}
                    temperature={shownTemperature}
                    size={shownSize}
                    service={shownService}
                    disabled={!editable}
                    onAdd={add}
                    onFood={() => {
                      setCatalog('food')
                      setSelectedId('new')
                    }}
                  />
                )}
              </>
            )}
            <nav
              className="flex w-16 shrink-0 flex-col gap-1 touch:portrait:w-auto touch:portrait:flex-row"
              aria-label="POS 도구"
            >
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
          <div className="grid shrink-0 grid-cols-4 gap-1">
            <PosButton
              tone="dark"
              disabled={!editable || !sale || !orderMatchesRequest(state) || !foodOrderAvailable(state)}
              onClick={() => {
                act({ type: 'pos-accept' })
                onClose()
              }}
            >
              선제공
            </PosButton>
            <PosButton tone="dark" disabled={!editable || !sale?.lines.length} onClick={() => setDialog('bulk')}>
              모두 변경
            </PosButton>
            <PosButton tone="dark" disabled={!editable || !activeLine} onClick={() => setDialog('options')}>
              컵 · 포장선택
            </PosButton>
            <PosButton tone="dark" onClick={() => setDialog('held')}>
              주문보류 {state.waitingOrders.length > 0 && `(${state.waitingOrders.length})`}
            </PosButton>
          </div>
          <footer className="grid min-h-14 shrink-0 grid-cols-6 gap-1 touch:portrait:grid-cols-3">
            <PosButton
              tone="dark"
              disabled={!editable}
              onClick={() => {
                setSelectedId('new')
                setCatalog('drink')
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
            <PosButton tone="dark" onClick={() => setDialog('management')}>
              관리메뉴
            </PosButton>
            <PosButton tone="dark" onClick={() => setDialog('transactions')}>
              거래 내역
            </PosButton>
          </footer>
        </div>
        {dialog === 'management' && (
          <PosDialog title="관리메뉴" onClose={closeDialog} wide>
            <CowSettings state={state} act={act} />
            <PosButton tone="dark" className="mt-4 w-full" onClick={() => setDialog('store')}>
              영업 관리 · 마감
            </PosButton>
          </PosDialog>
        )}
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
            {state.customer?.foodItems.map((item, index) => (
              <p key={index} className="border-b border-pos-soft py-3">
                {foodDescription(item)} · {SERVICE_NAMES[item.service]} {item.quantity}개
              </p>
            ))}
          </PosDialog>
        )}
        {dialog === 'store' && (
          <PosDialog title="매장 현황 · 영업 관리" onClose={closeDialog} wide>
            <ShiftLedger state={state} />
            <ShiftControls state={state} act={act} />
          </PosDialog>
        )}
        {dialog === 'transactions' && (
          <PosDialog title="거래 내역" onClose={closeDialog} wide>
            <TransactionHistory state={state} act={act} />
          </PosDialog>
        )}
        {dialog === 'clear' && (
          <PosDialog title="주문 전체 삭제" onClose={closeDialog}>
            <p className="mb-6">
              담은 음료 {count}잔·푸드 {foodCount}개를 모두 삭제할까요?
            </p>
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
        {dialog === 'quantity' && activeLine && (
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
                  updateQuantity(Number(quantity))
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
        {dialog === 'options' && activeLine && (
          <PosDialog title="컵 · 포장선택" onClose={closeDialog}>
            <PosOrderOptions key={activeLine.id} line={activeLine} act={act} onDone={closeDialog} />
          </PosDialog>
        )}
        {dialog === 'bulk' && (
          <PosDialog title="모두 변경" onClose={closeDialog}>
            <PosBulkOptions state={state} act={act} onDone={closeDialog} />
          </PosDialog>
        )}
        {dialog === 'held' && (
          <PosDialog title="보류 주문" onClose={closeDialog}>
            <HeldOrders state={state} act={act} editable={editable} />
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
