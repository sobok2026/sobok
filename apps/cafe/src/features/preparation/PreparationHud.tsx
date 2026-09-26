import type { StationId } from '../../content/stations'
import { TextButton } from '../../shared/ui/Button'
import { WorkButton, WorkHud, WorkTitle } from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import { cupHandsBusy } from '../../simulation/hands'
import type { GameState, Preparation } from '../../simulation/state'
import BatchLabel from '../inventory/BatchLabel'
import { batchTitle } from '../inventory/batches'
import { ProductionControls } from '../production/ProductionControls'
import { preparationSupplyNotice } from './help'
import { PREPARATIONS, preparationStep } from './rules'

type Props = { state: GameState; target: StationId | null; act: (action: Action) => void; stop: () => void }

export default function PreparationHud({ state, target, act, stop }: Props) {
  const prep = state.preparation
  if (!prep || target !== 'prep') return null
  const definition = PREPARATIONS[prep.recipe]

  return (
    <WorkHud data-fault={!!prep.fault} aria-label="부재료 직접 준비">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted compact:mb-1.5">
        <span>{definition.name}</span>
        <span>{prep.stage === 'ready' ? '라벨 · 보관' : `${prep.cursor + 1} / ${definition.steps.length}`}</span>
      </div>
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
  const step = preparationStep(prep)
  const job = state.jobs.find((item) => item.preparationId === prep.id)
  const batch = state.batches.find((item) => item.id === prep.batchId)
  const expiredBatch = batch?.expiresAt != null && batch.expiresAt <= state.time
  const handsFull = cupHandsBusy(state.cup)

  if (prep.fault) {
    return (
      <>
        <WorkTitle>배합 실패</WorkTitle>
        <p className="my-2.5 text-sm leading-relaxed text-danger">{prep.fault}</p>
        <WorkButton shortcut="F" primary onUse={() => act({ type: 'discard-preparation' })}>
          배합 폐기
        </WorkButton>
      </>
    )
  }

  if (prep.stage === 'ready' && batch) {
    return (
      <>
        <WorkTitle>{batchTitle(batch, expiredBatch, '보관 준비')}</WorkTitle>
        <BatchLabel batch={batch} time={state.time} act={act} station="prep" />
      </>
    )
  }

  if (!step) {
    return (
      <>
        <WorkTitle>준비 상태 확인</WorkTitle>
        <TextButton danger onClick={() => act({ type: 'discard-preparation' })}>
          배합을 정리하고 다시 시작
        </TextButton>
      </>
    )
  }

  return (
    <>
      {handsFull ? (
        <p className="my-2.5 text-sm leading-relaxed text-danger">음료 컵과 도구를 먼저 내려놓으세요.</p>
      ) : null}
      <ProductionControls
        session={prep}
        step={step}
        job={job}
        time={state.time}
        supplyNotice={job ? null : preparationSupplyNotice(state, prep, step)}
        disabled={handsFull}
        onTool={() => act({ type: 'prep-tool' })}
        onUse={() => act({ type: 'prep-use' })}
        onStop={stop}
        onConfirm={() => act({ type: 'prep-confirm' })}
        onObserve={(id, value) => act({ type: 'prep-confirm', observation: { id, value } })}
      />
      <details className="mt-3 text-xs text-muted">
        <summary className="py-1.5">작업 관리</summary>
        <TextButton danger onClick={() => act({ type: 'discard-preparation' })}>
          배합 폐기
        </TextButton>
      </details>
    </>
  )
}
