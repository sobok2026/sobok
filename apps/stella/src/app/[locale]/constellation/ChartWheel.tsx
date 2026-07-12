'use client'

import { useTranslations } from 'next-intl'

import { elementOfSign, signOfLon } from '../chart/astrology'
import { ASPECT_STYLE, ELEMENT_COLORS, SIGNS } from '../chart/data'
import {
  annularSector,
  type PlacedPlanet,
  type Point,
  placePlanets,
  polar,
  RADIUS,
  TOKEN,
  VIEW,
} from '../chart/geometry'
import type { ChartAspect, HouseNumber, NatalChart, PlanetId, SignId } from '../chart/types'
import styles from '../constellation.module.css'
import { glyphText } from './glyphs'
import type { Selection } from './selection'

// Animation timing (seconds).
const PLANET_BASE = 0.15
const PLANET_STAGGER = 0.09

export interface ChartWheelProps {
  aspects: readonly ChartAspect[]
  chart: NatalChart
  isAspectDimmed: (asp: ChartAspect) => boolean
  isPlanetDimmed: (id: string) => boolean
  onSelectHouse: (n: HouseNumber) => void
  onSelectPlanet: (id: PlanetId) => void
  onSelectSign: (id: SignId) => void
  revealed: boolean
  selection: Selection
}

/**
 * The natal wheel SVG: zodiac ring, house sectors, aspect lines and planet
 * tokens. Key this component per chart run so the reveal animations restart.
 */
export default function ChartWheel({
  aspects,
  chart,
  isAspectDimmed,
  isPlanetDimmed,
  onSelectHouse,
  onSelectPlanet,
  onSelectSign,
  revealed,
  selection,
}: ChartWheelProps) {
  const t = useTranslations('Constellation')
  const { ascendant, cusps, midheaven } = chart
  const anchor = ascendant ?? 0

  const placed = placePlanets(chart.planets, anchor)
  const pointById = new Map<string, Point>(placed.map((entry) => [entry.planet.id, entry.point]))

  return (
    <svg
      aria-hidden={!revealed}
      aria-label={t('meta.title')}
      className={`w-full ${revealed ? styles.wheel : 'pointer-events-none'}`}
      style={{
        transition: 'opacity 0.4s',
        opacity: revealed ? 1 : 0.4,
      }}
      viewBox={`-16 -16 ${VIEW + 32} ${VIEW + 32}`}
    >
      <Rings />
      <Sectors ascendant={anchor} interactive={revealed} onSelect={onSelectSign} selection={selection} />
      {revealed && ascendant !== null && cusps && (
        <Houses
          ascendant={ascendant}
          cusps={cusps}
          midheaven={midheaven}
          onSelect={onSelectHouse}
          selection={selection}
        />
      )}
      {revealed && (
        <>
          <Aspects aspects={aspects} isDimmed={isAspectDimmed} pointById={pointById} />
          <Planets isDimmed={isPlanetDimmed} onSelect={onSelectPlanet} placed={placed} selection={selection} />
        </>
      )}
      <CenterHub revealed={revealed} />
    </svg>
  )
}

function Rings() {
  return (
    <g className={styles.ring} style={{ animationDelay: '0s' }}>
      <circle cx={VIEW / 2} cy={VIEW / 2} fill="none" r={RADIUS.zodiacOuter} stroke="rgba(255,255,255,0.12)" />
      <circle cx={VIEW / 2} cy={VIEW / 2} fill="none" r={RADIUS.zodiacInner} stroke="rgba(255,255,255,0.1)" />
      <circle cx={VIEW / 2} cy={VIEW / 2} fill="none" r={RADIUS.houseInner} stroke="rgba(255,255,255,0.08)" />
      <circle
        cx={VIEW / 2}
        cy={VIEW / 2}
        fill="none"
        r={RADIUS.planet + 14}
        stroke="rgba(255,255,255,0.06)"
        strokeDasharray="2 4"
      />
    </g>
  )
}

interface SectorsProps {
  ascendant: number
  interactive: boolean
  onSelect: (id: SignId) => void
  selection: Selection
}

