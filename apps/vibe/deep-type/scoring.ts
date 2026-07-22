import {
  type AgreementValue,
  type AssessmentProfile,
  AXIS_POLES,
  type AxisId,
  type AxisScore,
  CONTEXT_AXES,
  type ContextAxisId,
  type ContextLayerProfile,
  GEM_AXES,
  type GemAxisId,
  type GemCode,
  type GemLayerProfile,
  INSTRUMENT_VERSION,
  type InnerCode,
  type ItemAnswer,
  type PersonaCode,
  TYPE_AXES,
} from './model'
import {
  BASE_ITEMS,
  type BaseItem,
  GEM_ITEMS,
  INNER_ITEMS,
  PERSONA_ITEMS,
  REFINEMENT_ITEMS,
  type RefinementItem,
} from './questionnaire'

type ScoredItem = BaseItem | RefinementItem

export class InvalidAnswerSetError extends Error {
  constructor() {
    super('invalid answer set')
  }
}

export function scoreBaseAssessment(answers: readonly ItemAnswer[]): AssessmentProfile {
  const byId = validateAndIndex(BASE_ITEMS, answers)

  return {
    instrumentVersion: INSTRUMENT_VERSION,
    persona: scoreContextLayer(PERSONA_ITEMS, byId),
    inner: scoreContextLayer(INNER_ITEMS, byId),
    gem: scoreGemLayer(GEM_ITEMS, byId),
  }
}

export function scoreRefinedAssessment(
  baseAnswers: readonly ItemAnswer[],
  refinementAnswers: readonly ItemAnswer[],
): AssessmentProfile {
  const baseProfile = scoreBaseAssessment(baseAnswers)
  const refinementById = validateAndIndex(REFINEMENT_ITEMS, refinementAnswers)
  const baseById = validateAndIndex(BASE_ITEMS, baseAnswers)
  const byId = new Map([...baseById, ...refinementById])

  const refinedInnerItems = [
    ...INNER_ITEMS,
    ...REFINEMENT_ITEMS.filter((item) => item.layer === 'inner'),
  ] as readonly ScoredItem[]
  const refinedGemItems = [
    ...GEM_ITEMS,
    ...REFINEMENT_ITEMS.filter((item) => item.layer === 'gem'),
  ] as readonly ScoredItem[]

  return {
    instrumentVersion: INSTRUMENT_VERSION,
    persona: baseProfile.persona,
    inner: scoreContextLayer(refinedInnerItems, byId, baseProfile.inner),
    gem: scoreGemLayer(refinedGemItems, byId, baseProfile.gem),
  }
}

function validateAndIndex(items: readonly ScoredItem[], answers: readonly ItemAnswer[]): Map<string, ItemAnswer> {
  if (answers.length !== items.length) {
    throw new InvalidAnswerSetError()
  }

  const expected = new Set(items.map((item) => item.id))
  const byId = new Map<string, ItemAnswer>()

  for (const answer of answers) {
    if (
      !expected.has(answer.itemId) ||
      byId.has(answer.itemId) ||
      !Number.isInteger(answer.value) ||
      answer.value < 1 ||
      answer.value > 4
    ) {
      throw new InvalidAnswerSetError()
    }
    byId.set(answer.itemId, answer)
  }

  return byId
}

function scoreContextLayer(
  items: readonly ScoredItem[],
  byId: ReadonlyMap<string, ItemAnswer>,
  fallback?: ContextLayerProfile,
): ContextLayerProfile {
  const axes = Object.fromEntries(
    CONTEXT_AXES.map((axis) => [axis, scoreAxis(axis, items, byId, fallback?.axes[axis].pole)]),
  ) as Record<ContextAxisId, AxisScore>

  const code = TYPE_AXES.map((axis) => axes[axis].pole).join('') as PersonaCode
  return { axes, code }
}

function scoreGemLayer(
  items: readonly ScoredItem[],
  byId: ReadonlyMap<string, ItemAnswer>,
  fallback?: GemLayerProfile,
): GemLayerProfile {
  const axes = Object.fromEntries(
    GEM_AXES.map((axis) => [axis, scoreAxis(axis, items, byId, fallback?.axes[axis].pole)]),
  ) as Record<GemAxisId, AxisScore>

  const code = GEM_AXES.map((axis) => axes[axis].pole).join('') as GemCode
  return { axes, code }
}

function scoreAxis(
  axis: AxisId,
  items: readonly ScoredItem[],
  byId: ReadonlyMap<string, ItemAnswer>,
  tieFallback?: string,
): AxisScore {
  const axisItems = items.filter((item) => item.axis === axis)
  if (axisItems.length === 0) {
    throw new InvalidAnswerSetError()
  }

  const sum = axisItems.reduce((total, item) => {
    const answer = byId.get(item.id)
    if (!answer) {
      throw new InvalidAnswerSetError()
    }
    const value = agreementToSigned(answer.value)
    return total + (item.reverse ? -value : value)
  }, 0)

  const lean = round(sum / axisItems.length, 4)
  const [firstPole, secondPole] = AXIS_POLES[axis]
  const pole = lean > 0 ? firstPole : lean < 0 ? secondPole : tieFallback || firstPole
  const firstShare = round(((lean + 1) / 2) * 100, 1)

  return {
    answered: axisItems.length,
    clarity: round(Math.abs(lean) * 100, 1),
    firstShare,
    lean,
    pole,
    secondShare: round(100 - firstShare, 1),
  }
}

function agreementToSigned(value: AgreementValue): number {
  return {
    1: -1,
    2: -1 / 3,
    3: 1 / 3,
    4: 1,
  }[value]
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function isAssessmentProfile(value: unknown): value is AssessmentProfile {
  if (!value || typeof value !== 'object') {
    return false
  }
  const profile = value as Partial<AssessmentProfile>
  return (
    profile.instrumentVersion === INSTRUMENT_VERSION &&
    typeof profile.persona?.code === 'string' &&
    typeof profile.inner?.code === 'string' &&
    typeof profile.gem?.code === 'string'
  )
}

export type { AssessmentProfile, InnerCode, ItemAnswer, PersonaCode }
