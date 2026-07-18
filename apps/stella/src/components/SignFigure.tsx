import { elementOfSign } from '@/chart/astrology'
import { ELEMENT_COLORS } from '@/chart/data'
import type { SignId } from '@/chart/types'
import { SIGN_FIGURES } from '@/lib/sign-art'

type SignFigureProps = {
  className?: string
  sign: SignId
}

/** A theme-aware constellation drawing shared by the chart and forecast views. */
export function SignFigure({ className, sign }: SignFigureProps) {
  const { stars, lines } = SIGN_FIGURES[sign]
  const color = ELEMENT_COLORS[elementOfSign(sign)]

  return (
    <svg aria-hidden className={className} viewBox="0 0 100 100">
      {lines.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          stroke={color}
          strokeLinecap="round"
          strokeOpacity={0.35}
          strokeWidth={0.9}
          x1={stars[a][0]}
          x2={stars[b][0]}
          y1={stars[a][1]}
          y2={stars[b][1]}
        />
      ))}
      {stars.map(([x, y, size]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} fill={color} opacity={0.25} r={size + 2.5} />
          <circle cx={x} cy={y} fill="#fff" r={0.8 + size * 0.7} />
        </g>
      ))}
    </svg>
  )
}
