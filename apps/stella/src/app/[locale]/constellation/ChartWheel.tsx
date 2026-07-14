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
import type { AngleId, ChartAspect, HouseNumber, NatalChart, PlanetId, SignId } from '../chart/types'
import styles from '../constellation.module.css'
import { glyphText } from './glyphs'
import type { Selection } from './selection'

// Animation timing (seconds).
const PLANET_BASE = 0.15
const PLANET_STAGGER = 0.09

// Aspect-line burst on planet select: the connected lines ignite in a staggered
// overshoot (see .aspectPulse). The stagger is capped so a heavily-aspected planet
// still finishes its cascade quickly instead of trickling in.
const ASPECT_PULSE_STAGGER = 0.045
const ASPECT_PULSE_STAGGER_MAX = 6

// Enlarged tap target for the ASC/MC/IC/DSC labels: a transparent wedge in the
// empty band just outside the zodiac ring. It grows outward and along the arc —
// never inward, which would overlap the clickable sign sectors (radius ≤ 172).
// The outer edge stays inside the viewBox (drawable radius ≈ 196), and the
// tangential half-width shrinks when another angle is close so two wedges never
// touch (down to the old r=10 circle's reach when angles crowd).
const ANGLE_HIT_INNER = RADIUS.zodiacOuter
const ANGLE_HIT_OUTER = RADIUS.zodiacOuter + 20
const ANGLE_HIT_HALF_MAX = 6
const ANGLE_HIT_HALF_MIN = 3.2
const ANGLE_HIT_GAP = 1

/** Smallest angle (deg) between two ecliptic longitudes. */
function angleGap(a: number, b: number): number {
  const d = Math.abs((((a - b) % 360) + 360) % 360)
  return Math.min(d, 360 - d)
}

export interface ChartWheelProps {
  aspects: readonly ChartAspect[]
  chart: NatalChart
  isAspectDimmed: (asp: ChartAspect) => boolean
  isPlanetDimmed: (id: string) => boolean
  onSelectAngle: (id: AngleId) => void
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
  onSelectAngle,
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
      className={`w-full select-none transition-opacity duration-400 ${revealed ? styles.wheel : 'pointer-events-none'}`}
      style={{ opacity: revealed ? 1 : 0.4 }}
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
          onSelectAngle={onSelectAngle}
          selection={selection}
        />
      )}
      {revealed && (
        <>
          <Aspects aspects={aspects} isDimmed={isAspectDimmed} pointById={pointById} selection={selection} />
          <Planets isDimmed={isPlanetDimmed} onSelect={onSelectPlanet} placed={placed} selection={selection} />
        </>
      )}
      <CenterHub revealed={revealed} />
    </svg>
  )
}

