'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { track } from '@/lib/analytics/browser'
import BirthForm from './BirthForm'
import { type StoredBirth, toBirthInput } from './birth-storage'
import { decodeBirthHash, encodeBirthHash } from './birth-url'
import { computeAspects, elementCounts, signOfLon } from './chart/astrology'
import { DEFAULT_CHART, ELEMENT_IDS } from './chart/data'
import type { AngleId, ChartAspect, HouseNumber, NatalChart, PlanetId, SignId } from './chart/types'
import AspectSection from './constellation/AspectSection'
import Big3Card from './constellation/Big3Card'
import ChartWheel from './constellation/ChartWheel'
import DetailPanel from './constellation/DetailPanel'
import ElementBalance from './constellation/ElementBalance'
import PatternSection from './constellation/PatternSection'
import ReportSection from './constellation/ReportSection'
import {
  computeBrightPlanets,
  isAspectDimmed,
  isAspectSelection,
  isPlanetDimmed,
  type Selection,
  selectionKey,
} from './constellation/selection'
import { computeChart } from './ephemeris'
import { loadInterpretations } from './interpretations'
import type { Interpretations } from './interpretations/types'
import Starfield from './Starfield'

/** Chart and its locale's reading tables arrive together — one reveal, no half-loaded panel. */
type ChartData = {
  chart: NatalChart
  interpretations: Interpretations
}

export default function Constellation() {
  const [selection, setSelection] = useState<Selection>(null)
  const [data, setData] = useState<ChartData | null>(null)
  const [computing, setComputing] = useState(false)
  const [failed, setFailed] = useState(false)
  const [runId, setRunId] = useState(0)
  const wheelRef = useRef<HTMLDivElement>(null)
  const syncRef = useRef<(fromSubmit: boolean) => void>(() => {})
  const t = useTranslations('Constellation')
  const locale = useLocale()

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

  function handleSubmit(birth: StoredBirth) {
    const url = `${window.location.pathname}${window.location.search}#${encodeBirthHash(birth)}`
    window.history.pushState(null, '', url)
    syncRef.current(true)
  }

  function backToForm() {
    window.history.pushState(null, '', `${window.location.pathname}${window.location.search}`)
    setSelection(null)
    setData(null)
    setFailed(false)
  }

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const data = { title: t('meta.title'), text: t('share.text'), url }

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(data)
        track('share', { method: 'web_share', content_type: 'natal' })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success(t('share.copied'))
      track('share', { method: 'clipboard', content_type: 'natal' })
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
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
  function selectPlanet(id: PlanetId) {
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

  function togglePlanet(id: PlanetId) {
    setSelection((prev) => (prev?.kind === 'planet' && prev.id === id ? null : { kind: 'planet', id }))
  }

  function toggleSign(id: SignId) {
    setSelection((prev) => (prev?.kind === 'sign' && prev.id === id ? null : { kind: 'sign', id }))
  }

  function toggleHouse(n: HouseNumber) {
    setSelection((prev) => (prev?.kind === 'house' && prev.n === n ? null : { kind: 'house', n }))
  }

  function toggleAngle(id: AngleId) {
    setSelection((prev) => (prev?.kind === 'angle' && prev.id === id ? null : { kind: 'angle', id }))
  }

  function toggleAspectAndScroll(asp: ChartAspect) {
    if (isAspectSelection(selection, asp)) {
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

    if (selection.kind === 'angle') {
      return t('a11y.statusAngle', { name: t(`angleNames.${selection.id}`) })
    }

    const body = activeChart.planets.find((p) => p.id === selection.id)

    return t('a11y.statusPlanet', {
      name: t(`planets.${selection.id}`),
      sign: body ? t(`signs.${signOfLon(body.lon)}`) : '',
    })
  }

  // The birth input is mirrored into the URL hash (see birth-url), which makes a
  // chart refreshable, bookmarkable, and shareable, and lets Back return to the
  // form. This effect is the single place a chart is computed: it resolves the
  // hash on mount (deep links, refresh) and on every browser navigation. A submit
  // pushes the hash then calls `syncRef` directly, since pushState fires no
  // `hashchange`.
  useEffect(() => {
    let cancelled = false
    let generation = 0

    async function sync(fromSubmit: boolean) {
      const stored = decodeBirthHash(window.location.hash)
      const gen = ++generation

      if (!stored) {
        setFailed(false)
        setSelection(null)
        setData(null)
        return
      }

      setFailed(false)
      setComputing(true)

      try {
        const [chart, interpretations] = await Promise.all([
          computeChart(toBirthInput(stored)),
          loadInterpretations(locale),
        ])

        // A newer navigation (or unmount) superseded this compute — drop it.
        if (cancelled || gen !== generation) {
          return
        }

        setSelection(null)
        setData({ chart, interpretations })
        setRunId((n) => n + 1)

        // Count only visitor-initiated charts, not deep-link/back-forward views.
        if (fromSubmit) {
          track('generate_chart')
        }
      } catch {
        if (!cancelled && gen === generation) {
          setFailed(true)
        }
      } finally {
        if (!cancelled && gen === generation) {
          setComputing(false)
        }
      }
    }

    syncRef.current = sync
    sync(false)

    const onHashChange = () => sync(false)
    window.addEventListener('hashchange', onHashChange)

    return () => {
      cancelled = true
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [locale])

  return (
    <main className="relative min-h-dvh overflow-hidden bg-night-sky px-3 pb-16 pt-[calc(4rem+var(--safe-area-top))] text-foreground sm:px-4 md:pt-[calc(2rem+var(--safe-area-top))]">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center">
        {/* Hero */}
        <header className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{t('hero.eyebrow')}</p>
          <h1 className="mt-2 bg-hero-gradient bg-clip-text text-3xl font-extrabold text-transparent">
            {t('hero.title')}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-foreground-muted/90">{t('hero.subtitle')}</p>
        </header>

        {/* Birth form → loading → chart. The birth input lives in the URL hash, so a
            submit computes through that hash; deep links and refreshes resolve the same way. */}
        {!revealed &&
          (computing ? (
            <p className="mt-10 animate-pulse text-sm text-foreground-subtle">{t('form.computing')}</p>
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
              onClose={() => setSelection(null)}
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
              <Link
                className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
                href={`/${locale}/love/`}
              >
                {t('loveCta')}
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
