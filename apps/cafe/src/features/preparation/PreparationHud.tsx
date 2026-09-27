import type { StationId } from '../../content/stations'
import { HoldAction, WorkBlocker, WorkHeader, WorkHud, WorkLinks, WorkMeter } from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import { preparationBlocker } from '../../simulation/guidance'
import { cupHandsBusy } from '../../simulation/hands'
import type { GameState, Preparation } from '../../simulation/state'
import BatchWork from '../inventory/BatchWork'
import { ProductionControls } from '../production/ProductionControls'
import type { WorkStep } from '../production/workflow'
import { PREPARATIONS, preparationStep } from './rules'

type Props = { state: GameState; target: StationId | null; act: (action: Action) => void; stop: () => void }

export default function PreparationHud({ state, target, act, stop }: Props) {
  const prep = state.preparation
  if (!prep || target !== 'prep') {
    return null
  }

  return (
    <WorkHud aria-label="부재료 직접 준비">
      <PreparationWork state={state} prep={prep} act={act} stop={stop} />
    </WorkHud>
  )
}

function PreparationWork({
  state,
  prep,
  act,
  stop,
}: {
  state: GameState
  prep: Preparation
  act: (action: Action) => void
  stop: () => void
}) {
  const definition = PREPARATIONS[prep.recipe]
  const step = preparationStep(prep)
  const job = state.jobs.find((item) => item.preparationId === prep.id)
  const batch = state.batches.find((item) => item.id === prep.batchId)
  const discard = (label: string) => (
    <WorkLinks>
      <HoldAction onConfirm={() => act({ type: 'discard-preparation' })}>{label}</HoldAction>
    </WorkLinks>
  )

  if (prep.fault) {
    return (
      <>
        <WorkHeader title={definition.name} />
        <WorkBlocker reason="다시 준비해야 해요" fix={prep.fault} fault />
        {discard('배합 폐기')}
      </>
    )
  }

  if (prep.stage === 'ready' && batch) {
    return <BatchWork batch={batch} time={state.time} inputsUntil={prep.ingredientExpiresAt} act={act} station="prep" />
  }

  if (!step) {
    return (
      <>
        <WorkHeader title="준비 상태 확인" />
        <WorkBlocker reason="다음 단계를 찾을 수 없어요" fix="배합을 정리하고 다시 시작하세요." fault />
        {discard('배합 정리')}
      </>
    )
  }

  if (job) {
    return (
      <>
        <WorkHeader title={`${job.label} 중`} value={`${Math.max(0, Math.ceil(job.endsAt - state.time))}초`} />
        <WorkMeter
          label={job.label}
          ratio={(state.time - job.startedAt) / Math.max(1e-9, job.endsAt - job.startedAt)}
          valueText={`${Math.max(0, Math.ceil(job.endsAt - state.time))}초 남음`}
        />
        {discard('배합 폐기')}
      </>
    )
  }

  return (
    <>
      <ProductionControls
        session={prep}
        step={step}
        blocker={workBlocker(state, prep, step)}
        onTool={() => act({ type: 'prep-tool' })}
        onUse={() => act({ type: 'prep-use' })}
        onStop={stop}
        onConfirm={() => act({ type: 'prep-confirm' })}
        onChoose={(key, value) => act({ type: 'prep-choose', key, value })}
        onObserve={(id, value) => act({ type: 'prep-confirm', observation: { id, value } })}
      />
      {discard('배합 폐기')}
    </>
  )
}

function workBlocker(state: GameState, prep: Preparation, step: WorkStep) {
  if (cupHandsBusy(state.cup)) {
    return { reason: '손이 비어 있지 않아요', fix: '음료 컵과 도구를 먼저 내려놓으세요.' }
  }
  return preparationBlocker(state, prep, step)
}
