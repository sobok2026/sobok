'use client'

import { Refresh } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import { cn } from '@/utils/cn'

import { useReportPolling } from '../_hooks/use-report-polling'
import type { DeepReport, DeepTypeContent } from '../_lib/types'
import { ReportView } from './report-view'

type DynamicReportViewProps = {
  accessToken: string
  content: DeepTypeContent
  fallbackReport: DeepReport
  locale: Locale
  onRestart: () => void
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

// The paid tail: kick + poll the LLM report. While generating, a spinner. On a terminal failure the paid
// report is unavailable, so we fall back to the (already-computed) static report as a consolation and flag
// it — Phase 7 wires the one-click refund for this case.
export function DynamicReportView({ accessToken, content, fallbackReport, locale, onRestart }: DynamicReportViewProps) {
  const paywall = content.paywall
  const state = useReportPolling(accessToken)

  if (state.phase === 'generating') {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-page-bg px-safe py-16 text-center text-page-ink">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-page-accent/20 border-t-page-accent" />
        <h1 className="mt-6 break-keep font-black text-2xl">{paywall.generatingTitle}</h1>
        <p className="mx-auto mt-3 max-w-sm text-page-ink/64 leading-7">{paywall.generatingBody}</p>
      </main>
    )
  }

  if (state.phase === 'failed') {
    return (
      <div className="flex flex-1 flex-col">
        <p className="bg-page-accent/10 px-safe py-3 text-center font-bold text-page-accent text-sm">
          {paywall.fallbackNote}
        </p>
        <ReportView content={content} locale={locale} onRestart={onRestart} report={fallbackReport} />
      </div>
    )
  }

  return (
    <main className="flex flex-1 flex-col bg-page-bg px-safe py-10 text-page-ink sm:py-14">
      <div className="mx-auto grid w-full max-w-xl gap-4">
        {state.sections.map((section) => (
          <section className="rounded-4xl border border-page-border bg-page-surface p-6 sm:p-7" key={section.key}>
            <h2 className="break-keep font-black text-lg">{section.title}</h2>
            <p className="mt-3 whitespace-pre-line break-keep text-page-ink/76 leading-8">{section.body}</p>
          </section>
        ))}

        <button
          className={cn(
            'mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-page-border bg-white px-6 font-bold text-page-ink/70 text-sm transition-colors hover:text-page-ink',
            focusClassName,
          )}
          onClick={onRestart}
          type="button"
        >
          <Refresh aria-hidden="true" className="h-4 w-4" stroke={1.8} />
          {content.ui.reportRestartCta}
        </button>

        <p className="mt-2 text-center text-page-ink/40 text-xs leading-6">{content.ui.reportDisclaimer}</p>
      </div>
    </main>
  )
}
