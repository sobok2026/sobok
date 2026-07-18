import { LOCALE_LANGUAGE_TAGS, type Locale } from '@sobok/domain/locale'
import { useTranslations } from 'next-intl'

import { type LoveWindow, type LoveWindowPurpose, windowPurpose } from './compute'
import type { LoveReadings } from './readings/types'

const PURPOSE_STYLE: Record<LoveWindowPurpose, { chip: string; marker: string }> = {
  meeting: {
    chip: 'bg-accent/15 text-accent',
    marker: 'border-accent bg-accent/25',
  },
  opening: {
    chip: 'bg-positive/15 text-positive',
    marker: 'border-positive bg-positive/25',
  },
  deepening: {
    chip: 'bg-foreground/10 text-foreground-secondary',
    marker: 'border-foreground-subtle bg-foreground/15',
  },
  caution: {
    chip: 'bg-danger/15 text-danger',
    marker: 'border-danger bg-danger/25',
  },
}

type LoveTimelineProps = {
  locale: Locale
  readings: LoveReadings
  today: Date
  windows: readonly LoveWindow[]
}

/** A chronological, semantic list whose rail makes the year-ahead reading scannable. */
export function LoveTimeline({ locale, readings, today, windows }: LoveTimelineProps) {
  const t = useTranslations('Love')

  return (
    <ol className="relative mt-4 space-y-3 before:absolute before:bottom-4 before:left-2 before:top-4 before:w-px before:bg-border-2">
      {windows.map((window) => {
        const purpose = windowPurpose(window)
        const style = PURPOSE_STYLE[purpose]
        const current = window.start <= today && today <= window.end
        const key = `${window.kind}-${window.tone ?? 'none'}-${window.start.toISOString()}-${window.end.toISOString()}`

        return (
          <li className="relative pl-7" key={key}>
            <span
              aria-hidden
              className={`absolute left-0 top-4 h-4 w-4 rounded-full border-2 ring-4 ring-surface-2 ${style.marker} ${current ? 'shadow-[0_0_0_3px_var(--color-accent)]' : ''}`}
            />
            <div className="rounded-xl bg-surface px-3 py-3">
              <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-accent">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${style.chip}`}
                >
                  {t(`timing.purpose.${purpose}`)}
                </span>
                <span>{formatWindowRange(window, locale)}</span>
                {current && (
                  <span className="inline-flex items-center rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                    {t('timing.now')}
                  </span>
                )}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground-secondary">{windowText(window, readings)}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function windowText(window: LoveWindow, readings: LoveReadings): string {
  if (window.kind === 'venusRetro') {
    return readings.timing.venusRetro
  }
  if (window.kind === 'jupiterDescendant') {
    return readings.timing.jupiterDescendant
  }

  const table = window.kind === 'jupiterVenus' ? readings.timing.jupiterVenus : readings.timing.saturnVenus
  return table[window.tone ?? 'conjunction']
}

/** Month-level range — the 5-day scan step makes day precision an overclaim. */
function formatWindowRange(window: LoveWindow, locale: Locale): string {
  const formatter = new Intl.DateTimeFormat(LOCALE_LANGUAGE_TAGS[locale], { year: 'numeric', month: 'long' })
  return formatter.formatRange(window.start, window.end)
}
