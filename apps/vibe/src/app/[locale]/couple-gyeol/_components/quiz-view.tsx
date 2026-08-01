import { ArrowRight, HeartWaves } from '@mynaui/icons-react'
import { cn } from '@/utils/cn'
import { FOCUS_CLASS_NAME } from '../../../../components/focus'

import type { GyeolAnswers, GyeolContent, GyeolQuestionId } from '../_lib/types'

type QuizViewProps = {
  answers: GyeolAnswers
  content: GyeolContent
  currentIndex: number
  onBack: () => void
  onNext: () => void
  onSelect: (questionId: GyeolQuestionId, optionId: GyeolAnswers[keyof GyeolAnswers]) => void
}

export function QuizView({ answers, content, currentIndex, onBack, onNext, onSelect }: QuizViewProps) {
  const question = content.questions[currentIndex]
  const selectedAnswer = answers[question.id]
  const answeredCount = Object.keys(answers).length
  const progressPercent = Math.round((answeredCount / content.questions.length) * 100)
  const isLastQuestion = currentIndex === content.questions.length - 1
  const canGoNext = Boolean(selectedAnswer)
  const buttonLabel = isLastQuestion ? content.ui.resultButton : content.ui.nextButton

  return (
    <section className="flex flex-1 flex-col justify-center bg-background px-safe py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-4 py-4 sm:gap-8 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <aside className="rounded-3xl sm:rounded-4xl bg-foreground p-6 text-white shadow-[0_32px_110px_rgba(36,22,23,0.16)] sm:p-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-bold text-sm text-white/78">
            <HeartWaves aria-hidden="true" className="h-4 w-4 text-accent" stroke={1.8} />
            {content.ui.questionEyebrow}
          </p>
          <h1 className="mt-7 font-black text-4xl leading-tight tracking-tight sm:text-5xl">{content.ui.heroTitle}</h1>
          <p className="mt-5 text-white/68 leading-8">{content.ui.modelNotice}</p>
          <div className="mt-8">
            <div className="flex items-center justify-between font-bold text-sm text-white/60">
              <span>
                {formatText(content.ui.answeredCount, { count: answeredCount, total: content.questions.length })}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </aside>

        <form className="rounded-3xl sm:rounded-4xl border border-border bg-surface p-5 shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-7">
          <fieldset>
            <legend className="font-black text-xl leading-tight tracking-tight sm:text-3xl">{question.question}</legend>
            <div className="mt-5 grid gap-3 sm:mt-7">
              {question.options.map((option) => {
                const isSelected = selectedAnswer === option.id

                return (
                  <label
                    className={cn(
                      'group flex min-h-20 cursor-pointer items-center gap-4 rounded-3xl border p-5 transition',
                      isSelected
                        ? 'border-brand bg-[#fff3f0] shadow-[0_18px_50px_var(--accent-glow)]'
                        : 'border-border bg-white hover:border-brand/50 hover:bg-surface-2/50',
                    )}
                    key={option.id}
                  >
                    <input
                      checked={isSelected}
                      className="h-5 w-5 shrink-0 accent-brand"
                      name={question.id}
                      onChange={() => onSelect(question.id, option.id)}
                      type="radio"
                      value={option.id}
                    />
                    <span className="font-black text-lg leading-7">{option.label}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              className={cn(
                'inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white px-5 font-bold text-foreground-secondary text-sm transition-colors hover:text-foreground',
                FOCUS_CLASS_NAME,
              )}
              onClick={onBack}
              type="button"
            >
              {content.ui.backButton}
            </button>
            <button
              className={cn(
                'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 font-black text-sm text-white transition-colors enabled:hover:bg-foreground/92 disabled:cursor-not-allowed disabled:opacity-45',
                FOCUS_CLASS_NAME,
              )}
              disabled={!canGoNext}
              onClick={onNext}
              type="button"
            >
              {buttonLabel}
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
