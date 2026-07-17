'use client'

import { LOCALE_LANGUAGE_TAGS, type Locale } from '@sobok/domain/locale'
import { useLocale, useTranslations } from 'next-intl'
import { useReducer, useRef, useState } from 'react'
import { preload } from 'react-dom'

import { computeAspects, elementCounts, signOfLon } from '@/chart/astrology'
import { DEFAULT_CHART, ELEMENT_IDS } from '@/chart/data'
import type { AngleId, ChartAspect, HouseNumber, PlanetId, SignId } from '@/chart/types'
import { HeroTitle } from '@/components/HeroTitle'
import SharedLinkError from '@/components/SharedLinkError'
import Starfield from '@/components/Starfield'
import { useBirthSource } from '@/hooks/useBirthSource'
import type { StoredBirth } from '@/lib/birth-storage'

import AspectSection from './AspectSection'
import Big3Card from './Big3Card'
import BirthForm from './BirthForm'
import { ConstellationActions } from './ConstellationActions'
import DetailPanel from './DetailPanel'
import ElementBalance from './ElementBalance'
import PatternSection from './PatternSection'
import ReportSection from './ReportSection'
import {
  computeBrightPlanets,
  isAspectDimmed,
  isAspectSelection,
  isPlanetDimmed,
  selectionKey,
  selectionReducer,
} from './selection'
import { useNatalChart } from './useNatalChart'
import ChartWheel from './wheel/ChartWheel'
import { ZODIAC_IMAGE_URLS } from './zodiac-images'