function Sectors({ ascendant, interactive, onSelect, selection }: SectorsProps) {
  const t = useTranslations('Constellation')

  return (
    <g>
      {SIGNS.map((sign, i) => {
        const lonStart = i * 30
        const color = ELEMENT_COLORS[sign.element]
        const glyphPos = polar(lonStart + 15, RADIUS.zodiacGlyph, ascendant)
        const active = selection?.kind === 'sign' && selection.id === sign.id
        return (
          <g
            aria-label={t(`signs.${sign.id}`)}
            aria-pressed={active}
            className={`${styles.wheelButton} cursor-pointer`}
            key={sign.id}
            onClick={() => onSelect(sign.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(sign.id)
              }
            }}
            role="button"
            tabIndex={interactive ? 0 : -1}
          >
            <path
              className={styles.sector}
              d={annularSector(lonStart, lonStart + 30, RADIUS.zodiacOuter, RADIUS.zodiacInner, ascendant)}
              fill={color}
              fillOpacity={active ? 0.4 : 0.14}
              stroke={active ? color : 'transparent'}
              strokeWidth={active ? 1 : 0}
              style={{ animationDelay: `${i * 0.03}s` }}
            />
            <text
              className={styles.signGlyph}
              dominantBaseline="central"
              fill={color}
              fontSize={16}
              style={{ animationDelay: `${0.2 + i * 0.03}s` }}
              textAnchor="middle"
              x={glyphPos.x}
              y={glyphPos.y}
            >
              {glyphText(sign.glyph)}
            </text>
            <circle className={styles.focusRing} cx={glyphPos.x} cy={glyphPos.y} r={13} />
          </g>
        )
      })}
    </g>
  )
}

interface HousesProps {
  ascendant: number
  cusps: number[]
  midheaven: number | null
  onSelect: (n: HouseNumber) => void
  selection: Selection
}

