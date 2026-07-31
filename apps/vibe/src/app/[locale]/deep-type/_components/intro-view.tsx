'use client'

import { ArrowRight } from '@mynaui/icons-react'
import { cn } from '@/utils/cn'
import { FOCUS_CLASS_NAME } from '../../../../components/focus'

type IntroViewProps = {
  body: string
  cta: string
  hint: string
  onNext: () => void
  title: string
}

// Each chapter frames the context before its questions so the journey reads as distinct layers.
export function IntroView({ body, cta, hint, onNext, title }: IntroViewProps) {
  return (
    <main className="flex flex-1 flex-col justify-center bg-page-bg px-safe py-10 text-page-ink">
      <div className="mx-auto w-full max-w-2xl text-center py-4">
        <h1 className="break-keep font-black text-3xl leading-tight">{title}</h1>
        <p className="mx-auto mt-5 text-page-ink-soft leading-8">{body}</p>
        <p className="mx-auto mt-5 rounded-3xl bg-page-soft px-5 py-4 font-bold text-page-ink-soft text-sm leading-6">
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
