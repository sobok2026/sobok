// biome-ignore-all lint/a11y/useSemanticElements: SVG has no native button element; each interactive shape implements the complete button keyboard contract below.
'use client'

import { useTranslations } from 'next-intl'
import { type CSSProperties, type FocusEvent, type KeyboardEvent, type PointerEvent, useId, useState } from 'react'

import { CENTER, TOKEN } from '../chart/geometry'
import type { AngleId, ChartAspect, HouseNumber, NatalChart, PlanetId, SignId } from '../chart/types'
import styles from '../constellation.module.css'
import { ASTROLOGY_GLYPH_UNITS_PER_EM, getAstrologyGlyphPath } from './astrology-glyph-paths'
import type { Selection } from './selection'
import {
  buildWheelScene,
  WHEEL_STYLE,
  type WheelAngle,
  type WheelAspect,
  type WheelHouse,
  type WheelMoonRange,
  type WheelPlanet,
  type WheelRing,
  type WheelScene,
  type WheelSign,
} from './wheel-scene'

// Animation timing (seconds).
const PLANET_BASE = 0.15
const PLANET_STAGGER = 0.09

// Aspect-line burst on planet select: the connected lines ignite in a staggered
// overshoot (see .aspectPulse). The stagger is capped so a heavily-aspected planet
// still finishes its cascade quickly instead of trickling in.
const ASPECT_PULSE_STAGGER = 0.045
const ASPECT_PULSE_STAGGER_MAX = 6
const WHEEL_CONTROL_SELECTOR = '[data-wheel-control]'

type WheelControlId = `sign:${SignId}` | `house:${HouseNumber}` | `angle:${AngleId}` | `planet:${PlanetId}`

const INITIAL_WHEEL_CONTROL: WheelControlId = 'sign:aries'

type VectorGlyphProps = {
  className?: string
  fill: string
  glyph: string
  pointerEvents?: 'none'
  size: number
  style?: CSSProperties
  x: number
  y: number
}

/** Render one ink-bounds-centered glyph without relying on font metrics. */
function VectorGlyph({ className, fill, glyph, pointerEvents, size, style, x, y }: VectorGlyphProps) {
  const scale = size / ASTROLOGY_GLYPH_UNITS_PER_EM

  return (
    <path
      className={className}
      d={getAstrologyGlyphPath(glyph)}
      fill={fill}
      pointerEvents={pointerEvents}
      style={style}
      transform={`translate(${x} ${y}) scale(${scale})`}
    />
  )
}

