import { INGREDIENTS } from '../../content/ingredients'
import type { StationId } from '../../content/stations'
import { formatAmount } from '../../shared/format'
import { TextButton } from '../../shared/ui/Button'
import { WorkButton, WorkHud, WorkMeter, WorkTitle } from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import { cupHandsBusy } from '../../simulation/hands'
import type { GameState } from '../../simulation/state'
import BatchLabel from '../inventory/BatchLabel'
import { available } from '../inventory/inventory'
import { continuousPreparation, PREP_TOOL_NAMES, PREPARATIONS, preparationStep } from './rules'

type Props = { state: GameState; target: StationId | null; act: (action: Action) => void; stop: () => void }
export default function PreparationHud({ state, target, act, stop }: Props) {
  const prep = state.preparation
  if (!prep || target !== 'prep') return null
  const definition = PREPARATIONS[prep.recipe]
  const step = preparationStep(prep)
  const job = state.jobs.find((job) => job.preparationId === prep.id)
  const batch = state.batches.find((batch) => batch.id === prep.batchId)
  const expiredBatch = batch?.expiresAt != null && batch.expiresAt <= state.time
  const ratio = job ? (state.time - job.startedAt) / (job.endsAt - job.startedAt) : prep.progress / step.target
  const handsFull = cupHandsBusy(state.cup)
  const ready = prep.progress + 1e-9 >= step.target * (1 - step.tolerance)
  const canUse = !handsFull && prep.stage === 'measuring' && prep.tool === step.tool
  const missing =
    prep.stage === 'measuring' &&
    !ready &&
    step.ingredient &&
    available(state, step.ingredient) + 1e-9 <
      Math.max(0, step.target * (1 - step.tolerance) - prep.progress) * (step.perUnit ?? 1)
  const toolIsNext = missing ? !!prep.tool : !prep.tool || ready
  return (
    <WorkHud data-fault={!!prep.fault} aria-label="부재료 직접 준비">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted compact:mb-1.5">
        <span>{definition.name} 준비</span>
        <span>{prep.stage === 'ready' ? '라벨 · 보관' : `${prep.step + 1} / ${definition.steps.length}`}</span>
      </div>
      {prep.fault ? (
        <>
          <WorkTitle>배합 실패</WorkTitle>
          <p className="my-2.5 text-sm leading-[1.65] text-muted group-data-[fault=true]/work:text-danger">
            {prep.fault}
          </p>
          <WorkButton shortcut="F" primary onUse={() => act({ type: 'discard-preparation' })}>
            배합 폐기
          </WorkButton>
        </>
      ) : prep.stage === 'ready' && batch ? (
        <>
          <WorkTitle>{expiredBatch ? '기한 만료' : batch.labelled ? '보관 준비' : '라벨 부착'}</WorkTitle>
          <BatchLabel batch={batch} time={state.time} act={act} station="prep" />
        </>
      ) : (
        <>
          <WorkTitle>{prep.stage === 'processing' ? '블렌딩 중' : step.label}</WorkTitle>
          {missing && step.ingredient ? (
            <p className="my-2.5 border-l-3 border-[#bb8a57] pl-3 text-sm leading-[1.65] text-danger group-data-[fault=true]/work:text-danger">
              {INGREDIENTS[step.ingredient].name} 보충이 필요해요. {prep.tool ? '도구를 놓고 ' : ''}창고에서
              보충해주세요.
            </p>
          ) : null}
          <WorkMeter
            label={step.label}
            ratio={ratio}
            value={
              job
                ? `${Math.max(0, Math.ceil(job.endsAt - state.time))}초 남음`
                : `${formatAmount(prep.progress)} / ${step.target}${step.unit}`
            }
            tolerance={!job && step.tolerance > 0 ? step.tolerance : undefined}
          />
          {handsFull ? (
            <p className="my-2.5 text-sm leading-[1.65] text-danger">음료 컵과 도구를 먼저 내려놓으세요.</p>
          ) : null}
          {prep.stage === 'measuring' ? (
            <div className="flex flex-wrap gap-2">
              {step.tool || prep.tool ? (
                <WorkButton
                  shortcut="G"
                  primary={toolIsNext}
                  disabled={handsFull}
                  onUse={() => act({ type: 'prep-tool' })}
                >
                  {prep.tool ? `${PREP_TOOL_NAMES[prep.tool]} 놓기` : `${PREP_TOOL_NAMES[step.tool!]} 집기`}
                </WorkButton>
              ) : null}
              {canUse ? (
                continuousPreparation(step) ? (
                  <WorkButton
                    shortcut="Space"
                    primary={!ready && !missing}
                    hold
                    onUse={() => act({ type: 'prep-use' })}
                    onStop={stop}
                  >
                    누르고 {step.kind === 'stir' ? '젓기' : '붓기'}
                  </WorkButton>
                ) : (
                  <WorkButton shortcut="Space" primary={!ready && !missing} onUse={() => act({ type: 'prep-use' })}>
                    {step.kind === 'machine'
                      ? '블렌딩 시작'
                      : step.kind === 'pump'
                        ? '펌핑'
                        : step.kind === 'scoop'
                          ? '한 스쿱 넣기'
                          : step.kind === 'shake'
                            ? '흔들기'
                            : '원팩 한 봉 넣기'}
                  </WorkButton>
                )
              ) : null}
              {step.kind !== 'machine' && ready && !prep.tool ? (
                <WorkButton shortcut="F" primary disabled={handsFull} onUse={() => act({ type: 'prep-confirm' })}>
                  계량 확인
                </WorkButton>
              ) : null}
            </div>
          ) : null}
          <details className="mt-3 text-xs text-muted">
            <summary className="py-1.5">작업 관리</summary>
            <TextButton danger onClick={() => act({ type: 'discard-preparation' })}>
              배합 폐기
            </TextButton>
          </details>
        </>
      )}
    </WorkHud>
  )
}
