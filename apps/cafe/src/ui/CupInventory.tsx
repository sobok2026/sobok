import { CUP_NAMES, cupKindFor, disposableCupKinds, reusableCupKinds } from '../game/cups'
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
  const needed = state.ticket ? cupKindFor(state.ticket.recipe, state.ticket.service) : null
  return (
    <section className="divide-y divide-line" aria-label="컵 종류별 재고">
      <div className="flex justify-between gap-3 py-2 text-xs text-muted">
        <span>컵 종류</span>
        <span>사용 가능</span>
      </div>
      {reusableCupKinds.map((kind) => {
        const stock = state.reusableCups[kind]
        const pending = [
          stock.dirty ? `세척 대기 ${stock.dirty}개` : '',
          stock.washed ? `보관 대기 ${stock.washed}개` : '',
        ].filter(Boolean)
        return (
          <div key={kind} className="py-3">
            <div className="flex justify-between gap-3 text-sm">
              <span>{CUP_NAMES[kind]}</span>
              <span
                className="tabular-nums data-[empty=true]:text-danger"
                data-empty={needed === kind && stock.clean === 0}
              >
                {stock.clean}개
              </span>
            </div>
            {pending.length ? <p className="mt-1 text-xs text-muted">{pending.join(' · ')}</p> : null}
            {act && needed === kind && stock.clean === 0 ? (
              <p className="mt-2 text-xs text-danger">
                {stock.washed
                  ? '세척대에서 씻은 컵을 가져오세요.'
                  : stock.dirty
                    ? '세척대에서 컵을 씻어 보관하세요.'
                    : '객석·반납대에서 컵 회수가 필요합니다.'}
              </p>
            ) : null}
          </div>
        )
      })}
      {disposableCupKinds.map((kind) => {
        const stock = state.disposableCups[kind]
        const row = (
          <>
            <span className="grow">{CUP_NAMES[kind]}</span>
            <span
              className="tabular-nums data-[empty=true]:text-danger"
              data-empty={needed === kind && stock.bar === 0}
            >
              {stock.bar}개
            </span>
          </>
        )
        if (!act)
          return (
            <div key={kind} className="py-3">
              <div className="flex justify-between gap-3 text-sm">{row}</div>
              {stock.reserve > 0 ? <p className="mt-1 text-xs text-muted">후방 {stock.reserve}개</p> : null}
            </div>
          )
        return (
          <details key={kind} className="group/cups" open={needed === kind && stock.bar === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm after:text-muted after:content-['+'] group-open/cups:after:content-['−'] [&::-webkit-details-marker]:hidden">
              {row}
            </summary>
            <div className="pb-3">
              <p className="mb-2 text-xs text-muted">후방 {stock.reserve}개</p>
              {stock.reserve > 0 ? (
                <Button
                  variant="secondary"
                  disabled={stock.bar >= 12}
                  onClick={() => act({ type: 'cups', kind })}
                  aria-label={`${CUP_NAMES[kind]} 보충`}
                >
                  보관대 보충
                </Button>
              ) : !purchasing ? (
                <p className="text-xs text-muted">창고에서 입고 필요</p>
              ) : null}
              {purchasing ? (
                <Button
                  variant="secondary"
                  disabled={state.cash < 2000 || stock.reserve >= 48}
                  onClick={() => act({ type: 'buy-cups', kind })}
                  aria-label={`${CUP_NAMES[kind]} 24개 입고 · 2,000원`}
                >
                  24개 입고 · 2,000원
                </Button>
              ) : null}
            </div>
          </details>
        )
      })}
    </section>
  )
}
