import { money } from '../../shared/format'
import { Button } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { packagingNames } from '../service/checkout-model'
import { FOODS, foodProducts, SHOWCASE_CAPACITY } from './catalog'
import { currentFood, foodDescription, foodQuantity } from './rules'

type Props = { state: GameState; act: (action: Action) => void; place: 'stock' | 'showcase' | 'food-oven' | 'pickup' }

export default function FoodPanel({ state, act, place }: Props) {
  const line = currentFood(state)
  const food = state.foodWork
  const location = place === 'showcase' ? 'showcase' : 'stock'
  const batches = state.foodBatches.filter((batch) => batch.location === location && batch.quantity > 0)
  const displayed = state.foodBatches
    .filter((batch) => batch.location === 'showcase')
    .reduce((sum, batch) => sum + batch.quantity, 0)

  if (place === 'food-oven' || place === 'pickup') {
    if (!food || !line) return <p className="text-sm text-muted">쇼케이스에서 주문한 푸드를 먼저 집어주세요.</p>
    const seconds = food.heatingEndsAt === null ? 0 : Math.max(0, Math.ceil(food.heatingEndsAt - state.time))

    return (
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">{foodDescription(line)}</h3>
        {food.expiresAt <= state.time && (
          <p className="text-danger" role="alert">
            기한이 지났어요. 폐기 후 다시 준비해주세요.
          </p>
        )}
        {food.stage === 'heating' && (
          <p role="status" className="text-2xl font-semibold tabular-nums">
            가열 중 · {seconds}초
          </p>
        )}
        {food.stage === 'heated' && (
          <p role="status" className="text-brand">
            가열 완료
          </p>
        )}
        {food.location === 'hand' && (
          <Button onClick={() => act({ type: 'food-move', location: place })}>
            {place === 'food-oven' ? '오븐에 넣기' : '픽업대에 놓기'}
          </Button>
        )}
        {food.location === 'food-oven' && place === 'food-oven' && food.stage === 'picked' && line.warmed && (
          <Button onClick={() => act({ type: 'food-heat' })}>가열 시작</Button>
        )}
        {food.location === place && food.stage !== 'heating' && (
          <Button variant="secondary" onClick={() => act({ type: 'food-move', location: 'hand' })}>
            푸드 집기
          </Button>
        )}
        {place === 'pickup' &&
          food.location === 'pickup' &&
          food.stage !== 'packed' &&
          (!line.warmed || food.stage === 'heated') && (
            <div className="grid gap-2">
              <p className="text-sm text-muted">주문한 포장 · {packagingNames[line.options.packaging]}</p>
              {(Object.entries(packagingNames) as Array<[keyof typeof packagingNames, string]>).map(
                ([packaging, name]) => (
                  <Button key={packaging} variant="secondary" onClick={() => act({ type: 'food-pack', packaging })}>
                    {packaging === 'none' && line.service === 'dine-in' ? '접시에 준비' : name}
                  </Button>
                ),
              )}
            </div>
          )}
        {place === 'pickup' && food.location === 'pickup' && food.stage === 'packed' && (
          <Button disabled={state.customer?.stage !== 'pickup'} onClick={() => act({ type: 'food-serve' })}>
            손님에게 전달
          </Button>
        )}
        <Button variant="secondary" onClick={() => act({ type: 'food-discard-work' })}>
          준비 중인 푸드 폐기
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {line && (
        <p className="rounded-lg bg-control p-3 text-sm">
          준비할 주문 · {foodDescription(line)} · {line.quantity - line.served}개
        </p>
      )}
      {place === 'showcase' && (
        <p className="text-sm text-muted">
          진열 {displayed} / {SHOWCASE_CAPACITY}개 · 냉장고에서 푸드를 보충할 수 있어요.
        </p>
      )}
      {batches.length === 0 && (
        <p className="text-sm text-muted">
          {place === 'showcase' ? '진열된 푸드가 없어요. 백룸 냉장고에서 보충해주세요.' : '보관 중인 푸드가 없어요.'}
        </p>
      )}
      {batches.map((batch) => {
        const product = FOODS[batch.productId]
        if (!product) return null
        const expired = batch.expiresAt <= state.time
        const canDisplay = SHOWCASE_CAPACITY - displayed

        return (
          <section key={batch.id} className="grid gap-3 rounded-xl border border-line p-3">
            <h3 className="flex justify-between gap-2 font-semibold">
              <span>{product.name}</span>
              <span>{batch.quantity}개</span>
            </h3>
            <p className="text-xs text-muted">
              기한 {new Date(batch.expiresAt * 1000).toISOString().slice(5, 16).replace('T', ' ')}
              {expired ? ' · 기한 지남' : ''}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {place === 'stock' && (
                <Button
                  disabled={expired || canDisplay < 1}
                  onClick={() =>
                    act({ type: 'food-display', batchId: batch.id, quantity: Math.min(batch.quantity, canDisplay) })
                  }
                >
                  쇼케이스에 진열
                </Button>
              )}
              {place === 'showcase' && (
                <Button
                  disabled={expired || !!food || line?.productId !== batch.productId}
                  onClick={() => act({ type: 'food-pick', batchId: batch.id })}
                >
                  주문 푸드 집기
                </Button>
              )}
              {place === 'showcase' && (
                <Button
                  variant="secondary"
                  disabled={expired}
                  onClick={() => act({ type: 'food-return', batchId: batch.id, quantity: batch.quantity })}
                >
                  냉장고로 이동
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => act({ type: 'food-discard', batchId: batch.id, quantity: batch.quantity })}
              >
                폐기
              </Button>
            </div>
          </section>
        )
      })}
      {place === 'stock' && (
        <div className="grid gap-2 border-t border-line pt-4">
          <h3 className="font-semibold">푸드 입고</h3>
          {foodProducts.map((product) => (
            <Button
              key={product.id}
              variant="secondary"
              disabled={state.cash < product.purchasePrice}
              onClick={() => act({ type: 'food-buy', productId: product.id })}
            >
              {product.name} {product.purchaseQuantity}개 · {money(product.purchasePrice)}
              <span className="text-xs">사용 가능 {foodQuantity(state, product.id)}개</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
