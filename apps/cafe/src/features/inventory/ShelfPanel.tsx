import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import BatchLabel from './BatchLabel'

export default function ShelfPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const shelfBatches = state.batches.filter(
    (batch) => batch.ingredient === 'mocha' && batch.location === 'bar' && batch.amount > 0,
  )

  return (
    <>
      {!shelfBatches.length && <p className="text-sm text-muted">보관된 배합 없음</p>}
      {shelfBatches.map((batch) => (
        <BatchLabel key={batch.id} batch={batch} time={state.time} act={act} station="shelf" />
      ))}
    </>
  )
}
