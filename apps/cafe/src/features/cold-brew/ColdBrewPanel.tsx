import { COLD_BREW_HOURS } from '../../content/references'
import { money } from '../../shared/format'
import { Button } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { COLD_BREW_BEANS, COLD_BREW_COST, COLD_BREW_WATER } from './rules'
export default function ColdBrewPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  return (
    <>
      <dl className="mb-5 grid grid-cols-3 gap-3 text-xs">
        <div>
          <dt className="text-muted">원두</dt>
          <dd className="mt-2 text-base">{COLD_BREW_BEANS}lb</dd>
        </div>
        <div>
          <dt className="text-muted">정수</dt>
          <dd className="mt-2 text-base">{COLD_BREW_WATER}L</dd>
        </div>
        <div>
          <dt className="text-muted">추출</dt>
          <dd className="mt-2 text-base">{COLD_BREW_HOURS}시간</dd>
        </div>
      </dl>
      <Button
        disabled={!!state.coldBrew || state.cash < COLD_BREW_COST}
        onClick={() => act({ type: 'start-cold-brew' })}
      >
        추출 준비 <span>{money(COLD_BREW_COST)}</span>
      </Button>
    </>
  )
}
