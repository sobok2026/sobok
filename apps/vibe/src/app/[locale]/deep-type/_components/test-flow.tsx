'use client'

import type { ItemAnswer } from '@deep-type/model'
import { FREE_LIKERT_PRESENTATION } from '@deep-type/presentation'
import type { Locale } from '@sobok/domain/locale'
import { useRouter } from 'next/navigation'
import { useEffect, useReducer } from 'react'

import { writeSitting } from '../_lib/sitting'
import type { DeepTypeContent } from '../_lib/types'
import { AnalyzingView } from './analyzing-view'
import { IntroView } from './intro-view'
import { QuizView } from './quiz-view'

type TestState =
  | { phase: 'intro' }
  | { likert: ItemAnswer[]; phase: 'likert' }
  | { likert: ItemAnswer[]; phase: 'analyzing' }

type TestAction = { type: 'BEGIN' } | { answer: ItemAnswer; type: 'ANSWER' } | { type: 'BACK' }

const INITIAL_TEST_STATE: TestState = { phase: 'intro' }

function testReducer(state: TestState, action: TestAction): TestState {
  switch (action.type) {
    case 'BEGIN':
      return state.phase === 'intro' ? { likert: [], phase: 'likert' } : state
    case 'ANSWER': {
      if (state.phase !== 'likert') {
        return state
      }
      const likert = [...state.likert, action.answer]
      return { likert, phase: likert.length === FREE_LIKERT_PRESENTATION.length ? 'analyzing' : 'likert' }
    }
    case 'BACK':
      return state.phase === 'likert' ? { ...state, likert: state.likert.slice(0, -1) } : state
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

  // The drain block and the self-declaration picker have no authored copy yet, so the sitting still leaves here
  // without them and the result screen cannot score it.
  function handleAnalyzingDone() {
    if ('likert' in state && state.likert.length > 0) {
      writeSitting({ declaredPersona: null, likert: state.likert, work: [] })
    }
    router.push(`/${locale}/deep-type/result`)
  }

  switch (state.phase) {
    case 'intro':
      return (
        <IntroView
          body={ui.innerIntroBody}
          cta={ui.innerIntroCta}
          hint={ui.innerIntroHint}
          onNext={() => dispatch({ type: 'BEGIN' })}
          title={ui.innerIntroTitle}
        />
      )
    case 'likert': {
      const index = state.likert.length
      const item = FREE_LIKERT_PRESENTATION[index]
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
          progressLabel={`${ui.innerStepLabel} · ${index + 1} / ${FREE_LIKERT_PRESENTATION.length}`}
          progressPercent={Math.round(((index + 1) / FREE_LIKERT_PRESENTATION.length) * 100)}
          question={content.questions[item.id]}
        />
      )
    }
    case 'analyzing':
      return <AnalyzingView body={ui.analyzingBody} onDone={handleAnalyzingDone} title={ui.analyzingTitle} />
  }
}
