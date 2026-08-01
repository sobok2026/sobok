'use client'

import type { FreeAssessmentProfile } from '@deep-type/model'
import { scoreBaseAssessment } from '@deep-type/scoring'
import type { Locale } from '@sobok/domain/locale'
import { useRouter } from 'next/navigation'
import { useEffect, useReducer, useState } from 'react'

import { assertNever } from '../_lib/assert'
import type { SettledPayment } from '../_lib/pending-checkout'
import { clearSitting, type DeepTypeSitting, readSitting } from '../_lib/sitting'
import type { DeepTypeContent } from '../_lib/types'
import { DynamicReportView } from './dynamic-report-view'
import { FreeResultView } from './free-result-view'
import { IntroView } from './intro-view'
import { PaidNotice } from './paid-notice'
import { PaywallView } from './paywall-view'
import { RefinementQuizView } from './refinement-quiz-view'

// The settled payment travels with every post-payment phase, because the report at the end of them prints its
// id as the order number. Carrying only the access token this far meant the one screen that owes the buyer a
// receipt was also the one screen that had thrown the receipt away.
type ResultState =
  | { phase: 'report' }
  | { phase: 'paywall' }
  | (SettledPayment & { phase: 'refinementIntro' })
  | (SettledPayment & { phase: 'refinement' })
  | (SettledPayment & { phase: 'dynamicReport' })

type ResultAction =
  | { type: 'UNLOCK' }
  | { type: 'CLOSE_PAYWALL' }
  | { payment: SettledPayment; type: 'PAID' }
  | { type: 'BEGIN' }
  | { type: 'REFINEMENT_DONE' }

function resultReducer(state: ResultState, action: ResultAction): ResultState {
  switch (action.type) {
    case 'UNLOCK':
      return state.phase === 'report' ? { phase: 'paywall' } : state
    case 'CLOSE_PAYWALL':
      return state.phase === 'paywall' ? { phase: 'report' } : state
    case 'PAID':
      return state.phase === 'paywall' ? { ...action.payment, phase: 'refinementIntro' } : state
    case 'BEGIN':
      return state.phase === 'refinementIntro' ? { ...state, phase: 'refinement' } : state
    case 'REFINEMENT_DONE':
      return state.phase === 'refinement' ? { ...state, phase: 'dynamicReport' } : state
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
  const [profile, setProfile] = useState<FreeAssessmentProfile | null>(null)
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
      <main className="flex flex-1 items-center justify-center bg-background px-safe py-16 text-foreground">
        <div className="h-12 w-12 rounded-full border-4 border-brand/20 border-t-brand" />
      </main>
    )
  }

  switch (state.phase) {
    case 'report':
      return (
        <FreeResultView
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
            personaSource: sitting.personaSource,
            workAnswers: sitting.work,
          }}
          onClose={() => dispatch({ type: 'CLOSE_PAYWALL' })}
          onPaid={(payment) => dispatch({ payment, type: 'PAID' })}
        />
      )
    case 'refinementIntro':
      return (
        <IntroView
          body={content.paywall.refinementIntroBody}
          cta={content.paywall.refinementIntroCta}
          hint={content.paywall.refinementIntroHint}
          notice={<PaidNotice content={content} locale={locale} payment={state} />}
          onNext={() => dispatch({ type: 'BEGIN' })}
          title={content.paywall.refinementIntroTitle}
        />
      )
    case 'refinement':
      return (
        <RefinementQuizView
          accessToken={state.accessToken}
          content={content}
          freeWorkAnswers={sitting.work}
          locale={locale}
          onComplete={() => dispatch({ type: 'REFINEMENT_DONE' })}
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
          orderId={state.paymentId}
        />
      )
    default:
      return assertNever(state)
  }
}
