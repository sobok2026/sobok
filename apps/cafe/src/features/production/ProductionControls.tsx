import type { ReactNode } from 'react'
import { recipeCatalog } from '../../content/catalog'
import { vesselProfile } from '../../content/stock-amounts'
import { Button } from '../../shared/ui/Button'
import {
  type GaugeTick,
  WorkActions,
  WorkBlocker,
  WorkButton,
  WorkChoices,
  WorkGauge,
  WorkHeader,
  WorkNote,
} from '../../shared/ui/WorkControls'
import { workReading, workTitle, workUseLabel } from './presentation'
import { continuousWork } from './runtime'
import { PRODUCTION_EPSILON, type ProductionState, type WorkStep } from './workflow'

type Props = {
  session: ProductionState
  step: WorkStep
  title?: ReactNode
  blocker?: { reason: string; fix: string; fault?: boolean } | null
  onTool: () => void
  onUse: () => void
  onStop: () => void
  onConfirm: () => void
  onChoose: (key: string, value: string) => void
  onObserve?: (id: string, value: boolean) => void
}

const RIM_TICKS_MM = [5, 10, 15, 20]

/** Where the liquid stands now, including a pour past the recipe amount that the stock model stops counting. */
function liquidFill(session: ProductionState, step: WorkStep, id: string) {
  const actual = session.vessels[id]?.fill ?? 0
  const start = session.stepStart?.stepId === step.id ? session.stepStart : null
  const from = start?.fills[id]
  const to = start?.effect.targetFills[id]
  if (!start || from === undefined || to === undefined || session.progress <= start.target) {
    return actual
  }
  return Math.min(1, from + ((to - from) * session.progress) / start.target)
}

/** A held pour into a vessel whose target is a line or a gap reads on the height gauge; amounts read as numbers. */
function heightGauge(session: ProductionState, step: WorkStep) {
  const operation = step.operation
  if (step.kind !== 'pour' || workReading(step, session.progress) !== null || !('into' in operation)) {
    return null
  }
  const amount = 'amount' in operation ? operation.amount : undefined
  const named = amount?.kind === 'mark' ? amount.label : undefined
  const profile = vesselProfile(recipeCatalog, operation.into, step.stockContext, named)
  const ticks: GaugeTick[] = profile.marks.map((mark) => ({ at: mark.fill, label: mark.label }))
  if (profile.cup) {
    // Cups carry no scale near the rim, so a pocket ruler stands in for the barista's eye.
    for (const millimeters of RIM_TICKS_MM) {
      ticks.push({
        at: 1 - millimeters / profile.shape.heightMillimeters,
        label: millimeters % 10 === 0 ? String(millimeters) : null,
        minor: true,
      })
    }
  }
  return { fill: liquidFill(session, step, operation.into), ticks }
}

export function ProductionControls({
  session,
  step,
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
  const canConfirm = !session.tool && !halted && (started || serving)
  const gauge = heightGauge(session, step)
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
      {!halted && gauge && <WorkGauge label="수위" fill={gauge.fill} ticks={gauge.ticks} />}
      <WorkActions>
        {showTool && (
          <WorkButton shortcut="G" primary={needsTool || !rightTool} onUse={onTool}>
            {session.tool
              ? `${session.tool === step.tool?.id ? step.tool.name : '도구'} 놓기`
              : `${step.tool!.name} 집기`}
          </WorkButton>
        )}
        {canUse && continuousWork(step) && (
          <WorkButton shortcut="Space" primary={!!session.tool || !started} hold onUse={onUse} onStop={onStop}>
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
