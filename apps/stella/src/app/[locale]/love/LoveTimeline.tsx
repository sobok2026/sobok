import { LOCALE_LANGUAGE_TAGS, type Locale } from '@sobok/domain/locale'
import { useTranslations } from 'next-intl'

import type { AspectType } from '@/chart/types'
import { aspectTone } from '@/content/interpretations/types'

import { type LoveWindow, windowPurpose } from './compute'
import type { LoveReadings, TimingReading } from './readings/types'

const ASPECT_NAME_KEY = {
  conjunction: 'aspects.conjunctionName',
  trine: 'aspects.trineName',
  square: 'aspects.squareName',
  sextile: 'aspects.sextileName',
  opposition: 'aspects.oppositionName',
} as const satisfies Record<AspectType, string>

type LoveTimelineProps = {
  locale: Locale
  readings: LoveReadings
  today: Date
  windows: readonly LoveWindow[]
}

/** A semantic event list: every window renders as an evenly framed card, with the current one tinted by accent. */
export function LoveTimeline({ locale, readings, today, windows }: LoveTimelineProps) {
  const t = useTranslations('Love')
  const tc = useTranslations('Constellation')

  return (
    <ol className="mt-3 space-y-3">
      {windows.map((window) => {
        const purpose = windowPurpose(window)
        const current = window.start <= today && today <= window.end
        const reading = windowReading(window, readings)
        const key = `${window.kind}-${window.aspect ?? 'retrograde'}-${window.start.toISOString()}-${window.end.toISOString()}`

        const basis =
          window.kind === 'venusRetro'
            ? t('timing.basisRetrograde', { planet: tc('planets.venus') })
            : t('timing.basisAspect', {
                transit: tc(window.kind === 'saturnVenus' ? 'planets.saturn' : 'planets.jupiter'),
                target: tc(window.kind === 'jupiterDescendant' ? 'angleNames.dsc' : 'planets.venus'),
                aspect: tc(ASPECT_NAME_KEY[window.aspect]),
              })

        return (
          <li
            aria-current={current ? 'date' : undefined}
            className={`rounded-2xl p-4 ${current ? 'sm:border border-accent/25 bg-accent/5' : 'border-border bg-surface'}`}
            key={key}
          >
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-accent">{formatWindowRange(window, locale)}</span>
              {current && (
                <span className="inline-flex items-center rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-medium text-accent">
                  {t('timing.now')}
                </span>
              )}
            </p>

            <h4 className="mt-2 text-base font-bold text-foreground">{reading.title}</h4>

            <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-medium leading-5">
              <span className={purpose === 'caution' ? 'text-love-warm' : 'text-foreground-muted'}>
                {t(`timing.purpose.${purpose}`)}
              </span>
              <span aria-hidden className="text-foreground-faint">
                ·
              </span>
              <span className="text-foreground-subtle">{basis}</span>
            </p>

            <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">{reading.interpretation}</p>

            <div className="mt-4 border-t border-border pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                {t('timing.guidanceLabel')}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground-muted">{reading.guidance}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function windowReading(window: LoveWindow, readings: LoveReadings): TimingReading {
  if (window.kind === 'venusRetro') {
    return readings.timing.venusRetro
  }
  if (window.kind === 'jupiterDescendant') {
    return readings.timing.jupiterDescendant
  }

  const table = window.kind === 'jupiterVenus' ? readings.timing.jupiterVenus : readings.timing.saturnVenus
  return table[aspectTone(window.aspect)]
}

/** Month-level range — the 5-day scan step makes day precision an overclaim. */
function formatWindowRange(window: LoveWindow, locale: Locale): string {
  const formatter = new Intl.DateTimeFormat(LOCALE_LANGUAGE_TAGS[locale], { year: 'numeric', month: 'long' })
  return formatter.formatRange(window.start, window.end)
}
