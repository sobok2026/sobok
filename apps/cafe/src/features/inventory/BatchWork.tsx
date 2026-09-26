import { formatDecimal } from '@sobok/std/format/number'
import { INGREDIENTS } from '../../content/ingredients'
import { STATIONS, type StationId } from '../../content/stations'
import { batchDate } from '../../shared/format'
import {
  HoldAction,
  WorkActions,
  WorkBlocker,
  WorkButton,
  WorkHeader,
  WorkLinks,
  WorkNote,
} from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import type { Batch } from '../../simulation/state'
import { batchDestination, limitedByIngredient } from './batches'

/** Labelling and picking up a finished batch at the bench that made it. */
export default function BatchWork({
  batch,
  time,
  act,
  station,
}: {
  batch: Batch
  time: number
  act: (action: Action) => void
  station: StationId
}) {
  const definition = INGREDIENTS[batch.ingredient]
  const discard = (
    <WorkLinks>
      <HoldAction onConfirm={() => act({ type: 'discard-batch', id: batch.id, station })}>배치 폐기</HoldAction>
    </WorkLinks>
  )

  if (batch.expiresAt !== null && batch.expiresAt <= time) {
    return (
      <>
        <WorkHeader title={`${definition.name} 기한 만료`} />
        <WorkBlocker reason="사용할 수 없어요" fix="라벨을 붙이거나 보관해도 만료 시각은 늘어나지 않아요." />
        {discard}
      </>
    )
  }

  return (
    <>
      <WorkHeader
        title={batch.labelled ? `${definition.name} 보관` : `${definition.name} 라벨`}
        value={`${formatDecimal(batch.amount)}${definition.unit}`}
      />
      <WorkNote>
        만료 {batchDate(batch.expiresAt)}
        {limitedByIngredient(batch) && ' · 원재료 기한 적용'}
      </WorkNote>
      <WorkActions>
        {batch.labelled ? (
          <WorkButton shortcut="E" primary onUse={() => act({ type: 'take-batch', id: batch.id, station })}>
            용기 집기 → {STATIONS[batchDestination(batch)].name}
          </WorkButton>
        ) : (
          <WorkButton shortcut="F" primary onUse={() => act({ type: 'label-batch', id: batch.id, station })}>
            라벨 붙이기
          </WorkButton>
        )}
      </WorkActions>
      {discard}
    </>
  )
}
