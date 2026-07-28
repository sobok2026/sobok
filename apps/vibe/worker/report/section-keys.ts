// The report section vocabulary, and the only place it is declared. It used to live in `worker/db/schema.ts`
// with a hand-copied duplicate in `_lib/api.ts`, which is how the two drifted; importing the schema module
// instead would drag drizzle and the top-level `pgSchema()` side effect into the Next client graph. So this
// module stays dependency-free and both trees import it, the same arrangement `api/deep-type/actions.ts` uses.

export const REPORT_SCHEMA_VERSIONS = ['1', '2'] as const
export type ReportSchemaVersion = (typeof REPORT_SCHEMA_VERSIONS)[number]

/**
 * Written on every new row. Stored rows are never migrated to a newer vocabulary — a purchase carries a
 * one-year re-open window, so v1 documents keep rendering for a year after the last v1 write.
 */
export const CURRENT_REPORT_SCHEMA_VERSION = '2' satisfies ReportSchemaVersion

/**
 * v1 — retired for writes, frozen for reads. Six of these keys (`selfWorth`, `relationships`,
 * `emotionRegulation`, `motivation`, `workStyle`, `recovery`) describe an inner-life report that the career
 * pivot no longer produces. Deleting the union would not delete the rows.
 */
export const REPORT_SECTION_KEYS_V1 = [
  'summary',
  'contextShift',
  'selfWorth',
  'relationships',
  'emotionRegulation',
  'motivation',
  'workStyle',
  'recovery',
  'strengths',
  'friction',
  'reflectionQuestions',
  'nextSteps',
] as const

export type ReportSectionKeyV1 = (typeof REPORT_SECTION_KEYS_V1)[number]

/**
 * v2 — the career vocabulary (MIGRATION §4.1). Order is the section table's own 1..12, which is generation
 * order: `openingRead` reads sections 1~7 and therefore cannot be produced before them. Display order is a
 * render decision and is not this array's job.
 */
export const REPORT_SECTION_KEYS_V2 = [
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

export type ReportSectionKeyV2 = (typeof REPORT_SECTION_KEYS_V2)[number]

/** Unqualified names mean the current vocabulary. Legacy call sites must name `_V1` out loud. */
export const REPORT_SECTION_KEYS = REPORT_SECTION_KEYS_V2
export type ReportSectionKey = ReportSectionKeyV2

/**
 * What a reader may encounter in `report.sections` / `report.narrative`. `contextShift` and
 * `reflectionQuestions` are members of both vocabularies and mean the same thing in both, so the overlap is
 * intentional rather than an accident to clean up. Everything else is disjoint, which is what lets a renderer
 * fall back on the key alone when a row predates `schema_version`.
 */
export type StoredReportSectionKey = ReportSectionKeyV1 | ReportSectionKeyV2

export type ReportSectionKeyFor<Version extends ReportSchemaVersion> = Version extends '1'
  ? ReportSectionKeyV1
  : ReportSectionKeyV2

export interface ReportSectionOf<Key extends StoredReportSectionKey> {
  body: string
  key: Key
  title: string
}

export type ReportSection = ReportSectionOf<ReportSectionKey>
export type ReportSectionV1 = ReportSectionOf<ReportSectionKeyV1>
export type StoredReportSection = ReportSectionOf<StoredReportSectionKey>

export function isReportSchemaVersion(value: string): value is ReportSchemaVersion {
  return (REPORT_SCHEMA_VERSIONS as readonly string[]).includes(value)
}

/** Read-path dispatch. An unknown stored value is treated as v1 because that is what the column defaults to. */
export function sectionKeysFor(version: string): readonly StoredReportSectionKey[] {
  return version === '2' ? REPORT_SECTION_KEYS_V2 : REPORT_SECTION_KEYS_V1
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
  strengthCards: { generator: 'ENGINE', inputSource: 'free-only', onFailure: 'unreachable' },
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
} as const satisfies Record<ReportSectionKeyV2, ReportSectionContract>

type SectionKeysWhere<Field extends keyof ReportSectionContract, Value> = {
  [Key in ReportSectionKeyV2]: (typeof REPORT_SECTION_CONTRACT)[Key][Field] extends Value ? Key : never
}[ReportSectionKeyV2]

export type EngineSectionKey = SectionKeysWhere<'generator', 'ENGINE'>
export type NarratedSectionKey = Exclude<ReportSectionKeyV2, EngineSectionKey>
/** Never derivable in the browser. A free-bundle module that names one of these should fail to compile. */
export type PaidSectionKey = SectionKeysWhere<'inputSource', 'paid'>
export type FreeSafeSectionKey = Exclude<ReportSectionKeyV2, PaidSectionKey>

export const ENGINE_SECTION_KEYS = REPORT_SECTION_KEYS_V2.filter(
  (key): key is EngineSectionKey => REPORT_SECTION_CONTRACT[key].generator === 'ENGINE',
)

/** What the LLM pass may return. Anything outside this set is dropped rather than stored. */
export const NARRATED_SECTION_KEYS = REPORT_SECTION_KEYS_V2.filter(
  (key): key is NarratedSectionKey => REPORT_SECTION_CONTRACT[key].generator !== 'ENGINE',
)

export const PAID_SECTION_KEYS = REPORT_SECTION_KEYS_V2.filter(
  (key): key is PaidSectionKey => REPORT_SECTION_CONTRACT[key].inputSource === 'paid',
)

export const FREE_SAFE_SECTION_KEYS = REPORT_SECTION_KEYS_V2.filter(
  (key): key is FreeSafeSectionKey => REPORT_SECTION_CONTRACT[key].inputSource !== 'paid',
)

/**
 * D3: the free-text `careerContext` is not collected in v1, so each of these sections carries one part —
 * `threePaths`' stay route, `fitAndFriction` as a whole, `roleFamilies`' "experience to carry over" — whose
 * confidence is pinned at "needs more input". Pinned, not defaulted: no later answer raises it, because no
 * question asks. Listed by key so the copy layer cannot quietly drop the marker from one of the three.
 */
export const CONTEXT_DEPENDENT_SECTION_KEYS = [
  'roleFamilies',
  'threePaths',
  'fitAndFriction',
] as const satisfies readonly ReportSectionKeyV2[]
