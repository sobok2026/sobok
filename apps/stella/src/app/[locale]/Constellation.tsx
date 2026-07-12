'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { track } from '@/lib/analytics/browser'

import BirthForm from './BirthForm'
import { computeAspects, elementCounts, signOfLon } from './chart/astrology'
import { DEFAULT_CHART, ELEMENT_IDS } from './chart/data'
import type { ChartAspect, NatalChart } from './chart/types'
import AspectSection from './constellation/AspectSection'
import Big3Card from './constellation/Big3Card'
import ChartWheel from './constellation/ChartWheel'
import DetailPanel from './constellation/DetailPanel'
import ElementBalance from './constellation/ElementBalance'
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
import Starfield from './Starfield'

export default function Constellation() {
  const t = useTranslations('Constellation')
  const locale = useLocale()
  // The love vertical only exists where its copy does (Korean for now).
  const hasLove = (t as unknown as { has(key: string): boolean }).has('loveCta')
  const [chart, setChart] = useState<NatalChart | null>(null)
  const [computing, setComputing] = useState(false)
  const [runId, setRunId] = useState(0)
  const [selection, setSelection] = useState<Selection>(null)
  const wheelRef = useRef<HTMLDivElement>(null)

  const revealed = chart !== null
  const activeChart = chart ?? DEFAULT_CHART
  const { ascendant, cusps } = activeChart

  const aspects = computeAspects(activeChart.planets)
  const counts = elementCounts(activeChart.planets)
  const dominant = ELEMENT_IDS.reduce((best, id) => (counts[id] > counts[best] ? id : best), ELEMENT_IDS[0])

  const sunLon = activeChart.planets.find((p) => p.id === 'sun')?.lon ?? 0
  const moonLon = activeChart.planets.find((p) => p.id === 'moon')?.lon ?? 0
  const risingSign = ascendant !== null ? signOfLon(ascendant) : null

  const brightPlanets = computeBrightPlanets(selection, aspects, activeChart.planets, cusps, ascendant)

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

    const body = activeChart.planets.find((p) => p.id === selection.id)

    return t('a11y.statusPlanet', {
      name: t(`planets.${selection.id}`),
      sign: body ? t(`signs.${signOfLon(body.lon)}`) : '',
    })
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
            <p className="mt-4 flex flex-col items-center gap-2 text-center">
              <Link
                className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
                href={`/${locale}/today/`}
              >
                {t('todayCta')}
              </Link>
              {hasLove && (
                <Link
                  className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
                  href={`/${locale}/love/`}
                >
                  {t('loveCta')}
                </Link>
              )}
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
          <ChartWheel
            aspects={aspects}
            chart={activeChart}
            isAspectDimmed={(asp) => isAspectDimmed(asp, selection, brightPlanets)}
            isPlanetDimmed={(id) => isPlanetDimmed(id, selection, brightPlanets)}
            key={`wheel-${runId}`}
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
          <p className="mt-2 text-center text-xs text-foreground-subtle">
            {/* Once a planet with aspects is selected, point the user at the two-tap gesture. */}
            {selection?.kind === 'planet' && brightPlanets.size > 1 ? t('hero.connectionHint') : t('hero.tapHint')}
          </p>
        )}

        {/* Detail panel */}
        {revealed && (
          <div className="mt-4 w-full" key={`panel-${selectionKey(selection)}`}>
            <DetailPanel
              ascendant={ascendant}
              chart={activeChart}
              onClose={() => setSelection(null)}
              selection={selection}
            />
          </div>
        )}

        {/* Elements + aspects + actions */}
        {revealed && (
          <div className="mt-6 w-full space-y-6" key={`extras-${runId}`}>
            <ElementBalance counts={counts} dominant={dominant} total={activeChart.planets.length} />
            <AspectSection aspects={aspects} onSelect={toggleAspectAndScroll} selection={selection} />
            <ReportSection aspects={aspects} chart={activeChart} />
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
              {hasLove && (
                <Link
                  className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
                  href={`/${locale}/love/`}
                >
                  {t('loveCta')}
                </Link>
              )}
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
