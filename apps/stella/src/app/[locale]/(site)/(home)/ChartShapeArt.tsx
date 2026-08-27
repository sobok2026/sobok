import { norm360 } from '@/chart/astrology'
import { PLANET_ORDER } from '@/chart/data'
import type { ChartShape, ComputedPlanetId, PlanetPosition } from '@/chart/types'

import styles from './constellation.module.css'

type ChartShapeArtProps = {
  className?: string
  planets: readonly PlanetPosition[]
  shape: ChartShape
}

type ShapePoint = {
  id: ComputedPlanetId
  lon: number
  x: number
  y: number
}

const CENTER = 60
const PLANET_RADIUS = 43

const SECTOR_TICKS = Array.from({ length: 12 }, (_, index) => {
  const degree = index * 30
  const angle = ((degree - 90) * Math.PI) / 180

  return {
    degree,
    innerX: CENTER + 48 * Math.cos(angle),
    innerY: CENTER + 48 * Math.sin(angle),
    outerX: CENTER + 51 * Math.cos(angle),
    outerY: CENTER + 51 * Math.sin(angle),
  }
})

/** The actual ten-planet distribution, opened at its largest empty arc so its Jones shape reads at a glance. */
export function ChartShapeArt({ className, planets, shape }: ChartShapeArtProps) {
  const points = PLANET_ORDER.map((id) => {
    const planet = planets.find((candidate) => candidate.id === id)
    if (!planet) {
      return null
    }

    const lon = norm360(planet.lon)
    const angle = ((lon - 90) * Math.PI) / 180

    return {
      id,
      lon,
      x: CENTER + PLANET_RADIUS * Math.cos(angle),
      y: CENTER + PLANET_RADIUS * Math.sin(angle),
    }
  })
    .filter((point): point is ShapePoint => point !== null)
    .sort((a, b) => a.lon - b.lon)

  if (points.length === 0) {
    return null
  }

  let largestGapIndex = 0
  let largestGap = -1

  for (let index = 0; index < points.length; index++) {
    const next = points[(index + 1) % points.length]
    const gap = norm360(next.lon - points[index].lon)

    if (gap > largestGap) {
      largestGap = gap
      largestGapIndex = index
    }
  }

  const occupiedOrder = Array.from(
    { length: points.length },
    (_, offset) => points[(largestGapIndex + 1 + offset) % points.length],
  )

  const occupiedPath = occupiedOrder.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return (
    <svg aria-hidden className={className} viewBox="0 0 120 120">
      <circle className="fill-surface stroke-border-2" cx={CENTER} cy={CENTER} r={54} strokeWidth={0.8} />
      <circle
        className="fill-none stroke-foreground-faint/35"
        cx={CENTER}
        cy={CENTER}
        r={PLANET_RADIUS}
        strokeWidth={0.8}
      />
      {SECTOR_TICKS.map((tick) => (
        <line
          className="stroke-foreground-faint/40"
          key={tick.degree}
          strokeWidth={0.7}
          x1={tick.innerX}
          x2={tick.outerX}
          y1={tick.innerY}
          y2={tick.outerY}
        />
      ))}
      <path
        className={`${styles.shapePath} fill-none stroke-accent/55`}
        d={occupiedPath}
        pathLength={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
      />
      <circle className="fill-accent/15" cx={CENTER} cy={CENTER} r={8} />
      <path className="fill-accent/60" d="M60 53.5l1.4 5.1 5.1 1.4-5.1 1.4-1.4 5.1-1.4-5.1-5.1-1.4 5.1-1.4z" />
      {points.map((point) => {
        const isHandle = point.id === shape.handle
        const isLeading = point.id === shape.leading

        return (
          <g className={styles.shapePoint} key={point.id}>
            {(isHandle || isLeading) && (
              <circle
                className={isHandle ? 'fill-none stroke-positive/80' : 'fill-none stroke-accent/80'}
                cx={point.x}
                cy={point.y}
                r={isHandle ? 6 : 5.2}
                strokeWidth={1.2}
              />
            )}
            <circle
              className={isHandle ? 'fill-positive' : isLeading ? 'fill-accent' : 'fill-foreground-muted'}
              cx={point.x}
              cy={point.y}
              r={isHandle ? 3.2 : isLeading ? 2.8 : 2.2}
            />
          </g>
        )
      })}
    </svg>
  )
}
