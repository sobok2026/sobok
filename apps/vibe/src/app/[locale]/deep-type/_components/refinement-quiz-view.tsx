'use client'

import type { AssessmentProfile, ItemAnswer } from '@deep-type/model'
import { REFINEMENT_PRESENTATION } from '@deep-type/presentation'
import { useState } from 'react'

import { postRefinement } from '../_lib/api'
import type { DeepTypeContent } from '../_lib/types'
import { QuizView } from './quiz-view'

type RefinementQuizViewProps = {
  accessToken: string
  content: DeepTypeContent
  onComplete: (profile: AssessmentProfile) => void
}

export function RefinementQuizView({ accessToken, content, onComplete }: RefinementQuizViewProps) {
  const [answers, setAnswers] = useState<ItemAnswer[]>([])
  const [status, setStatus] = useState<'answering' | 'submitting' | 'error'>('answering')
  const item = REFINEMENT_PRESENTATION[answers.length]
  const paywall = content.paywall

  async function answer(nextAnswer: ItemAnswer) {
    const nextAnswers = [...answers, nextAnswer]
    if (nextAnswers.length < REFINEMENT_PRESENTATION.length) {
      setAnswers(nextAnswers)
      setStatus('answering')
      return
    }

    setStatus('submitting')
    try {
      const result = await postRefinement(accessToken, nextAnswers)
      onComplete(result.profile)
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
        progressLabel={`${paywall.refinementStepLabel} · ${answers.length + 1} / ${REFINEMENT_PRESENTATION.length}`}
        progressPercent={Math.round(((answers.length + 1) / REFINEMENT_PRESENTATION.length) * 100)}
        question={content.questions[item.id]}
      />
    </div>
  )
}
