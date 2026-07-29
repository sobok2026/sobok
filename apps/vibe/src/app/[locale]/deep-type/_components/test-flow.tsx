'use client'

import type { AgreementValue, ItemAnswer, OptionIndex, PersonaCode, PersonaSource, WorkAnswer } from '@deep-type/model'
import { readTypeLetters } from '@deep-type/scoring'
import type { Locale } from '@sobok/domain/locale'
import { useRouter } from 'next/navigation'
import { useEffect, useReducer } from 'react'

import { assertNever } from '../_lib/assert'
import { FREE_RUN, FREE_SEGMENTS, TYPE_BLOCK_END } from '../_lib/free-run'
import { writeSitting } from '../_lib/sitting'
import { trackFreeDeclaration, trackFreeProgress } from '../_lib/test-progress-analytics'
import type { DeepTypeContent } from '../_lib/types'
import { AnalyzingView } from './analyzing-view'
import { MicroReveal } from './micro-reveal'
import { PersonaDeclareView } from './persona-declare-view'
import { QuizView } from './quiz-view'
import { SelfImageView } from './self-image-view'

// Three things leave this screen together and `POST /session` requires all three: the twenty-four Likert
// answers, the three forced-choice drain answers, and whether four letters were declared. A sitting missing any
// of them cannot be scored and cannot be paid for, so the run does not branch — everyone walks the same 1 + 27.
type TestState =
  | { phase: 'declare' }
  // The branch for '모르겠어요'. Four self-image questions produce the same four letters a reader would have
  // typed, so everything downstream of here is identical; only `personaSource` remembers which way they came.
  | { phase: 'selfImage' }
  | { answers: readonly Answer[]; declared: Declared; phase: 'run' }
  | { answers: readonly Answer[]; declared: Declared; phase: 'analyzing' }

type Declared = { code: PersonaCode | null; source: PersonaSource }

/** Kept discriminated all the way to the writer so an option index can never land in an agreement level. */
type Answer = { kind: 'likert'; value: ItemAnswer } | { kind: 'work'; value: WorkAnswer }

type TestAction =
  | { declared: Declared; type: 'DECLARE' }
  | { type: 'GUIDE' }
  | { answer: Answer; type: 'ANSWER' }
  | { type: 'BACK' }

const INITIAL_TEST_STATE: TestState = { phase: 'declare' }

function testReducer(state: TestState, action: TestAction): TestState {
  switch (action.type) {
    case 'DECLARE':
      return state.phase === 'declare' || state.phase === 'selfImage'
        ? { answers: [], declared: action.declared, phase: 'run' }
        : state
    case 'GUIDE':
      return state.phase === 'declare' ? { phase: 'selfImage' } : state
    case 'ANSWER': {
      if (state.phase !== 'run') {
        return state
      }
      const answers = [...state.answers, action.answer]
      return { ...state, answers, phase: answers.length === FREE_RUN.length ? 'analyzing' : 'run' }
    }
    case 'BACK':
      return state.phase === 'run' ? { ...state, answers: state.answers.slice(0, -1) } : state
    default:
      return state
  }
}

function likertAnswers(answers: readonly Answer[]): ItemAnswer[] {
  return answers.flatMap((answer) => (answer.kind === 'likert' ? [answer.value] : []))
}

function workAnswers(answers: readonly Answer[]): WorkAnswer[] {
  return answers.flatMap((answer) => (answer.kind === 'work' ? [answer.value] : []))
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

  const segmentLabels = { core: ui.segmentCoreLabel, drain: ui.segmentDrainLabel, type: ui.segmentTypeLabel }
  const segments = FREE_SEGMENTS.map(({ count, segment }) => ({ count, label: segmentLabels[segment] }))

  function declare(declared: Declared) {
    trackFreeDeclaration(declared.code ? declared.source : 'unknown', locale)
    dispatch({ declared, type: 'DECLARE' })
  }

  function finish() {
    if (state.phase !== 'analyzing') {
      return
    }
    writeSitting({
      declaredPersona: state.declared.code,
      personaSource: state.declared.source,
      likert: likertAnswers(state.answers),
      work: workAnswers(state.answers),
    })
    router.push(`/${locale}/deep-type/result`)
  }

  switch (state.phase) {
    case 'declare':
      return (
        <PersonaDeclareView
          onDeclare={(code) => declare({ code, source: 'declared' })}
          onGuide={() => dispatch({ type: 'GUIDE' })}
          ui={ui}
        />
      )
    case 'selfImage':
      return (
        <SelfImageView content={content.selfImage} onDone={(code) => declare({ code, source: 'guided' })} ui={ui} />
      )
    case 'run': {
      const index = state.answers.length
      const step = FREE_RUN[index]
      const question = step && content.questions[step.id]
      if (!step || !question) {
        return null
      }

      // The two blocks answer into different types off the same four buttons. The answer is built here, where
      // the step's kind is known, so the shared view never has to know which one it is showing.
      const answer = (optionIndex: OptionIndex) => {
        dispatch({
          answer:
            step.kind === 'likert'
              ? { kind: 'likert', value: { itemId: step.id, value: (optionIndex + 1) as AgreementValue } }
              : { kind: 'work', value: { itemId: step.id, optionIndex } },
          type: 'ANSWER',
        })
        trackFreeProgress(index + 1, step.segment, locale)
      }

      return (
        <QuizView
          backLabel={ui.backCta}
          banner={
            index === TYPE_BLOCK_END ? (
              <MicroReveal
                body={ui.revealBody}
                code={readTypeLetters(likertAnswers(state.answers))}
                template={ui.revealTemplate}
                title={ui.revealTitle}
              />
            ) : null
          }
          hint={ui.closestAnswerHint}
          key={step.id}
          onAnswer={answer}
          onBack={index > 0 ? () => dispatch({ type: 'BACK' }) : undefined}
          progress={{ answered: index, segments }}
          question={question}
        />
      )
    }
    case 'analyzing':
      return <AnalyzingView body={ui.analyzingBody} onDone={finish} title={ui.analyzingTitle} />
    default:
      return assertNever(state)
  }
}
