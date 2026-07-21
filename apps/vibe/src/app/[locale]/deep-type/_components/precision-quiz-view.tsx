'use client'

import { useState } from 'react'

import { postPrecision } from '../_lib/api'
import { selectPrecision } from '../_lib/precision'
import type { DeepTypeContent, ItemAnswer } from '../_lib/types'
import { QuizView } from './quiz-view'

type PrecisionQuizViewProps = {
  accessToken: string
  content: DeepTypeContent
  gemCode: string
  innerCode: string
  onComplete: () => void
}

// The paid 심연 quiz. Items are selected from the bank by the free-tier poles (adaptive), answers are
// collected raw and submitted once to /precision where the server re-scores them (the client never scores
// the paid layer). Submission is best-effort — on failure we still advance to the report (it generates
// from codes only), so a transient error can't strand a paying user.
export function PrecisionQuizView({ accessToken, content, gemCode, innerCode, onComplete }: PrecisionQuizViewProps) {
  const paywall = content.paywall
  const [items] = useState(() => selectPrecision(innerCode, gemCode))
  const [answers, setAnswers] = useState<ItemAnswer[]>([])
  const [submitting, setSubmitting] = useState(false)

  async function handleAnswer(answer: ItemAnswer) {
    const next = [...answers, answer]
    setAnswers(next)
    if (next.length >= items.length) {
      setSubmitting(true)
      await postPrecision(accessToken, next).catch(() => undefined)
      onComplete()
    }
  }

  if (submitting || answers.length >= items.length) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-page-bg px-safe py-16 text-center text-page-ink">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-page-accent/20 border-t-page-accent" />
        <p className="mt-6 font-bold text-page-ink/64">{paywall.precisionSubmitting}</p>
      </main>
    )
  }

  const index = answers.length
  const item = items[index]

  return (
    <QuizView
      content={content.precisionQuestions}
      item={item}
      key={item.id}
      onAnswer={handleAnswer}
      onBack={index > 0 ? () => setAnswers(answers.slice(0, -1)) : undefined}
      progressLabel={`${paywall.precisionStepLabel} · ${index + 1} / ${items.length}`}
      progressPercent={Math.round((index / items.length) * 100)}
    />
  )
}
