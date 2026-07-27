'use client'

import type { ItemAnswer, WorkAnswer } from '@deep-type/model'
import { PAID_LIKERT_PRESENTATION } from '@deep-type/presentation'
import { useState } from 'react'

import { postRefinement } from '../_lib/api'
import type { DeepTypeContent } from '../_lib/types'
import { QuizView } from './quiz-view'

type RefinementQuizViewProps = {
  accessToken: string
  content: DeepTypeContent
  // No payload: the refined profile is paid content and reaches the client through the report poll.
  onComplete: () => void
  /** The whole forced-choice set the refined tally needs, free drain block included. */
  workAnswers: WorkAnswer[]
}

export function RefinementQuizView({ accessToken, content, onComplete, workAnswers }: RefinementQuizViewProps) {
  const [answers, setAnswers] = useState<ItemAnswer[]>([])
  const [status, setStatus] = useState<'answering' | 'submitting' | 'error'>('answering')
  const item = PAID_LIKERT_PRESENTATION[answers.length]
  const paywall = content.paywall

  async function answer(nextAnswer: ItemAnswer) {
    const nextAnswers = [...answers, nextAnswer]
    if (nextAnswers.length < PAID_LIKERT_PRESENTATION.length) {
      setAnswers(nextAnswers)
      setStatus('answering')
      return
    }

    setStatus('submitting')
    try {
      await postRefinement(accessToken, nextAnswers, workAnswers)
      onComplete()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'submitting') {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-page-bg px-safe py-16 text-center text-page-ink">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-page-accent/20 border-t-page-accent motion-reduce:animate-none" />
        <p className="mt-6 font-bold text-page-ink/64">{paywall.refinementSubmitting}</p>
      </main>
    )
  }

  if (!item) {
    return null
  }

  return (
    <div className="flex flex-1 flex-col">
      {status === 'error' ? (
        <p className="bg-page-accent/10 px-safe py-3 text-center font-bold text-page-accent text-sm" role="alert">
          {paywall.errorGeneric}
        </p>
      ) : null}
      <QuizView
        backLabel={content.ui.backCta}
        itemId={item.id}
        onAnswer={answer}
        onBack={answers.length > 0 ? () => setAnswers((current) => current.slice(0, -1)) : undefined}
        progressLabel={`${paywall.refinementStepLabel} · ${answers.length + 1} / ${PAID_LIKERT_PRESENTATION.length}`}
        progressPercent={Math.round(((answers.length + 1) / PAID_LIKERT_PRESENTATION.length) * 100)}
        question={content.questions[item.id]}
      />
    </div>
  )
}
