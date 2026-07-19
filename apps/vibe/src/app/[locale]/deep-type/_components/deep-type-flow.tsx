'use client'

import type { Locale } from '@sobok/domain/locale'
import { useReducer } from 'react'

import { GEM_QUICK_QUESTIONS, judgeGemQuick } from '../_lib/gem'
import { buildQuickInnerQuestions, judgeInnerQuick } from '../_lib/inner'
import { judgePersona, PERSONA_QUESTIONS, resolveAnswerSignal } from '../_lib/persona'
import type { AnsweredSignal, DeepTypeContent, GemCode, InnerCode, PersonaCode } from '../_lib/types'
import { LandingView } from './landing-view'
import { PersonaClaimView } from './persona-claim-view'
import { PersonaRevealView } from './persona-reveal-view'
import { QuickIntroView } from './quick-intro-view'
import { QuickResultView } from './quick-result-view'
import { QuizView } from './quiz-view'

type Phase =
  | 'claim'
  | 'gemQuiz'
  | 'innerQuiz'
  | 'landing'
  | 'personaQuiz'
  | 'personaReveal'
  | 'quickIntro'
  | 'quickResult'

type State = {
  answers: AnsweredSignal[]
  outer?: PersonaCode
  phase: Phase
  qGemCode?: GemCode
  qHidden?: InnerCode
}

type Action =
  | { type: 'ANSWER_GEM_QUIZ'; signal: AnsweredSignal }
  | { type: 'ANSWER_INNER_QUIZ'; signal: AnsweredSignal }
  | { type: 'ANSWER_PERSONA_QUIZ'; signal: AnsweredSignal }
  | { type: 'BACK' }
  | { code: PersonaCode; type: 'PICK_PERSONA' }
  | { type: 'RESTART' }
  | { type: 'START_CLAIM' }
  | { type: 'START_INNER_QUIZ' }
  | { type: 'START_PERSONA_QUIZ' }

const INITIAL_STATE: State = { answers: [], phase: 'landing' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_CLAIM':
      return { ...INITIAL_STATE, phase: 'claim' }
    case 'PICK_PERSONA':
      return { ...state, answers: [], outer: action.code, phase: 'quickIntro' }
    case 'START_PERSONA_QUIZ':
      return { ...state, answers: [], phase: 'personaQuiz' }
    case 'ANSWER_PERSONA_QUIZ': {
      const answers = [...state.answers, action.signal]

      if (answers.length < PERSONA_QUESTIONS.length) {
        return { ...state, answers }
      }

      const judgment = judgePersona(answers)

      return { ...state, answers: [], outer: judgment.code as PersonaCode, phase: 'personaReveal' }
    }
    case 'START_INNER_QUIZ':
      return { ...state, answers: [], phase: 'innerQuiz' }
    case 'ANSWER_INNER_QUIZ': {
      const answers = [...state.answers, action.signal]
      const total = buildQuickInnerQuestions(state.outer).length

      if (answers.length < total) {
        return { ...state, answers }
      }

      const judgment = judgeInnerQuick(answers)

      return { ...state, answers: [], phase: 'gemQuiz', qHidden: judgment.code as InnerCode }
    }
    case 'ANSWER_GEM_QUIZ': {
      const answers = [...state.answers, action.signal]

      if (answers.length < GEM_QUICK_QUESTIONS.length) {
        return { ...state, answers }
      }

      const judgment = judgeGemQuick(answers)

      return { ...state, answers: [], phase: 'quickResult', qGemCode: judgment.code as GemCode }
    }
    case 'BACK':
      return { ...state, answers: state.answers.slice(0, -1) }
    case 'RESTART':
      return INITIAL_STATE
    default:
      return state
  }
}

type DeepTypeFlowProps = {
  content: DeepTypeContent
  locale: Locale
}

export function DeepTypeFlow({ content, locale }: DeepTypeFlowProps) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const { answers, outer, phase, qGemCode, qHidden } = state

  if (phase === 'landing') {
    return <LandingView content={content} locale={locale} onStart={() => dispatch({ type: 'START_CLAIM' })} />
  }

  if (phase === 'claim') {
    return (
      <PersonaClaimView
        content={content}
        onMeasure={() => dispatch({ type: 'START_PERSONA_QUIZ' })}
        onSubmit={(code) => dispatch({ code: code as PersonaCode, type: 'PICK_PERSONA' })}
      />
    )
  }

  if (phase === 'personaQuiz') {
    const index = answers.length
    const question = PERSONA_QUESTIONS[index]

    return (
      <QuizView
        content={content.personaQuestions}
        key={question.id}
        onAnswer={(answer) => dispatch({ signal: resolveAnswerSignal(question, answer), type: 'ANSWER_PERSONA_QUIZ' })}
        onBack={index > 0 ? () => dispatch({ type: 'BACK' }) : undefined}
        progressLabel={`Persona 간단 측정 · ${index + 1} / ${PERSONA_QUESTIONS.length}`}
        progressPercent={Math.round((index / PERSONA_QUESTIONS.length) * 100)}
        question={question}
        tokens={{}}
      />
    )
  }

  if (phase === 'personaReveal' && outer) {
    return (
      <PersonaRevealView content={content} onContinue={() => dispatch({ type: 'START_INNER_QUIZ' })} outer={outer} />
    )
  }

  if (phase === 'quickIntro' && outer) {
    return <QuickIntroView content={content} onStart={() => dispatch({ type: 'START_INNER_QUIZ' })} outer={outer} />
  }

  if (phase === 'innerQuiz') {
    const questions = buildQuickInnerQuestions(outer)
    const index = answers.length
    const question = questions[index]

    return (
      <QuizView
        content={content.innerQuestions}
        key={question.id}
        onAnswer={(answer) => dispatch({ signal: resolveAnswerSignal(question, answer), type: 'ANSWER_INNER_QUIZ' })}
        onBack={index > 0 ? () => dispatch({ type: 'BACK' }) : undefined}
        progressLabel={`Inner 측정 · ${index + 1} / ${questions.length}`}
        progressPercent={Math.round((index / questions.length) * 100)}
        question={question}
        tokens={{ T: outer }}
      />
    )
  }

  if (phase === 'gemQuiz') {
    const index = answers.length
    const question = GEM_QUICK_QUESTIONS[index]

    return (
      <QuizView
        content={content.gemQuestions}
        key={question.id}
        onAnswer={(answer) => dispatch({ signal: resolveAnswerSignal(question, answer), type: 'ANSWER_GEM_QUIZ' })}
        onBack={index > 0 ? () => dispatch({ type: 'BACK' }) : undefined}
        progressLabel={`마음속 보석 찾기 · ${index + 1} / ${GEM_QUICK_QUESTIONS.length}`}
        progressPercent={Math.round((index / GEM_QUICK_QUESTIONS.length) * 100)}
        question={question}
        tokens={{}}
      />
    )
  }

  if (phase === 'quickResult' && outer && qHidden && qGemCode) {
    return (
      <QuickResultView
        content={content}
        gemCode={qGemCode}
        locale={locale}
        onOpenPaywall={() => {
          // Real checkout wiring lands in a follow-up phase — the paid tier isn't live yet.
        }}
        onRestart={() => dispatch({ type: 'RESTART' })}
        outer={outer}
        qHidden={qHidden}
      />
    )
  }

  return <LandingView content={content} locale={locale} onStart={() => dispatch({ type: 'START_CLAIM' })} />
}
