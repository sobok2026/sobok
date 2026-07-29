import {
  type AgreementValue,
  type AssessmentProfile,
  AXIS_POLES,
  type AxisId,
  type AxisScore,
  type BandShift,
  type ClarityBand,
  type DrainFacet,
  type DrainSpread,
  type FreeAssessmentProfile,
  type FreeAxisScore,
  type FreeDrainSpread,
  type FreeWorkProfile,
  GEM_AXES,
  type GemCode,
  INSTRUMENT_VERSION,
  type InnerCode,
  type ItemAnswer,
  type PersonaCode,
  type PersonaSource,
  type RefinedAssessmentProfile,
  type RefinedAxisScore,
  type RefinedWorkProfile,
  type TentativeBand,
  TYPE_AXES,
  WORK_FACETS,
  type WorkAnswer,
  type WorkFacetId,
  type WorkFacetTally,
  type WorkProfile,
} from './model'
import { FREE_LIKERT_ITEMS, FREE_WORK_ITEMS, PAID_LIKERT_ITEMS, WORK_ITEMS, type WorkItem } from './questionnaire'

type ScoredItem = {
  readonly axis: AxisId
  readonly id: string
  readonly reverse: boolean
}

export class InvalidAnswerSetError extends Error {
  constructor() {
    super('invalid answer set')
  }
}

/** Thrown where an exact tie would have to be reported as a letter. Odd item counts make it unreachable. */
export class UnreachableTieError extends Error {
  constructor(axis: string) {
    super(`axis ${axis} produced an exact tie`)
  }
}

export function scoreBaseAssessment(
  baseAnswers: readonly ItemAnswer[],
  workAnswers: readonly WorkAnswer[],
  declaredPersona: PersonaCode | null,
  declaredSource: Exclude<PersonaSource, 'unknown'> = 'declared',
): FreeAssessmentProfile {
  const byId = validateAndIndex(FREE_LIKERT_ITEMS, baseAnswers)
  const tallies = tallyAxes(FREE_LIKERT_ITEMS, byId)

  const score = (axis: AxisId): FreeAxisScore => ({ ...tallies[axis], band3: resolveTentativeBand(tallies[axis]) })

  return {
    gem: {
      axes: fromAxes(GEM_AXES, score),
      code: GEM_AXES.map((axis) => requirePole(axis, tallies[axis])).join('') as GemCode,
    },
    inner: {
      axes: fromAxes(TYPE_AXES, score),
      code: TYPE_AXES.map((axis) => requirePole(axis, tallies[axis])).join('') as InnerCode,
    },
    instrumentVersion: INSTRUMENT_VERSION,
    personaSource: declaredPersona ? declaredSource : 'unknown',
    tier: 'free',
    work: scoreFreeWorkProfile(workAnswers),
  }
}

/**
 * The four type letters, off the twelve type items alone. The free run settles them at its halfway mark and the
 * screen says so there, so the sentence on that screen has to come from this file: a letter derived anywhere
 * else can disagree with the report twelve items later, and a reveal that contradicts the result is worse than
 * no reveal.
 *
 * It is the same tally `scoreBaseAssessment` runs, restricted to the type axes, so the letters it returns are
 * the ones the full pass will return. The twelve core items cannot move them — an axis is scored from its own
 * items only — and the odd count per axis keeps every letter decided.
 */
export function readTypeLetters(typeAnswers: readonly ItemAnswer[]): InnerCode {
  const typeItems = FREE_LIKERT_ITEMS.filter((item) => (TYPE_AXES as readonly AxisId[]).includes(item.axis))
  const byId = validateAndIndex(typeItems, typeAnswers)
  // Per type axis rather than through `tallyAxes`, which walks all eight and would throw on the four core axes
  // this restricted item set has nothing for.
  return TYPE_AXES.map((axis) => requirePole(axis, tallyAxis(axis, typeItems, byId))).join('') as InnerCode
}

