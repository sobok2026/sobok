import { money } from '../../shared/format'
import { Button } from '../../shared/ui/Button'
import { PanelStatus } from '../../shared/ui/PanelControls'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { COLD_BREW_BEANS, COLD_BREW_COST, COLD_BREW_HOURS, COLD_BREW_WATER } from './rules'

/** Starting a batch spends money, so it stays a deliberate press in a small panel rather than a bare E. */
export default function ColdBrewPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  return (
    <>
      <PanelStatus>
        원두 {COLD_BREW_BEANS}lb · 정수 {COLD_BREW_WATER}L · 추출 {COLD_BREW_HOURS}시간
      </PanelStatus>
      {state.cash < COLD_BREW_COST ? (
        <p className="text-body text-danger">운영비가 부족해요.</p>
      ) : (
        <Button onClick={() => act({ type: 'start-cold-brew' })}>
          추출 준비 <span>{money(COLD_BREW_COST)}</span>
        </Button>
      )}
    </>
  )
}
