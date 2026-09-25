import { CUP_NAMES, disposableCupKinds, reusableCupKinds } from '../game/cups'
import type { GameState } from '../game/state'
import type { Action } from '../game/store'
import { Button } from './Button'

export default function CupInventory({
  state,
  act,
  purchasing = false,
}: {
  state: GameState
  act?: (action: Action) => void
  purchasing?: boolean
}) {
  return (
    <section className="divide-y divide-line" aria-label="컵 종류별 재고">
      {reusableCupKinds.map((kind) => {
        const stock = state.reusableCups[kind]
        return (
          <div key={kind} className="py-3">
            <div className="flex justify-between gap-3 text-sm">
              <span>{CUP_NAMES[kind]}</span>
              <span className="tabular-nums">준비 {stock.clean}개</span>
            </div>
            {stock.dirty || stock.washed ? (
              <p className="mt-1 text-xs text-muted">
                세척 대기 {stock.dirty}개 · 씻은 컵 {stock.washed}개
              </p>
            ) : null}
          </div>
        )
      })}
      {disposableCupKinds.map((kind) => {
        const stock = state.disposableCups[kind]
        return (
          <div key={kind} className="py-3">
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span>{CUP_NAMES[kind]}</span>
              <span className="tabular-nums">준비 {stock.bar}개</span>
            </div>
            <p className="mb-2 text-xs text-muted">후방 {stock.reserve}개</p>
            {act ? (
              <Button
                variant="secondary"
                disabled={!stock.reserve || stock.bar >= 12}
                onClick={() => act({ type: 'cups', kind })}
              >
                {CUP_NAMES[kind]} 보충
              </Button>
            ) : null}
            {act && purchasing ? (
              <Button
                variant="secondary"
                disabled={state.cash < 2000 || stock.reserve >= 48}
                onClick={() => act({ type: 'buy-cups', kind })}
              >
                {CUP_NAMES[kind]} 24개 입고 · 2,000원
              </Button>
            ) : null}
          </div>
        )
      })}
    </section>
  )
}
