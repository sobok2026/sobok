'use client'

import { PERSONA_CODES, type PersonaCode } from '@deep-type/model'
import { cn } from '@/utils/cn'
import { FOCUS_CLASS_NAME } from '../../../../components/focus'
import type { DeepTypeUiText } from '../_lib/types'

type PersonaDeclareViewProps = {
  onDeclare: (code: PersonaCode) => void
  /** Opens the four self-image questions for a reader who does not carry four letters around. */
  onGuide: () => void
  ui: DeepTypeUiText
}

/**
 * The first screen of the free run and the only place `personaSource` is decided. Nothing here is scored: the
 * four letters are taken as given, and all the report keeps is whether they were given at all.
 *
 * '모름' is a full-width choice below the grid, not a small link. It is a legitimate answer — most people do not
 * carry four letters around — and burying it would push them into picking one they half-remember, which is worse
 * input than no input. It opens the four self-image questions, so nothing is lost by admitting it.
 */
export function PersonaDeclareView({ onDeclare, onGuide, ui }: PersonaDeclareViewProps) {
  return (
    <main className="flex flex-1 flex-col justify-center bg-page-bg px-safe py-10 text-page-ink" id="main-content">
      <div className="mx-auto w-full max-w-2xl py-4">
        <h1 className="font-black text-3xl leading-tight">{ui.declareTitle}</h1>
        <p className="mt-4 text-page-ink-soft leading-8">{ui.declareBody}</p>

        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PERSONA_CODES.map((code) => (
            <button
              className={cn(
                'min-h-13 rounded-2xl border border-page-border bg-page-surface font-black text-base tabular-nums transition-colors hover:border-page-accent hover:bg-page-accent/8 hover:text-page-accent-strong',
                FOCUS_CLASS_NAME,
              )}
              key={code}
              onClick={() => onDeclare(code)}
              type="button"
            >
              {code}
            </button>
          ))}
        </div>

        {/* '모름' used to end the branch here. It now opens four self-image questions instead, because the
            comparison is worth more than the twenty seconds and a reader who does not know four letters is not
            a reader with nothing to say about themselves. There is no third choice: an opt-out beside this one
            would be offering the dead end back, and it would cost a report section to save twenty seconds. */}
        <button
          className={cn(
            'mt-3 min-h-14 w-full rounded-2xl border border-page-border bg-page-surface px-5 text-left font-bold text-page-ink transition-colors hover:border-page-accent hover:text-page-accent-strong',
            FOCUS_CLASS_NAME,
          )}
          onClick={onGuide}
          type="button"
        >
          {ui.declareUnknownLabel}
          <span className="mt-0.5 block font-medium text-page-ink-muted text-xs">{ui.declareUnknownHint}</span>
        </button>
      </div>
    </main>
  )
}
