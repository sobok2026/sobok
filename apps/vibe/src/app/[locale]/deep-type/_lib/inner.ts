import { judgeAxes } from './model'
import type { AnsweredSignal, AxisJudgment, DichoAxisId, InnerGroup, PersonaCode, QuestionDef } from './types'
import { DICHO_AXES } from './types'

const LETTERS = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'] as const

// Quick tier — one question per letter of the visitor's already-known/measured Persona, asking "is this
// still true when you're alone?" (source: LPROBE_Q). 8 questions total, one per letter; only the letter
// matching the visitor's own Persona is ever shown (see buildQuickInnerQuestions below).
export const INNER_QUICK_LETTER_QUESTIONS: Record<(typeof LETTERS)[number], QuestionDef> = {
  E: { id: 'inner-quick-letter-E', anchor: 'EI', optionCount: 3, options: [{ EI: 2 }, { EI: -2 }, {}] },
  I: { id: 'inner-quick-letter-I', anchor: 'EI', optionCount: 3, options: [{ EI: 2 }, { EI: -2 }, {}] },
  S: { id: 'inner-quick-letter-S', anchor: 'SN', optionCount: 3, options: [{ SN: 2 }, { SN: -2 }, {}] },
  N: { id: 'inner-quick-letter-N', anchor: 'SN', optionCount: 3, options: [{ SN: -2 }, { SN: 2 }, {}] },
  T: { id: 'inner-quick-letter-T', anchor: 'TF', optionCount: 3, options: [{ TF: 2 }, { TF: -2 }, {}] },
  F: { id: 'inner-quick-letter-F', anchor: 'TF', optionCount: 3, options: [{ TF: -2 }, { TF: 2 }, {}] },
  J: { id: 'inner-quick-letter-J', anchor: 'JP', optionCount: 3, options: [{ JP: 2 }, { JP: -2 }, {}] },
  P: { id: 'inner-quick-letter-P', anchor: 'JP', optionCount: 3, options: [{ JP: -2 }, { JP: 2 }, {}] },
}

// Quick tier — 4 neutral follow-ups appended regardless of Persona (source: QH_NEUTRAL).
export const INNER_QUICK_NEUTRAL_QUESTIONS: readonly QuestionDef[] = [
  { id: 'inner-quick-neutral-0', anchor: 'EI', axis: 'EI', negated: false },
  {
    id: 'inner-quick-neutral-1',
    anchor: 'SN',
    optionCount: 4,
    options: [{ SN: 2 }, { SN: -2 }, { SN: 2 }, { SN: -2 }],
  },
  {
    id: 'inner-quick-neutral-2',
    anchor: 'TF',
    optionCount: 4,
    options: [{ TF: 2 }, { TF: -2 }, { TF: 2 }, { TF: -2 }],
  },
  {
    id: 'inner-quick-neutral-3',
    anchor: 'JP',
    optionCount: 4,
    options: [{ JP: 2 }, { JP: 1 }, { JP: -1 }, { JP: -2 }],
  },
] as const

// Quick tier fallback — used only if Persona is somehow unknown when the quick Inner quiz starts (source:
// QH_FALLBACK; defensive, mirrors the source's own fallback even though today's flow always sets Persona
// before this point).
export const INNER_QUICK_FALLBACK_QUESTIONS: readonly QuestionDef[] = [
  { id: 'inner-quick-fallback-0', anchor: 'EI', axis: 'EI', negated: false },
  { id: 'inner-quick-fallback-1', optionCount: 4, options: [{ EI: 2 }, { EI: 1 }, { EI: -1 }, { EI: -2 }] },
  {
    id: 'inner-quick-fallback-2',
    anchor: 'SN',
    optionCount: 4,
    options: [{ SN: 2 }, { SN: -2 }, { SN: 2 }, { SN: -2 }],
  },
  { id: 'inner-quick-fallback-3', optionCount: 4, options: [{ SN: 2 }, { SN: 1 }, { SN: -1 }, { SN: -2 }] },
  {
    id: 'inner-quick-fallback-4',
    anchor: 'TF',
    optionCount: 4,
    options: [{ TF: 2 }, { TF: -2 }, { TF: 2 }, { TF: -2 }],
  },
  { id: 'inner-quick-fallback-5', optionCount: 4, options: [{ TF: 2 }, { TF: 1 }, { TF: -1 }, { TF: -2 }] },
  {
    id: 'inner-quick-fallback-6',
    anchor: 'JP',
    optionCount: 4,
    options: [{ JP: 2 }, { JP: 1 }, { JP: -1 }, { JP: -2 }],
  },
  { id: 'inner-quick-fallback-7', optionCount: 4, options: [{ JP: 2 }, { JP: 1 }, { JP: -1 }, { JP: -2 }] },
] as const