// The paid pass re-derives the ruler and nothing else. Poles and both codes are copied from the free result
// byte for byte, so no amount of added evidence can flip a letter after payment. Where the added items lean the
// other way the report says so through `evidenceSplit` and a downward `shift`, never by relabelling the axis.
export function scoreRefinedAssessment(
  baseAnswers: readonly ItemAnswer[],
  refinementAnswers: readonly ItemAnswer[],
  workAnswers: readonly WorkAnswer[],
  declaredPersona: PersonaCode | null,
  declaredSource: Exclude<PersonaSource, 'unknown'> = 'declared',
): RefinedAssessmentProfile {
  const baseById = validateAndIndex(FREE_LIKERT_ITEMS, baseAnswers)
  const refinementById = validateAndIndex(PAID_LIKERT_ITEMS, refinementAnswers)
  const cumulative = [...FREE_LIKERT_ITEMS, ...PAID_LIKERT_ITEMS]

  const baseTallies = tallyAxes(FREE_LIKERT_ITEMS, baseById)
  const cumulativeTallies = tallyAxes(cumulative, new Map([...baseById, ...refinementById]))

  const score = (axis: AxisId): RefinedAxisScore => {
    const free = baseTallies[axis]
    const refined = cumulativeTallies[axis]
    const band3 = resolveTentativeBand(free)
    const band5 = resolveClarityBand(refined)
    const evidenceSplit = Math.sign(refined.score) !== Math.sign(free.score)

    return {
      ...refined,
      band3,
      band5,
      evidenceSplit,
      // Frozen, not recomputed: the code below must stay identical to the free one.
      pole: free.pole,
      shift: evidenceSplit ? 'down' : compareBands(band3, band5),
    }
  }

  return {
    gem: {
      axes: fromAxes(GEM_AXES, score),
      code: GEM_AXES.map((axis) => requirePole(axis, baseTallies[axis])).join('') as GemCode,
    },
    inner: {
      axes: fromAxes(TYPE_AXES, score),
      code: TYPE_AXES.map((axis) => requirePole(axis, baseTallies[axis])).join('') as InnerCode,
    },
    instrumentVersion: INSTRUMENT_VERSION,
    personaSource: declaredPersona ? declaredSource : 'unknown',
    tier: 'refined',
    work: scoreRefinedWorkProfile(workAnswers),
  }
}

function fromAxes<Axis extends AxisId, Score>(axes: readonly Axis[], score: (axis: Axis) => Score) {
  return Object.fromEntries(axes.map((axis) => [axis, score(axis)])) as Record<Axis, Score>
}

