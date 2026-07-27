'use client'

import type { AssessmentProfile } from '@deep-type/model'
import type { Locale } from '@sobok/domain/locale'
import { useState } from 'react'
import { cn } from '@/utils/cn'

import { useReportPolling } from '../_hooks/use-report-polling'
import { postCancel } from '../_lib/api'
import type { DeepTypeContent } from '../_lib/types'
import { ReportView } from './report-view'

type DynamicReportViewProps = {
  accessToken: string
  content: DeepTypeContent
  // The FREE profile, or null when this screen was reached without one (the checkout return arrives from
  // PortOne with no answers in this tab). Never the refined profile — that is paid content and only
  // `GET /report` may hand it over. On failure the buyer sees their free result and the refund CTA.
  fallbackProfile: AssessmentProfile | null
  locale: Locale
  onRestart: () => void
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export function DynamicReportView({
  accessToken,
  content,
  fallbackProfile,
  locale,
  onRestart,
}: DynamicReportViewProps) {
  const state = useReportPolling(accessToken)

  if (state.phase === 'generating') {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-page-bg px-safe py-16 text-center text-page-ink">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-page-accent/20 border-t-page-accent motion-reduce:animate-none" />
        <h1 className="mt-6 break-keep font-black text-2xl">{content.paywall.generatingTitle}</h1>
        <p className="mx-auto mt-3 max-w-sm text-page-ink/64 leading-7">{content.paywall.generatingBody}</p>
      </main>
    )
  }

  if (state.phase === 'failed') {
    return (
      <FailedReport
        accessToken={accessToken}
        content={content}
        fallbackProfile={fallbackProfile}
        locale={locale}
        onRestart={onRestart}
      />
    )
  }

  return (
    <ReportView
      content={content}
      locale={locale}
      onRestart={onRestart}
      paidSections={state.sections}
      profile={state.profile}
      refined
    />
  )
}

type FailedReportProps = DynamicReportViewProps

function FailedReport({ accessToken, content, fallbackProfile, locale, onRestart }: FailedReportProps) {
  const [refund, setRefund] = useState<'idle' | 'pending' | 'done' | 'failed'>('idle')

  async function requestRefund() {
    setRefund('pending')
    try {
      const result = await postCancel(accessToken)
      setRefund(result.status === 'refunded' ? 'done' : 'failed')
    } catch {
      setRefund('failed')
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="grid gap-2 bg-page-accent/10 px-safe py-3 text-center">
        <p className="font-bold text-page-accent text-sm">{content.paywall.fallbackNote}</p>
        {refund === 'done' ? <p className="text-page-ink/64 text-sm">{content.paywall.refundDone}</p> : null}
        {refund === 'failed' ? <p className="text-page-ink/64 text-sm">{content.paywall.refundFailed}</p> : null}
        {refund === 'idle' || refund === 'pending' ? (
          <button
            className={cn(
              'mx-auto inline-flex min-h-10 items-center rounded-full border border-page-accent/50 px-4 font-bold text-page-accent text-sm transition-colors hover:bg-page-accent/10 disabled:opacity-60',
              focusClassName,
            )}
            disabled={refund === 'pending'}
            onClick={requestRefund}
            type="button"
          >
            {refund === 'pending' ? content.paywall.refundPending : content.paywall.refundCta}
          </button>
        ) : null}
      </div>
      {fallbackProfile ? (
        <ReportView content={content} locale={locale} onRestart={onRestart} profile={fallbackProfile} />
      ) : null}
    </div>
  )
}