export interface ChartWheelProps {
  aspects: readonly ChartAspect[]
  chart: NatalChart
  isAspectDimmed: (asp: ChartAspect) => boolean
  isPlanetDimmed: (id: string) => boolean
  moonLongitudeRange: readonly [start: number, end: number] | null
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
  moonLongitudeRange,
  onSelectAngle,
  onSelectHouse,
  onSelectPlanet,
  onSelectSign,
  revealed,
  selection,
}: ChartWheelProps) {
  const t = useTranslations('Constellation')
  const scene = buildWheelScene(chart, aspects, { moonLongitudeRange })
  const instructionsId = useId()
  const [tabStop, setTabStop] = useState<WheelControlId>(INITIAL_WHEEL_CONTROL)

  const availableControls: WheelControlId[] = [
    ...scene.signs.map(({ id }) => `sign:${id}` as const),
    ...scene.houses.map(({ n }) => `house:${n}` as const),
    ...scene.angles.map(({ id }) => `angle:${id}` as const),
    ...(scene.moonRange ? (['planet:moon'] as const) : []),
    ...scene.planets.map(({ planet }) => `planet:${planet.id}` as const),
  ]

  const resolvedTabStop = availableControls.includes(tabStop) ? tabStop : INITIAL_WHEEL_CONTROL

  function controlFromTarget(target: EventTarget | null): SVGElement | null {
    return target instanceof Element ? target.closest<SVGElement>(WHEEL_CONTROL_SELECTOR) : null
  }

  function controlId(element: SVGElement | null): WheelControlId | null {
    return (element?.dataset.wheelControl as WheelControlId | undefined) ?? null
  }

  function syncTabStop(target: EventTarget | null) {
    const id = controlId(controlFromTarget(target))

    if (id) {
      setTabStop(id)
    }
  }

  function handleFocus(event: FocusEvent<SVGSVGElement>) {
    syncTabStop(event.target)
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    syncTabStop(event.target)
  }

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return
    }

    const current = controlFromTarget(event.target)

    if (!current) {
      return
    }

    const controls = Array.from(event.currentTarget.querySelectorAll<SVGElement>(WHEEL_CONTROL_SELECTOR))
    const currentIndex = controls.indexOf(current)

    if (currentIndex < 0 || controls.length === 0) {
      return
    }

    let nextIndex: number

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + controls.length) % controls.length
        break
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % controls.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = controls.length - 1
        break
      default:
        return
    }

    event.preventDefault()

    const next = controls[nextIndex]
    const nextId = controlId(next)

    if (nextId) {
      setTabStop(nextId)
      next.focus()
    }
  }

  return (
    <svg
      aria-hidden={!revealed}
      aria-describedby={instructionsId}
      aria-label={t('a11y.wheelLabel')}
      className={`w-full select-none transition-opacity duration-400 ${revealed ? styles.wheel : 'pointer-events-none'}`}
      onFocusCapture={handleFocus}
      onKeyDown={handleKeyDown}
      onPointerDownCapture={handlePointerDown}
      role="toolbar"
      style={{ opacity: revealed ? 1 : 0.4 }}
      viewBox={scene.viewBox}
    >
      <desc id={instructionsId}>{t('a11y.wheelInstructions')}</desc>
      <Rings rings={scene.rings} />
      <Sectors
        interactive={revealed}
        onSelect={onSelectSign}
        selection={selection}
        signs={scene.signs}
        tabStop={resolvedTabStop}
      />
      {revealed && scene.houses.length > 0 && (
        <Houses
          angles={scene.angles}
          houses={scene.houses}
          onSelect={onSelectHouse}
          onSelectAngle={onSelectAngle}
          selection={selection}
          tabStop={resolvedTabStop}
        />
      )}
      {revealed && (
        <>
          <Aspects
            aspects={scene.aspects}
            isDimmed={isAspectDimmed}
            pointById={scene.pointById}
            selection={selection}
          />
          {scene.moonRange && (
            <MoonRange
              isDimmed={isPlanetDimmed('moon')}
              onSelect={() => onSelectPlanet('moon')}
              range={scene.moonRange}
              selected={selection?.kind === 'planet' && selection.id === 'moon'}
              tabStop={resolvedTabStop}
            />
          )}
          <Planets
            isDimmed={isPlanetDimmed}
            onSelect={onSelectPlanet}
            planets={scene.planets}
            selection={selection}
            tabStop={resolvedTabStop}
          />
        </>
      )}
    </svg>
  )
}

interface MoonRangeProps {
  isDimmed: boolean
  onSelect: () => void
  range: WheelMoonRange
  selected: boolean
  tabStop: WheelControlId
}

/** Date-only Moon: a full-day longitude band, never a falsely exact token. */
function MoonRange({ isDimmed, onSelect, range, selected, tabStop }: MoonRangeProps) {
  const t = useTranslations('Constellation')
  const opacity = isDimmed ? 0.3 : 1
  const id: WheelControlId = 'planet:moon'

  const label =
    range.startSign === range.endSign
      ? t('a11y.moonRangeWithin', { sign: t(`signs.${range.startSign}`) })
      : t('a11y.moonRange', {
          from: t(`signs.${range.startSign}`),
          to: t(`signs.${range.endSign}`),
        })

  return (
    <g
      aria-label={label}
      aria-pressed={selected}
      className={`${styles.wheelButton} ${styles.fade} cursor-pointer`}
      data-wheel-control={id}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      role="button"
      style={{ opacity }}
      tabIndex={tabStop === id ? 0 : -1}
    >
      {range.segments.map((segment) => (
        <path
          d={segment.sectorPath}
          fill={segment.color}
          fillOpacity={selected ? WHEEL_STYLE.moonRange.selectedFillOpacity : WHEEL_STYLE.moonRange.fillOpacity}
          key={segment.key}
        />
      ))}
      <line
        opacity={WHEEL_STYLE.moonRange.endpointOpacity}
        stroke={range.startTick.color}
        strokeLinecap="round"
        strokeWidth={WHEEL_STYLE.moonRange.endpointStrokeWidth}
        x1={range.startTick.inner.x}
        x2={range.startTick.outer.x}
        y1={range.startTick.inner.y}
        y2={range.startTick.outer.y}
      />
      <line
        opacity={WHEEL_STYLE.moonRange.endpointOpacity}
        stroke={range.endTick.color}
        strokeLinecap="round"
        strokeWidth={WHEEL_STYLE.moonRange.endpointStrokeWidth}
        x1={range.endTick.inner.x}
        x2={range.endTick.outer.x}
        y1={range.endTick.inner.y}
        y2={range.endTick.outer.y}
      />
      <circle cx={range.glyphPoint.x} cy={range.glyphPoint.y} fill="var(--color-background)" opacity={0.82} r={7} />
      <VectorGlyph
        fill={range.glyphColor}
        glyph={range.glyph}
        pointerEvents="none"
        size={WHEEL_STYLE.moonRange.glyphSize}
        x={range.glyphPoint.x}
        y={range.glyphPoint.y}
      />
      <path d={range.hitPath} fill="transparent" />
      <circle className={styles.focusRing} cx={range.glyphPoint.x} cy={range.glyphPoint.y} r={12} />
    </g>
  )
}

