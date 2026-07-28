import { FREE_DELIVERABLES_KO } from '@deep-type/free-deliverables'
import { ArrowRight, Sparkles } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { cn } from '@/utils/cn'

import { DEEP_TYPE_BRAND_NAME } from '../_lib/brand'
import type { DeepTypeContent } from '../_lib/types'

type LandingViewProps = {
  content: DeepTypeContent
  locale: Locale
  onStart?: () => void
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'
const JOB_HEADING = FREE_DELIVERABLES_KO[2]

export function LandingView({ content, locale, onStart }: LandingViewProps) {
  const keepHeadingBreakClassName = locale === 'ko' ? 'break-keep' : undefined

  return (
    <main className="flex flex-1 flex-col justify-center bg-page-bg px-safe py-10 text-page-ink" id="main-content">
      <div className="mx-auto w-full max-w-3xl py-4">
        <p className="inline-flex items-center gap-2 rounded-full bg-page-ink px-4 py-2 font-bold text-sm text-white">
          <Sparkles aria-hidden="true" className="h-4 w-4 text-page-accent" stroke={1.8} />
          {DEEP_TYPE_BRAND_NAME[locale]}
        </p>
        <h1
          className={cn('mt-6 text-balance font-black text-4xl leading-tight sm:text-5xl', keepHeadingBreakClassName)}
        >
          {content.ui.landingTitle}
        </h1>
        <p className="mt-5 text-page-ink/66 leading-8">{content.ui.landingSubtitle}</p>

        {/* The three cards name the three things the free run hands back, not three steps of a questionnaire —
            the run is one continuous stretch of questions and has no steps to number. */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <StepCard description={content.ui.landingStepTypeDesc} label={content.ui.layerInner} />
          <StepCard description={content.ui.landingStepCoreDesc} label={content.ui.layerGem} />
          <StepCard description={content.ui.landingStepJobDesc} label={JOB_HEADING} />
        </div>

        <Link
          className={cn(
            'mt-9 mx-auto w-full flex touch-manipulation items-center justify-center gap-2 rounded-2xl bg-page-accent py-4 font-black text-base text-white shadow-[0_24px_80px_rgba(255,77,109,0.26)] transition-colors hover:bg-page-accent/92 sm:max-w-sm',
            focusClassName,
          )}
          href={`/${locale}/deep-type/test`}
          onClick={onStart}
        >
          {content.ui.landingCta}
          <ArrowRight aria-hidden="true" className="h-4 w-4" stroke={1.8} />
        </Link>
        <p className="mt-3 text-center text-page-ink/48 text-sm">{content.ui.landingNote}</p>
        <Link
          className={cn(
            'mt-4 w-fit text-center mx-auto flex p-3 items-center rounded-full font-bold text-page-ink/58 text-xs underline underline-offset-4 hover:text-page-ink',
            focusClassName,
          )}
          href={`/${locale}/deep-type/reopen`}
        >
          {content.ui.reopenCta}
        </Link>
      </div>
    </main>
  )
}

function StepCard({ description, label }: { description: string; label: string }) {
  return (
    <div className="rounded-3xl border border-page-border bg-page-surface p-5 shadow-[0_18px_55px_rgba(36,22,23,0.07)]">
      <p className="font-black text-lg">{label}</p>
      <p className="mt-1 text-page-ink/56 text-sm leading-6">{description}</p>
    </div>
  )
}
