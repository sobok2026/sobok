'use client'

import type { ItemAnswer } from '@deep-type/model'
import { GEM_ITEMS, INNER_ITEMS, PERSONA_ITEMS } from '@deep-type/questionnaire'
import type { Locale } from '@sobok/domain/locale'
import { useReducer } from 'react'

import { assertNever } from '../_lib/assert'
import { INITIAL_STATE, reducer } from '../_lib/flow-state'
import type { DeepTypeContent } from '../_lib/types'
import { AnalyzingView } from './analyzing-view'
import { DynamicReportView } from './dynamic-report-view'
import { IntroView } from './intro-view'
import { LandingView } from './landing-view'
import { PaywallView } from './paywall-view'
import { QuizView } from './quiz-view'
import { RefinementQuizView } from './refinement-quiz-view'
import { ReportView } from './report-view'

type DeepTypeFlowProps = {
  content: DeepTypeContent
  locale: Locale
}

export function DeepTypeFlow({ content, locale }: DeepTypeFlowProps) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const ui = content.ui

  function renderQuiz(
    items: readonly { id: string }[],
    offset: number,
    answers: readonly ItemAnswer[],
    stepLabel: string,
  ) {
    const index = answers.length - offset
    const item = items[index]
    if (!item) {
      return null
    }

    return (
      <QuizView
        answerScale={ui.answerScale}
        backLabel={ui.backCta}
        itemId={item.id}
        key={item.id}
        onAnswer={(answer) => dispatch({ answer, type: 'ANSWER' })}
        onBack={index > 0 ? () => dispatch({ type: 'BACK' }) : undefined}
        progressLabel={`${stepLabel} · ${index + 1} / ${items.length}`}
        progressPercent={Math.round(((index + 1) / items.length) * 100)}
        question={content.questions[item.id]}
      />
    )
  }

  switch (state.phase) {
    case 'landing':
      return <LandingView content={content} locale={locale} onStart={() => dispatch({ type: 'START' })} />
    case 'personaIntro':
      return (
        <IntroView
          body={ui.personaIntroBody}
          cta={ui.personaIntroCta}
          onNext={() => dispatch({ type: 'BEGIN' })}
          title={ui.personaIntroTitle}
        />
      )
    case 'persona':
      return renderQuiz(PERSONA_ITEMS, 0, state.baseAnswers, ui.personaStepLabel)
    case 'innerIntro':
      return (
        <IntroView
          body={ui.innerIntroBody}
          cta={ui.innerIntroCta}
          onNext={() => dispatch({ type: 'BEGIN' })}
          title={ui.innerIntroTitle}
        />
      )
    case 'inner':
      return renderQuiz(INNER_ITEMS, PERSONA_ITEMS.length, state.baseAnswers, ui.innerStepLabel)
    case 'gemIntro':
      return (
        <IntroView
          body={ui.gemIntroBody}
          cta={ui.gemIntroCta}
          onNext={() => dispatch({ type: 'BEGIN' })}
          title={ui.gemIntroTitle}
        />
      )
    case 'gem':
      return renderQuiz(GEM_ITEMS, PERSONA_ITEMS.length + INNER_ITEMS.length, state.baseAnswers, ui.gemStepLabel)
    case 'analyzing':
      return (
        <AnalyzingView
          body={ui.analyzingBody}
          onDone={() => dispatch({ type: 'TO_REPORT' })}
          title={ui.analyzingTitle}
        />
      )
    case 'report':
      return (
        <ReportView
          content={content}
          locale={locale}
          onRestart={() => dispatch({ type: 'RESTART' })}
          onUnlock={() => dispatch({ type: 'UNLOCK' })}
          profile={state.profile}
        />
      )
    case 'paywall':
      return (
        <PaywallView
          content={content}
          freeResult={{ answers: state.baseAnswers, locale }}
          onClose={() => dispatch({ type: 'CLOSE_PAYWALL' })}
          onPaid={(accessToken) => dispatch({ accessToken, type: 'PAID' })}
        />
      )
    case 'refinementIntro':
      return (
        <IntroView
          body={content.paywall.refinementIntroBody}
          cta={content.paywall.refinementIntroCta}
          onNext={() => dispatch({ type: 'BEGIN' })}
          title={content.paywall.refinementIntroTitle}
        />
      )
    case 'refinement':
      return (
        <RefinementQuizView
          accessToken={state.accessToken}
          content={content}
          onComplete={(profile) => dispatch({ profile, type: 'REFINEMENT_DONE' })}
        />
      )
    case 'dynamicReport':
      return (
        <DynamicReportView
          accessToken={state.accessToken}
          content={content}
          fallbackProfile={state.profile}
          locale={locale}
          onRestart={() => dispatch({ type: 'RESTART' })}
        />
      )
    default:
      return assertNever(state)
  }
}
