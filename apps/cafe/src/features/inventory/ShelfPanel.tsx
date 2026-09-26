import { formatDecimal } from '@sobok/std/format/number'
import { INGREDIENTS } from '../../content/ingredients'
import { batchDate } from '../../shared/format'
import { PanelRow, PanelSection } from '../../shared/ui/PanelControls'
import { HoldAction } from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { batchHome } from './batches'

/** Room-temperature mixes waiting for use; the panel exists to check their dates and clear expired ones. */
export default function ShelfPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const batches = state.batches.filter((batch) => batch.amount > 0 && batchHome(batch) === 'shelf')

  return (
    <PanelSection title="보관 중인 배합">
      {batches.map((batch) => {
        const definition = INGREDIENTS[batch.ingredient]
        const expired = batch.expiresAt !== null && batch.expiresAt <= state.time

        return (
          <PanelRow
            key={batch.id}
            title={definition.name}
            note={expired ? '기한 만료' : `만료 ${batchDate(batch.expiresAt)}`}
            alert={expired}
            value={`${formatDecimal(batch.amount)}${definition.unit}`}
          >
            {expired && (
              <HoldAction
                shortcut={false}
                onConfirm={() => act({ type: 'discard-batch', id: batch.id, station: 'shelf' })}
              >
                폐기
              </HoldAction>
            )}
          </PanelRow>
        )
      })}
    </PanelSection>
  )
}
