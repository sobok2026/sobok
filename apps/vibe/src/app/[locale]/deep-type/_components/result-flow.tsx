'use client'

import type { AssessmentProfile } from '@deep-type/model'
import { scoreBaseAssessment } from '@deep-type/scoring'
import type { Locale } from '@sobok/domain/locale'
import { useRouter } from 'next/navigation'
import { useEffect, useReducer, useState } from 'react'

import { assertNever } from '../_lib/assert'
import { clearSitting, type DeepTypeSitting, readSitting } from '../_lib/sitting'
import type { DeepTypeContent } from '../_lib/types'
import { DynamicReportView } from './dynamic-report-view'
import { IntroView } from './intro-view'
import { PaywallView } from './paywall-view'
import { RefinementQuizView } from './refinement-quiz-view'
import { ReportView } from './report-view'

type ResultState =
  | { phase: 'report' }
  | { phase: 'paywall' }
  | { accessToken: string; phase: 'refinementIntro' }
  | { accessToken: string; phase: 'refinement' }
  | { accessToken: string; phase: 'dynamicReport' }

type ResultAction =
  | { type: 'UNLOCK' }
  | { type: 'CLOSE_PAYWALL' }
  | { accessToken: string; type: 'PAID' }
  | { type: 'BEGIN' }
  | { type: 'REFINEMENT_DONE' }

function resultReducer(state: ResultState, action: ResultAction): ResultState {
  switch (action.type) {
    case 'UNLOCK':
      return state.phase === 'report' ? { phase: 'paywall' } : state
    case 'CLOSE_PAYWALL':
      return state.phase === 'paywall' ? { phase: 'report' } : state
    case 'PAID':
      return state.phase === 'paywall' ? { accessToken: action.accessToken, phase: 'refinementIntro' } : state
    case 'BEGIN':
      return state.phase === 'refinementIntro' ? { accessToken: state.accessToken, phase: 'refinement' } : state
    case 'REFINEMENT_DONE':
      return state.phase === 'refinement' ? { accessToken: state.accessToken, phase: 'dynamicReport' } : state
    default:
      return state
  }
}

type ResultFlowProps = {
  content: DeepTypeContent
  locale: Locale
}

export function ResultFlow({ content, locale }: ResultFlowProps) {
  const [sitting, setSitting] = useState<DeepTypeSitting | null>(null)
  const [profile, setProfile] = useState<AssessmentProfile | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [state, dispatch] = useReducer(resultReducer, { phase: 'report' })
  const router = useRouter()

  useEffect(() => {
    const stored = readSitting()

    if (!stored || stored.likert.length === 0) {
      router.replace(`/${locale}/deep-type/test`)
      return
    }

    try {
      setProfile(scoreBaseAssessment(stored.likert, stored.work, stored.declaredPersona))
      setSitting(stored)
      setLoaded(true)
    } catch {
      // An answer set the current instrument cannot score. Sending the visitor back to the test would loop, so
      // the landing page is the exit until the sitting carries every part scoring needs.
      router.replace(`/${locale}/deep-type`)
    }
  }, [locale, router])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [state.phase])

  function handleRestart() {
    clearSitting()
    router.push(`/${locale}/deep-type/test`)
  }

  if (!loaded || !sitting || !profile) {
    return (
      <main className="flex flex-1 items-center justify-center bg-page-bg px-safe py-16 text-page-ink">
        <div className="h-12 w-12 rounded-full border-4 border-page-accent/20 border-t-page-accent" />
      </main>
    )
  }

  switch (state.phase) {
    case 'report':
      return (
        <ReportView
          content={content}
          locale={locale}
          onRestart={handleRestart}
          onUnlock={() => dispatch({ type: 'UNLOCK' })}
          profile={profile}
        />
      )
    case 'paywall':
      return (
        <PaywallView
          content={content}
          freeResult={{
            answers: sitting.likert,
            declaredPersona: sitting.declaredPersona,
            locale,
            workAnswers: sitting.work,
          }}
          onClose={() => dispatch({ type: 'CLOSE_PAYWALL' })}
          onPaid={(accessToken) => dispatch({ accessToken, type: 'PAID' })}
        />
      )
    case 'refinementIntro':
      return (
        <IntroView
          body={content.paywall.refinementIntroBody}
          cta={content.paywall.refinementIntroCta}
          hint={content.paywall.refinementIntroHint}
          onNext={() => dispatch({ type: 'BEGIN' })}
          title={content.paywall.refinementIntroTitle}
        />
      )
    case 'refinement':
      return (
        <RefinementQuizView
          accessToken={state.accessToken}
          content={content}
          onComplete={() => dispatch({ type: 'REFINEMENT_DONE' })}
          workAnswers={sitting.work}
        />
      )
    case 'dynamicReport':
      return (
        <DynamicReportView
          accessToken={state.accessToken}
          content={content}
          fallbackProfile={profile}
          locale={locale}
          onRestart={handleRestart}
        />
      )
    default:
      return assertNever(state)
  }
}