function Houses({ ascendant, cusps, midheaven, onSelect, selection }: HousesProps) {
  const t = useTranslations('Constellation')
  const angles = [{ lon: ascendant, label: 'ASC' }]

  if (midheaven !== null) {
    angles.push({ lon: midheaven, label: 'MC' })
  }

  return (
    <g className={styles.house} style={{ animationDelay: '0.15s' }}>
      {cusps.map((lon, k) => {
        const inner = polar(lon, RADIUS.aspect, ascendant)
        const outer = polar(lon, RADIUS.houseOuter, ascendant)
        const isAngle = k === 0 || k === 3 || k === 6 || k === 9 // ASC / IC / DSC / MC axes
        const n = (k + 1) as HouseNumber
        const span = (((cusps[(k + 1) % 12] - lon) % 360) + 360) % 360
        const labelPos = polar(lon + span / 2, RADIUS.houseLabel, ascendant)
        const active = selection?.kind === 'house' && selection.n === n

        return (
          <g key={k}>
            <line
              stroke={isAngle ? 'rgba(245,188,255,0.5)' : 'rgba(255,255,255,0.1)'}
              strokeWidth={isAngle ? 1.2 : 0.6}
              x1={inner.x}
              x2={outer.x}
              y1={inner.y}
              y2={outer.y}
            />
            <g
              aria-label={`${t('panel.house', { n })} · ${t(`houseThemes.${n}`)}`}
              aria-pressed={active}
              className={`${styles.wheelButton} cursor-pointer`}
              onClick={() => onSelect(n)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(n)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <path
                d={annularSector(lon, lon + span, RADIUS.houseOuter, RADIUS.houseInner, ascendant)}
                fill="#f5bcff"
                fillOpacity={active ? 0.16 : 0.02}
                stroke={active ? 'rgba(245,188,255,0.5)' : 'transparent'}
                strokeWidth={active ? 0.8 : 0}
              />
              <text
                dominantBaseline="central"
                fill={active ? 'rgba(245,188,255,0.9)' : 'rgba(255,255,255,0.4)'}
                fontSize={8}
                textAnchor="middle"
                x={labelPos.x}
                y={labelPos.y}
              >
                {t(`houseThemes.${n}`)}
              </text>
              <circle className={styles.focusRing} cx={labelPos.x} cy={labelPos.y} r={11} />
            </g>
          </g>
        )
      })}
      {angles.map(({ lon, label }) => {
        const pos = polar(lon, RADIUS.zodiacOuter + 8, ascendant)
        return (
          <text
            dominantBaseline="central"
            fill="#f5bcff"
            fontSize={8}
            fontWeight={700}
            key={label}
            textAnchor="middle"
            x={pos.x}
            y={pos.y}
          >
            {label}
          </text>
        )
      })}
    </g>
  )
}

interface AspectsProps {
  aspects: readonly ChartAspect[]
  isDimmed: (asp: ChartAspect) => boolean
  pointById: Map<string, Point>
}

function Aspects({ aspects, isDimmed, pointById }: AspectsProps) {
  return (
    <g>
      {aspects.map((aspect) => {
        const a = pointById.get(aspect.a)
        const b = pointById.get(aspect.b)

        if (!a || !b) {
          return null
        }

        const style = ASPECT_STYLE[aspect.type]
        const dim = isDimmed(aspect)

        return (
          <line
            className={styles.aspectLine}
            key={`${aspect.a}-${aspect.b}-${aspect.type}`}
            stroke={style.color}
            strokeDasharray={style.dashed ? '4 3' : undefined}
            strokeWidth={dim ? 0.5 : 1.2}
            style={{ opacity: dim ? 0.12 : 0.85 }}
            x1={a.x}
            x2={b.x}
            y1={a.y}
            y2={b.y}
          />
        )
      })}
    </g>
  )
}

interface PlanetsProps {
  isDimmed: (id: string) => boolean
  onSelect: (id: PlanetId) => void
  placed: PlacedPlanet[]
  selection: Selection
}

function Planets({ isDimmed, onSelect, placed, selection }: PlanetsProps) {
  const t = useTranslations('Constellation')

  return (
    <g>
      {/* True-longitude ticks (+ leader lines for nudged glyphs) drawn under the tokens. */}
      {placed.map(({ planet, tick, connector }) => {
        const color = ELEMENT_COLORS[elementOfSign(signOfLon(planet.lon))]
        const dim = isDimmed(planet.id)

        return (
          <g className={styles.fade} key={`mark-${planet.id}`} style={{ opacity: dim ? 0.3 : 1 }}>
            {connector && (
              <line
                opacity={0.5}
                stroke={color}
                strokeDasharray="1.5 2"
                strokeLinecap="round"
                strokeWidth={0.9}
                x1={connector.from.x}
                x2={connector.to.x}
                y1={connector.from.y}
                y2={connector.to.y}
              />
            )}
            <line
              opacity={0.9}
              stroke={color}
              strokeLinecap="round"
              strokeWidth={1.4}
              x1={tick.inner.x}
              x2={tick.outer.x}
              y1={tick.inner.y}
              y2={tick.outer.y}
            />
          </g>
        )
      })}
      {placed.map(({ planet, point }, i) => {
        const sign = signOfLon(planet.lon)
        const color = ELEMENT_COLORS[elementOfSign(sign)]
        const dim = isDimmed(planet.id)
        const delay = PLANET_BASE + i * PLANET_STAGGER

        const isSelected =
          (selection?.kind === 'planet' && selection.id === planet.id) ||
          (selection?.kind === 'aspect' && (selection.a === planet.id || selection.b === planet.id))

        return (
          <g className={styles.token} key={planet.id} style={{ animationDelay: `${delay}s` }}>
            <g className={styles.tokenFloat} style={{ animationDelay: `${delay + 0.55}s` }}>
              <g
                aria-label={`${t(`planets.${planet.id}`)} · ${t(`signs.${sign}`)}${planet.retrograde ? ` · ${t('panel.retrograde')}` : ''}`}
                aria-pressed={isSelected}
                className={`${styles.wheelButton} ${styles.fade} cursor-pointer`}
                onClick={() => onSelect(planet.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(planet.id)
                  }
                }}
                role="button"
                style={{ opacity: dim ? 0.35 : 1 }}
                tabIndex={0}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill={color}
                  opacity={0.18}
                  pointerEvents="none"
                  r={isSelected ? TOKEN.glowActive : TOKEN.glow}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill="var(--color-background)"
                  pointerEvents="none"
                  r={TOKEN.disc}
                  stroke={color}
                  strokeWidth={isSelected ? 2 : 1.2}
                  style={isSelected ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
                />
                <text
                  dominantBaseline="central"
                  fill={color}
                  fontSize={13.5}
                  pointerEvents="none"
                  textAnchor="middle"
                  x={point.x}
                  y={point.y + 0.5}
                >
                  {glyphText(planet.glyph)}
                </text>
                {planet.retrograde && (
                  <g pointerEvents="none">
                    <circle
                      cx={point.x + 9.5}
                      cy={point.y - 9.5}
                      fill="var(--color-background)"
                      r={5.2}
                      stroke="var(--color-danger)"
                      strokeOpacity={0.55}
                      strokeWidth={0.8}
                    />
                    <text
                      dominantBaseline="central"
                      fill="var(--color-danger)"
                      fontSize={7}
                      fontWeight={700}
                      textAnchor="middle"
                      x={point.x + 9.5}
                      y={point.y - 9.2}
                    >
                      ℞
                    </text>
                  </g>
                )}
                {/* Sole, selection-independent hit target — kept last so it wins hit-testing
                    over the decorative glow, whose radius changes when selected. */}
                <circle cx={point.x} cy={point.y} fill="transparent" r={TOKEN.hit} />
                <circle className={styles.focusRing} cx={point.x} cy={point.y} pointerEvents="none" r={TOKEN.hit + 3} />
              </g>
            </g>
          </g>
        )
      })}
    </g>
  )
}

interface CenterHubProps {
  revealed: boolean
}

function CenterHub({ revealed }: CenterHubProps) {
  if (!revealed) {
    return null
  }

  return (
    <g>
      <circle
        className={styles.token}
        cx={VIEW / 2}
        cy={VIEW / 2}
        fill="url(#coreGlow)"
        opacity={0.9}
        r={10}
        style={{ animationDelay: '1.6s' }}
      />
      <defs>
        <radialGradient id="coreGlow">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="var(--color-brand)" />
          <stop offset="100%" stopColor="var(--color-accent-cool)" stopOpacity="0" />
        </radialGradient>
      </defs>
    </g>
  )
}