// Deep tier PART 1 — 6 questions per letter (source: LPROBE_D), interleaved round-robin across the
// visitor's 4 Persona letters by buildInnerDeepQuestions(). Framed in the UI as "verifying your Persona",
// but every question's `sig` targets the DICHO axes and feeds the *Inner* score, not Persona — the
// contrast between the known Persona and these "alone" answers is the whole mechanic.
export const INNER_DEEP_LETTER_QUESTIONS: Record<(typeof LETTERS)[number], readonly QuestionDef[]> = {
  E: [
    { id: 'inner-deep-E-0', anchor: 'EI', optionCount: 3, options: [{ EI: 2 }, { EI: -2 }, {}] },
    { id: 'inner-deep-E-1', optionCount: 3, options: [{ EI: 2 }, { EI: -2 }, {}] },
    { id: 'inner-deep-E-2', optionCount: 3, options: [{ EI: 2 }, { EI: -2 }, {}] },
    { id: 'inner-deep-E-3', optionCount: 3, options: [{ EI: 2 }, { EI: -2 }, {}] },
    { id: 'inner-deep-E-4', optionCount: 3, options: [{ EI: 2 }, { EI: -2 }, {}] },
    { id: 'inner-deep-E-5', optionCount: 3, options: [{ EI: 2 }, { EI: -2 }, {}] },
  ],
  I: [
    { id: 'inner-deep-I-0', anchor: 'EI', optionCount: 3, options: [{ EI: 2 }, { EI: -2 }, {}] },
    { id: 'inner-deep-I-1', optionCount: 3, options: [{ EI: 2 }, { EI: -2 }, {}] },
    { id: 'inner-deep-I-2', optionCount: 3, options: [{ EI: 2 }, { EI: -2 }, {}] },
    { id: 'inner-deep-I-3', optionCount: 3, options: [{ EI: 2 }, { EI: -2 }, {}] },
    { id: 'inner-deep-I-4', optionCount: 3, options: [{ EI: 2 }, { EI: -2 }, {}] },
    { id: 'inner-deep-I-5', optionCount: 3, options: [{ EI: 2 }, { EI: -2 }, {}] },
  ],
  S: [
    { id: 'inner-deep-S-0', anchor: 'SN', optionCount: 3, options: [{ SN: 2 }, { SN: -2 }, {}] },
    { id: 'inner-deep-S-1', optionCount: 3, options: [{ SN: 2 }, { SN: -2 }, {}] },
    { id: 'inner-deep-S-2', optionCount: 3, options: [{ SN: 2 }, { SN: -2 }, {}] },
    { id: 'inner-deep-S-3', optionCount: 3, options: [{ SN: 2 }, { SN: -2 }, {}] },
    { id: 'inner-deep-S-4', optionCount: 3, options: [{ SN: 2 }, { SN: -2 }, {}] },
    { id: 'inner-deep-S-5', optionCount: 3, options: [{ SN: 2 }, { SN: -2 }, {}] },
  ],
  N: [
    { id: 'inner-deep-N-0', anchor: 'SN', optionCount: 3, options: [{ SN: -2 }, { SN: 2 }, {}] },
    { id: 'inner-deep-N-1', optionCount: 3, options: [{ SN: -2 }, { SN: 2 }, {}] },
    { id: 'inner-deep-N-2', optionCount: 3, options: [{ SN: -2 }, { SN: 2 }, {}] },
    { id: 'inner-deep-N-3', optionCount: 3, options: [{ SN: -2 }, { SN: 2 }, {}] },
    { id: 'inner-deep-N-4', optionCount: 3, options: [{ SN: -2 }, { SN: 2 }, {}] },
    { id: 'inner-deep-N-5', optionCount: 3, options: [{ SN: -2 }, { SN: 2 }, {}] },
  ],
  T: [
    { id: 'inner-deep-T-0', anchor: 'TF', optionCount: 3, options: [{ TF: 2 }, { TF: -2 }, {}] },
    { id: 'inner-deep-T-1', optionCount: 3, options: [{ TF: 2 }, { TF: -2 }, {}] },
    { id: 'inner-deep-T-2', optionCount: 3, options: [{ TF: 2 }, { TF: -2 }, {}] },
    { id: 'inner-deep-T-3', optionCount: 3, options: [{ TF: 2 }, { TF: -2 }, {}] },
    { id: 'inner-deep-T-4', optionCount: 3, options: [{ TF: 2 }, { TF: -2 }, {}] },
    { id: 'inner-deep-T-5', optionCount: 3, options: [{ TF: 2 }, { TF: -2 }, {}] },
  ],
  F: [
    { id: 'inner-deep-F-0', anchor: 'TF', optionCount: 3, options: [{ TF: -2 }, { TF: 2 }, {}] },
    { id: 'inner-deep-F-1', optionCount: 3, options: [{ TF: -2 }, { TF: 2 }, {}] },
    { id: 'inner-deep-F-2', optionCount: 3, options: [{ TF: -2 }, { TF: 2 }, {}] },
    { id: 'inner-deep-F-3', optionCount: 3, options: [{ TF: -2 }, { TF: 2 }, {}] },
    { id: 'inner-deep-F-4', optionCount: 3, options: [{ TF: -2 }, { TF: 2 }, {}] },
    { id: 'inner-deep-F-5', optionCount: 3, options: [{ TF: -2 }, { TF: 2 }, {}] },
  ],
  J: [
    { id: 'inner-deep-J-0', anchor: 'JP', optionCount: 3, options: [{ JP: 2 }, { JP: -2 }, {}] },
    { id: 'inner-deep-J-1', optionCount: 3, options: [{ JP: 2 }, { JP: -2 }, {}] },
    { id: 'inner-deep-J-2', optionCount: 3, options: [{ JP: 2 }, { JP: -2 }, {}] },
    { id: 'inner-deep-J-3', optionCount: 3, options: [{ JP: 2 }, { JP: -2 }, {}] },
    { id: 'inner-deep-J-4', optionCount: 3, options: [{ JP: 2 }, { JP: -2 }, {}] },
    { id: 'inner-deep-J-5', optionCount: 3, options: [{ JP: 2 }, { JP: -2 }, {}] },
  ],
  P: [
    { id: 'inner-deep-P-0', anchor: 'JP', optionCount: 3, options: [{ JP: -2 }, { JP: 2 }, {}] },
    { id: 'inner-deep-P-1', optionCount: 3, options: [{ JP: -2 }, { JP: 2 }, {}] },
    { id: 'inner-deep-P-2', optionCount: 3, options: [{ JP: -2 }, { JP: 2 }, {}] },
    { id: 'inner-deep-P-3', optionCount: 3, options: [{ JP: -2 }, { JP: 2 }, {}] },
    { id: 'inner-deep-P-4', optionCount: 3, options: [{ JP: -2 }, { JP: 2 }, {}] },
    { id: 'inner-deep-P-5', optionCount: 3, options: [{ JP: -2 }, { JP: 2 }, {}] },
  ],
}

