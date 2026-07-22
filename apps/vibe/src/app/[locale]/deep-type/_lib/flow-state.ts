import type { AssessmentProfile, ItemAnswer } from '@deep-type/model'
import { GEM_ITEMS, INNER_ITEMS, PERSONA_ITEMS } from '@deep-type/questionnaire'
import { scoreBaseAssessment } from '@deep-type/scoring'

import { assertNever } from './assert'

type BaseState = { baseAnswers: ItemAnswer[] }
type ProfileState = BaseState & { profile: AssessmentProfile }

export type State =
  | { phase: 'landing' }
  | { phase: 'personaIntro' }
  | (BaseState & { phase: 'persona' })
  | (BaseState & { phase: 'innerIntro' })
  | (BaseState & { phase: 'inner' })
  | (BaseState & { phase: 'gemIntro' })
  | (BaseState & { phase: 'gem' })
  | (ProfileState & { phase: 'analyzing' })
  | (ProfileState & { phase: 'report' })
  | (ProfileState & { phase: 'paywall' })
  | (ProfileState & { accessToken: string; phase: 'refinementIntro' })
  | (ProfileState & { accessToken: string; phase: 'refinement' })
  | (ProfileState & { accessToken: string; phase: 'dynamicReport' })

export type Action =
  | { type: 'START' }
  | { type: 'BEGIN' }
  | { answer: ItemAnswer; type: 'ANSWER' }
  | { type: 'BACK' }
  | { type: 'TO_REPORT' }
  | { type: 'UNLOCK' }
  | { type: 'CLOSE_PAYWALL' }
  | { accessToken: string; type: 'PAID' }
  | { profile: AssessmentProfile; type: 'REFINEMENT_DONE' }
  | { type: 'RESTART' }

export const INITIAL_STATE: State = { phase: 'landing' }

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START':
      return state.phase === 'landing' ? { phase: 'personaIntro' } : state
    case 'BEGIN':
      switch (state.phase) {
        case 'personaIntro':
          return { baseAnswers: [], phase: 'persona' }
        case 'innerIntro':
          return { baseAnswers: state.baseAnswers, phase: 'inner' }
        case 'gemIntro':
          return { baseAnswers: state.baseAnswers, phase: 'gem' }
        case 'refinementIntro':
          return { ...state, phase: 'refinement' }
        default:
          return state
      }
    case 'ANSWER': {
      if (state.phase !== 'persona' && state.phase !== 'inner' && state.phase !== 'gem') {
        return state
      }
      const baseAnswers = [...state.baseAnswers, action.answer]

      if (state.phase === 'persona' && baseAnswers.length === PERSONA_ITEMS.length) {
        return { baseAnswers, phase: 'innerIntro' }
      }
      if (state.phase === 'inner' && baseAnswers.length === PERSONA_ITEMS.length + INNER_ITEMS.length) {
        return { baseAnswers, phase: 'gemIntro' }
      }
      if (
        state.phase === 'gem' &&
        baseAnswers.length === PERSONA_ITEMS.length + INNER_ITEMS.length + GEM_ITEMS.length
      ) {
        return { baseAnswers, phase: 'analyzing', profile: scoreBaseAssessment(baseAnswers) }
      }
      return { baseAnswers, phase: state.phase }
    }
    case 'BACK':
      if (state.phase === 'persona' || state.phase === 'inner' || state.phase === 'gem') {
        return { ...state, baseAnswers: state.baseAnswers.slice(0, -1) }
      }
      return state
    case 'TO_REPORT':
      return state.phase === 'analyzing' ? { ...state, phase: 'report' } : state
    case 'UNLOCK':
      return state.phase === 'report' ? { ...state, phase: 'paywall' } : state
    case 'CLOSE_PAYWALL':
      return state.phase === 'paywall' ? { ...state, phase: 'report' } : state
    case 'PAID':
      return state.phase === 'paywall' ? { ...state, accessToken: action.accessToken, phase: 'refinementIntro' } : state
    case 'REFINEMENT_DONE':
      return state.phase === 'refinement' ? { ...state, phase: 'dynamicReport', profile: action.profile } : state
    case 'RESTART':
      return INITIAL_STATE
    default:
      return assertNever(action)
  }
}
