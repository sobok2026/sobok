'use client'

import type { OptionIndex } from '@deep-type/model'
import { ArrowLeft } from '@mynaui/icons-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { FOCUS_CLASS_NAME } from '../../../../components/focus'
import { type ProgressSegment, QuizProgress } from './quiz-progress'

type QuizViewProps = {
  backLabel: string
  /** Rendered above the card, in the flow of the same screen. The free run uses it for its one reveal. */
  banner?: ReactNode
  hint?: string
  onAnswer: (optionIndex: OptionIndex) => void
  onBack?: () => void
  progress: { answered: number; segments: readonly ProgressSegment[] }
  /**
   * Every scored item is four options, but the option count is read off the question rather than fixed here.
   * The self-image branch asks four binary questions through this same view, and the alternative was a second
   * component that looks like this one until someone edits one of them.
   */
  question: { options: readonly string[]; prompt: string }
}

/**
 * Every item in this instrument is one stem over four options, whether the four are an agreement ladder or six
 * work facets competing for one pick. So this reports the option index and nothing else, and the caller turns
 * that index into the answer its block is typed for — `value: index + 1` for Likert, `optionIndex` for forced
 * choice. Two components would have meant two layouts drifting apart inside a run that must not feel like it
 * changed screens, and no type safety is lost by sharing the view: it is enforced one level up, where the answer
 * is built and where `ItemAnswer` and `WorkAnswer` are already impossible to confuse.
 */
export function QuizView({ backLabel, banner, hint, onAnswer, onBack, progress, question }: QuizViewProps) {
  return (
    <section className="flex flex-1 flex-col justify-center px-safe py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <QuizProgress answered={progress.answered} segments={progress.segments} />

        {banner}

        <div className="mt-6 rounded-3xl border border-page-border bg-page-surface p-6 shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:rounded-4xl sm:p-8">
          <h1 className="font-black text-xl leading-snug">{question.prompt}</h1>
          <div className="mt-7 grid gap-3">
            {question.options.map((option, index) => (
              <button
                className={cn(
                  'min-h-13 rounded-3xl border border-page-border bg-white p-4 text-left font-bold leading-6 transition-colors hover:border-page-accent/50 hover:bg-page-soft/50',
                  FOCUS_CLASS_NAME,
                )}
                key={option}
                onClick={() => onAnswer(index as OptionIndex)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
          {hint ? <p className="mt-5 text-page-ink-muted text-xs leading-5">{hint}</p> : null}
        </div>

        <button
          className={cn(
            'mt-5 inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-bold text-page-ink-muted text-sm transition-colors enabled:hover:text-page-ink disabled:cursor-not-allowed disabled:opacity-40',
            FOCUS_CLASS_NAME,
          )}
          disabled={!onBack}
          onClick={onBack}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" stroke={1.8} />
          {backLabel}
        </button>
      </div>
    </section>
  )
}
