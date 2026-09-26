import { STATIONS, type StationId } from '../../content/stations'
import {
  HoldAction,
  WorkActions,
  WorkBlocker,
  WorkButton,
  WorkHeader,
  WorkHud,
  WorkLink,
  WorkLinks,
  WorkNote,
} from '../../shared/ui/WorkControls'
import { craftBlocker } from '../../simulation/guidance'
import type { CraftState, GameState, Job } from '../../simulation/state'
import { isReusableCup } from '../inventory/cups'
import { ProductionControls } from '../production/ProductionControls'
import type { WorkStep } from '../production/workflow'
import { CUSTOMER_STATUS } from '../service/customer'
import { operationFor } from './rules'

type Props = {
  state: GameState
  target: StationId | null
  onUse: (station: StationId) => void
  onStop: () => void
  onTool: (station: StationId) => void
  onConfirm: (station: StationId, observation?: { id: string; value: boolean }) => void
  onMoveCup: (station: StationId) => void
  onDiscard: () => void
}

export default function CraftingHud({ state, target, ...handlers }: Props) {
  const cup = state.cup
  if (!cup || cup.craft.location === 'hand' || cup.craft.location !== target) {
    return null
  }

  const craft = cup.craft
  const place = cup.craft.location
  const step = operationFor(cup.recipe, craft)
  const nextStation = step?.station ?? 'pickup'
  const job = state.jobs.find((item) => item.cupId === cup.id)

  return (
    <WorkHud aria-label="직접 제조 조작">
      <CraftingWork
        state={state}
        craft={craft}
        place={place}
        step={step}
        job={job}
        nextStation={nextStation}
        needsMove={nextStation !== place && !job}
        {...handlers}
      />
    </WorkHud>
  )
}

function CraftingWork({
  state,
  craft,
  place,
  step,
  job,
  nextStation,
  needsMove,
  onUse,
  onStop,
  onTool,
  onConfirm,
  onMoveCup,
  onDiscard,
}: Omit<Props, 'target'> & {
  craft: CraftState
  place: StationId
  step: WorkStep | null
  job: Job | undefined
  nextStation: StationId
  needsMove: boolean
}) {
  if (craft.fault) {
    return (
      <>
        <WorkHeader title={step?.label ?? '제조 완료'} />
        <WorkBlocker reason="다시 만들어야 해요" fix={craft.fault} />
        <WorkLinks>
          <HoldAction onConfirm={onDiscard}>{isReusableCup(craft.kind) ? '비우고 세척 대기로' : '컵 폐기'}</HoldAction>
        </WorkLinks>
      </>
    )
  }

  if (needsMove) {
    return (
      <>
        <WorkHeader title={`다음 · ${STATIONS[nextStation].name}`} />
        <WorkActions>
          <WorkButton shortcut="E" primary onUse={() => onMoveCup(place)}>
            컵 집기
          </WorkButton>
        </WorkActions>
      </>
    )
  }

  if (step) {
    return (
      <>
        <ProductionControls
          session={craft}
          step={step}
          job={job}
          time={state.time}
          blocker={craftBlocker(state, craft, step)}
          onTool={() => onTool(place)}
          onUse={() => onUse(place)}
          onStop={onStop}
          onConfirm={() => onConfirm(place)}
          onObserve={(id, value) => onConfirm(place, { id, value })}
        />
        {!craft.tool && !job && (
          <WorkLinks>
            <WorkLink shortcut="E" onUse={() => onMoveCup(place)}>
              컵 집기
            </WorkLink>
          </WorkLinks>
        )}
      </>
    )
  }

  const customer = state.customer

  return (
    <>
      <WorkHeader title={customer?.stage === 'pickup' ? '전달 준비' : '제조 완료'} />
      {customer?.stage !== 'pickup' && (
        <WorkNote>{customer ? `손님 ${CUSTOMER_STATUS[customer.stage]}` : '응대할 손님이 없어요.'}</WorkNote>
      )}
      {customer?.stage === 'pickup' && (
        <WorkActions>
          <WorkButton shortcut="F" primary onUse={() => onConfirm(place)}>
            음료 전달
          </WorkButton>
        </WorkActions>
      )}
      <WorkLinks>
        <WorkLink shortcut="E" onUse={() => onMoveCup(place)}>
          컵 집기
        </WorkLink>
      </WorkLinks>
    </>
  )
}
