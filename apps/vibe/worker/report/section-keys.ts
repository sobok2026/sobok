// The report section vocabulary, and the only place it is declared. It used to live in `worker/db/schema.ts`
// with a hand-copied duplicate in `_lib/api.ts`, which is how the two drifted; importing the schema module
// instead would drag drizzle and the top-level `pgSchema()` side effect into the Next client graph. So this
// module stays dependency-free and both trees import it, the same arrangement `api/deep-type/actions.ts` uses.

/**
 * The career vocabulary (MIGRATION §4.1), and the only one. Order is the section table's own 1..12, which is
 * generation order: `openingRead` reads sections 1~7 and therefore cannot be produced before them. Display
 * order is a render decision and is not this array's job.
 */
export const REPORT_SECTION_KEYS = [
  'worldJob',
  'strengthCards',
  'drainSignature',
  'happinessConditions',
  'interestProfile',
  'roleFamilies',
  'weekQuest',
  'contextShift',
  'threePaths',
  'fitAndFriction',
  'openingRead',
  'reflectionQuestions',
] as const

export type ReportSectionKey = (typeof REPORT_SECTION_KEYS)[number]

/** Exactly what a row of `report.sections` / `report.narrative` holds. */
export interface ReportSection {
  body: string
  key: ReportSectionKey
  title: string
}

/** Who writes the body. ENGINE bodies exist without the LLM; HYBRID keeps an engine body under the narration. */
export type SectionGenerator = 'ENGINE' | 'HYBRID' | 'LLM'

/**
 * Which answer set the section is derived from (MIGRATION §4.1 '입력 출처'). This is the input to the free/paid
 * engine split, so it is a constant rather than a comment: `paid` sections may never be produced by the
 * isomorphic free engine, which ships to the browser.
 */
export type SectionInputSource = 'free-only' | 'mixed' | 'paid'

/**
 * §4.1 '실패 시'. `unreachable` is a claim about the engine being total, not a wish — the sections that carry
 * it read tables that are complete for every code and every band.
 */
export type SectionFailureMode = 'drop-section' | 'keep-engine-body' | 'omit-section' | 'unreachable'

export interface ReportSectionContract {
  generator: SectionGenerator
  inputSource: SectionInputSource
  onFailure: SectionFailureMode
}

export const REPORT_SECTION_CONTRACT = {
  worldJob: { generator: 'ENGINE', inputSource: 'free-only', onFailure: 'unreachable' },
  // The cards themselves are free-only and are not recomputed here. `mixed` is for what the paid tier adds on
  // top: the settled band and its movement for all eight axes (D14). Same shape as `drainSignature` — one key,
  // a free reading and a richer paid one — and the same consequence: the free engine may still emit it.
  strengthCards: { generator: 'ENGINE', inputSource: 'mixed', onFailure: 'unreachable' },
  // Dual output, one key: the free pass answers three drain items and the paid pass six. `mixed` is what makes
  // the free engine allowed to emit it at all.
  drainSignature: { generator: 'ENGINE', inputSource: 'mixed', onFailure: 'unreachable' },
  happinessConditions: { generator: 'ENGINE', inputSource: 'paid', onFailure: 'unreachable' },
  interestProfile: { generator: 'ENGINE', inputSource: 'paid', onFailure: 'unreachable' },
  // The only ENGINE section that can be absent: the 36-cell interest x environment map is unwritten, and an
  // engine that invents a role family it has no table for is worse than a report with eleven sections.
  roleFamilies: { generator: 'ENGINE', inputSource: 'paid', onFailure: 'omit-section' },
  weekQuest: { generator: 'ENGINE', inputSource: 'paid', onFailure: 'unreachable' },
  // Generated only when a four-letter self-declaration exists. With `personaSource === 'unknown'` there is no
  // second reading to contrast, and contrasting against a measured persona is exactly what D13 removed.
  contextShift: { generator: 'HYBRID', inputSource: 'mixed', onFailure: 'omit-section' },
  threePaths: { generator: 'HYBRID', inputSource: 'paid', onFailure: 'keep-engine-body' },
  fitAndFriction: { generator: 'HYBRID', inputSource: 'paid', onFailure: 'keep-engine-body' },
  openingRead: { generator: 'LLM', inputSource: 'mixed', onFailure: 'drop-section' },
  reflectionQuestions: { generator: 'LLM', inputSource: 'mixed', onFailure: 'drop-section' },
} as const satisfies Record<ReportSectionKey, ReportSectionContract>

type SectionKeysWhere<Field extends keyof ReportSectionContract, Value> = {
  [Key in ReportSectionKey]: (typeof REPORT_SECTION_CONTRACT)[Key][Field] extends Value ? Key : never
}[ReportSectionKey]

export type EngineSectionKey = SectionKeysWhere<'generator', 'ENGINE'>
export type NarratedSectionKey = Exclude<ReportSectionKey, EngineSectionKey>
/** Never derivable in the browser. A free-bundle module that names one of these should fail to compile. */
export type PaidSectionKey = SectionKeysWhere<'inputSource', 'paid'>
export type FreeSafeSectionKey = Exclude<ReportSectionKey, PaidSectionKey>

export const ENGINE_SECTION_KEYS = REPORT_SECTION_KEYS.filter(
  (key): key is EngineSectionKey => REPORT_SECTION_CONTRACT[key].generator === 'ENGINE',
)

/** What the LLM pass may return. Anything outside this set is dropped rather than stored. */
export const NARRATED_SECTION_KEYS = REPORT_SECTION_KEYS.filter(
  (key): key is NarratedSectionKey => REPORT_SECTION_CONTRACT[key].generator !== 'ENGINE',
)

export const PAID_SECTION_KEYS = REPORT_SECTION_KEYS.filter(
  (key): key is PaidSectionKey => REPORT_SECTION_CONTRACT[key].inputSource === 'paid',
)

export const FREE_SAFE_SECTION_KEYS = REPORT_SECTION_KEYS.filter(
  (key): key is FreeSafeSectionKey => REPORT_SECTION_CONTRACT[key].inputSource !== 'paid',
)

/**
 * D3: the free-text `careerContext` is not collected at all, so each of these sections carries one part —
 * `threePaths`' stay route, `fitAndFriction` as a whole, `roleFamilies`' "experience to carry over" — whose
 * confidence is pinned at "needs more input". Pinned, not defaulted: no later answer raises it, because no
 * question asks. Listed by key so the copy layer cannot quietly drop the marker from one of the three.
 */
export const CONTEXT_DEPENDENT_SECTION_KEYS = [
  'roleFamilies',
  'threePaths',
  'fitAndFriction',
] as const satisfies readonly ReportSectionKey[]
