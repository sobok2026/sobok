import { judgeAxes } from './model'
import type {
  Answer,
  AnsweredSignal,
  AxisJudgment,
  DichoAxisId,
  PickQuestionDef,
  QuestionDef,
  SliderQuestionDef,
} from './types'
import { DICHO_AXES } from './types'

// Persona quick-measure bank ("STAGE_OUT" in the source prototype) — shown only when a visitor doesn't
// already know their 16-type and picks "측정해 볼래요" instead of the 4-letter picker. 12 questions; ids
// are positional (`persona-0`..`persona-11`), matching the fixed order they're always shown in — content
// (`personaQuestions` in _content/*.ts) is keyed the same way.
//
// This is NOT the deep-tier "PART 1: {Persona} 검증" stage (that's `buildInnerDeepQuestions` in inner.ts,
// which — despite its "verifying your Persona" framing — actually feeds the *Inner* score; see inner.ts).
export const PERSONA_QUESTIONS: readonly QuestionDef[] = [
  { id: 'persona-0', optionCount: 4, options: [{ JP: 2, TF: 1 }, { JP: -2, EI: 1 }, { TF: -2 }, { EI: -2 }] },
  { id: 'persona-1', optionCount: 4, options: [{ EI: 2 }, { EI: 1 }, { EI: -1 }, { EI: -2 }] },
  { id: 'persona-2', optionCount: 4, options: [{ SN: 2 }, { SN: 1 }, { SN: -1 }, { SN: -2 }] },
  { id: 'persona-3', optionCount: 4, options: [{ TF: 2 }, { TF: 1 }, { TF: -1 }, { TF: -2 }] },
  { id: 'persona-4', optionCount: 4, options: [{ JP: 2 }, { JP: 1 }, { JP: -1 }, { JP: -2 }] },
  { id: 'persona-5', anchor: 'EI', axis: 'EI', negated: false },
  { id: 'persona-6', anchor: 'SN', optionCount: 4, options: [{ SN: 2, TF: 1 }, { SN: -2 }, { SN: 2 }, { SN: -2 }] },
  { id: 'persona-7', anchor: 'TF', axis: 'TF', negated: true },
  { id: 'persona-8', anchor: 'JP', optionCount: 4, options: [{ JP: 2 }, { JP: 1 }, { JP: -1 }, { JP: -2 }] },
  { id: 'persona-9', optionCount: 4, options: [{ SN: 2 }, { SN: 1 }, { SN: -1 }, { SN: -2 }] },
  { id: 'persona-10', anchor: 'TF', optionCount: 4, options: [{ TF: 2 }, { TF: 1 }, { TF: -1 }, { TF: -2 }] },
  { id: 'persona-11', optionCount: 4, options: [{ JP: 2 }, { JP: 1 }, { JP: -1 }, { JP: -2 }] },
] as const

export const PERSONA_QUESTION_COUNT = 12

const MAX_PERSONA_SIGNAL: Record<DichoAxisId, number> = { EI: 6, JP: 6, SN: 6, TF: 6 }

export function resolveAnswerSignal(question: QuestionDef, answer: Answer): AnsweredSignal {
  if (answer.kind === 'slider') {
    const slider = question as SliderQuestionDef
    const magnitude = (answer.value - 50) / 25
    const signedMagnitude = slider.negated ? -magnitude : magnitude

    return { anchor: slider.anchor, signal: { [slider.axis]: signedMagnitude } }
  }

  const pick = question as PickQuestionDef

  return { anchor: pick.anchor, signal: pick.options[answer.optionIndex] }
}

export function judgePersona(answers: readonly AnsweredSignal[]): AxisJudgment<DichoAxisId> {
  return judgeAxes(answers, DICHO_AXES, MAX_PERSONA_SIGNAL)
}