function requirePole(axis: AxisId, score: AxisScore): string {
  if (score.pole === null) {
    throw new UnreachableTieError(axis)
  }
  return score.pole
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

function tallyAxes(items: readonly ScoredItem[], byId: ReadonlyMap<string, ItemAnswer>): Record<AxisId, AxisScore> {
  return {
    ...fromAxes(TYPE_AXES, (axis) => tallyAxis(axis, items, byId)),
    ...fromAxes(GEM_AXES, (axis) => tallyAxis(axis, items, byId)),
  }
}

// No ipsatization anywhere in this file, ever. Centring an axis against a respondent's own mean would take
// `score` off the integer lattice and put exact ties back on the table, which is what the odd count buys.
function tallyAxis(axis: AxisId, items: readonly ScoredItem[], byId: ReadonlyMap<string, ItemAnswer>): AxisScore {
  const axisItems = items.filter((item) => item.axis === axis)
  if (axisItems.length === 0) {
    throw new InvalidAnswerSetError()
  }

  const score = axisItems.reduce((total, item) => {
    const answer = byId.get(item.id)
    if (!answer) {
      throw new InvalidAnswerSetError()
    }
    const value = AGREEMENT_SCORE[answer.value]
    return total + (item.reverse ? -value : value)
  }, 0)

  const lean = round(score / (3 * axisItems.length), 4)
  const [firstPole, secondPole] = AXIS_POLES[axis]
  const firstShare = round(((lean + 1) / 2) * 100, 1)

  return {
    answered: axisItems.length,
    firstShare,
    lean,
    pole: score > 0 ? firstPole : score < 0 ? secondPole : null,
    score,
    secondShare: round(100 - firstShare, 1),
  }
}

// Integer form of `agreementToSigned`. Everything downstream of a band cut reads this and never the rounded
// mean: `round(3 / 9, 4)` is 0.3333, which sits below 1/3, so a rational cut silently deletes a whole band.
const AGREEMENT_SCORE = { 1: -3, 2: -1, 3: 1, 4: 3 } as const satisfies Record<AgreementValue, number>

export function agreementToSigned(value: AgreementValue): number {
  return AGREEMENT_SCORE[value] / 3
}

/** |S3| over three items, denominator 9. */
function resolveTentativeBand(score: AxisScore): TentativeBand {
  const magnitude = Math.abs(score.score)
  return magnitude >= 5 ? 'distinct3' : magnitude === 3 ? 'moderate3' : 'faint3'
}

/** |S5| over five items, denominator 15. */
function resolveClarityBand(score: AxisScore): ClarityBand {
  const magnitude = Math.abs(score.score)
  if (magnitude === 0) {
    return 'tie'
  }
  return magnitude >= 7 ? 'distinct' : magnitude === 5 ? 'moderate' : 'faint'
}

const BAND_RANK = {
  distinct3: 2,
  moderate3: 1,
  faint3: 0,
  distinct: 2,
  moderate: 1,
  faint: 0,
  tie: -1,
} as const satisfies Record<TentativeBand | ClarityBand, number>

function compareBands(band3: TentativeBand, band5: ClarityBand): BandShift {
  const before = BAND_RANK[band3]
  const after = BAND_RANK[band5]
  return after > before ? 'up' : after < before ? 'down' : 'same'
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function scoreWorkProfile(answers: readonly WorkAnswer[]): WorkProfile {
  return answers.length === FREE_WORK_ITEMS.length ? scoreFreeWorkProfile(answers) : scoreRefinedWorkProfile(answers)
}

function scoreFreeWorkProfile(answers: readonly WorkAnswer[]): FreeWorkProfile {
  const picks = validateAndIndexWork(FREE_WORK_ITEMS, answers)
  const drain = tallyFacets('drain', WORK_FACETS.drain, picks)
  return {
    drain: { ...drain, spread: resolveDrainBand(drain.counts, 2) },
    scope: 'free',
  }
}

function scoreRefinedWorkProfile(answers: readonly WorkAnswer[]): RefinedWorkProfile {
  const picks = validateAndIndexWork(WORK_ITEMS, answers)
  const drain = tallyFacets('drain', WORK_FACETS.drain, picks)
  return {
    drain: { ...drain, spread: resolveDrainBand(drain.counts, 4) },
    environment: tallyFacets('environment', WORK_FACETS.environment, picks),
    interest: tallyFacets('interest', WORK_FACETS.interest, picks),
    need: tallyFacets('need', WORK_FACETS.need, picks),
    purpose: tallyFacets('purpose', WORK_FACETS.purpose, picks),
    scope: 'refined',
  }
}

type WorkPick = { facet: WorkFacetId; item: WorkItem }

function validateAndIndexWork(items: readonly WorkItem[], answers: readonly WorkAnswer[]): readonly WorkPick[] {
  if (answers.length !== items.length) {
    throw new InvalidAnswerSetError()
  }

  const byId = new Map(items.map((item) => [item.id, item]))
  const seen = new Set<string>()

  return answers.map((answer) => {
    const item = byId.get(answer.itemId)
    if (!item || seen.has(answer.itemId) || !Number.isInteger(answer.optionIndex)) {
      throw new InvalidAnswerSetError()
    }
    const facet = item.facets[answer.optionIndex]
    if (!facet) {
      throw new InvalidAnswerSetError()
    }
    seen.add(answer.itemId)
    return { facet, item }
  })
}

function tallyFacets<Facet extends WorkFacetId>(
  dimension: WorkItem['dimension'],
  facets: readonly Facet[],
  picks: readonly WorkPick[],
): WorkFacetTally<Facet> {
  const counts: Record<string, number> = Object.fromEntries(facets.map((facet) => [facet, 0]))

  let answered = 0
  for (const pick of picks) {
    if (pick.item.dimension !== dimension) {
      continue
    }
    answered += 1
    counts[pick.facet] = (counts[pick.facet] ?? 0) + 1
  }

  const ranked = facets.map((facet) => counts[facet] ?? 0).sort((a, b) => b - a)
  const top = ranked[0] ?? 0

  return {
    counts: counts as Record<Facet, number>,
    // Four options per item over six facets: each facet is offered two thirds of the item count.
    exposure: (answered * 4) / 6,
    leaders: facets.filter((facet) => counts[facet] === top),
    separation: top - (ranked[1] ?? 0),
  }
}

/**
 * At exposure 2 the six facets are offered across three items, so no facet can be picked more than twice and
 * the count vector is either (2,1) or (1,1,1) — a leader is arithmetically impossible. The overloads make that
 * a compile-time fact rather than a comment, and the runtime check keeps a wrong exposure from being asserted.
 */
export function resolveDrainBand(counts: Readonly<Record<DrainFacet, number>>, exposure: 2): FreeDrainSpread
export function resolveDrainBand(counts: Readonly<Record<DrainFacet, number>>, exposure: 4): DrainSpread
export function resolveDrainBand(counts: Readonly<Record<DrainFacet, number>>, exposure: 2 | 4): DrainSpread {
  const picks = WORK_FACETS.drain.reduce((total, facet) => total + counts[facet], 0)
  if (picks !== (exposure * 6) / 4) {
    throw new InvalidAnswerSetError()
  }

  const ranked = WORK_FACETS.drain.map((facet) => counts[facet]).sort((a, b) => b - a)
  const separation = (ranked[0] ?? 0) - (ranked[1] ?? 0)
  return separation >= 2 ? 'single' : separation === 1 ? 'double' : 'triple'
}

// Read-path gates. A stored profile only survives if it declares this instrument version and its own tier:
// the version bump alone never blocked anything, because nothing called the old guard.
export function isFreeProfile(value: unknown): value is FreeAssessmentProfile {
  return isProfile(value) && value.tier === 'free'
}

export function isRefinedProfile(value: unknown): value is RefinedAssessmentProfile {
  return isProfile(value) && value.tier === 'refined'
}

function isProfile(value: unknown): value is AssessmentProfile {
  if (!value || typeof value !== 'object') {
    return false
  }
  const profile = value as Partial<AssessmentProfile>
  return (
    profile.instrumentVersion === INSTRUMENT_VERSION &&
    typeof profile.inner?.code === 'string' &&
    typeof profile.gem?.code === 'string' &&
    (profile.personaSource === 'declared' || profile.personaSource === 'unknown')
  )
}

export type { AssessmentProfile, InnerCode, ItemAnswer, PersonaCode, PersonaSource, WorkAnswer }
