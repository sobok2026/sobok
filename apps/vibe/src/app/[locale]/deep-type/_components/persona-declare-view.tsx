'use client'

import { PERSONA_CODES, type PersonaCode } from '@deep-type/model'
import { cn } from '@/utils/cn'
import type { DeepTypeUiText } from '../_lib/types'

type PersonaDeclareViewProps = {
  onDeclare: (code: PersonaCode | null) => void
  ui: DeepTypeUiText
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

/**
 * The first screen of the free run and the only place `personaSource` is decided. Nothing here is scored: the
 * four letters are taken as given, and all the report keeps is whether they were given at all.
 *
 * '모름' is a full-width choice below the grid, not a small link. It is a legitimate answer — most people do not
 * carry four letters around — and burying it would push them into picking one they half-remember, which is worse
 * input than no input. The notice under it says what skipping costs, per O6, and the paywall repeats it.
 */
export function PersonaDeclareView({ onDeclare, ui }: PersonaDeclareViewProps) {
  return (
    <main className="flex flex-1 flex-col justify-center bg-page-bg px-safe py-10 text-page-ink" id="main-content">
      <div className="mx-auto w-full max-w-2xl py-4">
        <h1 className="break-keep font-black text-3xl leading-tight">{ui.declareTitle}</h1>
        <p className="mt-4 text-page-ink/68 leading-8">{ui.declareBody}</p>

        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PERSONA_CODES.map((code) => (
            <button
              className={cn(
                'min-h-13 rounded-2xl border border-page-border bg-page-surface font-black text-base tabular-nums transition-colors hover:border-page-accent hover:bg-page-accent/8 hover:text-page-accent',
                focusClassName,
              )}
              key={code}
              onClick={() => onDeclare(code)}
              type="button"
            >
              {code}
            </button>
          ))}
        </div>

        <button
          className={cn(
            'mt-3 min-h-13 w-full rounded-2xl border border-page-border border-dashed bg-transparent font-bold text-page-ink/64 text-sm transition-colors hover:border-page-ink/40 hover:text-page-ink',
            focusClassName,
          )}
          onClick={() => onDeclare(null)}
          type="button"
        >
          {ui.declareUnknownLabel}
        </button>

        <p className="mt-4 rounded-3xl bg-page-soft px-5 py-4 text-page-ink/60 text-sm leading-6">{ui.declareNotice}</p>
      </div>
    </main>
  )
}
