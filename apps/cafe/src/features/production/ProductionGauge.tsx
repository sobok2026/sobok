import { recipeCatalog } from '../../content/catalog'
import { vesselProfile } from '../../content/stock-amounts'
import { type GaugeTick, WorkGauge } from '../../shared/ui/WorkControls'
import { workReading } from './presentation'
import type { ProductionState, WorkStep } from './workflow'

const RIM_TICKS_MM = [5, 10, 15, 20]
const RIM_ZOOM_MM = 30

/** Both scales read the same physical height as the cup; neither marks the recipe's answer. */
export function ProductionGauge({ session, step }: { session: ProductionState; step: WorkStep }) {
  const operation = step.operation
  if (step.kind !== 'pour' || workReading(step, session.progress) !== null || !('into' in operation)) {
    return null
  }
  const amount = 'amount' in operation ? operation.amount : undefined
  const named = amount?.kind === 'mark' ? amount.label : undefined
  const profile = vesselProfile(recipeCatalog, operation.into, step.stockContext, named)
  const height = profile.shape.heightMillimeters
  const fill = session.vessels[operation.into]?.fill ?? 0
  const startFill = session.stepStart?.stepId === step.id ? session.stepStart.fills[operation.into] : fill
  const ticks: GaugeTick[] = profile.marks.map((mark) => ({ at: mark.fill, label: mark.label }))
  const zoom = profile.cup && amount && ['rim-gap', 'depth', 'depth-range'].includes(amount.kind)

  if (profile.cup && !zoom) {
    for (const millimeters of RIM_TICKS_MM) {
      ticks.push({
        at: 1 - millimeters / height,
        label: millimeters % 10 === 0 ? `${millimeters}mm` : null,
        minor: true,
      })
    }
  }

  return (
    <>
      <WorkGauge
        label={zoom ? '전체 수위' : '수위'}
        fill={fill}
        ticks={ticks}
        startFill={startFill}
        overview={!!zoom}
      />
      {zoom && (
        <WorkGauge
          label="테두리까지 간격 (mm)"
          fill={fill}
          startFill={startFill}
          minimum={1 - Math.min(RIM_ZOOM_MM, height) / height}
          ticks={Array.from({ length: Math.min(RIM_ZOOM_MM, Math.floor(height)) + 1 }, (_, millimeters) => ({
            at: 1 - millimeters / height,
            label: millimeters % 5 === 0 ? String(millimeters) : null,
            minor: millimeters % 5 !== 0,
          }))}
          edgeLabels={['', '테두리']}
        />
      )}
    </>
  )
}
