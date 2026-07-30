export const INSTRUMENT_VERSION = '4.0.0' as const

export const TYPE_AXES = ['EI', 'SN', 'TF', 'JP'] as const
export const GEM_AXES = ['RM', 'OA', 'VH', 'UO'] as const
export const AXES = [...TYPE_AXES, ...GEM_AXES] as const

export type TypeAxisId = (typeof TYPE_AXES)[number]
export type GemAxisId = (typeof GEM_AXES)[number]
export type AxisId = TypeAxisId | GemAxisId

export type PersonaCode = `${'E' | 'I'}${'S' | 'N'}${'T' | 'F'}${'J' | 'P'}`
export type InnerCode = PersonaCode
export type GemCode = `${'R' | 'M'}${'O' | 'A'}${'V' | 'H'}${'U' | 'O'}`

// `O` appears twice across the two codes and they are different constructs: the second GemCode letter is OA's
// connected pole, the fourth is UO's preserving focus. Always write `OA.O` / `UO.O`, never a bare "O pole".
export const AXIS_POLES = {
  EI: ['E', 'I'],
  SN: ['S', 'N'],
  TF: ['T', 'F'],
  JP: ['J', 'P'],
  RM: ['R', 'M'],
  OA: ['O', 'A'],
  VH: ['V', 'H'],
  UO: ['U', 'O'],
} as const satisfies Record<AxisId, readonly [string, string]>

/**
 * Whether a code letter is the axis's FIRST pole. Everything that reads a letter needs this and nothing can
 * avoid it: indexing a template-literal code type yields a bare `string`, and a declared letter is respondent
 * input, so anything that is not the first pole folds onto the second. Folding rather than throwing is what
 * keeps every downstream lookup on a key the copy tables own.
 *
 * The fold was written out four times — `poleOf` in the free engine, `poleLabel` in the paid engine, and inline
 * in both `axisMovement` and `namedAxis` — and each copy's comment pointed at one of the others as the reason it
 * was correct. It is the predicate rather than the pole because the four callers want different things out of
 * it: a pole letter, a pole label, and twice a whole `NamedPole`.
 */
export function isFirstPole(axis: AxisId, letter: string | undefined): boolean {
  return letter === AXIS_POLES[axis][0]
}

/** The pole letter a code letter names, folded. For callers that key a table by the pole itself. */
export function leadingPole(axis: AxisId, letter: string | undefined): string {
  const [first, second] = AXIS_POLES[axis]
  return isFirstPole(axis, letter) ? first : second
}

export type AgreementValue = 1 | 2 | 3 | 4
export type OptionIndex = 0 | 1 | 2 | 3

export type ItemAnswer = {
  itemId: string
  value: AgreementValue
}

// Forced-choice answers carry an option index, not an agreement level. The distinct field name is the point:
// it makes feeding a Likert answer into the work tally a type error rather than a silent miscount.
export type WorkAnswer = {
  itemId: string
  optionIndex: OptionIndex
}

/** The four-letter self-declaration is offered, never measured. Only whether it was given survives scoring. */
/**
 * How the four self-reported letters were obtained. `guided` came from the four self-image questions and
 * `declared` was typed in; both are self-report and both feed the same comparison. `unknown` means the reader
 * offered nothing, and it is the only value that omits the comparison from the report.
 */
export type PersonaSource = 'declared' | 'guided' | 'unknown'

// Two band scales that must never merge. The free pass reports a provisional ruler, the paid pass a settled
// one; a shared union would let a free screen render settled wording. `tie` is defensive only — see AxisScore.
export type TentativeBand = 'faint3' | 'moderate3' | 'distinct3'
export type ClarityBand = 'faint' | 'moderate' | 'distinct' | 'tie'

/** Free → paid movement of the clarity ruler. Never movement of a letter: the poles are frozen. */
export type BandShift = 'up' | 'down' | 'same'

export type BandCopy = {
  detail: string
  label: string
}

export type DrainSpread = 'single' | 'double' | 'triple'
/** At exposure 2 the top facet cannot lead by more than one pick, so `single` is structurally unreachable. */
export type FreeDrainSpread = Exclude<DrainSpread, 'single'>

export type AxisScore = {
  /** Number of items contributing to this axis. Always odd, which is what keeps `pole` decidable. */
  answered: number
  /** Share associated with the first pole in AXIS_POLES, from 0 to 100. */
  firstShare: number
  /** Signed mean toward the first pole, from -1 to 1. Reported, never compared against a band cut. */
  lean: number
  /** Null only at an exact tie, which the odd item count makes unreachable. Kept so the tie cannot be hidden. */
  pole: string | null
  /** Integer sum of `agreementToSigned * 3`. Band cuts compare `Math.abs(score)` and nothing else. */
  score: number
  /** Share associated with the second pole in AXIS_POLES, from 0 to 100. */
  secondShare: number
}

export type FreeAxisScore = AxisScore & {
  band3: TentativeBand
}

export type RefinedAxisScore = AxisScore & {
  /** The free band this axis carried, kept so the paid screen can name the movement instead of asserting it. */
  band3: TentativeBand
  band5: ClarityBand
  /** True when the added items lean against the frozen pole. Forces `shift` to 'down' before any comparison. */
  evidenceSplit: boolean
  shift: BandShift
}

export type InnerLayerProfile<Score extends AxisScore> = {
  axes: Record<TypeAxisId, Score>
  code: InnerCode
}

