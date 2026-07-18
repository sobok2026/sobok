import { elementOfSign } from '@/chart/astrology'
import { ELEMENT_COLORS } from '@/chart/data'
import type { SignId } from '@/chart/types'
import { projectSignFigure } from '@/lib/sign-art'

type SignFigureProps = {
  className?: string
  sign: SignId
}

/** The reusable mark, for both standalone and composed SVG illustrations. */
export function SignFigureMark({ sign }: Pick<SignFigureProps, 'sign'>) {
  const { paths, stars } = projectSignFigure(sign)
  const color = ELEMENT_COLORS[elementOfSign(sign)]

  return (
    <g>
      {paths.map((path, pathIndex) => {
        const points = path
          .map((starIndex) => `${stars[starIndex].x.toFixed(2)},${stars[starIndex].y.toFixed(2)}`)
          .join(' ')

        return (
          <g key={`${sign}-path-${pathIndex}`}>
            <polyline
              fill="none"
              points={points}
              stroke={color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.14}
              strokeWidth={2.8}
              vectorEffect="non-scaling-stroke"
            />
            <polyline
              fill="none"
              points={points}
              stroke={color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.58}
              strokeWidth={0.9}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )
      })}
      {stars.map(({ hipparcosId, radius, x, y }) => (
        <g key={hipparcosId}>
          <circle cx={x} cy={y} fill={color} opacity={0.16} r={radius + 2.5} />
          <circle
            cx={x}
            cy={y}
            fill={color}
            opacity={0.94}
            r={radius}
            stroke="#fff"
            strokeOpacity={0.68}
            strokeWidth={0.55}
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={x} cy={y} fill="#fff" opacity={0.92} r={Math.max(0.58, radius * 0.43)} />
        </g>
      ))}
    </g>
  )
}

/** A theme-aware modern Western constellation drawing shared across Stella. */
export function SignFigure({ className, sign }: SignFigureProps) {
  return (
    <svg aria-hidden className={className} focusable="false" preserveAspectRatio="xMidYMid meet" viewBox="0 0 100 100">
      <SignFigureMark sign={sign} />
    </svg>
  )
}