// Deep tier PART 2 — 4 group-specific probe questions, shown once (not per-letter), keyed by the
// visitor's just-measured Inner group (source: PROBE). Cross-axis bonus signal on top of PART1, feeding
// the same Inner score.
export const INNER_PROBE_QUESTIONS: Record<InnerGroup, readonly QuestionDef[]> = {
  NF: [
    { id: 'inner-probe-NF-0', optionCount: 4, options: [{ SN: 2, TF: 1 }, { SN: -2 }, { EI: -2 }, { EI: 2 }] },
    { id: 'inner-probe-NF-1', optionCount: 4, options: [{ TF: -2 }, { TF: 2 }, { EI: -2 }, { TF: 1, EI: -1 }] },
    { id: 'inner-probe-NF-2', optionCount: 4, options: [{ SN: 2 }, { TF: -2 }, { SN: -2 }, { JP: 2 }] },
    { id: 'inner-probe-NF-3', optionCount: 4, options: [{ JP: 2 }, { JP: 1 }, { JP: -1 }, { JP: -2 }] },
  ],
  NT: [
    { id: 'inner-probe-NT-0', optionCount: 4, options: [{ TF: -2 }, { TF: 2 }, { TF: -1, EI: 1 }, { EI: -2 }] },
    { id: 'inner-probe-NT-1', optionCount: 4, options: [{ SN: -2 }, { SN: 2 }, { EI: 2, TF: -1 }, { EI: -2 }] },
    { id: 'inner-probe-NT-2', optionCount: 4, options: [{ TF: 2 }, { TF: -2 }, { SN: -2 }, { SN: 2 }] },
    { id: 'inner-probe-NT-3', optionCount: 4, options: [{ TF: -2 }, { TF: -1 }, { TF: 1 }, { TF: 2 }] },
  ],
  SJ: [
    { id: 'inner-probe-SJ-0', optionCount: 4, options: [{ JP: -2, SN: -1 }, { JP: 2 }, { TF: -2 }, { SN: 2 }] },
    { id: 'inner-probe-SJ-1', optionCount: 4, options: [{ JP: -1, TF: -1 }, { JP: 2 }, { SN: -2 }, { EI: -2 }] },
    { id: 'inner-probe-SJ-2', optionCount: 4, options: [{ JP: 2 }, { TF: -2 }, { SN: 2 }, { JP: -2 }] },
    { id: 'inner-probe-SJ-3', optionCount: 4, options: [{ JP: 2 }, { JP: 1 }, { JP: -1 }, { JP: -2 }] },
  ],
  SP: [
    { id: 'inner-probe-SP-0', optionCount: 4, options: [{ JP: 2 }, { JP: -2 }, { SN: -1, TF: -1 }, { EI: -2 }] },
    { id: 'inner-probe-SP-1', optionCount: 4, options: [{ TF: 2 }, { TF: -2 }, { SN: 2, JP: 1 }, { SN: -2 }] },
    { id: 'inner-probe-SP-2', optionCount: 4, options: [{ SN: -2 }, { SN: -1, TF: -1 }, { SN: 2 }, { JP: 2 }] },
    { id: 'inner-probe-SP-3', optionCount: 4, options: [{ SN: -2 }, { SN: -1 }, { SN: 1 }, { SN: 2 }] },
  ],
}

