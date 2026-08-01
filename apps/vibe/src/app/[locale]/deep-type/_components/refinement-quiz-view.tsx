'use client'

import type { AgreementValue, ItemAnswer, OptionIndex, WorkAnswer } from '@deep-type/model'
import type { Locale } from '@sobok/domain/locale'
import { useEffect, useState } from 'react'

import { loadPaidQuestions } from '../_content/paid-questions'
import { useRefinementDraft } from '../_hooks/use-refinement-draft'
import { postRefinement } from '../_lib/api'
import { PAID_RUN, PAID_SEGMENTS } from '../_lib/paid-run'
import { isRunComplete, paidCount, resumeWorkAnswers } from '../_lib/refinement-run'
import type { DeepTypeContent, QuestionContent } from '../_lib/types'
import { QuizView } from './quiz-view'

type RefinementQuizViewProps = {
  accessToken: string
  content: DeepTypeContent
  locale: Locale
  // No payload: the refined profile is paid content and reaches the client through the report poll.
  onComplete: () => void
  /** The free drain block, from the sitting that bought this. Empty in a tab reached by e-mail re-open. */
  freeWorkAnswers: readonly WorkAnswer[]
}

export function RefinementQuizView({
  accessToken,
  content,
  freeWorkAnswers,
  locale,
  onComplete,
}: RefinementQuizViewProps) {
  const paywall = content.paywall
  const { save, state: draft } = useRefinementDraft(accessToken)
  // The paid question text is not in this bundle. It arrives as its own chunk so the free static export cannot
  // carry it (MIGRATION L6), which means the block waits on a fetch the free run never had to make.
  const [questions, setQuestions] = useState<Record<string, QuestionContent> | null>(null)
  const [answers, setAnswers] = useState<readonly ItemAnswer[]>([])
  const [work, setWork] = useState<readonly WorkAnswer[]>([])
  const [restored, setRestored] = useState(false)
  const [status, setStatus] = useState<'answering' | 'submitting' | 'error'>('answering')

  useEffect(() => {
    let live = true
    loadPaidQuestions(locale).then((loaded) => {
      if (live) {
        setQuestions(loaded)
      }
    })
    return () => {
      live = false
    }
  }, [locale])

  useEffect(() => {
    if (restored) {
      return
    }
    // A failed load still has to seed the free drain block. Nothing resumes, but the submit at the end wants
    // all twenty-four forced choices either way, and leaving the buffer empty here made a lost draft request
    // cost the buyer the whole block thirty-seven questions later.
    if (draft.phase === 'failed') {
      setWork(resumeWorkAnswers({ parked: [], server: [], sitting: freeWorkAnswers }))
      setRestored(true)
      return
    }
    if (draft.phase !== 'ready') {
      return
    }
    const restoredAnswers = draft.draft.answers
    // Three sources, one rule, tested in `_lib/refinement-run.ts`. `freeWorkAnswers` is this tab's sitting and
    // is last because it is the one a second browser never has.
    const restoredWork = resumeWorkAnswers({
      parked: draft.draft.workAnswers,
      server: draft.draft.freeWorkAnswers,
      sitting: freeWorkAnswers,
    })

    setAnswers(restoredAnswers)
    setWork(restoredWork)
    setRestored(true)

    // A complete buffer can come back: the last answer parks before the submit that carries it, so a tab
    // closed or a network dropped in that gap resumes with thirty-seven answers and nothing left to ask.
    // Submitting here is what keeps the run off a step that does not exist.
    if (isRunComplete(restoredAnswers, restoredWork)) {
      void submit(restoredAnswers, restoredWork)
    }
  }, [draft, freeWorkAnswers, restored])

  const index = paidCount(answers, work)
  const complete = isRunComplete(answers, work)
  const step = PAID_RUN[index]

  const segments = PAID_SEGMENTS.map((segment) => ({
    count: segment.count,
    label: 'kind' in segment ? paywall.refinementStepLabel : paywall.workDimensions[segment.dimension],
  }))

  async function submit(finalAnswers: readonly ItemAnswer[], finalWork: readonly WorkAnswer[]) {
    setStatus('submitting')
    try {
      await postRefinement(accessToken, [...finalAnswers], [...finalWork])
      onComplete()
    } catch {
      setStatus('error')
    }
  }

  function answer(optionIndex: OptionIndex) {
    if (!step) {
      return
    }

    const nextAnswers =
      step.kind === 'likert' ? [...answers, { itemId: step.id, value: (optionIndex + 1) as AgreementValue }] : answers
    const nextWork = step.kind === 'work' ? [...work, { itemId: step.id, optionIndex }] : work

    setAnswers(nextAnswers)
    setWork(nextWork)
    save({ answers: [...nextAnswers], workAnswers: [...nextWork] })

    if (isRunComplete(nextAnswers, nextWork)) {
      void submit(nextAnswers, nextWork)
    } else {
      setStatus('answering')
    }
  }

  function back() {
    if (!step || index === 0) {
      return
    }
    const previous = PAID_RUN[index - 1]
    const nextAnswers = previous?.kind === 'likert' ? answers.slice(0, -1) : answers
    const nextWork = previous?.kind === 'work' ? work.slice(0, -1) : work
    setAnswers(nextAnswers)
    setWork(nextWork)
    save({ answers: [...nextAnswers], workAnswers: [...nextWork] })
  }

  if (status === 'submitting') {
    return <Waiting message={paywall.refinementSubmitting} />
  }

  // Before the step lookup, not after it. A failed submit happens at index 37, where `PAID_RUN[index]` is
  // undefined and the missing-step guard below would have returned null — a blank screen handed to someone who
  // has paid, finished the block and lost their connection on the last request. The answers are still in
  // memory, so the retry needs nothing from the network to be worth offering.
  if (status === 'error') {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-background px-safe py-16 text-center text-foreground">
        <div className="w-full max-w-sm" role="alert">
          <h1 className="font-black text-xl">{paywall.refinementFailedTitle}</h1>
          <p className="mt-3 break-prose text-foreground-secondary leading-7">{paywall.refinementFailedBody}</p>
        </div>
        <button
          className="mt-6 inline-flex min-h-13 w-full max-w-sm items-center justify-center rounded-full bg-accent px-6 font-black text-sm text-white transition-colors hover:bg-accent/92 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand"
          onClick={() => void submit(answers, work)}
          type="button"
        >
          {paywall.refinementRetryCta}
        </button>
      </main>
    )
  }

  // A failed draft load falls through rather than blocking. There is nothing to resume that is worth refusing to
  // start over: the buyer keeps answering, every answer still tries to park, and the worst case is the sitting
  // they were already going to have.
  if (draft.phase === 'loading' || !questions || complete) {
    return <Waiting message={paywall.processing} />
  }

  const question = step && questions[step.id]
  if (!step || !question) {
    return null
  }

  return (
    <div className="flex flex-1 flex-col">
      {draft.phase === 'ready' && draft.resumed ? (
        <p className="bg-surface-2 px-safe py-3 text-center font-bold text-foreground-secondary text-sm">
          {paywall.resumeNote}
        </p>
      ) : null}
      <QuizView
        backLabel={content.ui.backCta}
        key={step.id}
        onAnswer={answer}
        onBack={index > 0 ? back : undefined}
        progress={{ answered: index, segments }}
        question={question}
      />
    </div>
  )
}

function Waiting({ message }: { message: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-background px-safe py-16 text-center text-foreground">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-brand/20 border-t-brand motion-reduce:animate-none"
        role="status"
      />
      <p className="mt-6 font-bold text-foreground-secondary">{message}</p>
    </main>
  )
}
