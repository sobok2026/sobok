import { elementOfSign } from '@/chart/astrology'
import { ELEMENT_COLORS } from '@/chart/data'
import type { SignId } from '@/chart/types'
import { SignFigureMark } from '@/components/SignFigure'
import styles from './PersonaArt.module.css'

/**
 * Fixed sparkle accents — plus-shaped glints around the portrait.
 * Each is `[x, y, size, twinkleSeconds, phaseSeconds]`; the last two give
 * every sparkle its own rhythm so none blink in sync.
 */
const SPARKLES: readonly (readonly [number, number, number, number, number])[] = [
  [20, 24, 2.2, 2.3, -0.4],
  [102, 30, 1.6, 3.1, -1.7],
  [14, 86, 1.6, 2.7, -0.9],
  [105, 90, 2.2, 3.6, -2.3],
  [90, 12, 1.2, 1.9, -1.1],
]

/**
 * Persona portrait for the love vertical: the descendant sign's modern line figure held
 * by two meeting orbits (the 1st–7th house axis) with a small heart where they
 * cross. Same data-plus-renderer approach as SignFigure — no image assets.
 *
 * Ambient motion (defined in PersonaArt.module.css) runs several animations at
 * mutually incommensurate periods so the composite never visibly repeats — an
 * organic drift rather than a loop. Transform/opacity only, so this stays pure
 * markup, and it rests at the static pose under prefers-reduced-motion.
 */
export default function PersonaArt({ className, sign }: { className?: string; sign: SignId }) {
  const color = ELEMENT_COLORS[elementOfSign(sign)]
  const haloId = `persona-halo-${sign}`

  return (
    <svg aria-hidden className={className} focusable="false" viewBox="0 0 120 120">
      <defs>
        <radialGradient id={haloId}>
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="65%" stopColor={color} stopOpacity="0.07" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle className={styles.halo} cx="60" cy="60" fill={`url(#${haloId})`} r="56" />

      {/* Two orbits meeting — you and the partner the descendant describes. */}
      <circle
        className={styles.orbitA}
        cx="47"
        cy="60"
        fill="none"
        r="40"
        stroke={color}
        strokeOpacity="0.3"
        strokeWidth="0.8"
      />
      <circle
        className={styles.orbitB}
        cx="73"
        cy="60"
        fill="none"
        r="40"
        stroke="#fff"
        strokeOpacity="0.16"
        strokeWidth="0.8"
      />

      {/* A small heart at the upper crossing of the orbits. */}
      <path
        className={styles.heart}
        d="M60 24.2 C58.6 22 55.6 22.6 55.6 25 C55.6 27.2 57.8 28.8 60 30.6 C62.2 28.8 64.4 27.2 64.4 25 C64.4 22.6 61.4 22 60 24.2 Z"
        fill={color}
        opacity="0.75"
      />

      {/* The descendant sign's modern Western figure, scaled into the frame. The nested
          drift wrappers each add one sine on one axis; composed, they trace a
          non-repeating Lissajous float. The inner transform keeps its scale. */}
      <g className={styles.drift1}>
        <g className={styles.drift2}>
          <g className={styles.drift3}>
            <g transform="translate(28 28) scale(0.64)">
              <SignFigureMark sign={sign} />
            </g>
          </g>
        </g>
      </g>

      {SPARKLES.map(([x, y, s, dur, delay]) => (
        <path
          className={styles.twinkle}
          d={`M${x} ${y - s} L${x} ${y + s} M${x - s} ${y} L${x + s} ${y}`}
          key={`${x}-${y}`}
          stroke="#fff"
          strokeLinecap="round"
          strokeOpacity="0.35"
          strokeWidth="0.7"
          style={{ animationDelay: `${delay}s`, animationDuration: `${dur}s` }}
        />
      ))}
    </svg>
  )
}
