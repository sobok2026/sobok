'use client'

import type { ItemAnswer } from '@deep-type/model'
import { GEM_PRESENTATION, INNER_PRESENTATION, PERSONA_PRESENTATION } from '@deep-type/presentation'
import type { Locale } from '@sobok/domain/locale'
import { useRouter } from 'next/navigation'
import { useEffect, useReducer } from 'react'

import type { DeepTypeContent } from '../_lib/types'
import { AnalyzingView } from './analyzing-view'
import { IntroView } from './intro-view'
import { QuizView } from './quiz-view'

export const DEEP_TYPE_STORAGE_KEY = 'sobok_deep_type_answers'

type TestState =
  | { phase: 'personaIntro' }
  | { baseAnswers: ItemAnswer[]; phase: 'persona' }
  | { baseAnswers: ItemAnswer[]; phase: 'innerIntro' }
  | { baseAnswers: ItemAnswer[]; phase: 'inner' }
  | { baseAnswers: ItemAnswer[]; phase: 'gemIntro' }
  | { baseAnswers: ItemAnswer[]; phase: 'gem' }
  | { baseAnswers: ItemAnswer[]; phase: 'analyzing' }

type TestAction = { type: 'BEGIN' } | { answer: ItemAnswer; type: 'ANSWER' } | { type: 'BACK' }

const INITIAL_TEST_STATE: TestState = { phase: 'personaIntro' }

function testReducer(state: TestState, action: TestAction): TestState {
  switch (action.type) {
    case 'BEGIN':
      switch (state.phase) {
        case 'personaIntro':
          return { baseAnswers: [], phase: 'persona' }
        case 'innerIntro':
          return { baseAnswers: state.baseAnswers, phase: 'inner' }
        case 'gemIntro':
          return { baseAnswers: state.baseAnswers, phase: 'gem' }
        default:
          return state
      }
    case 'ANSWER': {
      if (state.phase !== 'persona' && state.phase !== 'inner' && state.phase !== 'gem') {
        return state
      }
      const baseAnswers = [...state.baseAnswers, action.answer]

      if (state.phase === 'persona' && baseAnswers.length === PERSONA_PRESENTATION.length) {
        return { baseAnswers, phase: 'innerIntro' }
      }
      if (state.phase === 'inner' && baseAnswers.length === PERSONA_PRESENTATION.length + INNER_PRESENTATION.length) {
        return { baseAnswers, phase: 'gemIntro' }
      }
      if (
        state.phase === 'gem' &&
        baseAnswers.length === PERSONA_PRESENTATION.length + INNER_PRESENTATION.length + GEM_PRESENTATION.length
      ) {
        return { baseAnswers, phase: 'analyzing' }
      }
      return { baseAnswers, phase: state.phase }
    }
    case 'BACK':
      if (state.phase === 'persona' || state.phase === 'inner' || state.phase === 'gem') {
        return { ...state, baseAnswers: state.baseAnswers.slice(0, -1) }
      }
      return state
    default:
      return state
  }
}

type TestFlowProps = {
  content: DeepTypeContent
  locale: Locale
}

export function TestFlow({ content, locale }: TestFlowProps) {
  const [state, dispatch] = useReducer(testReducer, INITIAL_TEST_STATE)
  const router = useRouter()
  const ui = content.ui

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [state.phase])

  function handleAnalyzingDone() {
    if ('baseAnswers' in state && state.baseAnswers.length > 0) {
      try {
        sessionStorage.setItem(DEEP_TYPE_STORAGE_KEY, JSON.stringify(state.baseAnswers))
      } catch {
        // Storage unavailable or disabled
      }
    }
    router.push(`/${locale}/deep-type/result`)
  }

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
    case 'personaIntro':
      return (
        <IntroView
          body={ui.personaIntroBody}
          cta={ui.personaIntroCta}
          hint={ui.personaIntroHint}
          onNext={() => dispatch({ type: 'BEGIN' })}
          title={ui.personaIntroTitle}
        />
      )
    case 'persona':
      return renderQuiz(PERSONA_PRESENTATION, 0, state.baseAnswers, ui.personaStepLabel)
    case 'innerIntro':
      return (
        <IntroView
          body={ui.innerIntroBody}
          cta={ui.innerIntroCta}
          hint={ui.innerIntroHint}
          onNext={() => dispatch({ type: 'BEGIN' })}
          title={ui.innerIntroTitle}
        />
      )
    case 'inner':
      return renderQuiz(INNER_PRESENTATION, PERSONA_PRESENTATION.length, state.baseAnswers, ui.innerStepLabel)
    case 'gemIntro':
      return (
        <IntroView
          body={ui.gemIntroBody}
          cta={ui.gemIntroCta}
          hint={ui.gemIntroHint}
          onNext={() => dispatch({ type: 'BEGIN' })}
          title={ui.gemIntroTitle}
        />
      )
    case 'gem':
      return renderQuiz(
        GEM_PRESENTATION,
        PERSONA_PRESENTATION.length + INNER_PRESENTATION.length,
        state.baseAnswers,
        ui.gemStepLabel,
      )
    case 'analyzing':
      return <AnalyzingView body={ui.analyzingBody} onDone={handleAnalyzingDone} title={ui.analyzingTitle} />
  }
}
