import { useEffect, useState } from 'react'
import { customerNames } from '../../content/customers'
import { DRINK_SIZES, type DrinkSize } from '../../content/drink-sizes'
import { recipeFor, recipeIds, recipeLabel, recipeSizes } from '../../content/recipes'
import { money } from '../../shared/format'
import { Button } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { nextStep } from '../crafting/rules'
import { SERVICE_NAMES, type ServiceMode, serviceModes } from '../inventory/cups'
import { CUSTOMER_STATUS, orderSizes } from './customer'

export default function PosPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const [posSelection, setPosSelection] = useState(state.ticket?.recipe ?? state.request)
  const [posService, setPosService] = useState<ServiceMode>(
    state.ticket?.service ?? state.customer?.service ?? 'dine-in',
  )
  const [posSize, setPosSize] = useState<DrinkSize>(state.ticket?.size ?? state.customer?.size ?? 'tall')
  const customerId = state.customer?.id
  const customerService = state.customer?.service
  const ticketRecipe = state.ticket?.recipe
  const ticketService = state.ticket?.service
  const ticketSize = state.ticket?.size
  const customerSize = state.customer?.size
  useEffect(() => {
    if (customerId && customerService) {
      setPosSelection(ticketRecipe ?? state.request)
      setPosService(ticketService ?? customerService)
      setPosSize(ticketSize ?? customerSize ?? 'tall')
    }
  }, [customerId, customerService, customerSize, ticketRecipe, ticketService, ticketSize, state.request])
  const sizes = orderSizes(posSelection, posService)
  const selectedSize = sizes.includes(posSize) ? posSize : 'tall'
  const canTakeOrder =
    !!state.customer &&
    !state.customer.visit &&
    state.customer.stage !== 'leaving' &&
    (state.customer.stage === 'ordering' || !!state.ticket)
  const customer = customerNames[(state.orderNumber - 1) % customerNames.length]

  return (
    <>
      {(state.phase === 'open' || state.ticket) &&
      state.customer &&
      !state.customer.visit &&
      state.customer.stage !== 'leaving' ? (
        <>
          <div className="mb-5.5 rounded-[0.1875rem] border-l-2 border-[#a9b495] bg-[#eaeade] p-4 compact:mb-4 compact:p-3">
            <span className="text-xs text-muted">손님 주문</span>
            <p className="mt-2.25 mb-0 text-body leading-[1.7] text-[#4b6248]">
              {recipeLabel(state.request, state.customer.size)} · {SERVICE_NAMES[state.customer.service]}
            </p>
          </div>
          <label className="mb-2.25 block text-xs text-muted" htmlFor="pos-menu">
            주문 입력
          </label>
          <select
            className="mb-3.5 w-full rounded-[0.1875rem] border border-[#d9ddce] bg-[#fffdf7] p-3 text-sm text-[#496347]"
            id="pos-menu"
            value={posSelection}
            disabled={!!state.cup || !canTakeOrder}
            onChange={(event) => {
              const recipe = event.target.value as typeof posSelection
              setPosSelection(recipe)
              if (!orderSizes(recipe, posService).includes(posSize)) setPosSize('tall')
            }}
          >
            {recipeIds.map((id) => (
              <option key={id} value={id}>
                {recipeLabel(id)}
              </option>
            ))}
          </select>
          <fieldset className="mb-4 grid grid-cols-2 gap-2 disabled:opacity-45" disabled={!!state.cup || !canTakeOrder}>
            <legend className="mb-2 text-xs text-muted">이용 방식</legend>
            {serviceModes.map((service) => (
              <label key={service} className="cursor-pointer">
                <input
                  className="peer sr-only"
                  type="radio"
                  name="pos-service"
                  value={service}
                  checked={posService === service}
                  onChange={() => {
                    setPosService(service)
                    if (!orderSizes(posSelection, service).includes(posSize)) setPosSize('tall')
                  }}
                />
                <span className="block rounded-xl border border-control-line bg-control px-3 py-2.5 text-center text-sm peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">
                  {SERVICE_NAMES[service]}
                </span>
              </label>
            ))}
          </fieldset>
          <fieldset
            className={`mb-4 grid gap-2 disabled:opacity-45 ${sizes.length > 3 ? 'grid-cols-2' : 'grid-cols-3'}`}
            disabled={!!state.cup || !canTakeOrder}
          >
            <legend className="mb-2 text-xs text-muted">사이즈</legend>
            {sizes.map((size) => (
              <label key={size} className="cursor-pointer">
                <input
                  className="peer sr-only"
                  type="radio"
                  name="pos-size"
                  value={size}
                  checked={selectedSize === size}
                  onChange={() => setPosSize(size)}
                />
                <span className="flex flex-col gap-1 rounded-xl border border-control-line bg-control px-3 py-2.5 text-center text-sm peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">
                  <span className="font-medium">{DRINK_SIZES[size].name}</span>
                  <span className="text-xs">
                    {DRINK_SIZES[size].label} · {DRINK_SIZES[size].ml}ml
                  </span>
                  <span className="tabular-nums">{money(recipeFor(posSelection, size).price)}</span>
                </span>
              </label>
            ))}
          </fieldset>
          {recipeSizes(posSelection).includes('trenta') ? (
            <p className="mb-4 text-xs text-muted">Trenta는 포장 주문에서 선택할 수 있어요.</p>
          ) : null}
          <Button
            disabled={!!state.cup || !canTakeOrder}
            onClick={() => act({ type: 'ticket', recipe: posSelection, service: posService, size: selectedSize })}
          >
            {state.ticket ? '주문표 수정' : canTakeOrder ? '주문 접수' : '손님 도착 대기'} ·{' '}
            {money(recipeFor(posSelection, selectedSize).price)}
          </Button>
        </>
      ) : (
        <div className="mb-5 rounded-md bg-[#eaeade] p-4 text-sm leading-relaxed text-muted">
          <p>{state.customer ? `${customer} 님 · ${CUSTOMER_STATUS[state.customer.stage]}` : '응대 중인 손님 없음'}</p>
        </div>
      )}
    </>
  )
}

export function PickupPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const step = nextStep(state)
  return (
    <>
      <div className="my-5.5 h-px bg-line" />
      <Button
        disabled={!state.cup || !!step || state.customer?.stage !== 'pickup'}
        onClick={() => act({ type: 'serve' })}
      >
        음료 전달
      </Button>
    </>
  )
}
