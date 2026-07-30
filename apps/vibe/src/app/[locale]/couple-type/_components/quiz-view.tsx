import { ArrowLeft, ArrowRight, HeartWaves } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import { cn } from '@/utils/cn'

import type { AxisValue, CoupleTypeAnswers, CoupleTypeContent } from '../_lib/types'
import { MiniStat } from './mini-stat'

type QuizViewProps = {
  answers: CoupleTypeAnswers
  axisDefinitions: CoupleTypeContent['axisDefinitions']
  /** Held by the flow, not here: a run that cannot be resumed at the question it stopped at is not resumable. */
  currentIndex: number
  locale: Locale
  onBack: () => void
  onNext: () => void
  onSelect: (questionId: string, value: AxisValue) => void
  questions: CoupleTypeContent['questions']
  ui: CoupleTypeContent['ui']
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export function QuizView({
  answers,
  axisDefinitions,
  currentIndex,
  locale,
  onBack,
  onNext,
  onSelect,
  questions,
  ui,
}: QuizViewProps) {
  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const selectedValue = answers[currentQuestion.id]
  const answeredCount = Object.keys(answers).length
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100)
  const isLastQuestion = currentIndex === totalQuestions - 1
  const isComplete = answeredCount === totalQuestions
  const axis = axisDefinitions[currentQuestion.axis]
  const canGoNext = Boolean(selectedValue)
  const keepHeadingBreakClassName = locale === 'ko' ? 'break-keep' : undefined

  const nextButtonLabel =
    isLastQuestion && selectedValue && isComplete
      ? ui.resultButton
      : selectedValue
        ? ui.nextButton
        : ui.selectAnswerButton

  return (
    <section className="flex flex-1 flex-col justify-center px-safe py-10 sm:py-16">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="hidden max-w-3xl lg:block">
          <p className="inline-flex items-center gap-2 rounded-full bg-page-ink px-4 py-2 font-bold text-sm text-white">
            <HeartWaves aria-hidden="true" className="h-4 w-4 text-page-accent" stroke={1.8} />
            {ui.heroEyebrow}
          </p>
          <h1
            className={cn(
              'mt-6 font-black text-4xl leading-tight lg:text-[2.8rem] xl:text-6xl',
              keepHeadingBreakClassName,
            )}
          >
            {ui.heroTitle}
          </h1>
          <p className="mt-5 text-lg text-page-ink/66 leading-8">{ui.heroDescription}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <MiniStat
              label={ui.questionCountLabel}
              value={formatText(ui.questionCountValue, { count: totalQuestions })}
            />
            <MiniStat label={ui.resultCountLabel} value={ui.resultCountValue} />
          </div>
        </div>

        <form className="rounded-3xl sm:rounded-4xl border-page-border sm:border sm:bg-page-surface sm:p-6 sm:shadow-[0_32px_110px_rgba(36,22,23,0.12)]">
          <div className="flex flex-col gap-4 border-page-border border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black text-page-accent text-sm">
                {String(currentIndex + 1).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
              </p>
              <p className="mt-1 font-bold text-page-ink/58 text-sm">{axis.label}</p>
            </div>
            <div className="min-w-40">
              <div className="flex items-center justify-between text-page-ink/48 text-xs">
                <span>{formatText(ui.answeredCount, { count: answeredCount })}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-page-soft">
                <div
                  className="h-full rounded-full bg-page-accent transition-[width] duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <fieldset className="mt-7">
            <legend className={cn('font-black text-2xl leading-snug', keepHeadingBreakClassName)}>
              {currentQuestion.question}
            </legend>
            <div className="mt-6 grid gap-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedValue === option.value

                return (
                  <label
                    className={cn(
                      'group flex cursor-pointer items-start gap-4 rounded-3xl border p-5 transition',
                      isSelected
                        ? 'border-page-accent bg-[#fff3f0] shadow-[0_18px_50px_rgba(255,77,109,0.16)]'
                        : 'border-page-border bg-white hover:border-page-accent/50 hover:bg-page-soft/50',
                    )}
                    key={option.value}
                  >
                    <input
                      checked={isSelected}
                      className="mt-1 h-5 w-5 shrink-0 accent-page-accent"
                      name={currentQuestion.id}
                      onChange={() => onSelect(currentQuestion.id, option.value)}
                      type="radio"
                      value={option.value}
                    />
                    <span>
                      <span className="block font-black text-lg leading-7">{option.label}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              className={cn(
                'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-page-border bg-white px-5 font-bold text-page-ink/70 text-sm transition-colors hover:text-page-ink',
                focusClassName,
              )}
              onClick={onBack}
              type="button"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" stroke={1.8} />
              {ui.previousButton}
            </button>
            <button
              className={cn(
                'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-page-ink px-6 font-black text-sm text-white transition-colors enabled:hover:bg-page-ink/92 disabled:cursor-not-allowed disabled:opacity-45',
                focusClassName,
              )}
              disabled={!canGoNext}
              onClick={onNext}
              type="button"
            >
              {nextButtonLabel}
              <ArrowRight aria-hidden="true" className="h-4 w-4" stroke={1.8} />
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

function formatText(template: string, values: Record<string, number | string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}
