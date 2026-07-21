import { GEM_ITEMS, scoreGem } from './gem'
import { INNER_ITEMS, scoreInner } from './inner'
import { PERSONA_MEASURE_ITEMS, PERSONA_VERIFY_ITEMS, scorePersonaMeasure, scorePersonaVerify } from './persona'
import type { AxesResult, AxisResponse, DichoAxisId, GemAxisId, PersonaCode, PersonaResult } from './types'

// The flow is a finite state machine. State is a discriminated union keyed on `phase`, so every phase
// carries exactly the data it owns and nothing else: illegal combinations like "report without scores"
// or "gem quiz with no persona" are unrepresentable. That is what lets the view narrow on `phase` alone
// and drop the runtime `&& data` guards the flat shape used to need. `responses` exists only during the
// three quiz phases (it is the accumulating answer buffer, reset on every phase change).
export type State =
  | { phase: 'landing' }
  | { phase: 'claim' }
  | { claim: PersonaCode; phase: 'verifyIntro' }
  | { phase: 'measureIntro' }
  | { claim: PersonaCode; phase: 'personaVerify'; responses: AxisResponse[] }
  | { phase: 'personaMeasure'; responses: AxisResponse[] }
  | { claim?: PersonaCode; persona: PersonaResult; phase: 'innerIntro' }
  | { persona: PersonaResult; phase: 'inner'; responses: AxisResponse[] }
  | { inner: AxesResult<DichoAxisId>; persona: PersonaResult; phase: 'gemIntro' }
  | { inner: AxesResult<DichoAxisId>; persona: PersonaResult; phase: 'gem'; responses: AxisResponse[] }
  | { gem: AxesResult<GemAxisId>; inner: AxesResult<DichoAxisId>; persona: PersonaResult; phase: 'analyzing' }
  | { gem: AxesResult<GemAxisId>; inner: AxesResult<DichoAxisId>; persona: PersonaResult; phase: 'report' }
  // Monetization tail (Phase 6): free report → paywall → (verified payment) → 정밀 24문항 → dynamic report.
  // The access_token from checkout threads through the paid phases.
  | { gem: AxesResult<GemAxisId>; inner: AxesResult<DichoAxisId>; persona: PersonaResult; phase: 'paywall' }
  | {
      accessToken: string
      gem: AxesResult<GemAxisId>
      inner: AxesResult<DichoAxisId>
      persona: PersonaResult
      phase: 'precisionIntro'
    }
  | {
      accessToken: string
      gem: AxesResult<GemAxisId>
      inner: AxesResult<DichoAxisId>
      persona: PersonaResult
      phase: 'precision'
    }
  | {
      accessToken: string
      gem: AxesResult<GemAxisId>
      inner: AxesResult<DichoAxisId>
      persona: PersonaResult
      phase: 'dynamicReport'
    }

// Actions name what happened, not what to set. The reducer derives the target phase from the current
// one, so no action can jump to a phase without supplying that phase's data. `ANSWER` is one event for
// all three quizzes — the reducer knows which quiz the visitor is in from `phase`.
export type Action =
  | { code: PersonaCode; type: 'CLAIM' }
  | { response: AxisResponse; type: 'ANSWER' }
  | { type: 'BACK' }
  | { type: 'BEGIN' }
  | { type: 'MEASURE' }
  | { type: 'RESTART' }
  | { type: 'START' }
  | { type: 'TO_REPORT' }
  | { type: 'UNLOCK' }
  | { type: 'CLOSE_PAYWALL' }
  | { accessToken: string; type: 'PAID' }
  | { type: 'PRECISION_DONE' }

export const INITIAL_STATE: State = { phase: 'landing' }

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START':
      return { phase: 'claim' }
    case 'CLAIM':
      return { claim: action.code, phase: 'verifyIntro' }
    case 'MEASURE':
      return { phase: 'measureIntro' }
    case 'BEGIN':
      switch (state.phase) {
        case 'verifyIntro':
          return { claim: state.claim, phase: 'personaVerify', responses: [] }
        case 'measureIntro':
          return { phase: 'personaMeasure', responses: [] }
        case 'innerIntro':
          return { persona: state.persona, phase: 'inner', responses: [] }
        case 'gemIntro':
          return { inner: state.inner, persona: state.persona, phase: 'gem', responses: [] }
        case 'precisionIntro':
          return {
            accessToken: state.accessToken,
            gem: state.gem,
            inner: state.inner,
            persona: state.persona,
            phase: 'precision',
          }
        default:
          return state
      }
    case 'ANSWER':
      switch (state.phase) {
        case 'personaVerify': {
          const responses = [...state.responses, action.response]

          if (responses.length < PERSONA_VERIFY_ITEMS.length) {
            return { ...state, responses }
          }

          return { claim: state.claim, persona: scorePersonaVerify(state.claim, responses), phase: 'innerIntro' }
        }
        case 'personaMeasure': {
          const responses = [...state.responses, action.response]

          if (responses.length < PERSONA_MEASURE_ITEMS.length) {
            return { ...state, responses }
          }

          return { persona: scorePersonaMeasure(responses), phase: 'innerIntro' }
        }
        case 'inner': {
          const responses = [...state.responses, action.response]

          if (responses.length < INNER_ITEMS.length) {
            return { ...state, responses }
          }

          return { inner: scoreInner(responses), persona: state.persona, phase: 'gemIntro' }
        }
        case 'gem': {
          const responses = [...state.responses, action.response]

          if (responses.length < GEM_ITEMS.length) {
            return { ...state, responses }
          }

          return { gem: scoreGem(responses), inner: state.inner, persona: state.persona, phase: 'analyzing' }
        }
        default:
          return state
      }
    case 'BACK':
      if ('responses' in state) {
        return { ...state, responses: state.responses.slice(0, -1) }
      }

      return state
    case 'TO_REPORT':
      if (state.phase === 'analyzing') {
        return { gem: state.gem, inner: state.inner, persona: state.persona, phase: 'report' }
      }

      return state
    case 'UNLOCK':
      if (state.phase === 'report') {
        return { gem: state.gem, inner: state.inner, persona: state.persona, phase: 'paywall' }
      }

      return state
    case 'CLOSE_PAYWALL':
      if (state.phase === 'paywall') {
        return { gem: state.gem, inner: state.inner, persona: state.persona, phase: 'report' }
      }

      return state
    case 'PAID':
      if (state.phase === 'paywall') {
        return {
          accessToken: action.accessToken,
          gem: state.gem,
          inner: state.inner,
          persona: state.persona,
          phase: 'precisionIntro',
        }
      }

      return state
    case 'PRECISION_DONE':
      if (state.phase === 'precision') {
        return {
          accessToken: state.accessToken,
          gem: state.gem,
          inner: state.inner,
          persona: state.persona,
          phase: 'dynamicReport',
        }
      }

      return state
    case 'RESTART':
      return INITIAL_STATE
    default: {
      const _exhaustive: never = action

      return _exhaustive
    }
  }
}