function Rings({ rings }: { rings: readonly WheelRing[] }) {
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

interface SectorsProps {
  interactive: boolean
  onSelect: (id: SignId) => void
  selection: Selection
  signs: readonly WheelSign[]
  tabStop: WheelControlId
}

function Sectors({ interactive, onSelect, selection, signs, tabStop }: SectorsProps) {
  const t = useTranslations('Constellation')

  return (
    <g>
      {signs.map((sign) => {
        const active = selection?.kind === 'sign' && selection.id === sign.id
        const id: WheelControlId = `sign:${sign.id}`

        return (
          <g
            aria-label={t(`signs.${sign.id}`)}
            aria-pressed={active}
            className={`${styles.wheelButton} cursor-pointer`}
            data-wheel-control={id}
            key={sign.id}
            onClick={() => onSelect(sign.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(sign.id)
              }
            }}
            role="button"
            tabIndex={interactive && tabStop === id ? 0 : -1}
          >
            <path
              className={styles.sector}
              d={sign.sectorPath}
              fill={sign.color}
              fillOpacity={active ? WHEEL_STYLE.sign.selectedFillOpacity : WHEEL_STYLE.sign.fillOpacity}
              stroke={active ? sign.color : 'transparent'}
              strokeWidth={active ? WHEEL_STYLE.sign.selectedStrokeWidth : 0}
              style={{ animationDelay: `${sign.index * 0.03}s` }}
            />
            <VectorGlyph
              className={styles.signGlyph}
              fill={sign.color}
              glyph={sign.glyph}
              size={WHEEL_STYLE.sign.glyphSize}
              style={{ animationDelay: `${0.2 + sign.index * 0.03}s` }}
              x={sign.glyphPoint.x}
              y={sign.glyphPoint.y}
            />
            <circle className={styles.focusRing} cx={sign.glyphPoint.x} cy={sign.glyphPoint.y} r={13} />
          </g>
        )
      })}
    </g>
  )
}

interface HousesProps {
  angles: readonly WheelAngle[]
  houses: readonly WheelHouse[]
  onSelect: (n: HouseNumber) => void
  onSelectAngle: (id: AngleId) => void
  selection: Selection
  tabStop: WheelControlId
}

