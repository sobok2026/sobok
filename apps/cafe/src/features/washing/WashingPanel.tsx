import { Button } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { WASH_NAMES, washItems, washStock } from './rules'
export default function WashingPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const washingQueue = washItems
    .map((item) => ({ item, ...washStock(state, item) }))
    .filter((stock) => stock.dirty > 0 || stock.washed > 0)
  return (
    <div className="divide-y divide-line">
      {washingQueue.length === 0 ? <p className="text-sm text-muted">세척할 용기 없음</p> : null}
      {washingQueue.map(({ item, dirty, washed }) => {
        return (
          <section key={item} className="py-3" aria-label={`${WASH_NAMES[item]} 세척 재고`}>
            <p className="mb-3 flex justify-between gap-3 text-sm">
              <span>{WASH_NAMES[item]}</span>
              <span className="text-muted">{dirty > 0 ? `세척 대기 ${dirty}개` : `세척 완료 ${washed}개`}</span>
            </p>
            {dirty > 0 ? (
              <Button disabled={!!state.washing} onClick={() => act({ type: 'wash', item })}>
                {WASH_NAMES[item]} 세척 시작
              </Button>
            ) : null}
            {washed > 0 ? (
              <Button
                variant={dirty > 0 ? 'secondary' : 'primary'}
                disabled={!!state.washing}
                onClick={() => act({ type: 'take-washed', item })}
              >
                씻은 {WASH_NAMES[item]} 집기
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
