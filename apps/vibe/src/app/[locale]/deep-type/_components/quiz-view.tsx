'use client'

import type { AgreementValue, ItemAnswer } from '@deep-type/model'
import { ArrowLeft } from '@mynaui/icons-react'
import { cn } from '@/utils/cn'

type QuizViewProps = {
  answerScale: readonly [string, string, string, string]
  backLabel: string
  itemId: string
  onAnswer: (answer: ItemAnswer) => void
  onBack?: () => void
  progressLabel: string
  progressPercent: number
  question: string
}

const AGREEMENT_VALUES = [1, 2, 3, 4] as const satisfies readonly AgreementValue[]
const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export function QuizView({
  answerScale,
  backLabel,
  itemId,
  onAnswer,
  onBack,
  progressLabel,
  progressPercent,
  question,
}: QuizViewProps) {
  return (
    <section className="flex flex-1 flex-col justify-center px-safe py-10 sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-6">
          <p className="text-page-ink/48 text-xs">{progressLabel}</p>
          <div
            aria-label={progressLabel}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progressPercent}
            className="mt-2 h-2 overflow-hidden rounded-full bg-page-soft"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-page-accent transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-4xl border border-page-border bg-page-surface p-6 shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-8">
          <h1 className="text-balance font-black text-2xl leading-snug">{question}</h1>
          <div className="mt-7 grid gap-3">
            {AGREEMENT_VALUES.map((value, index) => (
              <button
                className={cn(
                  'min-h-13 rounded-3xl border border-page-border bg-white p-4 text-left font-bold leading-6 transition-colors hover:border-page-accent/50 hover:bg-page-soft/50',
                  focusClassName,
                )}
                key={value}
                onClick={() => onAnswer({ itemId, value })}
                type="button"
              >
                {answerScale[index]}
              </button>
            ))}
          </div>
        </div>

        {onBack ? (
          <button
            className={cn(
              'mt-5 inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-bold text-page-ink/58 text-sm transition-colors hover:text-page-ink',
              focusClassName,
            )}
            onClick={onBack}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" stroke={1.8} />
            {backLabel}
          </button>
        ) : null}
      </div>
    </section>
  )
}
