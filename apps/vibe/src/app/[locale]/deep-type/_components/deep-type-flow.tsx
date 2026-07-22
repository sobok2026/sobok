'use client'

import type { Locale } from '@sobok/domain/locale'
import { useReducer } from 'react'

import { assertNever } from '../_lib/assert'
import { INITIAL_STATE, reducer } from '../_lib/flow-state'
import { GEM_ITEMS } from '../_lib/gem'
import { INNER_ITEMS } from '../_lib/inner'
import { PERSONA_MEASURE_ITEMS, PERSONA_VERIFY_ITEMS } from '../_lib/persona'
import { buildDeepReport } from '../_lib/report'
import { resolveResponse } from '../_lib/scoring'
import type { AxisResponse, DeepTypeContent, Item, ItemAnswer, PersonaCode } from '../_lib/types'
import { AnalyzingView } from './analyzing-view'
import { DynamicReportView } from './dynamic-report-view'
import { GapReveal } from './gap-reveal'
import { IntroView } from './intro-view'
import { LandingView } from './landing-view'
import { PaywallView } from './paywall-view'
import { PersonaClaimView } from './persona-claim-view'
import { PersonaReveal } from './persona-reveal'
import { PrecisionQuizView } from './precision-quiz-view'
import { QuizView } from './quiz-view'
import { ReportView } from './report-view'

type DeepTypeFlowProps = {
  content: DeepTypeContent
  locale: Locale
}

export function DeepTypeFlow({ content, locale }: DeepTypeFlowProps) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const ui = content.ui

  // Persona/Inner/Gem item text lives in three content dictionaries keyed by the item id prefix.
  function contentByPrefix(id: string) {
    if (id.startsWith('persona-')) {
      return content.personaQuestions
    }
    if (id.startsWith('inner-')) {
      return content.innerQuestions
    }
    return content.gemQuestions
  }

  function renderQuiz(items: readonly Item[], stepLabel: string, responses: readonly AxisResponse[]) {
    const index = responses.length
    const item = items[index]

    return (
      <QuizView
        content={contentByPrefix(item.id)}
        item={item}
        key={item.id}
        onAnswer={(answer: ItemAnswer) => dispatch({ response: resolveResponse(item, answer), type: 'ANSWER' })}
        onBack={index > 0 ? () => dispatch({ type: 'BACK' }) : undefined}
        progressLabel={`${stepLabel} · ${index + 1} / ${items.length}`}
        progressPercent={Math.round((index / items.length) * 100)}
      />
    )
  }

  switch (state.phase) {
    case 'landing':
      return <LandingView content={content} locale={locale} onStart={() => dispatch({ type: 'START' })} />
    case 'claim':
      return (
        <PersonaClaimView
          content={content}
          onMeasure={() => dispatch({ type: 'MEASURE' })}
          onSubmit={(code) => dispatch({ code: code as PersonaCode, type: 'CLAIM' })}
        />
      )
    case 'verifyIntro':
      return (
        <IntroView
          body={ui.claimVerifyBody}
          cta={ui.claimVerifyCta}
          onNext={() => dispatch({ type: 'BEGIN' })}
          title={ui.claimVerifyTitle}
        />
      )
    case 'measureIntro':
      return (
        <IntroView
          body={ui.measureIntroBody}
          cta={ui.measureIntroCta}
          onNext={() => dispatch({ type: 'BEGIN' })}
          title={ui.measureIntroTitle}
        />
      )
    case 'personaVerify':
      return renderQuiz(PERSONA_VERIFY_ITEMS, 'STEP 1 · 겉유형', state.responses)
    case 'personaMeasure':
      return renderQuiz(PERSONA_MEASURE_ITEMS, 'STEP 1 · 겉유형', state.responses)
    case 'innerIntro':
      return (
        <PersonaReveal
          claim={state.claim}
          content={content}
          onNext={() => dispatch({ type: 'BEGIN' })}
          persona={state.persona}
        />
      )
    case 'inner':
      return renderQuiz(INNER_ITEMS, 'STEP 2 · Inner', state.responses)
    case 'gemIntro':
      return (
        <GapReveal
          content={content}
          inner={state.inner}
          onNext={() => dispatch({ type: 'BEGIN' })}
          outer={state.persona.code}
        />
      )
    case 'gem':
      return renderQuiz(GEM_ITEMS, 'STEP 3 · 보석', state.responses)
    case 'analyzing':
      return (
        <AnalyzingView
          body={ui.analyzingBody}
          onDone={() => dispatch({ type: 'TO_REPORT' })}
          title={ui.analyzingTitle}
        />
      )
    case 'report': {
      const report = buildDeepReport(content, state.persona, state.inner, state.gem)

      return (
        <ReportView
          content={content}
          locale={locale}
          onRestart={() => dispatch({ type: 'RESTART' })}
          onUnlock={() => dispatch({ type: 'UNLOCK' })}
          report={report}
        />
      )
    }
    case 'paywall':
      return (
        <PaywallView
          content={content}
          freeResult={{ gem: state.gem.code, innerType: state.inner.code, locale, persona: state.persona.code }}
          onClose={() => dispatch({ type: 'CLOSE_PAYWALL' })}
          onPaid={(accessToken) => dispatch({ accessToken, type: 'PAID' })}
        />
      )
    case 'precisionIntro':
      return (
        <IntroView
          body={content.paywall.precisionIntroBody}
          cta={content.paywall.precisionIntroCta}
          onNext={() => dispatch({ type: 'BEGIN' })}
          title={content.paywall.precisionIntroTitle}
        />
      )
    case 'precision':
      return (
        <PrecisionQuizView
          accessToken={state.accessToken}
          content={content}
          gemCode={state.gem.code}
          innerCode={state.inner.code}
          onComplete={() => dispatch({ type: 'PRECISION_DONE' })}
        />
      )
    case 'dynamicReport': {
      const fallbackReport = buildDeepReport(content, state.persona, state.inner, state.gem)

      return (
        <DynamicReportView
          accessToken={state.accessToken}
          content={content}
          fallbackReport={fallbackReport}
          locale={locale}
          onRestart={() => dispatch({ type: 'RESTART' })}
        />
      )
    }
    default:
      return assertNever(state)
  }
}
