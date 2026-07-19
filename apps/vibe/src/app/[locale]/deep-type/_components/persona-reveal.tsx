'use client'

import { ArrowRight } from '@mynaui/icons-react'
import { cn } from '@/utils/cn'

import type { DeepTypeContent, PersonaCode, PersonaResult } from '../_lib/types'

type PersonaRevealProps = {
  claim?: PersonaCode
  content: DeepTypeContent
  onNext: () => void
  persona: PersonaResult
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

// Interim reveal after STEP 1 (verify). Deliberately LIGHT — the type was self-claimed, so the payoff
// here is the confirm-or-overturn beat, not a full read. Doubles as the STEP 2 intro, so it replaces the
// plain inner-intro screen rather than adding one. Forward CTA only — no share/done exit ramp.
export function PersonaReveal({ claim, content, onNext, persona }: PersonaRevealProps) {
  const ui = content.ui
  const overturned = claim !== undefined && claim !== persona.code
  const line = claim === undefined ? ui.personaRevealMeasured : overturned ? ui.personaRevealDiff : ui.personaRevealSame

  return (
    <main className="flex flex-1 flex-col justify-center bg-page-bg px-safe py-10 text-page-ink sm:py-16">
      <div className="mx-auto w-full max-w-xl text-center">
        <p className="font-bold text-page-accent text-sm">{ui.personaRevealEyebrow}</p>

        <div className="mt-4 flex items-center justify-center gap-3">
          {overturned ? <span className="font-bold text-page-ink/40 text-xl line-through">{claim}</span> : null}
          <span className="font-black text-4xl tracking-wide">{persona.code}</span>
        </div>
        <p className="mx-auto mt-4 max-w-md text-page-ink/68 leading-8">{line}</p>

        <div className="mt-8 border-page-border border-t pt-8">
          <h1 className="break-keep font-black text-2xl leading-tight">{ui.innerIntroTitle}</h1>
          <p className="mx-auto mt-4 max-w-md text-page-ink/66 leading-8">{ui.innerIntroBody}</p>
        </div>

        <button
          className={cn(
            'mt-8 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-page-ink px-6 font-black text-sm text-white transition-colors hover:bg-page-ink/92 sm:w-auto',
            focusClassName,
          )}
          onClick={onNext}
          type="button"
        >
          {ui.innerIntroCta}
          <ArrowRight aria-hidden="true" className="h-4 w-4" stroke={1.8} />
        </button>
      </div>
    </main>
  )
}
