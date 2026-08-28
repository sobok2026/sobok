'use client'

import { useTranslations } from 'next-intl'

import { angleLongitude, elementOfSign, norm360, signOfLon } from '@/chart/astrology'
import { ASPECT_STYLE, ELEMENT_COLORS, PLANET_GLYPHS } from '@/chart/data'
import type { HouseNumber, NatalChart, PlanetId, PlanetPosition } from '@/chart/types'

import styles from './constellation.module.css'
import type { ReportChapterVisual } from './report'
import VectorGlyph from './wheel/VectorGlyph'

export type ReportThemeChapterId = 'love' | 'mind' | 'money' | 'root' | 'work'

type ReportThemeArtProps = {
  chapterId: ReportThemeChapterId
  chart: NatalChart
  visual: ReportChapterVisual
}

type ThemeConfig = {
  accent: string
}

type Marker = {
  emphasized: boolean
  position: PlanetPosition
}

const CENTER = 64
const RING_RADIUS = 42
const MARKER_RADIUS = 38
const DEG = Math.PI / 180

const THEME_CONFIG: Record<ReportThemeChapterId, ThemeConfig> = {
  mind: { accent: '#7cc4ff' },
  love: { accent: '#ffc1d6' },
  work: { accent: '#ffd66b' },
  money: { accent: '#eacd84' },
  root: { accent: '#c9a8ff' },
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function pointAt(lon: number, radius: number, ascendant: number): { x: number; y: number } {
  const angle = (180 + (lon - ascendant)) * DEG
  return {
    x: round(CENTER + radius * Math.cos(angle)),
    y: round(CENTER - radius * Math.sin(angle)),
  }
}

function arcPath(start: number, end: number, radius: number, ascendant: number): string {
  const from = pointAt(start, radius, ascendant)
  const to = pointAt(end, radius, ascendant)
  const largeArc = norm360(end - start) > 180 ? 1 : 0
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${largeArc} 0 ${to.x} ${to.y}`
}

function houseBounds(chart: NatalChart, house: HouseNumber): readonly [number, number] | null {
  if (chart.cusps) {
    return [chart.cusps[house - 1], chart.cusps[house % 12]]
  }

  if (chart.ascendant === null) {
    return null
  }

  const start = chart.ascendant + (house - 1) * 30
  return [start, start + 30]
}

function markerColor(position: PlanetPosition): string {
  return ELEMENT_COLORS[elementOfSign(signOfLon(position.lon))]
}

/** Compact, data-faithful chapter index drawn in the same orientation as the main natal wheel. */
export default function ReportThemeArt({ chapterId, chart, visual }: ReportThemeArtProps) {
  const t = useTranslations('Constellation')
  const config = THEME_CONFIG[chapterId]
  const orientation = chart.ascendant ?? 0
  const availableHouses = visual.houses.flatMap((house) => {
    const bounds = houseBounds(chart, house)
    return bounds ? [{ bounds, house }] : []
  })
  const primary = visual.primary ? (chart.planets.find((planet) => planet.id === visual.primary) ?? null) : null
  const activeAspect = visual.relatedAspect ?? null
  const relatedId = activeAspect ? (activeAspect.a === visual.primary ? activeAspect.b : activeAspect.a) : null
  const related = relatedId ? (chart.planets.find((planet) => planet.id === relatedId) ?? null) : null
  const residents = visual.residents.flatMap((id) => {
    const resident = chart.planets.find((planet) => planet.id === id)
    return resident ? [resident] : []
  })

  const markers = new Map<PlanetId, Marker>()
  if (primary) {
    markers.set(primary.id, { emphasized: true, position: primary })
  }
  if (related) {
    markers.set(related.id, { emphasized: false, position: related })
  }
  for (const resident of residents) {
    markers.set(resident.id, { emphasized: markers.size === 0, position: resident })
  }

  const angleLon = visual.angle ? angleLongitude(visual.angle, chart.ascendant, chart.midheaven) : null
  const headline =
    chapterId === 'root' && primary && angleLon !== null
      ? `${t('angleNames.ic')} · ${t(`signs.${signOfLon(angleLon)}`)} / ${t(`planets.${primary.id}`)} · ${t(`signs.${signOfLon(primary.lon)}`)}`
      : primary
        ? `${t(`planets.${primary.id}`)} · ${t(`signs.${signOfLon(primary.lon)}`)}`
        : angleLon !== null && visual.angle
          ? `${t(`angleNames.${visual.angle}`)} · ${t(`signs.${signOfLon(angleLon)}`)}`
          : availableHouses.map(({ house }) => t('panel.house', { n: house })).join(' ↔ ')

  return (
    <div
      aria-hidden
      className="mt-3 grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-3 rounded-xl border border-accent/10 bg-surface px-2.5 py-3 sm:px-3"
    >
      <svg className="h-28 w-28" viewBox="0 0 128 128">
        <circle className="fill-background/30 stroke-border-2" cx={CENTER} cy={CENTER} r={51} strokeWidth={0.8} />
        <circle className="fill-none stroke-foreground-faint/35" cx={CENTER} cy={CENTER} r={RING_RADIUS} />
        {Array.from({ length: 12 }, (_, index) => {
          const lon = orientation + index * 30
          const inner = pointAt(lon, RING_RADIUS - 2, orientation)
          const outer = pointAt(lon, RING_RADIUS + 2, orientation)
          return (
            <line
              className="stroke-foreground-faint/35"
              key={index}
              strokeWidth={0.7}
              x1={inner.x}
              x2={outer.x}
              y1={inner.y}
              y2={outer.y}
            />
          )
        })}

        {availableHouses.map(({ bounds, house }) => {
          return (
            <path
              className={styles.themeLine}
              d={arcPath(bounds[0], bounds[1], RING_RADIUS, orientation)}
              key={house}
              pathLength={1}
              stroke={config.accent}
              strokeLinecap="round"
              strokeWidth={6}
            />
          )
        })}

        {primary &&
          related &&
          activeAspect &&
          (() => {
            const from = pointAt(primary.lon, MARKER_RADIUS, orientation)
            const to = pointAt(related.lon, MARKER_RADIUS, orientation)
            const aspectStyle = ASPECT_STYLE[activeAspect.type]
            return (
              <line
                className={styles.themeLine}
                pathLength={1}
                stroke={aspectStyle.color}
                strokeDasharray={aspectStyle.dashed ? '3 2' : undefined}
                strokeWidth={1.3}
                x1={from.x}
                x2={to.x}
                y1={from.y}
                y2={to.y}
              />
            )
          })()}

        {angleLon !== null &&
          visual.angle &&
          (() => {
            const point = pointAt(angleLon, RING_RADIUS + 7, orientation)
            const inner = pointAt(angleLon, 10, orientation)
            return (
              <g className={styles.themeToken}>
                <line
                  className={styles.themeLine}
                  pathLength={1}
                  stroke={config.accent}
                  strokeWidth={1.1}
                  x1={inner.x}
                  x2={point.x}
                  y1={inner.y}
                  y2={point.y}
                />
                <text
                  dominantBaseline="central"
                  fill={config.accent}
                  fontSize={7}
                  fontWeight={700}
                  textAnchor="middle"
                  x={point.x}
                  y={point.y}
                >
                  {visual.angle.toUpperCase()}
                </text>
              </g>
            )
          })()}

        {[...markers.values()].map(({ emphasized, position }) => {
          const point = pointAt(position.lon, MARKER_RADIUS, orientation)
          const color = markerColor(position)
          return (
            <g className={styles.themeToken} key={position.id}>
              {emphasized && <circle cx={point.x} cy={point.y} fill={color} opacity={0.16} r={9} />}
              <circle
                cx={point.x}
                cy={point.y}
                fill="var(--color-background)"
                r={emphasized ? 6.5 : 5.4}
                stroke={color}
                strokeWidth={emphasized ? 1.5 : 1}
              />
              <VectorGlyph
                fill={color}
                glyph={PLANET_GLYPHS[position.id]}
                pointerEvents="none"
                size={emphasized ? 7 : 5.8}
                x={point.x}
                y={point.y}
              />
            </g>
          )
        })}

        <path className="fill-accent/55" d="M64 58.5l1.2 4.3 4.3 1.2-4.3 1.2-1.2 4.3-1.2-4.3-4.3-1.2 4.3-1.2z" />
      </svg>

      <div className="min-w-0">
        <p className="text-xs font-semibold" style={{ color: config.accent }}>
          {headline}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {availableHouses.map(({ house }) => (
            <span
              className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-foreground-subtle"
              key={house}
            >
              {t('panel.house', { n: house })} · {t(`houseThemes.${house}`)}
            </span>
          ))}
          {related && activeAspect && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-foreground-subtle">
              {t(`planets.${related.id}`)} · {t(`aspects.${activeAspect.type}Name`)}
            </span>
          )}
          {residents.length > 0 && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-foreground-subtle">
              {residents.map((resident) => t(`planets.${resident.id}`)).join(' · ')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
