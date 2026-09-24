import { formatAmount, INGREDIENTS, type StationId } from '../game/catalog'
import { continuousPreparation, PREP_TOOL_NAMES, PREPARATIONS, preparationStep } from '../game/preparation'
import type { GameState } from '../game/state'
import { type Action, available } from '../game/store'
import BatchLabel from './BatchLabel'
import { TextButton } from './Button'
import { WorkButton, WorkHud, WorkMeter, WorkTitle } from './WorkControls'

type Props = { state: GameState; target: StationId | null; act: (action: Action) => void; stop: () => void }
export default function PreparationHud({ state, target, act, stop }: Props) {
  const prep = state.preparation
  if (!prep || target !== 'prep') return null
  const definition = PREPARATIONS[prep.recipe]
  const step = preparationStep(prep)
  const job = state.jobs.find((job) => job.preparationId === prep.id)
  const batch = state.batches.find((batch) => batch.id === prep.batchId)
  const ratio = job ? (state.time - job.startedAt) / (job.endsAt - job.startedAt) : prep.progress / step.target
  const handsFull = !!state.cup && (state.cup.craft.location === 'hand' || !!state.cup.craft.tool)
  const ready = prep.progress + 0.0001 >= step.target * (1 - step.tolerance)
  const canUse = !handsFull && prep.stage === 'measuring' && prep.tool === step.tool
  const missing =
    prep.stage === 'measuring' &&
    !ready &&
    step.ingredient &&
    available(state, step.ingredient) + 0.0001 <
      Math.max(0, step.target * (1 - step.tolerance) - prep.progress) * (step.perUnit ?? 1)
  const toolIsNext = missing ? !!prep.tool : !prep.tool || ready
  return (
    <WorkHud data-fault={!!prep.fault} aria-label="부재료 직접 준비">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted compact:mb-1.5">
        <span>{definition.name} 준비</span>
        <span>{prep.stage === 'ready' ? '라벨 · 보관' : `${prep.step + 1} / ${definition.steps.length} 단계`}</span>
      </div>
      {prep.fault ? (
        <>
          <WorkTitle>배합을 다시 준비해주세요</WorkTitle>
          <p className="my-2.5 text-sm leading-[1.65] text-muted group-data-[fault=true]/work:text-danger">
            {prep.fault}
          </p>
          <WorkButton shortcut="F" primary onUse={() => act({ type: 'discard-preparation' })}>
            배합 폐기하기
          </WorkButton>
        </>
      ) : prep.stage === 'ready' && batch ? (
        <>
          <WorkTitle>{batch.labelled ? '보관 위치를 선택하세요' : '날짜를 확인하고 라벨을 붙이세요'}</WorkTitle>
          <BatchLabel batch={batch} time={state.time} act={act} />
        </>
      ) : (
        <>
          <WorkTitle>{prep.stage === 'processing' ? '블렌딩 중이에요' : step.label}</WorkTitle>
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
            hint={
              job
                ? '다른 일을 해도 괜찮아요'
                : ready
                  ? prep.tool
                    ? '도구를 놓고 확인하세요'
                    : '계량을 확인하세요'
                  : step.tolerance > 0
                    ? '초록 구간에서 멈추세요'
                    : '목표까지 진행하세요'
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
                      ? '3번 버튼 · 블렌딩 시작'
                      : step.kind === 'pump'
                        ? '한 번 펌핑'
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
          <details className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 text-xs text-muted open:basis-full compact:mt-1.5">
            <summary className="cursor-pointer py-1.5">레시피 · 작업 안내</summary>
            <p className="my-2.5 text-sm leading-[1.65] whitespace-pre-line text-muted">{step.instruction}</p>
            <ol className="my-2.5 flex list-none flex-wrap gap-1.5 p-0 text-xs text-muted" aria-label="준비 순서">
              {definition.steps.map((item, index) => (
                <li
                  className="rounded-[0.1875rem] bg-[#e9ecdf] px-1.75 py-1 data-[step=complete]:text-brand data-[step=current]:bg-brand data-[step=current]:text-surface"
                  key={item.label}
                  data-step={index === prep.step ? 'current' : index < prep.step ? 'complete' : undefined}
                >
                  {index < prep.step ? '✓' : index + 1} {item.label}
                </li>
              ))}
            </ol>
            <p className="my-2.5 text-sm leading-[1.65] whitespace-pre-line text-muted">{definition.storageNote}</p>
            <p className="my-2.5 text-xs wrap-anywhere whitespace-pre-line text-muted group-data-[fault=true]/work:text-danger">
              {step.source}
            </p>
            <TextButton danger className="mt-2.5" onClick={() => act({ type: 'discard-preparation' })}>
              준비 중단 · 투입한 재료 폐기
            </TextButton>
          </details>
        </>
      )}
    </WorkHud>
  )
}
