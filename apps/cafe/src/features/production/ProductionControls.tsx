import { Button } from '../../shared/ui/Button'
import { WorkButton, WorkMeter, WorkTitle } from '../../shared/ui/WorkControls'
import type { Job } from '../../simulation/state'
import { operationDetails, workProgressLabel, workUseLabel } from './presentation'
import { continuousWork, readyWork } from './runtime'
import { PRODUCTION_EPSILON, type ProductionState, type WorkStep } from './workflow'

type Props = {
  session: ProductionState
  step: WorkStep
  job?: Pick<Job, 'label' | 'startedAt' | 'endsAt'>
  time: number
  supplyNotice?: string | null
  disabled?: boolean
  onTool: () => void
  onUse: () => void
  onStop: () => void
  onConfirm: () => void
  onObserve?: (id: string, value: boolean) => void
}
export function ProductionControls({
  session,
  step,
  job,
  time,
  supplyNotice,
  disabled,
  onTool,
  onUse,
  onStop,
  onConfirm,
  onObserve,
}: Props) {
  const ready = readyWork(step, session.progress)
  const rightTool = session.tool === (step.tool?.id ?? null)
  const atMaximum = step.maximum !== null && session.progress + PRODUCTION_EPSILON >= step.maximum
  const blocked = disabled || !!session.fault
  const details = operationDetails(step)
  const jobRatio = job ? (time - job.startedAt) / Math.max(PRODUCTION_EPSILON, job.endsAt - job.startedAt) : 0
  if (step.kind === 'condition') {
    const condition = step.condition
    return (
      <>
        <WorkTitle>{step.label}</WorkTitle>
        {condition ? (
          <>
            <p className="mb-3 text-sm leading-relaxed">
              {condition.property}: {condition.value}에 해당하나요?
            </p>
            <fieldset
              className="grid grid-cols-2 gap-2"
              aria-label="제조 조건 확인"
              disabled={blocked || !!job || !onObserve}
            >
              <Button variant="secondary" onClick={() => onObserve?.(condition.id, true)}>
                해당함
              </Button>
              <Button variant="secondary" onClick={() => onObserve?.(condition.id, false)}>
                해당하지 않음
              </Button>
            </fieldset>
          </>
        ) : (
          <p className="text-sm text-muted">확인할 제조 조건이 없어요.</p>
        )}
      </>
    )
  }
  return (
    <>
      <WorkTitle>{step.label}</WorkTitle>
      {step.measurement && !step.mixesMaterialId ? (
        <p className="mb-2 text-sm font-medium">목표 · {step.measurement}</p>
      ) : null}
      {details.length ? <p className="mb-3 text-xs leading-relaxed text-muted">{details.join(' · ')}</p> : null}
      {supplyNotice ? (
        <p className="mb-3 border-l-3 border-[#bb8a57] pl-3 text-sm leading-relaxed text-danger">{supplyNotice}</p>
      ) : null}
      <WorkMeter
        label={job?.label ?? step.label}
        ratio={job ? jobRatio : session.progress / (step.maximum ?? step.target)}
        value={job ? `${Math.max(0, Math.ceil(job.endsAt - time))}초 남음` : workProgressLabel(step, session.progress)}
      />
      {job ? (
        <>
          <p className="mb-3 text-xs text-muted">작동이 끝난 뒤 완료를 확인하세요.</p>
          {session.tool ? (
            <WorkButton shortcut="G" disabled={blocked} onUse={onTool}>
              도구 놓기
            </WorkButton>
          ) : null}
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          {session.tool || (step.tool && !atMaximum) ? (
            <WorkButton
              shortcut="G"
              primary={(!!session.tool && (ready || !rightTool)) || (!rightTool && !supplyNotice)}
              disabled={blocked}
              onUse={onTool}
            >
              {session.tool
                ? `${session.tool === step.tool?.id ? step.tool.name : '도구'} 놓기`
                : `${step.tool!.name} 집기`}
            </WorkButton>
          ) : null}
          {rightTool && !atMaximum ? (
            continuousWork(step) ? (
              <WorkButton
                shortcut="Space"
                primary={!ready && !supplyNotice}
                disabled={blocked || !!supplyNotice}
                hold
                onUse={onUse}
                onStop={onStop}
              >
                {workUseLabel(step)}
              </WorkButton>
            ) : (
              <WorkButton
                shortcut="Space"
                primary={!ready && !supplyNotice}
                disabled={blocked || !!supplyNotice}
                onUse={onUse}
              >
                {workUseLabel(step)}
              </WorkButton>
            )
          ) : null}
          {ready && !session.tool ? (
            <WorkButton shortcut="F" primary disabled={blocked} onUse={onConfirm}>
              {step.kind === 'machine' ? '장비 완료 확인' : '단계 완료 확인'}
            </WorkButton>
          ) : null}
        </div>
      )}
    </>
  )
}