function Houses({ angles, houses, onSelect, onSelectAngle, selection, tabStop }: HousesProps) {
  const t = useTranslations('Constellation')

  return (
    <g className={`${styles.house} [animation-delay:0.15s]`}>
      {houses.map((house) => {
        const active = selection?.kind === 'house' && selection.n === house.n
        const id: WheelControlId = `house:${house.n}`

        return (
          <g key={house.n}>
            <line
              stroke={house.cuspStroke}
              strokeWidth={house.cuspStrokeWidth}
              x1={house.cuspFrom.x}
              x2={house.cuspTo.x}
              y1={house.cuspFrom.y}
              y2={house.cuspTo.y}
            />
            <g
              aria-label={`${t('panel.house', { n: house.n })} · ${t(`houseThemes.${house.n}`)}`}
              aria-pressed={active}
              className={`${styles.wheelButton} cursor-pointer`}
              data-wheel-control={id}
              onClick={() => onSelect(house.n)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(house.n)
                }
              }}
              role="button"
              tabIndex={tabStop === id ? 0 : -1}
            >
              {/* Houses carry a neutral (white-alpha) identity, so selection reads as a
                  brighter version of their own colour — matching the sign/planet idiom.
                  Brand pink stays reserved for the ASC/MC axes and labels below. */}
              <path
                d={house.sectorPath}
                fill={WHEEL_STYLE.house.fill}
                fillOpacity={active ? WHEEL_STYLE.house.selectedFillOpacity : WHEEL_STYLE.house.fillOpacity}
                stroke={active ? WHEEL_STYLE.house.selectedStroke : 'transparent'}
                strokeWidth={active ? WHEEL_STYLE.house.selectedStrokeWidth : 0}
              />
              <text
                dominantBaseline="central"
                fill={active ? WHEEL_STYLE.house.selectedLabelFill : WHEEL_STYLE.house.labelFill}
                fontSize={WHEEL_STYLE.house.labelFontSize}
                textAnchor="middle"
                x={house.labelPoint.x}
                y={house.labelPoint.y}
              >
                {t(`houseThemes.${house.n}`)}
              </text>
              <circle className={styles.focusRing} cx={house.labelPoint.x} cy={house.labelPoint.y} r={11} />
            </g>
          </g>
        )
      })}
      {angles.map((angle) => {
        const active = selection?.kind === 'angle' && selection.id === angle.id
        const id: WheelControlId = `angle:${angle.id}`

        return (
          <g
            aria-label={t(`angleNames.${angle.id}`)}
            aria-pressed={active}
            className={`${styles.wheelButton} cursor-pointer`}
            data-wheel-control={id}
            key={angle.id}
            onClick={() => onSelectAngle(angle.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectAngle(angle.id)
              }
            }}
            role="button"
            tabIndex={tabStop === id ? 0 : -1}
          >
            <text
              dominantBaseline="central"
              fill={active ? WHEEL_STYLE.angle.selectedFill : angle.fill}
              fontSize={angle.fontSize}
              fontWeight={active ? WHEEL_STYLE.angle.primaryFontWeight : angle.fontWeight}
              textAnchor="middle"
              x={angle.point.x}
              y={angle.point.y}
            >
              {angle.id.toUpperCase()}
            </text>
            {active && (
              <line
                stroke={WHEEL_STYLE.angle.selectedFill}
                strokeWidth={WHEEL_STYLE.angle.selectedUnderlineWidth}
                x1={angle.point.x - 7}
                x2={angle.point.x + 7}
                y1={angle.point.y + 6}
                y2={angle.point.y + 6}
              />
            )}
            <path d={angle.hitPath} fill="transparent" />
            <circle className={styles.focusRing} cx={angle.point.x} cy={angle.point.y} r={10} />
          </g>
        )
      })}
    </g>
  )
}

