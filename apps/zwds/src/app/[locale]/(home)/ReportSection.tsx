'use client'

import type { Locale } from '@sobok/domain/locale'
import { useLocale } from 'next-intl'
import { useMemo } from 'react'

import { computeSignature } from '@/chart/signature'
import type { ZwdsChart } from '@/chart/types'
import { useInterpretations } from '@/hooks/useInterpretations'

import { buildReport } from './report'

export default function ReportSection({ chart }: { chart: ZwdsChart }) {
  const locale = useLocale() as Locale
  const interpretations = useInterpretations(locale)

  const chapters = useMemo(() => {
    if (!interpretations) {
      return []
    }

    // 세는나이 — 대한 구간 판정과 같은 기준을 쓴다.
    const nominalAge = new Date().getFullYear() - chart.clock.year + 1
    return buildReport(chart, computeSignature(chart), interpretations, locale, { nominalAge })
  }, [chart, interpretations, locale])

  if (!interpretations || chapters.length === 0) {
    return null
  }

  return (
    <section className="w-full max-w-2xl">
      <header className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-foreground">{interpretations.report.title}</h2>
        {interpretations.report.subtitle && (
          <p className="mt-2 text-sm leading-relaxed text-foreground-subtle">{interpretations.report.subtitle}</p>
        )}
      </header>

      <div className="flex flex-col gap-4">
        {chapters.map((chapter) => (
          <article className="rounded-2xl border bg-surface p-5" key={chapter.id}>
            <h3 className="mb-3 text-base font-bold text-accent">{chapter.title}</h3>
            {chapter.intro && <p className="mb-3 text-xs leading-relaxed text-foreground-faint">{chapter.intro}</p>}
            <div className="flex flex-col gap-4">
              {chapter.paragraphs.map((paragraph, index) => (
                <div key={index}>
                  {paragraph.kicker && (
                    <p className="mb-1 text-xs font-semibold tracking-wide text-accent-gold">{paragraph.kicker}</p>
                  )}
                  <p className="text-sm leading-relaxed text-foreground-secondary">{paragraph.text}</p>
                  {paragraph.note && (
                    <p className="mt-1.5 text-xs leading-relaxed text-foreground-subtle">{paragraph.note}</p>
                  )}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
