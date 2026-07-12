'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import type { ChartAspect, NatalChart } from '../chart/types'
import { buildReport } from './report'

/**
 * The composed long-form reading below the wheel — weighted signature first,
 * then life-theme chapters.
 */
export default function ReportSection({ aspects, chart }: { aspects: ChartAspect[]; chart: NatalChart }) {
  const t = useTranslations('Constellation')
  const locale = useLocale()
  const chapters = buildReport(chart, aspects, t)

  return (
    <section className="w-full">
      <header className="text-center">
        <h2 className="text-lg font-bold text-foreground">{t('report.title')}</h2>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-foreground-subtle">{t('report.subtitle')}</p>
        {chart.ascendant === null && <p className="mt-2 text-[11px] text-foreground-faint">{t('report.noTimeNote')}</p>}
      </header>
      <div className="mt-4 space-y-4">
        {chapters.map((chapter) => (
          <article className="rounded-2xl border bg-surface-2 p-4 backdrop-blur sm:p-5" key={chapter.id}>
            <h3 className="text-base font-bold text-foreground">{chapter.title}</h3>
            {chapter.intro && <p className="mt-2 text-xs leading-relaxed text-foreground-subtle">{chapter.intro}</p>}
            {chapter.paragraphs.map((para, i) => (
              <div className="mt-4 first-of-type:mt-3" key={`${chapter.id}-${i}`}>
                {para.kicker && <p className="text-xs font-semibold text-accent">{para.kicker}</p>}
                {para.note && <p className="mt-1 text-xs font-semibold text-foreground-subtle">{para.note}</p>}
                <p className="mt-1.5 text-sm leading-relaxed text-foreground-secondary">{para.text}</p>
              </div>
            ))}
            {chapter.id === 'love' && (
              <p className="mt-4">
                <Link
                  className="text-xs font-semibold text-accent underline-offset-4 transition hover:underline"
                  href={`/${locale}/love/`}
                >
                  {t('report.loveCta')}
                </Link>
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
