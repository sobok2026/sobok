import type { ChartAspect } from '@/chart/types'

import styles from '../constellation.module.css'
import type { Selection } from '../selection'
import { WHEEL_STYLE, type WheelAspect, type WheelScene } from './wheel-scene'

// Aspect-line burst on planet select: the connected lines ignite in a staggered
// overshoot (see .aspectPulse). The stagger is capped so a heavily-aspected planet
// still finishes its cascade quickly instead of trickling in.
const ASPECT_PULSE_STAGGER = 0.045
const ASPECT_PULSE_STAGGER_MAX = 6

interface AspectsProps {
  aspects: readonly WheelAspect[]
  isDimmed: (asp: ChartAspect) => boolean
  pointById: WheelScene['pointById']
  selection: Selection
}

export default function Aspects({ aspects, isDimmed, pointById, selection }: AspectsProps) {
  // A planet pick lights up its whole web of relationships — those lines ignite in a
  // staggered overshoot burst (the "expansion" beat). An aspect pick instead narrows to
  // one line and sends an energy comet down it A→B (the "focus" beat, rendered below).
  const pulsePlanet = selection?.kind === 'planet' ? selection.id : null
  let pulseIndex = 0

  // Endpoints of the active aspect's line, for the A→B comet overlay.
  const cometA = selection?.kind === 'aspect' ? pointById.get(selection.a) : undefined
  const cometB = selection?.kind === 'aspect' ? pointById.get(selection.b) : undefined

  return (
    <g>
      {aspects.map((line) => {
        const dim = isDimmed(line.aspect)
        const pulse = pulsePlanet !== null && !dim
        const stagger = pulse ? Math.min(pulseIndex++, ASPECT_PULSE_STAGGER_MAX) : 0

        return (
          <line
            className={pulse ? styles.aspectPulse : styles.aspectLine}
            // Re-key connected lines by the selected planet so remount re-fires the pulse
            // on each pick; dim lines keep the stable key and cross-fade instead.
            key={pulse ? `${line.key}-${pulsePlanet}` : line.key}
            stroke={line.color}
            strokeDasharray={line.dashed ? WHEEL_STYLE.aspect.dash.join(' ') : undefined}
            strokeWidth={dim ? WHEEL_STYLE.aspect.dimStrokeWidth : WHEEL_STYLE.aspect.strokeWidth}
            style={{
              opacity: dim ? WHEEL_STYLE.aspect.dimOpacity : WHEEL_STYLE.aspect.opacity,
              animationDelay: pulse ? `${stagger * ASPECT_PULSE_STAGGER}s` : undefined,
            }}
            x1={line.from.x}
            x2={line.to.x}
            y1={line.from.y}
            y2={line.to.y}
          />
        )
      })}
      {selection?.kind === 'aspect' && cometA && cometB && (
        <line
          className={styles.aspectComet}
          // Keyed by the aspect so a new pick remounts the line and re-fires the one-shot.
          key={`comet-${selection.a}-${selection.b}-${selection.aspectType}`}
          pathLength={1}
          pointerEvents="none"
          stroke="#ffffff"
          strokeLinecap="round"
          x1={cometA.x}
          x2={cometB.x}
          y1={cometA.y}
          y2={cometB.y}
        />
      )}
    </g>
  )
}