const MAX_INNER_QUICK_SIGNAL: Record<DichoAxisId, number> = { EI: 6, JP: 6, SN: 6, TF: 6 }
const MAX_INNER_DEEP_SIGNAL: Record<DichoAxisId, number> = { EI: 12, JP: 12, SN: 12, TF: 12 }

export function buildQuickInnerQuestions(outer: PersonaCode | undefined): readonly QuestionDef[] {
  if (!outer) {
    return INNER_QUICK_FALLBACK_QUESTIONS
  }

  const letterQuestions = outer
    .split('')
    .map((letter) => INNER_QUICK_LETTER_QUESTIONS[letter as (typeof LETTERS)[number]])

  return [...letterQuestions, ...INNER_QUICK_NEUTRAL_QUESTIONS]
}

// Round-robin across the 4 letters' 6-question banks (source: buildPart1) — one question from each
// letter, six times, rather than all of one letter then the next. Keeps the felt topic mix varied
// (job/friends/dating/spending/weekend/feelings) instead of front-loading one theme.
export function buildDeepInnerPart1Questions(outer: PersonaCode): readonly QuestionDef[] {
  const perLetter = outer.split('').map((letter) => INNER_DEEP_LETTER_QUESTIONS[letter as (typeof LETTERS)[number]])
  const questions: QuestionDef[] = []

  for (let i = 0; i < 6; i++) {
    for (const bank of perLetter) {
      questions.push(bank[i])
    }
  }

  return questions
}

export function buildDeepInnerPart2Questions(group: InnerGroup): readonly QuestionDef[] {
  return INNER_PROBE_QUESTIONS[group]
}

export function judgeInnerQuick(answers: readonly AnsweredSignal[]): AxisJudgment<DichoAxisId> {
  return judgeAxes(answers, DICHO_AXES, MAX_INNER_QUICK_SIGNAL)
}

export function judgeInnerDeep(answers: readonly AnsweredSignal[]): AxisJudgment<DichoAxisId> {
  return judgeAxes(answers, DICHO_AXES, MAX_INNER_DEEP_SIGNAL)
}
