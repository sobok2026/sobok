import type { ReactNode } from 'react'
import { Button } from '../../shared/ui/Button'
import {
  WorkActions,
  WorkBlocker,
  WorkButton,
  WorkChoices,
  WorkHeader,
  WorkHoldStatus,
  WorkNote,
} from '../../shared/ui/WorkControls'
import { ProductionGauge } from './ProductionGauge'
import { workReading, workTitle, workUseLabel } from './presentation'
import { continuousWork } from './runtime'
import { PRODUCTION_EPSILON, type ProductionState, type WorkStep } from './workflow'

type Props = {
  session: ProductionState
  step: WorkStep
  active: boolean
  title?: ReactNode
  blocker?: { reason: string; fix: string; fault?: boolean } | null
  onTool: () => void
  onUse: () => void
  onStop: () => void
  onConfirm: () => void
  onChoose: (key: string, value: string) => void
  onObserve?: (id: string, value: boolean) => void
}

export function ProductionControls({
  session,
  step,
  active,
  title,
  blocker,
  onTool,
  onUse,
  onStop,
  onConfirm,
  onChoose,
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
              disabled={!!session.fault || !onObserve}
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

  const serving = step.operation.action === 'serve'
  const started = session.progress > PRODUCTION_EPSILON
  const rightTool = session.tool === (step.tool?.id ?? null)
  const halted = !!blocker || !!session.fault
  const canUse = rightTool && !halted && !serving
  const showTool = !!session.tool || (!!step.tool && !halted)
  const canConfirm = !active && !session.tool && !halted && (started || serving)
  const needsTool = !!step.tool && !session.tool

  return (
    <>
      <WorkHeader title={title ?? workTitle(step)} value={workReading(step, session.progress) ?? undefined} />
      {blocker && <WorkBlocker reason={blocker.reason} fix={blocker.fix} fault={blocker.fault} />}
      {!halted && step.choices.length > 0 && (
        <WorkChoices
          groups={step.choices.map((choice) => ({ ...choice, picked: session.choices[choice.key] }))}
          locked={started}
          onPick={onChoose}
        />
      )}
      <ProductionGauge session={session} step={step} />
      {canUse && continuousWork(step) && (
        <WorkHoldStatus active={active} started={started} pouring={step.kind === 'pour'} />
      )}
      <WorkActions>
        {showTool && (
          <WorkButton shortcut="G" primary={!canConfirm && (needsTool || !rightTool)} onUse={onTool}>
            {session.tool
              ? `${session.tool === step.tool?.id ? step.tool.name : '도구'} 놓기`
              : `${step.tool!.name} 집기`}
          </WorkButton>
        )}
        {canUse && continuousWork(step) && (
          <WorkButton
            shortcut="Space"
            primary={active || !!session.tool || !started}
            active={active}
            hold
            onUse={onUse}
            onStop={onStop}
          >
            {workUseLabel(step)}
          </WorkButton>
        )}
        {canUse && !continuousWork(step) && (
          <WorkButton shortcut="Space" primary={!started} onUse={onUse}>
            {workUseLabel(step)}
          </WorkButton>
        )}
        {canConfirm && (
          <WorkButton shortcut="F" primary onUse={onConfirm}>
            확인
          </WorkButton>
        )}
      </WorkActions>
    </>
  )
}