function Rings() {
  return (
    <g className={`${styles.ring} [animation-delay:0s]`}>
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
  onSelectAngle: (id: AngleId) => void
  selection: Selection
}

function Houses({ ascendant, cusps, midheaven, onSelect, onSelectAngle, selection }: HousesProps) {
  const t = useTranslations('Constellation')
  const norm = (v: number) => ((v % 360) + 360) % 360

  // The four angles as a tiered set: ASC/MC are primary, their antipodes DSC/IC
  // secondary. DSC/IC derive from ASC/MC, so all four exist once we have a time.
  const angles: { id: AngleId; lon: number; primary: boolean }[] = [
    { id: 'asc', lon: norm(ascendant), primary: true },
    { id: 'dsc', lon: norm(ascendant + 180), primary: false },
  ]

  if (midheaven !== null) {
    angles.push({ id: 'mc', lon: norm(midheaven), primary: true })
    angles.push({ id: 'ic', lon: norm(midheaven + 180), primary: false })
  }

  return (
    <g className={`${styles.house} [animation-delay:0.15s]`}>
      {cusps.map((lon, k) => {
        const inner = polar(lon, RADIUS.aspect, ascendant)
        const outer = polar(lon, RADIUS.houseOuter, ascendant)
        const isPrimaryAngle = k === 0 || k === 9 // ASC / MC axis
        const isSecondaryAngle = k === 3 || k === 6 // IC / DSC axis
        const n = (k + 1) as HouseNumber
        const span = (((cusps[(k + 1) % 12] - lon) % 360) + 360) % 360
        const labelPos = polar(lon + span / 2, RADIUS.houseLabel, ascendant)
        const active = selection?.kind === 'house' && selection.n === n

        return (
          <g key={k}>
            <line
              stroke={
                isPrimaryAngle
                  ? 'rgba(245,188,255,0.5)'
                  : isSecondaryAngle
                    ? 'rgba(245,188,255,0.3)'
                    : 'rgba(255,255,255,0.1)'
              }
              strokeWidth={isPrimaryAngle ? 1.2 : isSecondaryAngle ? 0.9 : 0.6}
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
              {/* Houses carry a neutral (white-alpha) identity, so selection reads as a
                  brighter version of their own colour — matching the sign/planet idiom.
                  Brand pink stays reserved for the ASC/MC axes and labels below. */}
              <path
                d={annularSector(lon, lon + span, RADIUS.houseOuter, RADIUS.houseInner, ascendant)}
                fill="#ffffff"
                fillOpacity={active ? 0.16 : 0.02}
                stroke={active ? 'rgba(255,255,255,0.5)' : 'transparent'}
                strokeWidth={active ? 0.8 : 0}
              />
              <text
                dominantBaseline="central"
                fill={active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'}
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
      {angles.map(({ id, lon, primary }) => {
        const pos = polar(lon, RADIUS.zodiacOuter + 8, ascendant)
        const active = selection?.kind === 'angle' && selection.id === id

        // Shrink the wedge if a neighbouring angle is near so the two never overlap.
        const nearest = angles.reduce(
          (min, other) => (other.id === id ? min : Math.min(min, angleGap(lon, other.lon))),
          Number.POSITIVE_INFINITY,
        )

        const hitHalf = Math.max(ANGLE_HIT_HALF_MIN, Math.min(ANGLE_HIT_HALF_MAX, nearest / 2 - ANGLE_HIT_GAP))

        // Selection intensifies the angle's own brand pink; the two-tier resting
        // opacity keeps ASC/MC dominant over their antipodes DSC/IC.
        const fill = active ? '#f5bcff' : primary ? 'rgba(245,188,255,0.85)' : 'rgba(245,188,255,0.5)'

        return (
          <g
            aria-label={t(`angleNames.${id}`)}
            aria-pressed={active}
            className={`${styles.wheelButton} cursor-pointer`}
            key={id}
            onClick={() => onSelectAngle(id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectAngle(id)
              }
            }}
            role="button"
            tabIndex={0}
          >
            <text
              dominantBaseline="central"
              fill={fill}
              fontSize={primary ? 8 : 7}
              fontWeight={primary || active ? 700 : 600}
              textAnchor="middle"
              x={pos.x}
              y={pos.y}
            >
              {id.toUpperCase()}
            </text>
            {active && (
              <line stroke="#f5bcff" strokeWidth={0.9} x1={pos.x - 7} x2={pos.x + 7} y1={pos.y + 6} y2={pos.y + 6} />
            )}
            <path
              d={annularSector(lon - hitHalf, lon + hitHalf, ANGLE_HIT_OUTER, ANGLE_HIT_INNER, ascendant)}
              fill="transparent"
            />
            <circle className={styles.focusRing} cx={pos.x} cy={pos.y} r={10} />
          </g>
        )
      })}
    </g>
  )
}

interface AspectsProps {
  aspects: readonly ChartAspect[]
  isDimmed: (asp: ChartAspect) => boolean
  pointById: Map<string, Point>
  selection: Selection
}

function Aspects({ aspects, isDimmed, pointById, selection }: AspectsProps) {
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
      {aspects.map((aspect) => {
        const a = pointById.get(aspect.a)
        const b = pointById.get(aspect.b)

        if (!a || !b) {
          return null
        }

        const style = ASPECT_STYLE[aspect.type]
        const dim = isDimmed(aspect)
        const pulse = pulsePlanet !== null && !dim
        const stagger = pulse ? Math.min(pulseIndex++, ASPECT_PULSE_STAGGER_MAX) : 0
        const baseKey = `${aspect.a}-${aspect.b}-${aspect.type}`

        return (
          <line
            className={pulse ? styles.aspectPulse : styles.aspectLine}
            // Re-key connected lines by the selected planet so remount re-fires the pulse
            // on each pick; dim lines keep the stable key and cross-fade instead.
            key={pulse ? `${baseKey}-${pulsePlanet}` : baseKey}
            stroke={style.color}
            strokeDasharray={style.dashed ? '4 3' : undefined}
            strokeWidth={dim ? 0.5 : 1.2}
            style={{
              opacity: dim ? 0.12 : 0.85,
              animationDelay: pulse ? `${stagger * ASPECT_PULSE_STAGGER}s` : undefined,
            }}
            x1={a.x}
            x2={b.x}
            y1={a.y}
            y2={b.y}
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
      {placed.map(({ planet, point, displaced }, i) => {
        const sign = signOfLon(planet.lon)
        const color = ELEMENT_COLORS[elementOfSign(sign)]
        const dim = isDimmed(planet.id)
        const delay = PLANET_BASE + i * PLANET_STAGGER

        const isSelected =
          (selection?.kind === 'planet' && selection.id === planet.id) ||
          (selection?.kind === 'aspect' && (selection.a === planet.id || selection.b === planet.id))

        return (
          <g className={styles.token} key={planet.id} style={{ animationDelay: `${delay}s` }}>
            <g
              className={displaced ? undefined : styles.tokenFloat}
              style={displaced ? undefined : { animationDelay: `${delay + 0.55}s` }}
            >
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
        className={`${styles.token} [animation-delay:1.6s]`}
        cx={VIEW / 2}
        cy={VIEW / 2}
        fill="url(#coreGlow)"
        opacity={0.9}
        r={10}
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
