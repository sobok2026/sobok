import clsx from 'clsx'
import { money } from '../../shared/format'
import { Button } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { currentTicket } from '../service/orders'
import { CUP_NAMES, CUP_SUPPLY, cupKindFor, disposableCupKinds, reusableCupKinds } from './cups'

export default function CupInventory({
  state,
  act,
  purchasing = false,
}: {
  state: GameState
  act?: (action: Action) => void
  purchasing?: boolean
}) {
  const ticket = currentTicket(state)
  const needed = ticket ? cupKindFor(ticket.recipe, ticket.service, ticket.size) : null

  return (
    <section className="divide-y divide-line" aria-label="컵 종류·사이즈별 재고">
      <div className="flex justify-between gap-3 py-2 text-xs text-muted">
        <span>컵 종류·사이즈</span>
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
              <p className="mt-2 text-xs text-danger">{restockHint(stock)}</p>
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
            <summary
              className={clsx(
                'flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm',
                "after:text-muted after:content-['+'] group-open/cups:after:content-['−']",
                '[&::-webkit-details-marker]:hidden',
              )}
            >
              {row}
            </summary>
            <div className="pb-3">
              <p className="mb-2 text-xs text-muted">후방 {stock.reserve}개</p>
              {stock.reserve > 0 ? (
                <Button
                  variant="secondary"
                  disabled={stock.bar >= CUP_SUPPLY.barCapacity}
                  onClick={() => act({ type: 'cups', kind })}
                  aria-label={`${CUP_NAMES[kind]} 보충`}
                >
                  보관대 보충
                </Button>
              ) : null}
              {stock.reserve <= 0 && !purchasing ? <p className="text-xs text-muted">창고에서 입고 필요</p> : null}
              {purchasing ? (
                <Button
                  variant="secondary"
                  disabled={state.cash < CUP_SUPPLY.price || stock.reserve >= CUP_SUPPLY.reserveLimit}
                  onClick={() => act({ type: 'buy-cups', kind })}
                  aria-label={`${CUP_NAMES[kind]} ${CUP_SUPPLY.pack}개 입고 · ${money(CUP_SUPPLY.price)}`}
                >
                  {CUP_SUPPLY.pack}개 입고 · {money(CUP_SUPPLY.price)}
                </Button>
              ) : null}
            </div>
          </details>
        )
      })}
    </section>
  )
}

function restockHint(stock: { washed: number; dirty: number }) {
  if (stock.washed) return '세척대에서 씻은 컵을 가져오세요.'
  if (stock.dirty) return '세척대에서 컵을 씻어 보관하세요.'
  return '객석·반납대에서 컵 회수가 필요합니다.'
}
