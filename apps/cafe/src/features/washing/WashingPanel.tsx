import { Button } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { CUP_STYLE_NAMES, cupKindFor, cupStyle } from '../inventory/cups'
import { WASH_NAMES, washItems, washStock } from './rules'
export default function WashingPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const needed = state.ticket ? cupKindFor(state.ticket.recipe, state.ticket.service, state.ticket.size) : null
  const washingQueue = (['pitcher', 'hot-mug', 'iced-glass'] as const)
    .map((group) => {
      const items = washItems.filter((item) => (item === 'pitcher' ? item : cupStyle(item)) === group)
      const next = (key: 'dirty' | 'washed') =>
        items.find((item) => item === needed && washStock(state, item)[key] > 0) ??
        items.find((item) => washStock(state, item)[key] > 0)
      return {
        group,
        name: group === 'pitcher' ? WASH_NAMES.pitcher : CUP_STYLE_NAMES[group],
        dirty: items.reduce((sum, item) => sum + washStock(state, item).dirty, 0),
        washed: items.reduce((sum, item) => sum + washStock(state, item).washed, 0),
        dirtyItem: next('dirty'),
        washedItem: next('washed'),
      }
    })
    .filter((stock) => stock.dirty > 0 || stock.washed > 0)
  return (
    <div className="divide-y divide-line">
      {washingQueue.length === 0 ? <p className="text-sm text-muted">세척할 용기 없음</p> : null}
      {washingQueue.map(({ group, name, dirty, washed, dirtyItem, washedItem }) => {
        return (
          <section key={group} className="py-3" aria-label={`${name} 세척 재고`}>
            <p className="mb-3 flex justify-between gap-3 text-sm">
              <span>{name}</span>
              <span className="text-muted">
                {[dirty > 0 ? `세척 대기 ${dirty}개` : '', washed > 0 ? `세척 완료 ${washed}개` : '']
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </p>
            {dirtyItem ? (
              <Button disabled={!!state.washing} onClick={() => act({ type: 'wash', item: dirtyItem })}>
                {name} 세척 시작
              </Button>
            ) : null}
            {washedItem ? (
              <Button
                variant={dirty > 0 ? 'secondary' : 'primary'}
                disabled={!!state.washing}
                onClick={() => act({ type: 'take-washed', item: washedItem })}
              >
                씻은 {name} 집기
              </Button>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

export function ToolRack({ state }: { state: GameState }) {
  return (
    <p className="text-sm text-muted">
      깨끗한 피처 <strong className="ml-2 text-lg font-medium text-ink">{state.tools.clean}개</strong>
    </p>
  )
}
