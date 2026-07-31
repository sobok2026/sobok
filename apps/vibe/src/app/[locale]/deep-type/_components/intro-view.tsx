'use client'

import { ArrowRight } from '@mynaui/icons-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { FOCUS_CLASS_NAME } from '../../../../components/focus'

type IntroViewProps = {
  body: string
  cta: string
  hint: string
  /**
   * Rendered above the title. The checkout return puts its payment confirmation here rather than on a screen
   * of its own: the purchase is settled and these questions are the next thing to do, so a tap between them
   * buys nothing — but arriving at a questionnaire with no word about the money is what this slot fixes.
   */
  notice?: ReactNode
  onNext: () => void
  title: string
}

// Each chapter frames the context before its questions so the journey reads as distinct layers.
export function IntroView({ body, cta, hint, notice, onNext, title }: IntroViewProps) {
  return (
    <main className="flex flex-1 flex-col justify-center bg-page-bg px-safe py-10 text-page-ink">
      <div className="mx-auto w-full max-w-2xl py-4 text-center">
        {notice}
        <h1 className="break-keep font-black text-3xl leading-tight">{title}</h1>
        <p className="mx-auto mt-5 text-page-ink/68 leading-8">{body}</p>
        <p className="mx-auto mt-5 rounded-3xl bg-page-soft px-5 py-4 font-bold text-page-ink/72 text-sm leading-6">
          {hint}
        </p>

        <button
          className={cn(
            'mt-9 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-page-ink px-6 font-black text-sm text-white transition-colors hover:bg-page-ink/92 sm:w-auto',
            FOCUS_CLASS_NAME,
          )}
          onClick={onNext}
          type="button"
        >
          {cta}
          <ArrowRight aria-hidden="true" className="h-4 w-4" stroke={1.8} />
        </button>
      </div>
    </main>
  )
}
