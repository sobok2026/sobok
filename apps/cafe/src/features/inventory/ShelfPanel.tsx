import { formatDecimal } from '@sobok/std/format/number'
import { INGREDIENTS } from '../../content/ingredients'
import { PanelEmpty, PanelRow, PanelSection, RowButton, StatusChip } from '../../shared/ui/PanelControls'
import { HoldAction } from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { BAR_BATCH_CAPACITY, barBatchCount, batchHome, batchName } from './batches'
import { labelText } from './labels'

export default function ShelfPanel({
  state,
  act,
  place,
}: {
  state: GameState
  act: (action: Action) => void
  place: 'shelf' | 'bar-fridge'
}) {
  const batches = state.batches.filter((batch) => batch.amount > 0 && batchHome(batch) === place)

  return (
    <PanelSection title={`바 사용 재료 · 품목당 용기 ${BAR_BATCH_CAPACITY}개`}>
      {!batches.length && <PanelEmpty>백룸에서 개봉·라벨을 마친 재료를 운반해 보충하세요.</PanelEmpty>}
      {batches.map((batch) => {
        const definition = INGREDIENTS[batch.ingredient]
        const expired = batch.expiresAt !== null && batch.expiresAt <= state.time

        return (
          <PanelRow
            key={batch.id}
            title={batchName(batch)}
            note={`${formatDecimal(batch.amount)}${definition.unit} · 용기 ${barBatchCount(state, batch.ingredient)}/${BAR_BATCH_CAPACITY}개`}
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
                onConfirm={() => act({ type: 'discard-batch', id: batch.id, station: place })}
              >
                폐기
              </HoldAction>
            )}
            {!expired && (
              <RowButton onClick={() => act({ type: 'take-batch', id: batch.id, station: place })}>
                백룸으로 집기
              </RowButton>
            )}
          </PanelRow>
        )
      })}
    </PanelSection>
  )
}
