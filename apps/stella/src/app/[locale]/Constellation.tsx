'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { track } from '@/lib/analytics/browser'

import BirthForm from './BirthForm'
import {
  ASPECT_STYLE,
  type AspectType,
  annularSector,
  type ChartAspect,
  computeAspects,
  DEFAULT_CHART,
  degreeMinuteInSign,
  ELEMENT_COLORS,
  ELEMENT_IDS,
  elementCounts,
  elementOfSign,
  houseOfLon,
  type NatalChart,
  PLANET_GLYPHS,
  type PlacedPlanet,
  type PlanetId,
  placePlanets,
  polar,
  RADIUS,
  SIGNS,
  type SignId,
  signOfLon,
  TOKEN,
  VIEW,
} from './chart'
import styles from './constellation.module.css'
import { computeChart } from './ephemeris'
import { aspectTone, orbTier, pairKey } from './interpretations/types'
import Starfield from './Starfield'

// Animation timing (seconds).
const PLANET_BASE = 0.15
const PLANET_STAGGER = 0.09

// Aspects that flow easily vs. those that create productive friction.
const HARMONY_TYPES: readonly AspectType[] = ['conjunction', 'trine', 'sextile']
const TENSION_TYPES: readonly AspectType[] = ['square', 'opposition']

type Selection =
  | { kind: 'planet' | 'sign'; id: string }
  | { kind: 'aspect'; a: string; b: string; aspectType: AspectType; orb: number }
  | { kind: 'house'; n: number }
  | null

type Point = {
  x: number
  y: number
}

const glyphText = (glyph: string) => `${glyph}︎`

