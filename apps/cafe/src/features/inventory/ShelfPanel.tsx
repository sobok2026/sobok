import { formatDecimal } from '@sobok/std/format/number'
import { INGREDIENTS } from '../../content/ingredients'
import { PanelRow, PanelSection, StatusChip } from '../../shared/ui/PanelControls'
import { HoldAction } from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { batchHome } from './batches'
import { labelText } from './labels'

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
            note={`${formatDecimal(batch.amount)}${definition.unit}`}
            status={
              expired ? (
                <StatusChip tone="alert">기한 지남</StatusChip>
              ) : (
                <StatusChip tone="label">{labelText(batch)}</StatusChip>
              )
            }
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