export default function Constellation() {
  const [selection, dispatchSelection] = useReducer(selectionReducer, null)
  const [editing, setEditing] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('Constellation')
  const ts = useTranslations('Shared')
  const locale = useLocale()
  const birthSource = useBirthSource('chart')

  const { birth, save, shared } = birthSource
  const sourceReady = birthSource.status === 'ready'

  const chart = useNatalChart({
    birth,
    editing,
    onReset: () => dispatchSelection({ type: 'reset' }),
    sourceReady,
  })

  const { computing, data, failed, runId } = chart
  const revealed = data !== null

  // An auto-reveal birth computes its chart in an effect that runs a frame after
  // the source hydrates. Treat that gap as loading so the form does not flash for
  // one frame before the chart replaces it.
  const autoRevealPending = sourceReady && !editing && birth !== null && !revealed && !failed

  const birthSummary = birth ? formatBirthSummary(birth, locale, t('form.timeUnknownShort')) : null
  const activeChart = data?.chart ?? DEFAULT_CHART
  const { ascendant, cusps } = activeChart

  const computedAspects = computeAspects(activeChart.planets)
  const unknownTime = data?.unknownTime ?? null
  const aspects = unknownTime
    ? computedAspects.filter((aspect) => aspect.a !== 'moon' && aspect.b !== 'moon')
    : computedAspects

  const sunLon = activeChart.planets.find((p) => p.id === 'sun')?.lon ?? 0
  const moonLon = activeChart.planets.find((p) => p.id === 'moon')?.lon ?? 0
  const moonSigns = unknownTime?.moonSigns ?? null
  const moonLongitudeRange = unknownTime?.moonLongitudeRange ?? null
  const displayedMoonSigns = moonSigns ?? [signOfLon(moonLon)]
  const moonSignUncertain = displayedMoonSigns.length > 1

  const balancePlanets = moonSignUncertain
    ? activeChart.planets.filter((planet) => planet.id !== 'moon')
    : activeChart.planets

  const counts = elementCounts(balancePlanets)
  const dominant = ELEMENT_IDS.reduce((best, id) => (counts[id] > counts[best] ? id : best), ELEMENT_IDS[0])
  const risingSign = ascendant !== null ? signOfLon(ascendant) : null
  const brightPlanets = computeBrightPlanets(selection, aspects, activeChart.planets, cusps, ascendant)

  if (selection?.kind === 'sign' && moonSigns?.includes(selection.id)) {
    brightPlanets.add('moon')
  }

  function handleSubmit(nextBirth: StoredBirth, persistent: boolean) {
    window.scrollTo(0, 0)
    chart.markSubmitted()
    save(nextBirth, persistent)
    setEditing(false)
  }

  function backToForm() {
    window.scrollTo(0, 0)
    setEditing(true)
    dispatchSelection({ type: 'reset' })
    chart.reset()
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

    const selectedSign =
      selection.id === 'moon' && moonSigns
        ? moonSigns.map((sign) => t(`signs.${sign}`)).join(' / ')
        : body
          ? t(`signs.${signOfLon(body.lon)}`)
          : ''

    return t('a11y.statusPlanet', {
      name: t(`planets.${selection.id}`),
      sign: selectedSign,
    })
  }

  if (birthSource.status === 'invalid') {
    return <SharedLinkError />
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-night-sky px-3 pb-16 pt-[calc(4.5rem+var(--safe-area-top))] text-foreground sm:px-4">
      {data && <ZodiacImagePreloads />}
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

        {revealed && !shared && birthSummary && (
          <button
            className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border-2 bg-surface-2/60 px-3.5 py-1.5 text-xs text-foreground-subtle backdrop-blur transition hover:border-white/30 hover:text-foreground-secondary"
            onClick={backToForm}
            type="button"
          >
            <span>{birthSummary}</span>
            <svg
              aria-hidden
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
            <span className="sr-only">{t('form.edit')}</span>
          </button>
        )}

        {/* Normal profiles restore from the shared layout provider. Share routes
            inject an isolated birth and never render or mutate the visitor's form. */}
        {!revealed &&
          (!sourceReady || computing || autoRevealPending ? (
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
            <>
              <BirthForm onSubmit={handleSubmit} />
              {failed && <p className="mt-3 text-center text-sm text-danger">{t('form.error')}</p>}
            </>
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
              value={displayedMoonSigns.map((sign) => t(`signs.${sign}`)).join(' ↔ ')}
            />
            <Big3Card
              delay={0.3}
              glyph="Asc"
              hint={risingSign ? t('big3.risingHint') : t('big3.risingUnknownHint')}
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
            moonLongitudeRange={moonLongitudeRange}
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
              moonSigns={moonSigns}
              onClose={() => dispatchSelection({ type: 'reset' })}
              selection={selection}
            />
          </div>
        )}

        {data && (
          <div className="mt-6 w-full">
            <ConstellationActions
              aspects={aspects}
              birth={birth}
              chart={data.chart}
              moonLongitudeRange={moonLongitudeRange}
              moonSigns={moonSigns}
              shared={shared}
            />
          </div>
        )}

        {/* Elements + aspects + report */}
        {data && (
          <div className="mt-9 w-full space-y-9 sm:mt-6 sm:space-y-6" key={`extras-${runId}`}>
            <ElementBalance
              counts={counts}
              dominant={dominant}
              note={moonSignUncertain ? t('elements.moonExcluded') : undefined}
              total={balancePlanets.length}
            />
            <AspectSection aspects={aspects} onSelect={toggleAspectAndScroll} selection={selection} />
            <PatternSection chart={data.chart} dateOnly={unknownTime !== null} />
            <ReportSection
              aspects={aspects}
              chart={data.chart}
              interpretations={data.interpretations}
              moonSignUncertain={moonSignUncertain}
            />
            <p className="text-center text-xs text-foreground-faint">{t('footer')}</p>
          </div>
        )}
      </div>
    </main>
  )
}

/** Warm the bounded icon set only after the chart is ready, when the critical data work is complete. */
function ZodiacImagePreloads() {
  for (const src of ZODIAC_IMAGE_URLS) {
    preload(src, {
      as: 'image',
      fetchPriority: 'low',
      type: 'image/svg+xml',
    })
  }

  return null
}

/** "2000년 1월 1일 · 12:00 · 서울" — date and city localized, time literal (or "unknown"). */
function formatBirthSummary(birth: StoredBirth, locale: Locale, timeUnknownLabel: string): string {
  const tag = LOCALE_LANGUAGE_TAGS[locale]

  const date = new Intl.DateTimeFormat(tag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${birth.date}T12:00:00`))

  const time = birth.timeKnown ? birth.time : timeUnknownLabel
  return `${date} · ${time} · ${birth.place.name}`
}