export type GemLayerProfile<Score extends AxisScore> = {
  axes: Record<GemAxisId, Score>
  code: GemCode
}

export type InterestFacet = 'MAKE' | 'ANALYZE' | 'CREATE' | 'HELP' | 'LEAD' | 'ORDER'
export type NeedFacet = 'AUT' | 'MASTER' | 'IMPACT' | 'BELONG' | 'STABLE' | 'NOVEL'
export type DrainFacet = 'BREAK' | 'VAGUE' | 'EMPTY' | 'TENSION' | 'OVERLOAD' | 'STUCK'
export type PurposeFacet = 'SOLVE' | 'UNDERSTAND' | 'EXPRESS' | 'CARE' | 'MOVE' | 'STEADY'
export type EnvironmentFacet =
  | 'FOCUS_ENV'
  | 'TOGETHER_ENV'
  | 'FREEDOM_ENV'
  | 'CLEAR_ENV'
  | 'VARIETY_ENV'
  | 'VISIBLE_ENV'
export type WorkFacetId = InterestFacet | NeedFacet | DrainFacet | PurposeFacet | EnvironmentFacet

export type WorkDimension = 'interest' | 'need' | 'drain' | 'purpose' | 'environment'
/** Drain items are authored as either a demand scene or a resource scene. Split reporting is paid-only. */
export type DrainFraming = 'demand' | 'resource'

export const WORK_DIMENSIONS = ['interest', 'need', 'drain', 'purpose', 'environment'] as const

// The `_ENV` suffix on environment facets is canonical, not decoration: `FOCUS`/`CLEAR` would collide with
// interest and purpose keys once the five tallies are rendered from one label lookup.
export const WORK_FACETS = {
  interest: ['MAKE', 'ANALYZE', 'CREATE', 'HELP', 'LEAD', 'ORDER'],
  need: ['AUT', 'MASTER', 'IMPACT', 'BELONG', 'STABLE', 'NOVEL'],
  drain: ['BREAK', 'VAGUE', 'EMPTY', 'TENSION', 'OVERLOAD', 'STUCK'],
  purpose: ['SOLVE', 'UNDERSTAND', 'EXPRESS', 'CARE', 'MOVE', 'STEADY'],
  environment: ['FOCUS_ENV', 'TOGETHER_ENV', 'FREEDOM_ENV', 'CLEAR_ENV', 'VARIETY_ENV', 'VISIBLE_ENV'],
} as const satisfies Record<WorkDimension, readonly WorkFacetId[]>

// Ipsative counts: every option carries the same weight, so a respondent's six facet counts always sum to the
// item count. They cannot be compared across people and share no scale with `lean`, which is why this never
// becomes an AxisScore.
export type WorkFacetTally<Facet extends WorkFacetId> = {
  counts: Readonly<Record<Facet, number>>
  /** Times each facet was offered. A count of 2 means nothing until you know whether 2 or 4 chances existed. */
  exposure: number
  /** Facets tied at the top count, in WORK_FACETS order. */
  leaders: readonly Facet[]
  /** Top count minus runner-up count, in picks — not in summed option weights. */
  separation: number
}

export type DrainTally<Spread extends DrainSpread> = WorkFacetTally<DrainFacet> & {
  spread: Spread
}

// The free tier answers three drain items and nothing else, so the other four dimensions are absent by
// construction. A discriminated union rather than optional fields: a free render that reaches for `interest`
// should fail to compile, not read undefined.
export type FreeWorkProfile = {
  drain: DrainTally<FreeDrainSpread>
  scope: 'free'
}

export type RefinedWorkProfile = {
  drain: DrainTally<DrainSpread>
  environment: WorkFacetTally<EnvironmentFacet>
  interest: WorkFacetTally<InterestFacet>
  need: WorkFacetTally<NeedFacet>
  purpose: WorkFacetTally<PurposeFacet>
  scope: 'refined'
}

export type WorkProfile = FreeWorkProfile | RefinedWorkProfile

export type FreeAssessmentProfile = {
  gem: GemLayerProfile<FreeAxisScore>
  inner: InnerLayerProfile<FreeAxisScore>
  instrumentVersion: typeof INSTRUMENT_VERSION
  personaSource: PersonaSource
  tier: 'free'
  work: FreeWorkProfile
}

export type RefinedAssessmentProfile = {
  gem: GemLayerProfile<RefinedAxisScore>
  inner: InnerLayerProfile<RefinedAxisScore>
  instrumentVersion: typeof INSTRUMENT_VERSION
  personaSource: PersonaSource
  tier: 'refined'
  work: RefinedWorkProfile
}

export type AssessmentProfile = FreeAssessmentProfile | RefinedAssessmentProfile

/** The option set of the self-declaration picker. Nothing in scoring reads it. */
export const PERSONA_CODES = [
  'ESTJ',
  'ESTP',
  'ESFJ',
  'ESFP',
  'ENTJ',
  'ENTP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISTP',
  'ISFJ',
  'ISFP',
  'INTJ',
  'INTP',
  'INFJ',
  'INFP',
] as const satisfies readonly PersonaCode[]

export const GEM_CODES = [
  'ROVU',
  'ROVO',
  'ROHU',
  'ROHO',
  'RAVU',
  'RAVO',
  'RAHU',
  'RAHO',
  'MOVU',
  'MOVO',
  'MOHU',
  'MOHO',
  'MAVU',
  'MAVO',
  'MAHU',
  'MAHO',
] as const satisfies readonly GemCode[]
