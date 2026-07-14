'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useReducer, useRef, useState } from 'react'

import { track } from '@/lib/analytics/browser'

import BirthForm from './BirthForm'
import type { StoredBirth } from './birth-storage'
import { toBirthInput } from './birth-storage'
import { computeAspects, elementCounts, signOfLon } from './chart/astrology'
import { DEFAULT_CHART, ELEMENT_IDS } from './chart/data'
import type { AngleId, ChartAspect, HouseNumber, NatalChart, PlanetId, SignId } from './chart/types'
import AspectSection from './constellation/AspectSection'
import Big3Card from './constellation/Big3Card'
import ChartWheel from './constellation/ChartWheel'
import { ConstellationActions } from './constellation/ConstellationActions'
import DetailPanel from './constellation/DetailPanel'
import ElementBalance from './constellation/ElementBalance'
import PatternSection from './constellation/PatternSection'
import ReportSection from './constellation/ReportSection'
import {
  computeBrightPlanets,
  isAspectDimmed,
  isAspectSelection,
  isPlanetDimmed,
  selectionKey,
  selectionReducer,
} from './constellation/selection'
import { computeChart } from './ephemeris'
import { HeroTitle } from './HeroTitle'
import { loadInterpretations } from './interpretations'
import type { Interpretations } from './interpretations/types'
import SharedLinkError from './SharedLinkError'
import Starfield from './Starfield'
import { useBirthSource } from './useBirthSource'

/** Chart and its locale's reading tables arrive together — one reveal, no half-loaded panel. */
type ChartData = {
  chart: NatalChart
  interpretations: Interpretations
}

type ChartState =
  | { status: 'idle' | 'computing' | 'failed'; runId: number }
  | { status: 'ready'; data: ChartData; runId: number }

const INITIAL_CHART_STATE: ChartState = { status: 'idle', runId: 0 }

