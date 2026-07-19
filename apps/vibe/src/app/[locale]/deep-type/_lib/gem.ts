import { judgeAxes } from './model'
import type { AnsweredSignal, AxisJudgment, GemAxisId, InnerGroup, QuestionDef } from './types'
import { GEM_AXES } from './types'

// Quick tier — one question per gem axis (source: QG). 4 questions total.
export const GEM_QUICK_QUESTIONS: readonly QuestionDef[] = [
  { id: 'gem-quick-0', anchor: 'RM', axis: 'RM', negated: true },
  { id: 'gem-quick-1', anchor: 'OA', optionCount: 4, options: [{ OA: 2 }, { OA: 1 }, { OA: -1 }, { OA: -2 }] },
  { id: 'gem-quick-2', anchor: 'VH', axis: 'VH', negated: false },
  { id: 'gem-quick-3', anchor: 'UO', optionCount: 4, options: [{ UO: 2 }, { UO: 1 }, { UO: -1 }, { UO: -2 }] },
] as const

// Deep tier — 4 questions unique to the visitor's Inner group (source: GEMP), one per gem axis in a fixed
// RM/OA/VH/UO order.
export const GEM_DEEP_GROUP_QUESTIONS: Record<InnerGroup, readonly QuestionDef[]> = {
  NF: [
    { id: 'gem-deep-group-NF-0', optionCount: 3, options: [{ RM: 2 }, { RM: -2 }, {}] },
    { id: 'gem-deep-group-NF-1', optionCount: 3, options: [{ OA: 2 }, { OA: -2 }, {}] },
    { id: 'gem-deep-group-NF-2', optionCount: 3, options: [{ VH: 2 }, { VH: -2 }, {}] },
    { id: 'gem-deep-group-NF-3', optionCount: 3, options: [{ UO: 2 }, { UO: -2 }, {}] },
  ],
  NT: [
    { id: 'gem-deep-group-NT-0', optionCount: 3, options: [{ RM: 2 }, { RM: -2 }, {}] },
    { id: 'gem-deep-group-NT-1', optionCount: 3, options: [{ OA: 2 }, { OA: -2 }, {}] },
    { id: 'gem-deep-group-NT-2', optionCount: 3, options: [{ VH: 2 }, { VH: -2 }, {}] },
    { id: 'gem-deep-group-NT-3', optionCount: 3, options: [{ UO: 2 }, { UO: -2 }, {}] },
  ],
  SJ: [
    { id: 'gem-deep-group-SJ-0', optionCount: 3, options: [{ RM: 2 }, { RM: -2 }, {}] },
    { id: 'gem-deep-group-SJ-1', optionCount: 3, options: [{ OA: 2 }, { OA: -2 }, {}] },
    { id: 'gem-deep-group-SJ-2', optionCount: 3, options: [{ VH: 2 }, { VH: -2 }, {}] },
    { id: 'gem-deep-group-SJ-3', optionCount: 3, options: [{ UO: 2 }, { UO: -2 }, {}] },
  ],
  SP: [
    { id: 'gem-deep-group-SP-0', optionCount: 3, options: [{ RM: 2 }, { RM: -2 }, {}] },
    { id: 'gem-deep-group-SP-1', optionCount: 3, options: [{ OA: 2 }, { OA: -2 }, {}] },
    { id: 'gem-deep-group-SP-2', optionCount: 3, options: [{ VH: 2 }, { VH: -2 }, {}] },
    { id: 'gem-deep-group-SP-3', optionCount: 3, options: [{ UO: 2 }, { UO: -2 }, {}] },
  ],
}

// Deep tier — 8 questions shared across every group (source: GEM_EXTRA), their text flavored per-group by
// a {GF} prefix (see _content's `gemDeepExtraFlavor`). Scoring is identical regardless of group.
export const GEM_DEEP_EXTRA_QUESTIONS: readonly QuestionDef[] = [
  { id: 'gem-deep-extra-0', anchor: 'RM', optionCount: 3, options: [{ RM: 2 }, { RM: -2 }, { RM: -1 }] },
  { id: 'gem-deep-extra-1', optionCount: 3, options: [{ RM: 2 }, { RM: -2 }, {}] },
  { id: 'gem-deep-extra-2', anchor: 'OA', optionCount: 3, options: [{ OA: 2 }, { OA: -2 }, { OA: 1 }] },
  {
    id: 'gem-deep-extra-3',
    optionCount: 4,
    options: [{ OA: 2, VH: 1 }, { VH: -1, RM: -1 }, { RM: -2 }, { OA: -2 }],
  },
  { id: 'gem-deep-extra-4', anchor: 'VH', optionCount: 3, options: [{ VH: 2 }, { VH: -2 }, { VH: -1 }] },
  { id: 'gem-deep-extra-5', anchor: 'UO', optionCount: 3, options: [{ UO: 2 }, { UO: -2 }, { UO: -1 }] },
  { id: 'gem-deep-extra-6', optionCount: 4, options: [{ RM: -2 }, { OA: -2 }, { VH: -2 }, { UO: 2 }] },
  { id: 'gem-deep-extra-7', optionCount: 4, options: [{ RM: -2 }, { OA: 2 }, { VH: -2 }, { UO: 2 }] },
] as const

const MAX_GEM_QUICK_SIGNAL: Record<GemAxisId, number> = { OA: 2, RM: 2, UO: 2, VH: 2 }
const MAX_GEM_DEEP_SIGNAL: Record<GemAxisId, number> = { OA: 8, RM: 8, UO: 8, VH: 8 }

// Interleaves the 4 group-specific questions with the 8 shared ones — 1 group, 2 shared, 1 group, 2
// shared… (source: buildGem). 12 questions total ("PART 3 마음속 보석").
export function buildDeepGemQuestions(group: InnerGroup): readonly QuestionDef[] {
  const groupQuestions = GEM_DEEP_GROUP_QUESTIONS[group]
  const extra = GEM_DEEP_EXTRA_QUESTIONS

  return [
    groupQuestions[0],
    extra[0],
    extra[1],
    groupQuestions[1],
    extra[2],
    extra[3],
    groupQuestions[2],
    extra[4],
    extra[5],
    groupQuestions[3],
    extra[6],
    extra[7],
  ]
}

export function judgeGemQuick(answers: readonly AnsweredSignal[]): AxisJudgment<GemAxisId> {
  return judgeAxes(answers, GEM_AXES, MAX_GEM_QUICK_SIGNAL)
}

export function judgeGemDeep(answers: readonly AnsweredSignal[]): AxisJudgment<GemAxisId> {
  return judgeAxes(answers, GEM_AXES, MAX_GEM_DEEP_SIGNAL)
}
