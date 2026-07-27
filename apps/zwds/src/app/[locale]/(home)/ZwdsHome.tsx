'use client'

import { track } from '@sobok/analytics/browser'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { computeChart } from '@/chart/compute'
import SharedLinkError from '@/components/SharedLinkError'
import { useBirthSource } from '@/hooks/useBirthSource'
import type { StoredBirth } from '@/lib/birth-storage'
import BirthForm from './BirthForm'
import ChartGrid from './ChartGrid'
import PalaceDetail from './PalaceDetail'
import ReportSection from './ReportSection'
import ZwdsActions from './ZwdsActions'

function formatBirthDate(value: string, locale: string): string {
  const [year, month, day] = value.split('-').map(Number)

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

function formatBirthTime(value: string, locale: string): string {
  const [hour, minute] = value.split(':').map(Number)

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2000, 0, 1, hour, minute)))
}

export default function ZwdsHome() {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const summaryHeadingRef = useRef<HTMLHeadingElement>(null)
  const focusSummaryAfterEditRef = useRef(false)
  const birthSource = useBirthSource()
  const locale = useLocale()
  const t = useTranslations('Zwds.hero')
  const tForm = useTranslations('Zwds.form')
  const tChart = useTranslations('Zwds.chart')
  const tShared = useTranslations('Zwds.shared')

  // A shared link injects an isolated, read-only birth; otherwise the visitor's
  // saved profile is used. The two sources never write into each other.
  const { birth, save, shared } = birthSource
  const loading = birthSource.status === 'loading'

  const chart = birth
    ? computeChart({
        date: birth.date,
        time: birth.time,
        gender: birth.gender,
        longitude: birth.place.longitude,
        timeZone: birth.place.timeZone,
      })
    : null

  const birthDisplay = birth
    ? {
        date: formatBirthDate(birth.date, locale),
        time: formatBirthTime(birth.time, locale),
      }
    : null

  const selectedPalace =
    chart && selectedBranch ? chart.palaces.find((palace) => palace.branch === selectedBranch) : null

  function handleSubmit(nextBirth: StoredBirth, persistent: boolean) {
    save(nextBirth, persistent)
    track('generate_chart')
    focusSummaryAfterEditRef.current = editing
    setEditing(false)
    setSelectedBranch(null)
  }

  function handleSelectPalace(branch: string) {
    const next = branch === selectedBranch ? null : branch

    if (next) {
      track('view_reading', { palace: next })
    }

    setSelectedBranch(next)
  }

  function handleStartEditing() {
    setEditing(true)
  }

  function handleCancelEditing() {
    focusSummaryAfterEditRef.current = true
    setEditing(false)
  }

  function handleProfileCleared() {
    setEditing(false)
    setSelectedBranch(null)
  }

  useEffect(() => {
    if (chart && !editing && focusSummaryAfterEditRef.current) {
      focusSummaryAfterEditRef.current = false
      summaryHeadingRef.current?.focus()
    }
  }, [chart, editing])

  if (birthSource.status === 'invalid') {
    return <SharedLinkError />
  }

  return (
    <main className="bg-night-palace flex min-h-dvh flex-col items-center px-4 pt-[calc(4.5rem+var(--safe-area-top))] pb-[max(2.5rem,var(--safe-area-bottom))]">
      <header className="mb-8 text-center">
        <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-accent uppercase">{t('eyebrow')}</p>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{t('title')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground-subtle">{t('subtitle')}</p>
      </header>

      {loading ? (
        // Wait for the source to resolve before choosing form vs. chart. Rendering
        // the form during the pre-hydration frame makes it flash for a returning
        // visitor before their saved chart replaces it.
        <p className="mt-10 animate-pulse text-sm text-foreground-subtle motion-reduce:animate-none">{t('loading')}</p>
      ) : chart && (shared || !editing) ? (
        <div className="flex w-full flex-col items-center gap-6">
          {shared ? (
            <p className="w-fit rounded-full border border-accent/25 bg-accent/10 px-3.5 py-1.5 text-xs text-accent">
              {tShared('viewing')}
            </p>
          ) : (
            birth &&
            birthDisplay && (
              <section
                aria-labelledby="birth-summary-title"
                className="w-full max-w-4xl rounded-2xl border border-border-2 bg-surface px-4 py-4 sm:px-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <h2
                    className="text-sm font-bold text-foreground"
                    id="birth-summary-title"
                    ref={summaryHeadingRef}
                    tabIndex={-1}
                  >
                    {t('birthSummaryTitle')}
                  </h2>
                  <button
                    className="p-1.5 shrink-0 rounded-full border border-border-strong px-4 text-xs font-semibold text-foreground-secondary transition hover:bg-surface-3 active:scale-[0.98] motion-reduce:active:scale-100 sm:px-5 sm:text-sm"
                    onClick={handleStartEditing}
                    type="button"
                  >
                    {t('editBirthCta')}
                  </button>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                  <div className="min-w-0">
                    <dt className="text-[11px] font-semibold text-foreground-faint">{tForm('dateLabel')}</dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground-secondary">
                      <time dateTime={birth.date}>{birthDisplay.date}</time>
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[11px] font-semibold text-foreground-faint">{tForm('timeLabel')}</dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground-secondary">
                      <time dateTime={birth.time}>{birthDisplay.time}</time>
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[11px] font-semibold text-foreground-faint">{tForm('genderLabel')}</dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground-secondary">
                      {birth.gender === 'female' ? tForm('genderFemale') : tForm('genderMale')}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[11px] font-semibold text-foreground-faint">{tForm('cityLabel')}</dt>
                    <dd className="mt-1 wrap-break-word text-sm font-semibold text-foreground-secondary">
                      {birth.place.name}
                    </dd>
                  </div>
                </dl>
              </section>
            )
          )}
          <ChartGrid chart={chart} onSelectPalace={handleSelectPalace} selectedBranch={selectedBranch} />
          {!selectedPalace && <p className="text-xs text-foreground-faint">{tChart('palaceHint')}</p>}
          {selectedPalace && (
            <PalaceDetail chart={chart} onClose={() => setSelectedBranch(null)} palace={selectedPalace} />
          )}
          <ZwdsActions birth={birth} chart={chart} shared={shared} />
          <ReportSection chart={chart} />
          {!shared && (
            <button
              className="rounded-full border border-border-strong px-6 py-2.5 text-sm font-semibold text-foreground-secondary transition hover:bg-surface-3 active:scale-[0.98] motion-reduce:active:scale-100"
              onClick={handleStartEditing}
              type="button"
            >
              {t('editBirthCta')}
            </button>
          )}
        </div>
      ) : (
        <BirthForm
          onCancel={chart ? handleCancelEditing : undefined}
          onProfileCleared={handleProfileCleared}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  )
}