export default function Constellation() {
  const [chartState, setChartState] = useState<ChartState>(INITIAL_CHART_STATE)
  const [selection, dispatchSelection] = useReducer(selectionReducer, null)
  const [editing, setEditing] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)
  const submittedRef = useRef(false)
  const t = useTranslations('Constellation')
  const ts = useTranslations('Shared')
  const locale = useLocale()
  const birthSource = useBirthSource('chart')

  const { birth, save, shared } = birthSource
  const sourceReady = birthSource.status === 'ready'
  const data = chartState.status === 'ready' ? chartState.data : null
  const computing = chartState.status === 'computing'
  const failed = chartState.status === 'failed'
  const runId = chartState.runId
  const revealed = data !== null
  const activeChart = data?.chart ?? DEFAULT_CHART
  const { ascendant, cusps } = activeChart

  const aspects = computeAspects(activeChart.planets)
  const counts = elementCounts(activeChart.planets)
  const dominant = ELEMENT_IDS.reduce((best, id) => (counts[id] > counts[best] ? id : best), ELEMENT_IDS[0])

  const sunLon = activeChart.planets.find((p) => p.id === 'sun')?.lon ?? 0
  const moonLon = activeChart.planets.find((p) => p.id === 'moon')?.lon ?? 0
  const risingSign = ascendant !== null ? signOfLon(ascendant) : null
  const brightPlanets = computeBrightPlanets(selection, aspects, activeChart.planets, cusps, ascendant)

  function handleSubmit(nextBirth: StoredBirth, persistent: boolean) {
    submittedRef.current = true
    save(nextBirth, persistent)
    setEditing(false)
  }

  function backToForm() {
    window.scrollTo(0, 0)
    setEditing(true)
    dispatchSelection({ type: 'reset' })
    setChartState((previous) => ({ status: 'idle', runId: previous.runId }))
  }

  function scrollToWheel() {
    wheelRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  function selectPlanet(id: PlanetId) {
    dispatchSelection({ type: 'selectPlanet', id, aspects })
  }

  function togglePlanet(id: PlanetId) {
    dispatchSelection({ type: 'togglePlanet', id })
  }

  function toggleSign(id: SignId) {
    dispatchSelection({ type: 'toggleSign', id })
  }

  function toggleHouse(n: HouseNumber) {
    dispatchSelection({ type: 'toggleHouse', n })
  }

  function toggleAngle(id: AngleId) {
    dispatchSelection({ type: 'toggleAngle', id })
  }

  function toggleAspectAndScroll(asp: ChartAspect) {
    const deselecting = isAspectSelection(selection, asp)
    dispatchSelection({ type: 'toggleAspect', aspect: asp })

    if (!deselecting) {
      scrollToWheel()
    }
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

    if (selection.kind === 'angle') {
      return t('a11y.statusAngle', { name: t(`angleNames.${selection.id}`) })
    }

    const body = activeChart.planets.find((p) => p.id === selection.id)

    return t('a11y.statusPlanet', {
      name: t(`planets.${selection.id}`),
      sign: body ? t(`signs.${signOfLon(body.lon)}`) : '',
    })
  }

  // Normal views resolve the visitor's profile from the layout-level provider;
  // shared views receive an isolated read-only birth from the share route. The
  // two sources never write into each other.
  useEffect(() => {
    let cancelled = false

    if (!sourceReady || editing || !birth) {
      if (sourceReady) {
        dispatchSelection({ type: 'reset' })
        setChartState((previous) => ({ status: 'idle', runId: previous.runId }))
      }
      return () => {
        cancelled = true
      }
    }

    const fromSubmit = submittedRef.current
    const sourceBirth = birth
    submittedRef.current = false

    async function compute() {
      setChartState((previous) => ({ status: 'computing', runId: previous.runId }))

      try {
        const [chart, interpretations] = await Promise.all([
          computeChart(toBirthInput(sourceBirth)),
          loadInterpretations(locale),
        ])

        if (cancelled) {
          return
        }

        dispatchSelection({ type: 'reset' })

        setChartState((previous) => ({
          status: 'ready',
          data: { chart, interpretations },
          runId: previous.runId + 1,
        }))

        if (fromSubmit) {
          track('generate_chart')
        }
      } catch {
        if (!cancelled) {
          setChartState((previous) => ({ status: 'failed', runId: previous.runId }))
        }
      }
    }

    compute()

    return () => {
      cancelled = true
    }
  }, [birth, editing, locale, sourceReady])

  if (birthSource.status === 'invalid') {
    return <SharedLinkError />
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-night-sky px-3 pb-16 pt-[calc(4rem+var(--safe-area-top))] text-foreground sm:px-4 md:pt-[calc(2rem+var(--safe-area-top))]">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center">
        {/* Hero */}
        <header className="mb-6 w-full max-w-sm text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{t('hero.eyebrow')}</p>
          <HeroTitle>{t('hero.title')}</HeroTitle>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-foreground-muted/90">{t('hero.subtitle')}</p>
          {shared && (
            <p className="mx-auto mt-3 w-fit rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs text-accent">
              {ts('viewing')}
            </p>
          )}
        </header>

        {/* Normal profiles restore from the shared layout provider. Share routes
            inject an isolated birth and never render or mutate the visitor's form. */}
        {!revealed &&
          (!sourceReady || computing ? (
            <p className="mt-10 animate-pulse text-sm text-foreground-subtle motion-reduce:animate-none">
              {t('form.computing')}
            </p>
          ) : shared ? (
            failed && (
              <div className="text-center">
                <p className="text-sm text-danger">{t('form.error')}</p>
                <a
                  className="mt-4 inline-block text-xs text-foreground-subtle underline-offset-4 hover:text-foreground-secondary hover:underline"
                  href={`/${locale}`}
                >
                  {ts('createOwn')}
                </a>
              </div>
            )
          ) : (
            <div className="w-full">
              <BirthForm onSubmit={handleSubmit} />
              {failed && <p className="mt-3 text-center text-sm text-danger">{t('form.error')}</p>}
            </div>
          ))}

        {/* Big 3 (after compute) */}
        {revealed && (
          <div className="mb-6 grid w-full grid-cols-3 gap-1.5 sm:gap-2" key={`big3-${runId}`}>
            <Big3Card
              delay={0.1}
              glyph="☉"
              hint={t('big3.sunHint')}
              label={t('big3.sunLabel')}
              onClick={() => togglePlanet('sun')}
              value={t(`signs.${signOfLon(sunLon)}`)}
            />
            <Big3Card
              delay={0.2}
              glyph="☾"
              hint={t('big3.moonHint')}
              label={t('big3.moonLabel')}
              onClick={() => togglePlanet('moon')}
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
          <ChartWheel
            aspects={aspects}
            chart={activeChart}
            isAspectDimmed={(asp) => isAspectDimmed(asp, selection, brightPlanets)}
            isPlanetDimmed={(id) => isPlanetDimmed(id, selection, brightPlanets)}
            key={`wheel-${runId}`}
            onSelectAngle={toggleAngle}
            onSelectHouse={toggleHouse}
            onSelectPlanet={selectPlanet}
            onSelectSign={toggleSign}
            revealed={revealed}
            selection={selection}
          />
        </div>

        {/* Speaks the current selection to screen readers on change. */}
        {revealed && (
          <div aria-atomic="true" aria-live="polite" className="sr-only" role="status">
            {selectionStatus()}
          </div>
        )}

        {revealed && (
          <p className="mt-2 h-4 text-center text-xs text-foreground-subtle">
            {selection?.kind === 'planet' && brightPlanets.size > 1 && t('hero.connectionHint')}
          </p>
        )}

        {/* Detail panel */}
        {data && (
          <div className="mt-4 w-full" key={`panel-${selectionKey(selection)}`}>
            <DetailPanel
              ascendant={ascendant}
              chart={data.chart}
              interpretations={data.interpretations}
              onClose={() => dispatchSelection({ type: 'reset' })}
              selection={selection}
            />
          </div>
        )}

        {/* Elements + aspects + actions */}
        {data && (
          <div className="mt-9 w-full space-y-9 sm:mt-6 sm:space-y-6" key={`extras-${runId}`}>
            <ElementBalance counts={counts} dominant={dominant} total={data.chart.planets.length} />
            <AspectSection aspects={aspects} onSelect={toggleAspectAndScroll} selection={selection} />
            <PatternSection chart={data.chart} />
            <ReportSection aspects={aspects} chart={data.chart} interpretations={data.interpretations} />
            <ConstellationActions birth={birth} chart={data.chart} onRecompute={backToForm} shared={shared} />
          </div>
        )}
      </div>
    </main>
  )
}
