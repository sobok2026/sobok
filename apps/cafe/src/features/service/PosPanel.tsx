import { useEffect, useMemo, useState } from 'react'
import { customerNames } from '../../content/customers'
import { DRINK_SIZES, type DrinkSize } from '../../content/drink-sizes'
import { RECIPES, type RecipeId, recipeIds, recipeLabel, recipePrice, recipeServices } from '../../content/recipes'
import { money } from '../../shared/format'
import { Button } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { nextStep } from '../crafting/rules'
import { SERVICE_NAMES, type ServiceMode } from '../inventory/cups'
import { CUSTOMER_STATUS, orderSizes } from './customer'

type TemperatureFilter = 'all' | 'hot' | 'iced'
type PosSelection = { recipe: RecipeId | null; service: ServiceMode | null; size: DrinkSize | null }
const searchText = (value: string) => value.toLocaleLowerCase('ko-KR').replace(/\s+/g, '')

function selectRecipe(
  recipe: RecipeId | null,
  preferredService?: ServiceMode | null,
  preferredSize?: DrinkSize | null,
): PosSelection {
  if (!recipe || !RECIPES[recipe]) return { recipe: null, service: null, size: null }
  const services = recipeServices(recipe).filter((service) => orderSizes(recipe, service).length > 0)
  const service = preferredService && services.includes(preferredService) ? preferredService : (services[0] ?? null)
  const sizes = service ? orderSizes(recipe, service) : []
  const size = preferredSize && sizes.includes(preferredSize) ? preferredSize : (sizes[0] ?? null)
  return { recipe, service, size }
}

