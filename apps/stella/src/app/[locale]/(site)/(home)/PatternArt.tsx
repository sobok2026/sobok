import { angularGap } from '@/chart/astrology'
import { PLANET_GLYPHS } from '@/chart/data'
import type { ChartPattern, ComputedPlanetId, PlanetPosition } from '@/chart/types'

import styles from './constellation.module.css'
import VectorGlyph from './wheel/VectorGlyph'

type PatternArtProps = {
  pattern: ChartPattern
  planets: readonly PlanetPosition[]
}

type PatternPoint = {
  id: ComputedPlanetId
  lon: number
  x: number
  y: number
}

type EdgeStyle = {
  color: string
  dashed: boolean
}

const CENTER = 60
const RADIUS = 42

const EDGE_STYLES: readonly (EdgeStyle & { angle: number })[] = [
  { angle: 60, color: '#7dd3fc', dashed: true },
  { angle: 90, color: '#fb7185', dashed: false },
  { angle: 120, color: '#6ee7b7', dashed: false },
  { angle: 150, color: '#c9a8ff', dashed: true },
  { angle: 180, color: '#fbbf24', dashed: false },
]

function pointAtLongitude(id: ComputedPlanetId, lon: number): PatternPoint {
  const angle = ((lon - 90) * Math.PI) / 180

  return {
    id,
    lon,
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER + RADIUS * Math.sin(angle),
  }
}

function styleForEdge(a: PatternPoint, b: PatternPoint): EdgeStyle {
  const gap = angularGap(a.lon, b.lon)
  return EDGE_STYLES.reduce((best, candidate) =>
    Math.abs(candidate.angle - gap) < Math.abs(best.angle - gap) ? candidate : best,
  )
}

/** Draws each detected pattern from the real longitudes instead of a generic badge. */
export default function PatternArt({ pattern, planets }: PatternArtProps) {
  const points = pattern.planets.flatMap((id) => {
    const planet = planets.find((candidate) => candidate.id === id)
    return planet ? [pointAtLongitude(id, planet.lon)] : []
  })

  const edges = points.flatMap((from, index) =>
    points.slice(index + 1).map((to) => ({ from, to, style: styleForEdge(from, to) })),
  )

  return (
    <svg aria-hidden className="mx-auto h-32 w-32 shrink-0" viewBox="0 0 120 120">
      <circle className="fill-surface stroke-border-2" cx={CENTER} cy={CENTER} r={53} strokeWidth={0.8} />
      <circle className="fill-none stroke-foreground-faint/30" cx={CENTER} cy={CENTER} r={RADIUS} strokeWidth={0.8} />
      {Array.from({ length: 12 }, (_, index) => {
        const angle = ((index * 30 - 90) * Math.PI) / 180

        return (
          <line
            className="stroke-foreground-faint/25"
            key={index}
            strokeWidth={0.6}
            x1={CENTER + 48 * Math.cos(angle)}
            x2={CENTER + 51 * Math.cos(angle)}
            y1={CENTER + 48 * Math.sin(angle)}
            y2={CENTER + 51 * Math.sin(angle)}
          />
        )
      })}
      {edges.map(({ from, style, to }) => (
        <line
          className={styles.patternLine}
          key={`${from.id}-${to.id}`}
          pathLength={1}
          stroke={style.color}
          strokeDasharray={style.dashed ? '4 3' : undefined}
          strokeLinecap="round"
          strokeWidth={1.4}
          x1={from.x}
          x2={to.x}
          y1={from.y}
          y2={to.y}
        />
      ))}
      {points.map((point) => {
        const apex = point.id === pattern.apex

        return (
          <g className={styles.patternPoint} key={point.id}>
            {apex && <circle className="fill-accent/15 stroke-accent/80" cx={point.x} cy={point.y} r={8} />}
            <circle
              className={apex ? 'fill-background stroke-accent' : 'fill-background stroke-foreground-muted'}
              cx={point.x}
              cy={point.y}
              r={5.5}
              strokeWidth={1.1}
            />
            <VectorGlyph
              fill={apex ? 'var(--color-accent)' : 'var(--color-foreground-muted)'}
              glyph={PLANET_GLYPHS[point.id]}
              pointerEvents="none"
              size={6.5}
              x={point.x}
              y={point.y}
            />
          </g>
        )
      })}
    </svg>
  )
}
