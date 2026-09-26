import type { ReactNode } from 'react'
import { Button } from '../../shared/ui/Button'
import { WorkActions, WorkBlocker, WorkButton, WorkHeader, WorkMeter, WorkNote } from '../../shared/ui/WorkControls'
import type { Job } from '../../simulation/state'
import { operationNotes, workProgressLabel, workTargetCaption, workUseLabel } from './presentation'
import { continuousWork, readyWork } from './runtime'
import { PRODUCTION_EPSILON, type ProductionState, type WorkStep } from './workflow'

type Props = {
  session: ProductionState
  step: WorkStep
  title?: ReactNode
  job?: Pick<Job, 'label' | 'startedAt' | 'endsAt'>
  time: number
  blocker?: { reason: string; fix: string } | null
  onTool: () => void
  onUse: () => void
  onStop: () => void
  onConfirm: () => void
  onObserve?: (id: string, value: boolean) => void
}

export function ProductionControls({
  session,
  step,
  title,
  job,
  time,
  blocker,
  onTool,
  onUse,
  onStop,
  onConfirm,
  onObserve,
}: Props) {
  if (step.kind === 'condition') {
    const condition = step.condition

    return (
      <>
        <WorkHeader title={title ?? step.label} />
        {condition ? (
          <>
            <p className="mb-3 text-body">
              {condition.property}: {condition.value}에 해당하나요?
            </p>
            <fieldset
              className="grid grid-cols-2 gap-2"
              aria-label="제조 조건 확인"
              disabled={!!session.fault || !!job || !onObserve}
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
          <WorkNote>확인할 제조 조건이 없어요.</WorkNote>
        )}
      </>
    )
  }

  const ready = readyWork(step, session.progress)
  const rightTool = session.tool === (step.tool?.id ?? null)
  const atMaximum = step.maximum !== null && session.progress + PRODUCTION_EPSILON >= step.maximum
  const halted = !!blocker || !!session.fault
  const canUse = rightTool && !atMaximum && !halted && !job
  const showTool = !!session.tool || (!!step.tool && !atMaximum && !halted && !job)
  const continuous = continuousWork(step)
  const notes = operationNotes(step)
  const value = job ? `${Math.max(0, Math.ceil(job.endsAt - time))}초` : workProgressLabel(step, session.progress)
  const ratio = job
    ? (time - job.startedAt) / Math.max(PRODUCTION_EPSILON, job.endsAt - job.startedAt)
    : session.progress / (step.maximum ?? step.target)

  return (
    <>
      <WorkHeader title={title ?? step.label} value={value} />
      {notes.length > 0 && <WorkNote>{notes.join(' · ')}</WorkNote>}
      {blocker ? (
        <WorkBlocker reason={blocker.reason} fix={blocker.fix} />
      ) : (
        <WorkMeter label={job?.label ?? step.label} ratio={ratio} valueText={value} caption={workTargetCaption(step)} />
      )}
      <WorkActions>
        {showTool && (
          <WorkButton shortcut="G" primary={!session.tool || ready || !rightTool || halted} onUse={onTool}>
            {session.tool
              ? `${session.tool === step.tool?.id ? step.tool.name : '도구'} 놓기`
              : `${step.tool!.name} 집기`}
          </WorkButton>
        )}
        {canUse && continuous && (
          <WorkButton shortcut="Space" primary={!ready} hold onUse={onUse} onStop={onStop}>
            {workUseLabel(step)}
          </WorkButton>
        )}
        {canUse && !continuous && (
          <WorkButton shortcut="Space" primary={!ready} onUse={onUse}>
            {workUseLabel(step)}
          </WorkButton>
        )}
        {ready && !session.tool && !halted && !job && (
          <WorkButton shortcut="F" primary onUse={onConfirm}>
            {step.kind === 'machine' ? '장비 완료 확인' : '단계 완료 확인'}
          </WorkButton>
        )}
      </WorkActions>
    </>
  )
}
