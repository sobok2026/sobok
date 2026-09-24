import { money } from '../game/catalog'
import type { GameState } from '../game/state'
import type { Action } from '../game/store'
import { SUPPLIES, SUPPLY_CAPACITY, SUPPLY_PACK, SUPPLY_PRICE, supplyIds } from '../game/supplies'

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
      <p className="mb-4 text-label leading-[1.7] text-muted">
        {location === 'stock'
          ? '필요한 만큼 집어 컨디먼트 바까지 가져가세요.'
          : '창고에서 보충품을 가져오면 E로 채울 수 있어요.'}
      </p>
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
            <p className="mb-4 text-label leading-[1.7] text-muted">
              창고 {supply.stock}
              {definition.unit}
              {supply.bar === 0 ? ' · 품절, 보충이 필요해요' : supply.bar <= 5 ? ' · 얼마 남지 않았어요' : ''}
            </p>
            {location === 'stock' ? (
              <div className="mt-3 grid gap-2">
                <button
                  className="w-full rounded-[0.3125rem] border border-control-line bg-control px-3 py-2.5 text-sm text-brand"
                  type="button"
                  disabled={amount <= 0 || !!state.supplyDelivery}
                  onClick={() => act({ type: 'take-supply', supply: id })}
                >
                  {amount > 0
                    ? `${definition.name} ${amount}${definition.unit} 집기`
                    : supply.bar >= SUPPLY_CAPACITY
                      ? `${definition.name} 진열대가 가득 찼어요`
                      : `${definition.name} 후방 재고가 없어요`}
                </button>
                <button
                  className="w-full rounded-[0.3125rem] border border-control-line bg-control px-3 py-2.5 text-sm text-brand"
                  type="button"
                  disabled={state.cash < SUPPLY_PRICE || !!state.supplyDelivery}
                  onClick={() => act({ type: 'buy-supply', supply: id })}
                >
                  {definition.name} {SUPPLY_PACK}
                  {definition.unit} 입고 · {money(SUPPLY_PRICE)}
                </button>
              </div>
            ) : null}
          </article>
        )
      })}
    </section>
  )
}
