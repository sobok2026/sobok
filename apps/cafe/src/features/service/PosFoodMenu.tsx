import { useState } from 'react'
import type { GameState } from '../../simulation/state'
import { foodProducts } from '../food/catalog'
import type { FoodOrder } from '../food/model'
import { foodQuantity } from '../food/rules'
import { defaultOrderOptions } from './checkout-model'
import { PosButton } from './PosControls'

export function PosFoodMenu({
  state,
  service,
  disabled,
  onAdd,
  onDrinks,
  onService,
}: {
  state: GameState
  service: 'dine-in' | 'takeout'
  disabled: boolean
  onAdd: (item: FoodOrder) => void
  onDrinks: () => void
  onService: (service: 'dine-in' | 'takeout') => void
}) {
  const [query, setQuery] = useState('')

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-2" aria-label="푸드 메뉴">
      <div className="flex gap-2">
        <input
          type="search"
          aria-label="푸드 검색"
          placeholder="푸드 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-11 min-w-0 flex-1 rounded bg-white px-3"
        />
        <PosButton onClick={onDrinks}>음료</PosButton>
        <PosButton tone="active">푸드</PosButton>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <PosButton disabled={disabled} aria-pressed={service === 'dine-in'} onClick={() => onService('dine-in')}>
          매장
        </PosButton>
        <PosButton disabled={disabled} aria-pressed={service === 'takeout'} onClick={() => onService('takeout')}>
          포장
        </PosButton>
      </div>
      <div className="grid min-h-0 grid-cols-2 content-start gap-2 overflow-auto lg:grid-cols-3">
        {foodProducts
          .filter((product) => product.name.includes(query))
          .map((product) => (
            <PosButton
              key={product.id}
              disabled={disabled}
              tone="white"
              className="flex min-h-36 flex-col items-start justify-between gap-3 text-left"
              onClick={() =>
                onAdd({
                  productId: product.id,
                  service,
                  quantity: 1,
                  warmed: product.heatingSeconds > 0,
                  options: defaultOrderOptions(),
                })
              }
            >
              <strong>{product.name}</strong>
              <span className="text-xs text-pos-panel">
                재고 {foodQuantity(state, product.id)}개 · 진열 {foodQuantity(state, product.id, 'showcase')}개
              </span>
              <span className="self-end tabular-nums">{product.price.toLocaleString('ko-KR')}원</span>
            </PosButton>
          ))}
      </div>
    </section>
  )
}