export default function Constellation() {
  const t = useTranslations('Constellation')
  const locale = useLocale()
  const [chart, setChart] = useState<NatalChart | null>(null)
  const [computing, setComputing] = useState(false)
  const [runId, setRunId] = useState(0)
  const [selection, setSelection] = useState<Selection>(null)
  const wheelRef = useRef<HTMLDivElement>(null)

  const revealed = chart !== null
  const activeChart = chart ?? DEFAULT_CHART
  const { ascendant, cusps, midheaven } = activeChart
  const anchor = ascendant ?? 0

  const placed = placePlanets(activeChart.planets, anchor)
  const pointById = new Map<string, Point>(placed.map((entry) => [entry.planet.id, entry.point]))
  const aspects = computeAspects(activeChart.planets)
  const counts = elementCounts(activeChart.planets)
  const dominant = ELEMENT_IDS.reduce((best, id) => (counts[id] > counts[best] ? id : best), ELEMENT_IDS[0])

  const sunLon = activeChart.planets.find((p) => p.id === 'sun')?.lon ?? 0
  const moonLon = activeChart.planets.find((p) => p.id === 'moon')?.lon ?? 0
  const risingSign = ascendant !== null ? signOfLon(ascendant) : null

  // Spotlight logic: which planets/lines stay bright for the current selection.
  // - planet:  the planet + everything it aspects, and all of its lines
  // - aspect:  only the two involved planets and that single line
  // - house:   only the planets sitting inside that house
  const focusActive = selection?.kind === 'planet' || selection?.kind === 'aspect' || selection?.kind === 'house'
  const brightPlanets = new Set<string>()

  if (selection?.kind === 'planet') {
    brightPlanets.add(selection.id)

    for (const a of aspects) {
      if (a.a === selection.id) {
        brightPlanets.add(a.b)
      }
      if (a.b === selection.id) {
        brightPlanets.add(a.a)
      }
    }
  } else if (selection?.kind === 'aspect') {
    brightPlanets.add(selection.a)
    brightPlanets.add(selection.b)
  } else if (selection?.kind === 'house') {
    for (const p of activeChart.planets) {
      if (houseOfLon(p.lon, cusps, ascendant) === selection.n) {
        brightPlanets.add(p.id)
      }
    }
  }

  async function handleSubmit(input: Parameters<typeof computeChart>[0]) {
    setComputing(true)

    try {
      const result = await computeChart(input)
      setSelection(null)
      setChart(result)
      setRunId((n) => n + 1)
      track('chart_open')
    } catch {
      toast.error(t('form.error'))
    } finally {
      setComputing(false)
    }
  }

  function backToForm() {
    setSelection(null)
    setChart(null)
  }

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const data = { title: t('meta.title'), text: t('share.text'), url }

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(data)
        track('share', { method: 'web_share' })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success(t('share.copied'))
      track('share', { method: 'clipboard' })
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
  }

  function planetDimmed(id: string): boolean {
    return focusActive && !brightPlanets.has(id)
  }

  function aspectDimmed(asp: ChartAspect): boolean {
    if (selection?.kind === 'planet') {
      return asp.a !== selection.id && asp.b !== selection.id
    }
    if (selection?.kind === 'aspect') {
      return !(asp.a === selection.a && asp.b === selection.b && asp.type === selection.aspectType)
    }
    if (selection?.kind === 'house') {
      return !brightPlanets.has(asp.a) && !brightPlanets.has(asp.b)
    }
    return false
  }

  function scrollToWheel() {
    wheelRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  // A planet tap drives the whole relationship flow:
  //   • the same planet again      → deselect
  //   • another, aspected planet   → show the two planets' relationship
  //   • anything else (unaspected, or coming from a sign/aspect/nothing) → show this planet
  function selectPlanet(id: string) {
    setSelection((prev) => {
      if (prev?.kind === 'planet') {
        if (prev.id === id) {
          return null
        }

        const asp = aspects.find((x) => (x.a === prev.id && x.b === id) || (x.a === id && x.b === prev.id))

        if (asp) {
          return {
            kind: 'aspect',
            a: asp.a,
            b: asp.b,
            aspectType: asp.type,
            orb: asp.orb,
          }
        }
      }

      return {
        kind: 'planet',
        id,
      }
    })
  }

  function toggleSign(id: string) {
    setSelection((prev) => (prev?.kind === 'sign' && prev.id === id ? null : { kind: 'sign', id }))
  }

  function toggleHouse(n: number) {
    setSelection((prev) => (prev?.kind === 'house' && prev.n === n ? null : { kind: 'house', n }))
  }

  function toggleAspectAndScroll(asp: ChartAspect) {
    const same =
      selection?.kind === 'aspect' &&
      selection.a === asp.a &&
      selection.b === asp.b &&
      selection.aspectType === asp.type

    if (same) {
      setSelection(null)
      return
    }

    setSelection({
      kind: 'aspect',
      a: asp.a,
      b: asp.b,
      aspectType: asp.type,
      orb: asp.orb,
    })

    scrollToWheel()
  }

  function selectionStatus(): string {
    if (!selection) {
      return ''
    }

    if (selection.kind === 'sign') {
      return t('a11y.statusSign', { name: t(`signs.${selection.id}`) })
    }

    if (selection.kind === 'aspect') {
      return t('a11y.statusAspect', {
        a: t(`planets.${selection.a}`),
        b: t(`planets.${selection.b}`),
        aspect: t(`aspects.${selection.aspectType}Name`),
      })
    }

    if (selection.kind === 'house') {
      return t('a11y.statusHouse', { n: selection.n })
    }

    const body = activeChart.planets.find((p) => p.id === selection.id)

    return t('a11y.statusPlanet', {
      name: t(`planets.${selection.id}`),
      sign: body ? t(`signs.${signOfLon(body.lon)}`) : '',
    })
  }

  function selectionKey(): string {
    if (!selection) {
      return 'empty'
    }

    if (selection.kind === 'aspect') {
      return `a-${selection.a}-${selection.b}-${selection.aspectType}`
    }

    if (selection.kind === 'house') {
      return `h-${selection.n}`
    }

    return `${selection.kind}-${selection.id}`
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-night-sky px-3 pb-16 pt-[calc(4rem+var(--safe-area-top))] text-foreground sm:px-4 md:pt-[calc(2rem+var(--safe-area-top))]">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center">
        {/* Hero */}
        <header className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{t('hero.eyebrow')}</p>
          <h1 className="mt-2 bg-hero-gradient bg-clip-text text-3xl font-extrabold text-transparent">
            {t('hero.title')}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-foreground-muted/90">{t('hero.subtitle')}</p>
        </header>

        {/* Birth form (before compute) */}
        {!revealed && (
          <div className="mb-6 w-full">
            <BirthForm computing={computing} onSubmit={handleSubmit} />
            <p className="mt-4 text-center">
              <Link
                className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
                href={`/${locale}/today/`}
              >
                {t('todayCta')}
              </Link>
            </p>
          </div>
        )}

        {/* Big 3 (after compute) */}
        {revealed && (
          <div className="mb-6 grid w-full grid-cols-3 gap-1.5 sm:gap-2" key={`big3-${runId}`}>
            <Big3Card
              delay={0.1}
              glyph="☉"
              hint={t('big3.sunHint')}
              label={t('big3.sunLabel')}
              onClick={() => selectPlanet('sun')}
              value={t(`signs.${signOfLon(sunLon)}`)}
            />
            <Big3Card
              delay={0.2}
              glyph="☾"
              hint={t('big3.moonHint')}
              label={t('big3.moonLabel')}
              onClick={() => selectPlanet('moon')}
              value={t(`signs.${signOfLon(moonLon)}`)}
            />
            <Big3Card
              delay={0.3}
              glyph="Asc"
              hint={risingSign ? t('big3.risingHint') : t('form.timeUnknownHint')}
              label={t('big3.risingLabel')}
              onClick={risingSign ? () => toggleSign(risingSign) : undefined}
              value={risingSign ? t(`signs.${risingSign}`) : t('form.risingUnknown')}
            />
          </div>
        )}

        {/* Wheel — goes edge-to-edge on mobile (<sm) to reclaim width for legibility. */}
        <div className="relative -mx-3 scroll-mt-4 w-[calc(100%+1.5rem)] sm:mx-0 sm:w-full" ref={wheelRef}>
          <svg
            aria-hidden={!revealed}
            aria-label={t('meta.title')}
            className={`w-full ${revealed ? styles.wheel : 'pointer-events-none'}`}
            key={`wheel-${runId}`}
            role="group"
            style={{
              transition: 'opacity 0.4s',
              opacity: revealed ? 1 : 0.4,
            }}
            viewBox={`-16 -16 ${VIEW + 32} ${VIEW + 32}`}
          >
            <Rings />
            <Sectors ascendant={anchor} interactive={revealed} onSelect={toggleSign} selection={selection} t={t} />
            {revealed && ascendant !== null && cusps && (
              <Houses
                ascendant={ascendant}
                cusps={cusps}
                midheaven={midheaven}
                onSelect={toggleHouse}
                selection={selection}
                t={t}
              />
            )}
            {revealed && (
              <>
                <Aspects aspects={aspects} isDimmed={aspectDimmed} pointById={pointById} />
                <Planets isDimmed={planetDimmed} onSelect={selectPlanet} placed={placed} selection={selection} t={t} />
              </>
            )}
            <CenterHub revealed={revealed} />
          </svg>
        </div>

        {/* Speaks the current selection to screen readers on change. */}
        {revealed && (
          <div aria-atomic="true" aria-live="polite" className="sr-only" role="status">
            {selectionStatus()}
          </div>
        )}

        {revealed && (
          <p className="mt-2 text-center text-xs text-foreground-subtle">
            {/* Once a planet with aspects is selected, point the user at the two-tap gesture. */}
            {selection?.kind === 'planet' && brightPlanets.size > 1 ? t('hero.connectionHint') : t('hero.tapHint')}
          </p>
        )}

        {/* Detail panel */}
        {revealed && (
          <div className="mt-4 w-full" key={`panel-${selectionKey()}`}>
            <DetailPanel
              ascendant={ascendant}
              chart={activeChart}
              onClose={() => setSelection(null)}
              selection={selection}
              t={t}
            />
          </div>
        )}

        {/* Elements + aspects + actions */}
        {revealed && (
          <div className="mt-6 w-full space-y-6" key={`extras-${runId}`}>
            <ElementBalance counts={counts} dominant={dominant} t={t} total={activeChart.planets.length} />
            <AspectSection aspects={aspects} onSelect={toggleAspectAndScroll} selection={selection} t={t} />
            <div className="flex flex-col items-center gap-3">
              <button
                className="rounded-full border border-border-2 bg-surface-2 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur transition active:scale-95 hover:bg-surface-3"
                onClick={share}
                type="button"
              >
                {t('share.button')}
              </button>
              <Link
                className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
                href={`/${locale}/today/`}
              >
                {t('todayCta')}
              </Link>
              <button
                className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
                onClick={backToForm}
                type="button"
              >
                {t('form.recompute')}
              </button>
              <p className="mt-1 text-xs text-foreground-faint">{t('footer')}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

type T = ReturnType<typeof useTranslations>

// ── Wheel layers ─────────────────────────────────────────────────────────

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

function Sectors({
  ascendant,
  interactive,
  onSelect,
  selection,
  t,
}: {
  ascendant: number
  interactive: boolean
  onSelect: (id: string) => void
  selection: Selection
  t: T
}) {
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

function Houses({
  ascendant,
  cusps,
  midheaven,
  onSelect,
  selection,
  t,
}: {
  ascendant: number
  cusps: number[]
  midheaven: number | null
  onSelect: (n: number) => void
  selection: Selection
  t: T
}) {
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
        const n = k + 1
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

function Aspects({
  aspects,
  isDimmed,
  pointById,
}: {
  aspects: readonly ChartAspect[]
  isDimmed: (asp: ChartAspect) => boolean
  pointById: Map<string, Point>
}) {
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

function Planets({
  isDimmed,
  onSelect,
  placed,
  selection,
  t,
}: {
  isDimmed: (id: string) => boolean
  onSelect: (id: string) => void
  placed: PlacedPlanet[]
  selection: Selection
  t: T
}) {
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

function CenterHub({ revealed }: { revealed: boolean }) {
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

// ── Cards / panels ────────────────────────────────────────────────────────

function Big3Card({
  delay,
  glyph,
  hint,
  label,
  onClick,
  value,
}: {
  delay: number
  glyph: string
  hint: string
  label: string
  onClick?: () => void
  value: string
}) {
  return (
    <button
      className={`${styles.card} flex flex-col items-center gap-1 rounded-2xl border bg-surface-2 p-2.5 text-center backdrop-blur transition enabled:hover:border-border-strong enabled:hover:bg-surface-3 enabled:active:scale-95 disabled:cursor-default sm:p-3`}
      disabled={!onClick}
      onClick={onClick}
      style={{ animationDelay: `${delay}s` }}
      type="button"
    >
      <span className="text-lg text-brand">{glyphText(glyph)}</span>
      <span className="text-[10px] uppercase tracking-widest text-foreground-subtle">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
      <span className="text-[10px] leading-tight text-foreground-faint">{hint}</span>
    </button>
  )
}

function CloseButton({ label, onClose }: { label: string; onClose: () => void }) {
  return (
    <button
      aria-label={label}
      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-sm text-foreground-subtle transition hover:bg-surface-3 hover:text-foreground"
      onClick={onClose}
      type="button"
    >
      ✕
    </button>
  )
}

function DetailPanel({
  ascendant,
  chart,
  onClose,
  selection,
  t,
}: {
  ascendant: number | null
  chart: NatalChart
  onClose: () => void
  selection: Selection
  t: T
}) {
  const [showDetail, setShowDetail] = useState(false)

  if (!selection) {
    return (
      <div className="rounded-2xl border bg-surface p-4 text-center sm:p-5">
        <p className="text-sm font-semibold text-foreground-secondary">{t('panel.empty')}</p>
        <p className="mt-1 text-xs text-foreground-subtle">{t('panel.emptyHint')}</p>
      </div>
    )
  }

  if (selection.kind === 'sign') {
    const element = elementOfSign(selection.id as SignId)
    const color = ELEMENT_COLORS[element]
    const glyph = SIGNS.find((s) => s.id === selection.id)?.glyph ?? '★'

    return (
      <div className={`${styles.sheetIn} relative rounded-2xl border bg-surface-2 p-4 backdrop-blur sm:p-5`}>
        <CloseButton label={t('panel.close')} onClose={onClose} />
        <div className="flex items-center gap-3">
          <span className="text-2xl" style={{ color }}>
            {glyphText(glyph)}
          </span>
          <div>
            <p className="text-base font-bold text-foreground">{t(`signs.${selection.id}`)}</p>
            <Chip color={color} label={t(`elements.${element}`)} />
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{t(`signKeywords.${selection.id}`)}</p>
      </div>
    )
  }

  if (selection.kind === 'aspect') {
    const color = ASPECT_STYLE[selection.aspectType].color
    const pairKeyId = pairKey(selection.a as PlanetId, selection.b as PlanetId)
    const tone = aspectTone(selection.aspectType)
    const specificKey = `readings.aspectPairs.${pairKeyId}.${tone}`
    const legacyKey = `readings.aspectPairs.${pairKeyId}.friction`

    const pairReadingKey = t.has(specificKey)
      ? specificKey
      : (tone === 'square' || tone === 'opposition') && t.has(legacyKey)
        ? legacyKey
        : `aspects.${selection.aspectType}Desc`

    const pairReading = t(pairReadingKey)
    const tier = orbTier(selection.orb)
    const intensityKey = tier ? `readings.aspectIntensity.${tier}` : null
    const intensity = intensityKey && t.has(intensityKey) ? t(intensityKey) : null

    return (
      <div className={`${styles.sheetIn} relative rounded-2xl border bg-surface-2 p-4 backdrop-blur sm:p-5`}>
        <CloseButton label={t('panel.close')} onClose={onClose} />
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-2xl" style={{ color }}>
            {glyphText(PLANET_GLYPHS[selection.a as never])} {glyphText(PLANET_GLYPHS[selection.b as never])}
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-foreground">
              {t(`planets.${selection.a}`)} <span className="text-foreground-faint">↔</span>{' '}
              {t(`planets.${selection.b}`)}
            </p>
            <span className="text-xs font-medium" style={{ color }}>
              {t(`aspects.${selection.aspectType}Vibe`)}{' '}
              <span className="text-foreground-faint">
                · {t(`aspects.${selection.aspectType}Name`)} · {t('aspects.orbLabel')} {selection.orb}°
              </span>
            </span>
          </div>
        </div>
        {intensity && (
          <p
            className={`mt-3 text-xs font-semibold ${tier === 'wide' ? 'text-foreground-subtle' : ''}`}
            style={tier === 'tight' ? { color } : undefined}
          >
            {intensity}
          </p>
        )}
        <p className={`${intensity ? 'mt-2' : 'mt-3'} text-sm leading-relaxed text-foreground-secondary`}>
          {pairReading}
        </p>
      </div>
    )
  }

  if (selection.kind === 'house') {
    const n = selection.n
    const residents = chart.planets.filter((p) => houseOfLon(p.lon, chart.cusps, ascendant) === n)

    return (
      <div className={`${styles.sheetIn} relative rounded-2xl border bg-surface-2 p-4 backdrop-blur sm:p-5`}>
        <CloseButton label={t('panel.close')} onClose={onClose} />
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full border"
            style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
          >
            <span className="text-base font-bold">{n}</span>
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-foreground">{t('panel.house', { n })}</p>
            <p className="text-xs text-foreground-subtle">{t(`houseThemes.${n}`)}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{t(`houseIntros.${n}`)}</p>
        {residents.length === 0 ? (
          <p className="mt-3 border-t pt-3 text-sm leading-relaxed text-foreground-subtle">{t('panel.emptyHouse')}</p>
        ) : (
          residents.map((p) => {
            const residentSign = signOfLon(p.lon)
            const residentColor = ELEMENT_COLORS[elementOfSign(residentSign)]
            const readingKey = `readings.houses.${p.id}.${n}`

            return (
              <div className="mt-3 border-t pt-3" key={p.id}>
                <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: residentColor }}>
                  {glyphText(PLANET_GLYPHS[p.id])} {t(`planets.${p.id}`)}
                  <span className="font-medium text-foreground-faint">· {t(`signs.${residentSign}`)}</span>
                </p>
                {t.has(readingKey) && (
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground-secondary">{t(readingKey)}</p>
                )}
              </div>
            )
          })
        )}
      </div>
    )
  }

  const planet = chart.planets.find((p) => p.id === selection.id)

  if (!planet) {
    return null
  }

  const sign = signOfLon(planet.lon)
  const element = elementOfSign(sign)
  const color = ELEMENT_COLORS[element]
  const dm = degreeMinuteInSign(planet.lon)
  const house = houseOfLon(planet.lon, chart.cusps, ascendant)
  const retroKey = `readings.retro.${planet.id}.${sign}`
  const reading = planet.retrograde && t.has(retroKey) ? t(retroKey) : t(`readings.planets.${planet.id}.${sign}`)

  return (
    <div className={`${styles.sheetIn} relative rounded-2xl border bg-surface-2 p-4 backdrop-blur sm:p-5`}>
      <CloseButton label={t('panel.close')} onClose={onClose} />
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full border"
          style={{ borderColor: color, color }}
        >
          <span className="text-xl">{glyphText(PLANET_GLYPHS[planet.id])}</span>
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-base font-bold text-foreground">
            {t(`planets.${planet.id}`)}
            {planet.retrograde && (
              <span className="rounded bg-danger/20 px-1.5 py-0.5 text-[10px] font-semibold text-danger">
                ℞ {t('panel.retrograde')}
              </span>
            )}
          </p>
          <p className="text-xs text-foreground-subtle">
            {t(`signs.${sign}`)}
            {house !== null && <> · {t('panel.area', { name: t(`houseThemes.${house}`) })}</>}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">{reading}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip color={color} label={`${t('panel.elementLabel')}: ${t(`elements.${element}`)}`} />
        <Chip color="var(--color-accent)" label={`${t('panel.keywordLabel')}: ${t(`signKeywords.${sign}`)}`} />
      </div>
      <button
        className="mt-3 text-[11px] text-foreground-subtle underline-offset-2 transition hover:text-foreground-secondary hover:underline"
        onClick={() => setShowDetail((v) => !v)}
        type="button"
      >
        {showDetail ? t('panel.hideDetail') : t('panel.showDetail')}
      </button>
      {showDetail && (
        <div className="mt-2 rounded-xl bg-surface px-3 py-2.5">
          <p className="text-xs font-medium text-foreground-secondary">
            {t(`signs.${sign}`)} {dm.degree}°{String(dm.minute).padStart(2, '0')}′
            {house !== null && <> · {t('panel.house', { n: house })}</>} ·{' '}
            {planet.retrograde ? t('panel.retrograde') : t('panel.direct')}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-foreground-faint">{t('panel.detailHint')}</p>
        </div>
      )}
    </div>
  )
}

function Chip({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
      // color-mix instead of hex-alpha concat so both raw hexes and var() tokens work
      style={{ backgroundColor: `color-mix(in srgb, ${color} 13%, transparent)`, color }}
    >
      {label}
    </span>
  )
}

function ElementBalance({
  counts,
  dominant,
  t,
  total,
}: {
  counts: Record<string, number>
  dominant: string
  t: T
  total: number
}) {
  const descriptions: Record<string, string> = {
    fire: t('elements.fireDesc'),
    earth: t('elements.earthDesc'),
    air: t('elements.airDesc'),
    water: t('elements.waterDesc'),
  }

  return (
    <section className="sm:rounded-2xl sm:border sm:bg-surface sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">{t('elements.title')}</h2>
        <span className="text-xs text-foreground-subtle">
          {t('elements.dominant', { element: t(`elements.${dominant}`) })}
        </span>
      </div>
      <div className="space-y-2.5">
        {ELEMENT_IDS.map((id) => {
          const pct = total > 0 ? (counts[id] / total) * 100 : 0
          const color = ELEMENT_COLORS[id]

          return (
            <div className="flex items-center gap-2 sm:gap-3" key={id}>
              <span className="w-10 shrink-0 text-xs font-semibold" style={{ color }}>
                {t(`elements.${id}`)}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`${styles.gaugeFill} h-full rounded-full`}
                  style={{ background: `linear-gradient(90deg, ${color}88, ${color})`, width: `${pct}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-[10px] text-foreground-faint">{descriptions[id]}</span>
              <span className="w-4 shrink-0 text-right text-xs text-foreground-subtle">{counts[id]}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function AspectSection({
  aspects,
  onSelect,
  selection,
  t,
}: {
  aspects: readonly ChartAspect[]
  onSelect: (asp: ChartAspect) => void
  selection: Selection
  t: T
}) {
  if (aspects.length === 0) {
    return null
  }

  const harmony = aspects.filter((a) => HARMONY_TYPES.includes(a.type))
  const tension = aspects.filter((a) => TENSION_TYPES.includes(a.type))

  return (
    <section className="sm:rounded-2xl sm:border sm:bg-surface sm:p-5">
      <h2 className="text-sm font-bold text-foreground">{t('aspects.title')}</h2>
      <p className="mt-1 text-xs text-foreground-subtle">{t('aspects.intro')}</p>
      {harmony.length > 0 && (
        <AspectGroup
          accent="var(--color-positive)"
          aspects={harmony}
          label={t('aspects.harmonyGroup')}
          onSelect={onSelect}
          selection={selection}
          t={t}
        />
      )}
      {tension.length > 0 && (
        <AspectGroup
          accent="var(--color-danger)"
          aspects={tension}
          label={t('aspects.tensionGroup')}
          onSelect={onSelect}
          selection={selection}
          t={t}
        />
      )}
    </section>
  )
}

function AspectGroup({
  accent,
  aspects,
  label,
  onSelect,
  selection,
  t,
}: {
  accent: string
  aspects: readonly ChartAspect[]
  label: string
  onSelect: (asp: ChartAspect) => void
  selection: Selection
  t: T
}) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: accent }}>
        {label}
      </p>
      <ul className="space-y-1">
        {aspects.map((asp) => {
          const color = ASPECT_STYLE[asp.type].color

          const active =
            selection?.kind === 'aspect' &&
            selection.a === asp.a &&
            selection.b === asp.b &&
            selection.aspectType === asp.type

          return (
            <li key={`${asp.a}-${asp.b}-${asp.type}`}>
              <button
                className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-surface-2 sm:gap-3 sm:px-2.5 ${active ? 'bg-surface-3 ring-1 ring-ring' : ''}`}
                onClick={() => onSelect(asp)}
                type="button"
              >
                <span className="w-9 shrink-0 text-center text-base" style={{ color }}>
                  {glyphText(PLANET_GLYPHS[asp.a as never])} {glyphText(PLANET_GLYPHS[asp.b as never])}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-foreground-secondary">
                    {t(`planets.${asp.a}`)} <span className="text-foreground-faint">↔</span> {t(`planets.${asp.b}`)}
                  </span>
                  <span className="block text-[11px]" style={{ color }}>
                    {t(`aspects.${asp.type}Vibe`)}{' '}
                    <span className="text-foreground-faint">
                      · {t(`aspects.${asp.type}Name`)} · {t('aspects.orbLabel')} {asp.orb}°
                    </span>
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
