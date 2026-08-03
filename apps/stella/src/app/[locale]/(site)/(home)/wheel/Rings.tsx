import styles from '../constellation.module.css'
import { CENTER } from './geometry'
import type { WheelRing } from './wheel-scene'

export default function Rings({ rings }: { rings: readonly WheelRing[] }) {
  return (
    <g className={`${styles.ring} [animation-delay:0s]`}>
      {rings.map((ring) => (
        <circle
          cx={CENTER}
          cy={CENTER}
          fill="none"
          key={ring.radius}
          r={ring.radius}
          stroke={ring.stroke}
          strokeDasharray={ring.dash?.join(' ')}
          strokeWidth={ring.strokeWidth}
        />
      ))}
    </g>
  )
}
