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

/**
 * A semantic event list: full-width editorial reading on mobile, a chronological rail with dot
 * markers on wider screens (Ant Design/MUI Timeline pattern — status lives on the dot's fill,
 * not on a wrapper box, so it doesn't compete with the per-item card framing used elsewhere).
 */
export function LoveTimeline({ locale, readings, today, windows }: LoveTimelineProps) {
  const t = useTranslations('Love')
  const tc = useTranslations('Constellation')

  return (
    <ol className="relative mt-4 sm:space-y-10 sm:before:absolute sm:before:bottom-2 sm:before:left-1.5 sm:before:top-2 sm:before:w-px sm:before:bg-border-2">
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
            className="relative border-t border-border py-6 sm:first:border-t-0 sm:border-0 sm:py-0 sm:pl-8"
            key={key}
          >
            <span
              aria-hidden
              className={`absolute left-0 top-1.5 hidden h-3 w-3 rounded-full border-2 ring-4 ring-surface-2 sm:block ${
                current ? 'border-accent bg-accent' : 'border-border-strong bg-surface-3'
              }`}
            />

            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-foreground">{formatWindowRange(window, locale)}</span>
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

            <div className="mt-1 border-border pt-4 sm:mt-4 sm:border-t">
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
