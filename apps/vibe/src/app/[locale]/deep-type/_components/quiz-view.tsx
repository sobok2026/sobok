'use client'

import { ArrowLeft } from '@mynaui/icons-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import { interpolate, type TemplateTokens } from '../_lib/template'
import type { Answer, PickQuestionContent, QuestionDef, SliderQuestionContent } from '../_lib/types'
import { isSliderQuestion } from '../_lib/types'

type QuizViewProps = {
  content: Record<string, PickQuestionContent | SliderQuestionContent>
  onAnswer: (answer: Answer) => void
  onBack?: () => void
  progressLabel: string
  progressPercent: number
  question: QuestionDef
  tokens: TemplateTokens
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export function QuizView({
  content,
  onAnswer,
  onBack,
  progressLabel,
  progressPercent,
  question,
  tokens,
}: QuizViewProps) {
  const [sliderValue, setSliderValue] = useState(50)
  const questionContent = content[question.id]

  if (!questionContent) {
    return null
  }

  const scene = questionContent.scene ? interpolate(questionContent.scene, tokens) : undefined
  const text = interpolate(questionContent.text, tokens)

  return (
    <section className="flex flex-1 flex-col justify-center px-safe py-10 sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-6">
          <p className="text-page-ink/48 text-xs">{progressLabel}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-page-soft">
            <div
              className="h-full rounded-full bg-page-accent transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-4xl border border-page-border bg-page-surface p-6 shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-8">
          {scene ? <p className="font-bold text-page-accent text-sm">{scene}</p> : null}
          <h1 className="mt-2 font-black text-2xl leading-snug break-keep">{text}</h1>

          {isSliderQuestion(question) ? (
            <SliderAnswer
              content={questionContent as SliderQuestionContent}
              onSubmit={() => onAnswer({ kind: 'slider', questionId: question.id, value: sliderValue })}
              onValueChange={setSliderValue}
              tokens={tokens}
              value={sliderValue}
            />
          ) : (
            <PickAnswer
              content={questionContent as PickQuestionContent}
              onSelect={(optionIndex) => onAnswer({ kind: 'pick', optionIndex, questionId: question.id })}
              tokens={tokens}
            />
          )}
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
            이전
          </button>
        ) : null}
      </div>
    </section>
  )
}

function PickAnswer({
  content,
  onSelect,
  tokens,
}: {
  content: PickQuestionContent
  onSelect: (optionIndex: number) => void
  tokens: TemplateTokens
}) {
  return (
    <div className="mt-6 grid gap-3">
      {content.options.map((label, index) => (
        <button
          className={cn(
            'rounded-3xl border border-page-border bg-white p-4 text-left font-bold leading-6 transition hover:border-page-accent/50 hover:bg-page-soft/50',
            focusClassName,
          )}
          key={label}
          onClick={() => onSelect(index)}
          type="button"
        >
          {interpolate(label, tokens)}
        </button>
      ))}
    </div>
  )
}

function SliderAnswer({
  content,
  onSubmit,
  onValueChange,
  tokens,
  value,
}: {
  content: SliderQuestionContent
  onSubmit: () => void
  onValueChange: (value: number) => void
  tokens: TemplateTokens
  value: number
}) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between text-page-ink/58 text-sm">
        <span>{interpolate(content.lo, tokens)}</span>
        <span>{interpolate(content.hi, tokens)}</span>
      </div>
      <input
        className="mt-3 h-9 w-full accent-page-accent"
        max={100}
        min={0}
        onChange={(event) => onValueChange(Number(event.target.value))}
        type="range"
        value={value}
      />
      <p className="mt-1 text-center font-black text-2xl text-page-accent">{value}</p>
      <button
        className={cn(
          'mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-page-ink font-black text-sm text-white transition-colors hover:bg-page-ink/92',
          focusClassName,
        )}
        onClick={onSubmit}
        type="button"
      >
        다음
      </button>
    </div>
  )
}
