'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Fragment } from 'react'

import { signOfLon } from '@/chart/astrology'
import type { ChartAspect, NatalChart, PlanetId, SignId } from '@/chart/types'
import type { Interpretations } from '@/content/interpretations/types'

import { CoreSignatureArt } from './CoreSignatureArt'
import { NodeAxisArt } from './NodeAxisArt'
import { buildReport, type Translator } from './report'

/**
 * The composed long-form reading below the wheel — weighted signature first,
 * then life-theme chapters.
 */
export default function ReportSection({
  aspects,
  chart,
  interpretations,
  moonSigns,
  moonSignUncertain = false,
}: {
  aspects: ChartAspect[]
  chart: NatalChart
  interpretations: Interpretations
  moonSigns?: readonly SignId[]
  moonSignUncertain?: boolean
}) {
  const t = useTranslations('Constellation')
  const locale = useLocale()
  const { report } = interpretations

  // report.ts is decoupled from next-intl (its own loose Translator); the typed
  // `t` only supplies the name vocabulary, so hand it across the seam as that type.
  const chapters = buildReport(chart, aspects, interpretations, t as Translator, { moonSignUncertain })

  const signForBody = (id: PlanetId) => {
    const body = chart.planets.find((planet) => planet.id === id)
    return body ? signOfLon(body.lon) : null
  }

  const sunSign = signForBody('sun')
  const moonSign = signForBody('moon')
  const reportMoonSigns = moonSigns ?? (moonSign ? [moonSign] : [])
  const risingSign = chart.ascendant === null ? null : signOfLon(chart.ascendant)
  const southNodeSign = signForBody('southNode')
  const northNodeSign = signForBody('northNode')

  return (
    <section className="w-full">
      <header className="text-center">
        <h2 className="text-lg font-bold text-foreground">{report.title}</h2>
        <p className="mx-auto mt-1 text-xs leading-relaxed text-foreground-subtle">{report.subtitle}</p>
        {chart.ascendant === null && <p className="mt-2 text-[11px] text-foreground-faint">{report.noTimeNote}</p>}
      </header>
      <div className="mt-4 space-y-4">
        {chapters.map((chapter) => (
          <article className="rounded-2xl border bg-surface-2 p-4 backdrop-blur sm:p-5" key={chapter.id}>
            <h3 className="text-base font-bold text-foreground">{chapter.title}</h3>
            {chapter.id === 'core' && sunSign && (
              <CoreSignatureArt moonSigns={reportMoonSigns} risingSign={risingSign} sunSign={sunSign} />
            )}
            {chapter.intro && <p className="mt-2 text-xs leading-relaxed text-foreground-subtle">{chapter.intro}</p>}
            {chapter.paragraphs.map((para, i) => (
              <Fragment key={`${chapter.id}-${para.kicker ?? para.text}`}>
                <div className="mt-4 first-of-type:mt-3">
                  {para.kicker && <p className="text-xs font-semibold text-accent">{para.kicker}</p>}
                  {para.note && <p className="mt-1 text-xs font-semibold text-foreground-subtle">{para.note}</p>}
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground-secondary">{para.text}</p>
                </div>
                {chapter.id === 'path' && i === 1 && southNodeSign && northNodeSign && (
                  <NodeAxisArt
                    familiarLabel={report.path.familiarLabel}
                    growthLabel={report.path.growthLabel}
                    northSign={northNodeSign}
                    southSign={southNodeSign}
                  />
                )}
              </Fragment>
            ))}
            {chapter.id === 'love' && (
              <p className="mt-4">
                <Link
                  className="text-xs font-semibold text-accent underline-offset-4 transition hover:underline"
                  href={`/${locale}/love`}
                >
                  {report.loveCta}
                </Link>
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
