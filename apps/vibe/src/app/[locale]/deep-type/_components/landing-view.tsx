import { ArrowRight, Sparkles } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { cn } from '@/utils/cn'

import { DEEP_TYPE_BRAND_NAME } from '../_lib/brand'
import type { DeepTypeContent } from '../_lib/types'

type LandingViewProps = {
  content: DeepTypeContent
  locale: Locale
  onStart: () => void
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export function LandingView({ content, locale, onStart }: LandingViewProps) {
  const keepHeadingBreakClassName = locale === 'ko' ? 'break-keep' : undefined

  return (
    <main className="flex flex-1 flex-col bg-page-bg px-safe py-10 text-page-ink sm:py-16" id="main-content">
      <div className="mx-auto w-full max-w-3xl sm:px-6">
        <p className="inline-flex items-center gap-2 rounded-full bg-page-ink px-4 py-2 font-bold text-sm text-white">
          <Sparkles aria-hidden="true" className="h-4 w-4 text-page-accent" stroke={1.8} />
          {DEEP_TYPE_BRAND_NAME[locale]}
        </p>
        <h1
          className={cn('mt-6 text-balance font-black text-4xl leading-tight sm:text-5xl', keepHeadingBreakClassName)}
        >
          {content.ui.landingTitle}
        </h1>
        <p className="mt-5 max-w-xl text-page-ink/66 leading-8">{content.ui.landingSubtitle}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <StepCard eyebrow="STEP 1" label="Persona" description={content.ui.landingStepOuterDesc} />
          <StepCard eyebrow="STEP 2" label="Inner" description={content.ui.landingStepInnerDesc} />
          <StepCard eyebrow="STEP 3" label="Gem" description={content.ui.landingStepGemDesc} />
        </div>

        <button
          className={cn(
            'mt-9 inline-flex min-h-14 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-page-accent px-6 font-black text-base text-white shadow-[0_24px_80px_rgba(255,77,109,0.26)] transition-colors hover:bg-page-accent/92 sm:w-auto',
            focusClassName,
          )}
          onClick={onStart}
          type="button"
        >
          {content.ui.landingCta}
          <ArrowRight aria-hidden="true" className="h-4 w-4" stroke={1.8} />
        </button>
        <p className="mt-3 text-page-ink/48 text-sm">{content.ui.landingNote}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
          <Link
            className={cn(
              'inline-flex min-h-11 items-center rounded-full font-bold text-page-ink/58 text-sm underline underline-offset-4 hover:text-page-ink',
              focusClassName,
            )}
            href={`/${locale}/deep-type/reopen`}
          >
            {content.ui.reopenCta}
          </Link>
        </div>
      </div>
    </main>
  )
}

function StepCard({ description, eyebrow, label }: { description: string; eyebrow: string; label: string }) {
  return (
    <div className="rounded-3xl border border-page-border bg-page-surface p-5 shadow-[0_18px_55px_rgba(36,22,23,0.07)]">
      <p className="font-bold text-page-accent text-xs">{eyebrow}</p>
      <p className="mt-2 font-black text-lg">{label}</p>
      <p className="mt-1 text-page-ink/56 text-sm leading-6">{description}</p>
    </div>
  )
}
