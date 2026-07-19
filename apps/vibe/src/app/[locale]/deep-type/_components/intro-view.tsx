'use client'

import { ArrowRight } from '@mynaui/icons-react'
import { cn } from '@/utils/cn'

type IntroViewProps = {
  body: string
  cta: string
  onNext: () => void
  title: string
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

// Shared chapter-intro screen (STEP 1 검증/측정, STEP 2 Inner, STEP 3 보석) — sets the context for the
// block of items that follows so the journey reads as chapters, not one long undifferentiated quiz. Title
// carries its own "STEP N" prefix from content, so nothing here is hardcoded per-locale.
export function IntroView({ body, cta, onNext, title }: IntroViewProps) {
  return (
    <main className="flex flex-1 flex-col justify-center bg-page-bg px-safe py-10 text-page-ink sm:py-16">
      <div className="mx-auto w-full max-w-xl text-center">
        <h1 className="break-keep font-black text-3xl leading-tight">{title}</h1>
        <p className="mx-auto mt-5 max-w-md text-page-ink/68 leading-8">{body}</p>

        <button
          className={cn(
            'mt-9 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-page-ink px-6 font-black text-sm text-white transition-colors hover:bg-page-ink/92 sm:w-auto',
            focusClassName,
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
