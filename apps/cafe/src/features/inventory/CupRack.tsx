import { Button } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import CupInventory from './CupInventory'
import { CUP_NAMES, cleanCupCount, cupKindFor } from './cups'
export default function CupRack({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const selectedCupKind = state.ticket ? cupKindFor(state.ticket.recipe, state.ticket.service) : null
  return (
    <>
      {selectedCupKind ? (
        <Button
          disabled={!!state.cup || !cleanCupCount(state, selectedCupKind)}
          onClick={() => act({ type: 'take-cup' })}
        >
          {CUP_NAMES[selectedCupKind]} 집기
        </Button>
      ) : null}
      <CupInventory state={state} act={act} />
    </>
  )
}
