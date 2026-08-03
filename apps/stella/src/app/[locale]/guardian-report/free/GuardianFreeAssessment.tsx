'use client'

import { track } from '@sobok/analytics/browser'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import Starfield from '@/components/Starfield'
import {
  GUARDIAN_REPORT_UI,
  type GuardianPreviewMovement,
  type GuardianPreviewTone,
} from '@/content/guardian-report-ui'
import {
  GuardianCheckoutStorageError,
  guardianReportPaths,
  readGuardianPreviewSession,
  storeGuardianPreviewSession,
} from '@/lib/guardian-paid'

import styles from '../guardian-report.module.css'

type Step = 'tone' | 'movement'

export default function GuardianFreeAssessment({ locale }: { locale: Locale }) {
  const content = GUARDIAN_REPORT_UI[locale].landing
  const paths = guardianReportPaths(locale)
  const router = useRouter()
  const [step, setStep] = useState<Step>('tone')
  const [tone, setTone] = useState<GuardianPreviewTone | null>(null)
  const [movement, setMovement] = useState<GuardianPreviewMovement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = readGuardianPreviewSession(locale)
    if (stored) {
      setTone(stored.tone)
      setMovement(stored.movement)
    }
    track('guardian_preview_started', { locale })
  }, [locale])

  function continueFromTone() {
    if (!tone) {
      return
    }
    setError(null)
    setStep('movement')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function showResult() {
    if (!tone || !movement) {
      setError(content.errors.answerRequired)
      return
    }

    try {
      storeGuardianPreviewSession({ locale, tone, movement, completedAt: Date.now() })
      track('guardian_preview_complete', { locale, movement, tone })
      router.push(paths.freeResult)
    } catch (caught) {
      setError(caught instanceof GuardianCheckoutStorageError ? content.errors.storage : content.errors.genericCheckout)
    }
  }

  const question = step === 'tone' ? content.quiz.tone : content.quiz.movement
  const selected = step === 'tone' ? tone : movement
  const current = step === 'tone' ? 1 : 2

  return (
    <main className="relative min-h-dvh bg-night-sky px-3 pb-[calc(5rem+var(--safe-area-bottom))] pt-[calc(5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-60" />
      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <Link
          className="inline-flex items-center gap-2 text-xs text-foreground-subtle transition hover:text-white"
          href={paths.landing}
        >
          <span aria-hidden>←</span>
          {content.navigation.backToLanding}
        </Link>

        <section
          aria-labelledby={`preview-question-${current}`}
          className="mt-7 rounded-[2rem] border border-white/10 bg-[#120b24]/88 p-5 shadow-2xl backdrop-blur sm:mt-12 sm:p-8"
        >
          <header className="mb-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">{content.quiz.eyebrow}</p>
            <h1 className="mt-3 text-2xl font-black text-white">{content.quiz.title}</h1>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.quiz.body}</p>
          </header>

          <div className="flex items-center justify-between text-[11px] font-semibold text-foreground-subtle">
            <span>{question.label}</span>
            <span>{content.quiz.position(current, 2)}</span>
          </div>
          <div aria-hidden className="mt-3 grid grid-cols-2 gap-2">
            {[1, 2].map((position) => (
              <span
                className={`h-1 rounded-full ${position <= current ? 'bg-pink-200' : 'bg-white/8'}`}
                key={position}
              />
            ))}
          </div>
          <h2 className="mt-7 text-balance text-2xl font-black leading-9 text-white" id={`preview-question-${current}`}>
            {question.prompt}
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">{question.supportingText}</p>
          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {question.options.map((option) => (
              <button
                aria-pressed={selected === option.id}
                className={`${styles.quizOption} ${selected === option.id ? styles.quizOptionSelected : ''} rounded-2xl px-4 py-3 text-left text-sm leading-6 text-foreground-secondary transition`}
                key={option.id}
                onClick={() => {
                  setError(null)
                  if (step === 'tone') {
                    setTone(option.id as GuardianPreviewTone)
                  } else {
                    setMovement(option.id as GuardianPreviewMovement)
                  }
                }}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>

          {error && (
            <p aria-live="polite" className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-xs leading-5 text-pink-200">
              {error}
            </p>
          )}

          <button
            className="mt-6 w-full rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!selected}
            onClick={step === 'tone' ? continueFromTone : showResult}
            type="button"
          >
            {step === 'tone' ? content.quiz.next : content.quiz.result}
          </button>
        </section>
      </div>
    </main>
  )
}