interface AspectsProps {
  aspects: readonly WheelAspect[]
  isDimmed: (asp: ChartAspect) => boolean
  pointById: WheelScene['pointById']
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

interface PlanetsProps {
  isDimmed: (id: string) => boolean
  onSelect: (id: PlanetId) => void
  planets: readonly WheelPlanet[]
  selection: Selection
  tabStop: WheelControlId
}

function Planets({ isDimmed, onSelect, planets, selection, tabStop }: PlanetsProps) {
  const t = useTranslations('Constellation')

  return (
    <g>
      {/* True-longitude ticks (+ leader lines for nudged glyphs) drawn under the tokens. */}
      {planets.map(({ color, planet, tick, connector }) => {
        const dim = isDimmed(planet.id)
        const isDirectlySelected = selection?.kind === 'planet' && selection.id === planet.id

        return (
          <g className={styles.fade} key={`mark-${planet.id}`} style={{ opacity: dim ? 0.3 : 1 }}>
            {connector && (
              <line
                opacity={
                  isDirectlySelected ? WHEEL_STYLE.planet.selectedConnectorOpacity : WHEEL_STYLE.planet.connectorOpacity
                }
                stroke={color}
                strokeDasharray={WHEEL_STYLE.planet.connectorDash.join(' ')}
                strokeLinecap="round"
                strokeWidth={
                  isDirectlySelected
                    ? WHEEL_STYLE.planet.selectedConnectorStrokeWidth
                    : WHEEL_STYLE.planet.connectorStrokeWidth
                }
                x1={connector.from.x}
                x2={connector.to.x}
                y1={connector.from.y}
                y2={connector.to.y}
              />
            )}
            <line
              opacity={isDirectlySelected ? WHEEL_STYLE.planet.selectedTickOpacity : WHEEL_STYLE.planet.tickOpacity}
              stroke={color}
              strokeLinecap="round"
              strokeWidth={
                isDirectlySelected ? WHEEL_STYLE.planet.selectedTickStrokeWidth : WHEEL_STYLE.planet.tickStrokeWidth
              }
              x1={tick.inner.x}
              x2={tick.outer.x}
              y1={tick.inner.y}
              y2={tick.outer.y}
            />
          </g>
        )
      })}
      {planets.map(({ color, planet, point, displaced, sign }, i) => {
        const dim = isDimmed(planet.id)
        const delay = PLANET_BASE + i * PLANET_STAGGER
        const id: WheelControlId = `planet:${planet.id}`

        // Visual involvement and the pressed toggle state are intentionally separate.
        const isAspectEndpoint =
          selection?.kind === 'aspect' && (selection.a === planet.id || selection.b === planet.id)

        const isDirectlySelected = selection?.kind === 'planet' && selection.id === planet.id
        const isEmphasized = isDirectlySelected || isAspectEndpoint

        return (
          <g className={styles.token} key={planet.id} style={{ animationDelay: `${delay}s` }}>
            <g
              className={displaced ? undefined : styles.tokenFloat}
              style={displaced ? undefined : { animationDelay: `${delay + 0.55}s` }}
            >
              <g
                aria-label={`${t(`planets.${planet.id}`)} · ${t(`signs.${sign}`)}${planet.retrograde ? ` · ${t('panel.retrograde')}` : ''}`}
                aria-pressed={isDirectlySelected}
                className={`${styles.wheelButton} ${styles.fade} cursor-pointer`}
                data-wheel-control={id}
                onClick={() => onSelect(planet.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(planet.id)
                  }
                }}
                role="button"
                style={{ opacity: dim ? 0.35 : 1 }}
                tabIndex={tabStop === id ? 0 : -1}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill={color}
                  opacity={WHEEL_STYLE.planet.glowOpacity}
                  pointerEvents="none"
                  r={isEmphasized ? TOKEN.glowActive : TOKEN.glow}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill="var(--color-background)"
                  pointerEvents="none"
                  r={TOKEN.disc}
                  stroke={color}
                  strokeWidth={
                    isEmphasized ? WHEEL_STYLE.planet.selectedDiscStrokeWidth : WHEEL_STYLE.planet.discStrokeWidth
                  }
                  style={isEmphasized ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
                />
                <VectorGlyph
                  fill={color}
                  glyph={planet.glyph}
                  pointerEvents="none"
                  size={WHEEL_STYLE.planet.glyphSize}
                  x={point.x}
                  y={point.y}
                />
                {planet.retrograde && (
                  <g pointerEvents="none">
                    <circle
                      cx={point.x + WHEEL_STYLE.planet.retrogradeOffset}
                      cy={point.y - WHEEL_STYLE.planet.retrogradeOffset}
                      fill="var(--color-background)"
                      r={WHEEL_STYLE.planet.retrogradeRadius}
                      stroke="var(--color-danger)"
                      strokeOpacity={WHEEL_STYLE.planet.retrogradeStrokeOpacity}
                      strokeWidth={WHEEL_STYLE.planet.retrogradeStrokeWidth}
                    />
                    <VectorGlyph
                      fill="var(--color-danger)"
                      glyph="℞"
                      size={WHEEL_STYLE.planet.retrogradeGlyphSize}
                      x={point.x + WHEEL_STYLE.planet.retrogradeOffset}
                      y={point.y - WHEEL_STYLE.planet.retrogradeOffset}
                    />
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