export default function PosPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const [selection, setSelection] = useState(() =>
    selectRecipe(
      state.ticket?.recipe ?? state.request,
      state.ticket?.service ?? state.customer?.service,
      state.ticket?.size ?? state.customer?.size,
    ),
  )
  const [query, setQuery] = useState('')
  const [temperature, setTemperature] = useState<TemperatureFilter>('all')
  const customerId = state.customer?.id
  const customerService = state.customer?.service
  const customerSize = state.customer?.size
  const ticketRecipe = state.ticket?.recipe
  const ticketService = state.ticket?.service
  const ticketSize = state.ticket?.size
  useEffect(() => {
    if (!customerId || !customerService) return
    setSelection(
      selectRecipe(ticketRecipe ?? state.request, ticketService ?? customerService, ticketSize ?? customerSize),
    )
    setQuery('')
    setTemperature('all')
  }, [customerId, customerService, customerSize, ticketRecipe, ticketService, ticketSize, state.request])

  const filteredRecipes = useMemo(() => {
    const needle = searchText(query)
    return recipeIds.filter((id) => {
      const menu = RECIPES[id]
      return (temperature === 'all' || menu.temperature === temperature) && searchText(recipeLabel(id)).includes(needle)
    })
  }, [query, temperature])
  const selectedRecipe = selection.recipe && filteredRecipes.includes(selection.recipe) ? selection.recipe : null
  const services = selectedRecipe
    ? recipeServices(selectedRecipe).filter((service) => orderSizes(selectedRecipe, service).length > 0)
    : []
  const selectedService = selection.service && services.includes(selection.service) ? selection.service : null
  const sizes = selectedRecipe && selectedService ? orderSizes(selectedRecipe, selectedService) : []
  const selectedSize = selection.size && sizes.includes(selection.size) ? selection.size : null
  const price = selectedRecipe && selectedSize ? recipePrice(selectedRecipe, selectedSize) : null
  const canTakeOrder =
    !!state.customer &&
    !state.customer.visit &&
    state.customer.stage !== 'leaving' &&
    (state.customer.stage === 'ordering' || !!state.ticket)
  const locked = !!state.cup || !canTakeOrder
  const customer = customerNames[(state.orderNumber - 1) % customerNames.length]

  if (!recipeIds.length) {
    return <p className="rounded-md bg-control p-4 text-sm text-muted">현재 주문할 수 있는 메뉴가 없어요.</p>
  }

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
              {recipeLabel(state.customer.recipe, state.customer.size)} · {SERVICE_NAMES[state.customer.service]}
            </p>
          </div>
          <label className="mb-2 block text-xs text-muted" htmlFor="pos-search">
            전체 메뉴 검색
          </label>
          <div className="mb-3 flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-xl border border-control-line bg-control px-3 py-2.5 text-sm text-ink"
              id="pos-search"
              type="search"
              value={query}
              placeholder="메뉴 이름 검색"
              disabled={locked}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              className="rounded-xl border border-control-line bg-control px-3 py-2.5 text-sm text-ink"
              aria-label="음료 온도"
              value={temperature}
              disabled={locked}
              onChange={(event) => setTemperature(event.target.value as TemperatureFilter)}
            >
              <option value="all">전체</option>
              <option value="hot">HOT</option>
              <option value="iced">ICED</option>
            </select>
          </div>
          <label className="mb-2 block text-xs text-muted" htmlFor="pos-menu">
            메뉴 선택 · {filteredRecipes.length}개
          </label>
          <select
            className="mb-3.5 w-full rounded-xl border border-control-line bg-control p-3 text-sm text-ink"
            id="pos-menu"
            value={selectedRecipe ?? ''}
            disabled={locked || !filteredRecipes.length}
            onChange={(event) => setSelection(selectRecipe(event.target.value, selection.service, selection.size))}
          >
            <option value="" disabled>
              {filteredRecipes.length ? '메뉴를 선택하세요' : '검색 결과가 없어요'}
            </option>
            {filteredRecipes.map((id) => (
              <option key={id} value={id}>
                {recipeLabel(id)}
              </option>
            ))}
          </select>
          {!filteredRecipes.length ? (
            <p className="mb-4 text-sm text-muted" role="status">
              검색어나 온도를 바꿔 메뉴를 찾아보세요.
            </p>
          ) : null}
          {services.length ? (
            <fieldset
              className={`mb-4 grid gap-2 disabled:opacity-45 ${services.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
              disabled={locked}
            >
              <legend className="mb-2 text-xs text-muted">이용 방식</legend>
              {services.map((service) => (
                <label key={service} className="cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="radio"
                    name="pos-service"
                    value={service}
                    checked={selectedService === service}
                    onChange={() => setSelection(selectRecipe(selection.recipe, service, selection.size))}
                  />
                  <span className="block rounded-xl border border-control-line bg-control px-3 py-2.5 text-center text-sm peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">
                    {SERVICE_NAMES[service]}
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}
          {sizes.length > 0 && selectedRecipe ? (
            <fieldset
              className={`mb-4 grid gap-2 disabled:opacity-45 ${sizes.length === 1 ? 'grid-cols-1' : sizes.length > 3 ? 'grid-cols-2' : 'grid-cols-3'}`}
              disabled={locked}
            >
              <legend className="mb-2 text-xs text-muted">제공 규격</legend>
              {sizes.map((size) => {
                const definition = DRINK_SIZES[size]
                return (
                  <label key={size} className="cursor-pointer">
                    <input
                      className="peer sr-only"
                      type="radio"
                      name="pos-size"
                      value={size}
                      checked={selectedSize === size}
                      onChange={() => setSelection({ ...selection, size })}
                    />
                    <span className="flex flex-col gap-1 rounded-xl border border-control-line bg-control px-3 py-2.5 text-center text-sm peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">
                      <span className="font-medium">{definition.name}</span>
                      {definition.ml !== null ? (
                        <span className="text-xs">
                          {definition.label} · {definition.ml}ml
                        </span>
                      ) : null}
                      <span className="tabular-nums">{money(recipePrice(selectedRecipe, size))}</span>
                    </span>
                  </label>
                )
              })}
            </fieldset>
          ) : null}
          {selectedRecipe && !services.length ? (
            <p className="mb-4 text-sm text-muted" role="status">
              선택한 메뉴를 주문할 수 없어요. 다른 메뉴를 선택해주세요.
            </p>
          ) : null}
          <Button
            disabled={locked || !selectedRecipe || !selectedService || !selectedSize || price === null}
            onClick={() => {
              if (selectedRecipe && selectedService && selectedSize) {
                act({ type: 'ticket', recipe: selectedRecipe, service: selectedService, size: selectedSize })
              }
            }}
          >
            {state.ticket ? '주문표 수정' : canTakeOrder ? '주문 접수' : '손님 도착 대기'}
            {price !== null ? ` · ${money(price)}` : ''}
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
