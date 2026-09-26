import { money } from '../../shared/format'
import { InventoryButton } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { SUPPLIES, SUPPLY_CAPACITY, SUPPLY_PACK, SUPPLY_PRICE, supplyIds } from './supplies'

export default function SupplyPanel({
  state,
  act,
  location,
}: {
  state: GameState
  act: (action: Action) => void
  location: 'bar' | 'stock'
}) {
  return (
    <section className="mt-6 border-t border-line pt-5" aria-label="컨디먼트 소모품">
      <h3 className="mt-0 mb-3 text-base font-semibold">
        {location === 'stock' ? '컨디먼트 바 보충품' : '셀프 소모품'}
      </h3>
      {supplyIds.map((id) => {
        const definition = SUPPLIES[id]
        const supply = state.supplies[id]
        const amount = Math.min(SUPPLY_CAPACITY - supply.bar, supply.stock)

        return (
          <article className="border-b border-line py-3.5" key={id}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <strong>{definition.name}</strong>
              <span
                className="tabular-nums data-[error=true]:text-xs data-[error=true]:text-danger"
                data-error={supply.bar <= 5}
              >
                진열 {supply.bar} / {SUPPLY_CAPACITY}
                {definition.unit}
              </span>
            </div>
            <p className="mb-4 text-label leading-relaxed text-muted">
              창고 {supply.stock}
              {definition.unit}
              {shelfNote(supply.bar)}
            </p>
            {location === 'stock' && (
              <div className="mt-3 grid gap-2">
                <InventoryButton
                  disabled={amount <= 0 || !!state.supplyDelivery}
                  onClick={() => act({ type: 'take-supply', supply: id })}
                >
                  {takeLabel(definition, amount, supply.bar)}
                </InventoryButton>
                <InventoryButton
                  disabled={state.cash < SUPPLY_PRICE || !!state.supplyDelivery}
                  onClick={() => act({ type: 'buy-supply', supply: id })}
                >
                  {definition.name} {SUPPLY_PACK}
                  {definition.unit} 입고 · {money(SUPPLY_PRICE)}
                </InventoryButton>
              </div>
            )}
          </article>
        )
      })}
    </section>
  )
}

function shelfNote(bar: number) {
  if (bar === 0) {
    return ' · 품절'
  }
  return bar <= 5 ? ' · 보충 필요' : ''
}

function takeLabel(definition: { name: string; unit: string }, amount: number, bar: number) {
  if (amount > 0) {
    return `${definition.name} ${amount}${definition.unit} 집기`
  }
  if (bar >= SUPPLY_CAPACITY) {
    return `${definition.name} 진열대가 가득 찼어요`
  }
  return `${definition.name} 후방 재고가 없어요`
}
