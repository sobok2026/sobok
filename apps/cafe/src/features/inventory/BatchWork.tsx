import { formatDecimal } from '@sobok/std/format/number'
import { INGREDIENTS } from '../../content/ingredients'
import { STATIONS, type StationId } from '../../content/stations'
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
import { batchDestination } from './batches'
import LabelWriter from './LabelWriter'
import { labelText } from './labels'

/** Writing the label for a finished batch and picking it up at the bench that made it. */
export default function BatchWork({
  batch,
  time,
  inputsUntil = null,
  act,
  station,
}: {
  batch: Batch
  time: number
  inputsUntil?: number | null
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
        <WorkBlocker reason="사용할 수 없어요" fix="라벨을 쓰거나 보관해도 만료 시각은 늘어나지 않아요." />
        {discard}
      </>
    )
  }

  if (!batch.labelled) {
    return (
      <>
        <WorkHeader title="라벨 쓰기" value={`${formatDecimal(batch.amount)}${definition.unit}`} />
        <LabelWriter
          key={batch.id}
          batch={batch}
          inputsUntil={inputsUntil}
          onAttach={(until) => act({ type: 'label-batch', id: batch.id, station, until })}
        />
        {discard}
      </>
    )
  }

  return (
    <>
      <WorkHeader title={`${definition.name} 보관`} value={`${formatDecimal(batch.amount)}${definition.unit}`} />
      <WorkNote>라벨 {labelText(batch)}</WorkNote>
      <WorkActions>
        <WorkButton shortcut="E" primary onUse={() => act({ type: 'take-batch', id: batch.id, station })}>
          용기 집기 → {STATIONS[batchDestination(batch)].name}
        </WorkButton>
      </WorkActions>
      {discard}
    </>
  )
}
