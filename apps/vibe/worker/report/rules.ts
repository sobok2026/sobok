import { type AxisCopy, axisCopyFor } from '@deep-type/content/axis-copy'
import { type NamedFacet, nameFacets, rankFacetCounts, shownDrainFacets } from '@deep-type/facets'
import {
  type AxisId,
  type BandCopy,
  type DrainFacet,
  type DrainTally,
  type FreeAssessmentProfile,
  GEM_AXES,
  type InterestFacet,
  isFirstPole,
  type PersonaCode,
  type RefinedAssessmentProfile,
  type RefinedAxisScore,
  TYPE_AXES,
  type TypeAxisId,
  WORK_FACETS,
} from '@deep-type/model'
import { resolveDrainBand } from '@deep-type/scoring'
import type { Locale } from '@sobok/domain/locale'
import {
  BAND_SHIFT_PAID,
  CLARITY_BANDS_PAID,
  CLARITY_NOTE_PAID,
  DRAIN_SPREAD_MEANING,
  DRAIN_SPREAD_PAID,
} from '../../deep-type/content/band-labels.paid'
import { DRAIN_LABELS } from '../../deep-type/content/work-labels.free'
import {
  ENVIRONMENT_LABELS,
  INTEREST_LABELS,
  NEED_LABELS,
  PURPOSE_LABELS,
} from '../../deep-type/content/work-labels.paid'
import {
  CONFIDENCE_LABELS,
  type ConfidenceLevel,
  EXAMPLE_ROLE_NOTICE,
  ROLE_FAMILIES,
  ROLE_FAMILY_CARRY_OVER,
  type RoleFamilyPick,
  resolveRoleFamilies,
} from '../../deep-type/role-families'
import { buildFreeReport, type FreeReport, type FreeStrengthCard } from '../../deep-type/rules/free'
import { assertClaims, type ClaimableEvidenceId, INTERPRETATION_BOUNDARY } from './claims'
import {
  REPORT_SECTION_CONTRACT,
  type ReportSection,
  type ReportSectionKey,
  type SectionInputSource,
} from './section-keys'

// The paid rule engine. Server-only, and the import list is where that is enforced: `work-labels.paid`,
// `band-labels.paid` and `role-families` are the three tables the free bundle may not carry, and this module
// names all three.
//
// The engine owns the result and the model only narrates it, so `generateEngineReport` is a total-generation
// contract (§4.2). Nothing here throws, reads a clock, or draws a random number. A case that would need an
// exception is a design defect, not a runtime branch: every table it reads is complete over every code, band
// and facet, and the two functions that could refuse (`resolveDrainBand`, `assertClaims`) are called only
// where their preconditions were established two lines earlier.
//
// Sections 1-3 are not re-derived here. `deep-type/rules/free.ts` computes them and this module calls it, so a
// free screen and a paid report cannot disagree about the world job, the strength cards or the free drain read.
// What the paid tier adds is a second ruler beside the same answers — the band movement in section 2 and the
// drain contrast in section 3 — never a second computation of the first three answers.

export interface EngineReportInput {
  /** The four letters the respondent offered. `null` and `personaSource: 'unknown'` both omit section 8. */
  declaredPersona: PersonaCode | null
  /**
   * The free sitting, unchanged. Sections marked `free-only` in §4.1 are read from here and from nothing else,
   * which is what makes the input-source column a property of the call graph rather than a claim in a comment.
   */
  free: FreeAssessmentProfile
  locale: Locale
  /**
   * False when the two drain sittings fall outside the recall window. It describes what the engine did, not
   * what the caller intended: see `mergeDrainSittings` for the decision and `drainRead` for the fallback.
   */
  mergedDrainWindow: boolean
  /** The paid sitting. Its poles and `band3` values are copies of the free ones — payment re-draws the ruler. */
  refined: RefinedAssessmentProfile
}

/** MIGRATION §4.1 rows 1-10. Rows 11-12 are the model's, so they are not members of this union. */
export type EngineWrittenKey = {
  [Key in ReportSectionKey]: (typeof REPORT_SECTION_CONTRACT)[Key]['generator'] extends 'LLM' ? never : Key
}[ReportSectionKey]

export interface EngineBlockOf<Key extends EngineWrittenKey, Data> {
  /** Rendered body. Stored as-is, and kept under the narration when the model overwrites a HYBRID section. */
  body: string
  /** What this body rests on. Verified against `SECTION_CLAIMS` at construction, never merely declared. */
  claims: readonly ClaimableEvidenceId[]
  data: Data
  /** §4.1 '입력 출처', read from the contract rather than restated. */
  inputSource: SectionInputSource
  key: Key
  title: string
}

export interface WorldJobData {
  codes: FreeReport['worldJob']['codes']
  core: FreeReport['worldJob']['core']
  family: FreeReport['worldJob']['family']
  name: string
}

/**
 * One axis as the paid ruler leaves it. D14's other half: the free tier labels its bands tentatively, and the
 * only thing that earns that hedge is the paid pass actually saying where the ruler landed and which way it
 * moved. `shift` and `evidenceSplit` reached the model request and nothing else, so a reader whose narration
 * failed — an outcome §4.3 explicitly plans for — was told the free band was provisional and then never told
 * what it resolved to.
 */
export interface AxisBandMovement {
  /** Paid band copy. The settled ruler, not the tentative one the cards above were grouped by. */
  band: BandCopy
  /** True when the added items leaned against the frozen letter. Forces `shift` to `down` before any compare. */
  evidenceSplit: boolean
  id: AxisId
  /** The frozen pole's label, read off the code rather than off the recomputed score. For renderers. */
  leading: string
  name: string
  shift: BandCopy
}

export interface StrengthCardsData {
  /** Grouped by band, never ranked (§4.3). Combos keep their own slot: `min(A, B)` ties a parent by definition. */
  axis: FreeReport['strengthCards']['axis']
  /** All eight axes, always. A list that skipped the unmoved ones would make its own length a signal. */
  bandMovement: readonly AxisBandMovement[]
  combo: FreeReport['strengthCards']['combo']
}

export type DrainContrastRelation = 'narrowed' | 'same' | 'shifted' | 'widened'

/**
 * Required, not optional. `drainSignature` is the one section both tiers render, so a paid drain block that
 * cannot say how it relates to the block the reader already saw is incomplete — fixing the free display set at
 * two or three facets does not stop a paid leader from landing outside it.
 */
export interface DrainContrast {
  /** Paid leaders the free block did not show. */
  added: readonly NamedFacet[]
  /** Free leaders the paid read no longer leads with. */
  dropped: readonly NamedFacet[]
  freeShown: readonly NamedFacet[]
  relation: DrainContrastRelation
  sentence: string
}

export interface DrainSignatureData {
  contrast: DrainContrast
  leaders: readonly NamedFacet[]
  meaning: string
  /** True when the paid read summed both sittings. It reports the computation, so it cannot describe a wish. */
  mergedWindow: boolean
  spread: { detail: string; label: string }
}

export interface HappinessConditionsData {
  environments: readonly NamedFacet[]
  needs: readonly NamedFacet[]
}

export interface InterestProfileData {
  interests: readonly NamedFacet[]
  purposes: readonly NamedFacet[]
}

export interface RoleFamilyCard {
  carryOver: typeof ROLE_FAMILY_CARRY_OVER
  confidence: ConfidenceLevel
  confidenceLabel: string
  family: (typeof ROLE_FAMILIES)[keyof typeof ROLE_FAMILIES]
  pick: RoleFamilyPick
}

export interface RoleFamiliesData {
  cards: readonly RoleFamilyCard[]
  notice: string
}

/** §9.1 caps a day at half an hour and floors it at ten minutes. The union is the cap. */
export type QuestMinutes = 10 | 15 | 20 | 25 | 30
export type QuestDayNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7

/**
 * §9.2, all ten fields. `requiredCost` and `needsExternalContact` are literal types rather than defaults: a
 * quest day that costs money or sends the reader to talk to a stranger is the one thing §9 rules out, and a
 * default can be overwritten by the next edit while a literal type cannot.
 */
export interface QuestDay {
  completionCheck: string
  day: QuestDayNumber
  estimatedMinutes: QuestMinutes
  needsExternalContact: false
  purpose: string
  reflectionQuestion: string
  requiredCost: 0
  safetyNote: string
  task: string
  title: string
}

export type QuestWeek = readonly [QuestDay, QuestDay, QuestDay, QuestDay, QuestDay, QuestDay, QuestDay]

export interface WeekQuestData {
  closing: string
  days: QuestWeek
}

export interface SelfReportAxis {
  axisName: string
  declared: { code: string; label: string }
  id: TypeAxisId
  matched: boolean
  measured: { code: string; label: string }
}

export interface ContextShiftData {
  axes: readonly SelfReportAxis[]
  declaredCode: PersonaCode
  measuredCode: string
}

export type PathId = 'explore' | 'reshape' | 'stay'

export interface EnginePath {
  actions: readonly string[]
  confidence: ConfidenceLevel
  confidenceLabel: string
  id: PathId
  /** Present where the missing input is the reason for the rung, so the copy layer cannot drop the reason. */
  note: string | null
  purpose: string
  title: string
}

/** D3 pins the stay route: no answer raises it, because no question asks. A type lock, not a default value. */
export interface StayPath extends EnginePath {
  confidence: Extract<ConfidenceLevel, 'needsMoreInput'>
  id: 'stay'
  note: string
}

export interface ThreePathsData {
  guardrails: readonly string[]
  paths: readonly [StayPath, EnginePath, EnginePath]
}

export interface FitPoint {
  betterUse: string
  evidence: string
  possibility: string
  title: string
}

export interface FrictionPoint {
  adjustment: string
  checkQuestion: string
  condition: string
  evidence: string
  title: string
}

export interface FitAndFrictionData {
  /** Same pin as the stay route, same reason (D3). The whole section rests on input that v1 does not collect. */
  confidence: Extract<ConfidenceLevel, 'needsMoreInput'>
  conditions: readonly NamedFacet[]
  contextNote: string
  fits: readonly FitPoint[]
  frictions: readonly FrictionPoint[]
}

export type EngineBlock =
  | EngineBlockOf<'contextShift', ContextShiftData>
  | EngineBlockOf<'drainSignature', DrainSignatureData>
  | EngineBlockOf<'fitAndFriction', FitAndFrictionData>
  | EngineBlockOf<'happinessConditions', HappinessConditionsData>
  | EngineBlockOf<'interestProfile', InterestProfileData>
  | EngineBlockOf<'roleFamilies', RoleFamiliesData>
  | EngineBlockOf<'strengthCards', StrengthCardsData>
  | EngineBlockOf<'threePaths', ThreePathsData>
  | EngineBlockOf<'weekQuest', WeekQuestData>
  | EngineBlockOf<'worldJob', WorldJobData>

export interface EngineReportDocument {
  blocks: readonly EngineBlock[]
  interpretationBoundary: string
  /** Storage shape — exactly what `report.sections` holds. */
  sections: readonly ReportSection[]
}

export const SECTION_TITLES_KO = {
  worldJob: '세계관 직업',
  strengthCards: '강점 카드',
  drainSignature: '지치는 조건',
  happinessConditions: '오래 일하게 하는 조건',
  interestProfile: '끌리는 일의 결',
  roleFamilies: '살펴볼 만한 역할군',
  weekQuest: '7일 퀘스트',
  contextShift: '고른 네 글자와 이번 답',
  threePaths: '세 갈래 경로',
  fitAndFriction: '맞물리는 지점과 부딪히는 지점',
} as const satisfies Record<EngineWrittenKey, string>

/** §9.1 keeps free and paid drain answers summable only inside one recall window. */
export const DRAIN_MERGE_WINDOW_DAYS = 14

const MILLISECONDS_PER_DAY = 86_400_000

/**
 * Pure: the two instants arrive as data and no clock is read. A missing timestamp merges, because the column
 * is nullable on rows written before it existed and refusing to sum on absence would silently discard the free
 * half of every legacy report.
 */
export function mergeDrainSittings(freeAnsweredAt: Date | null, paidAnsweredAt: Date | null): boolean {
  if (!freeAnsweredAt || !paidAnsweredAt) {
    return true
  }
  const gap = Math.abs(paidAnsweredAt.getTime() - freeAnsweredAt.getTime())
  return gap <= DRAIN_MERGE_WINDOW_DAYS * MILLISECONDS_PER_DAY
}

export function generateEngineReport(input: EngineReportInput): EngineReportDocument {
  const free = buildFreeReport(input.free)
  const drain = drainRead(input)
  const roleCards = roleFamilyCards(input.refined)
  const leadingStrength = firstStrengthCard(free)

  const blocks: EngineBlock[] = [
    worldJobBlock(free),
    strengthCardsBlock(free, input.refined, input.locale),
    drainSignatureBlock(drain),
    happinessConditionsBlock(input.refined),
    interestProfileBlock(input.refined),
    roleFamiliesBlock(roleCards),
    weekQuestBlock(drain.leaders, leadingStrength, roleCards),
    ...contextShiftBlocks(input),
    threePathsBlock(roleCards),
    fitAndFrictionBlock(input.refined, drain.leaders),
  ]

  return {
    blocks,
    interpretationBoundary: INTERPRETATION_BOUNDARY,
    sections: blocks.map(({ body, key, title }) => ({ body, key, title })),
  }
}

// `claims` is authored per block rather than copied out of SECTION_CLAIMS, so the assertion compares two
// independent statements: what this body actually rests on against what the section is permitted to rest on.
// Copying the table in would make the check a tautology.
function block<Key extends EngineWrittenKey, Data>(
  key: Key,
  claims: readonly ClaimableEvidenceId[],
  data: Data,
  body: string,
): EngineBlockOf<Key, Data> {
  assertClaims(key, claims)
  return {
    body,
    claims,
    data,
    inputSource: REPORT_SECTION_CONTRACT[key].inputSource,
    key,
    title: SECTION_TITLES_KO[key],
  }
}

// Interpolated Korean nouns always sit at the end of a line or in front of ' — ', never in front of a
// particle. 은/는 and 이/가 split on the final consonant of the preceding word, so a template that attaches one
// is wrong for roughly half of any table it reads.
const BULLET = '· '

function bullets(items: readonly string[]): string {
  return items.map((item) => `${BULLET}${item}`).join('\n')
}

function field(label: string, value: string): string {
  return `${label} — ${value}`
}

function paragraphs(...parts: readonly (string | null)[]): string {
  return parts.filter((part): part is string => part !== null && part.length > 0).join('\n\n')
}

function labelsOf(facets: readonly NamedFacet[]): readonly string[] {
  return facets.map((facet) => facet.label)
}

function actionsOf(facets: readonly NamedFacet[]): readonly string[] {
  return facets.map((facet) => facet.action)
}

// Section 1 ------------------------------------------------------------------------------------------------

function worldJobBlock(free: FreeReport): EngineBlockOf<'worldJob', WorldJobData> {
  const { codes, core, family, name } = free.worldJob
  const body = paragraphs(
    field('세계관 직업', name),
    [field('여덟 글자', `${codes.inner} · ${codes.gem}`), field('속유형', family.name), family.method].join('\n'),
    [field('맡는 자리', family.role), field('마음의 코어', core.name), core.strength].join('\n'),
  )

  return block(
    'worldJob',
    ['inner_axis_profile', 'mind_axis_and_gem', 'world_role_card'],
    { codes, core, family, name },
    body,
  )
}

// Section 2 ------------------------------------------------------------------------------------------------

const STRENGTH_GROUP_HEADINGS = {
  distinct3: '뚜렷하게 나온 강점',
  moderate3: '한쪽으로 기운 강점',
} as const

// The free band copy stays in `data` and out of the body. Its labels carry the tentativeness marker that the
// paid ruler has already resolved, and printing '지금까지는' on a paid screen would reopen a reading the paid
// pass just settled (N7). The grouping is the band; the wording is not.
//
// The cards are still the free engine's, unrecomputed. What the paid tier adds is the movement block below —
// the same arrangement `drainSignature` has, which is why this section's input source is `mixed`.
function strengthCardsBlock(
  free: FreeReport,
  refined: RefinedAssessmentProfile,
  locale: Locale,
): EngineBlockOf<'strengthCards', StrengthCardsData> {
  const { axis, combo } = free.strengthCards
  const groups = [
    cardGroup(STRENGTH_GROUP_HEADINGS.distinct3, axis.distinct3),
    cardGroup(STRENGTH_GROUP_HEADINGS.moderate3, axis.moderate3),
    cardGroup(`조합 강점 · ${STRENGTH_GROUP_HEADINGS.distinct3}`, combo.distinct3),
    cardGroup(`조합 강점 · ${STRENGTH_GROUP_HEADINGS.moderate3}`, combo.moderate3),
  ]

  const written = groups.filter((group): group is string => group !== null)
  const bandMovement = axisBandMovement(refined, axisCopyFor(locale))
  const body = paragraphs(
    written.length > 0 ? '집합으로 묶었어요. 안에서 순서는 없어요.' : EMPTY_STRENGTH_NOTE,
    ...written,
    bandMovementBody(bandMovement),
  )

  return block(
    'strengthCards',
    ['ability_card_ranking', 'inner_axis_profile', 'mind_axis_and_gem'],
    { axis, bandMovement, combo },
    body,
  )
}

// Inner first and then the core, the order the eight letters are printed in everywhere else.
function axisBandMovement(refined: RefinedAssessmentProfile, copy: AxisCopy): readonly AxisBandMovement[] {
  return [
    ...TYPE_AXES.map((id, index) => axisMovement(id, refined.inner.code[index], refined.inner.axes[id], copy)),
    ...GEM_AXES.map((id, index) => axisMovement(id, refined.gem.code[index], refined.gem.axes[id], copy)),
  ]
}

function axisMovement(
  id: AxisId,
  letter: string | undefined,
  score: RefinedAxisScore,
  copy: AxisCopy,
): AxisBandMovement {
  const content = copy[id]
  return {
    band: CLARITY_BANDS_PAID[score.band5],
    evidenceSplit: score.evidenceSplit,
    id,
    // Read off the frozen code letter rather than `score.pole`, which is null at a tie.
    leading: isFirstPole(id, letter) ? content.first.label : content.second.label,
    name: content.name,
    shift: BAND_SHIFT_PAID[score.shift],
  }
}

// Every string a reader sees here comes out of `band-labels.paid`, never off a literal in this file. That table
// is the one place §8.5's REMEASURE gate exempts, and the exemption stops at the table: an engine that inlined
// '답이 갈렸어요' would put the movement wording somewhere the gate can no longer hold it. The two sentences
// authored below say which axes and how many, never what moving means.
const NO_EVIDENCE_SPLIT_NOTE = '양쪽으로 갈린 축은 없었어요.'
const BAND_MOVEMENT_HEADING = '문항을 더한 뒤의 선명도예요.'
const EVIDENCE_SPLIT_LABEL = '양쪽 답이 섞인 축'

function bandMovementBody(movement: readonly AxisBandMovement[]): string {
  const split = movement.filter((axis) => axis.evidenceSplit)

  return paragraphs(
    [
      BAND_MOVEMENT_HEADING,
      // The pole label stays out of the bullet and in `data`. Several of them carry their own '·'
      // ('사실·적용'), so printing one here would put three separators in a line whose two halves are the band
      // and its movement. The two sentences under this list are what hold the letter still.
      bullets(movement.map((axis) => field(axis.name, `${axis.band.label} · ${axis.shift.label}`))),
    ].join('\n'),
    split.length > 0
      ? [field(EVIDENCE_SPLIT_LABEL, split.map((axis) => axis.name).join(' · ')), BAND_SHIFT_PAID.down.detail].join(
          '\n',
        )
      : NO_EVIDENCE_SPLIT_NOTE,
    CLARITY_NOTE_PAID,
  )
}

// Reachable: |S3| lands on {1,3,5,7,9} and every axis can sit at 1, so a reader whose answers split evenly on
// all eight axes gets no card. That is an empty set, not a failure — the section still ships.
const EMPTY_STRENGTH_NOTE = '이번 답은 여덟 축 모두 양쪽에 비슷하게 놓였어요. 그래서 강점 카드를 뽑지 않았어요.'

function cardGroup(heading: string, cards: readonly FreeStrengthCard[]): string | null {
  if (cards.length === 0) {
    return null
  }
  return [heading, bullets(cards.map((card) => `${card.copy.name} — ${card.copy.short}`))].join('\n')
}

function firstStrengthCard(free: FreeReport): FreeStrengthCard | null {
  const { axis, combo } = free.strengthCards
  return axis.distinct3[0] ?? axis.moderate3[0] ?? combo.distinct3[0] ?? combo.moderate3[0] ?? null
}

// Section 3 ------------------------------------------------------------------------------------------------

interface DrainRead {
  contrast: DrainContrast
  leaders: readonly DrainFacet[]
  merged: boolean
  spread: DrainSignatureData['spread']
}

// Un-merging is exact rather than approximate: forced-choice counts are additive over picks, so the paid half
// is the merged tally minus the free one. Where that subtraction is inconsistent the engine keeps the merged
// read and reports `mergedWindow: true`, because summing both sittings is then what it actually did.
function drainRead(input: EngineReportInput): DrainRead {
  const mergedTally = input.refined.work.drain
  const freeTally = input.free.work.drain
  const paidOnly = input.mergedDrainWindow ? null : paidOnlyDrain(mergedTally, freeTally)
  const tally = paidOnly ?? mergedTally

  const leaders = shownDrainFacets(tally.counts, tally.spread)
  const freeFacets = shownDrainFacets(freeTally.counts, freeTally.spread)
  const freeShown = nameFacets(freeFacets, DRAIN_LABELS)
  const shown = new Set<DrainFacet>(freeFacets)
  const lead = new Set<DrainFacet>(leaders)

  const added = nameFacets(
    leaders.filter((facet) => !shown.has(facet)),
    DRAIN_LABELS,
  )
  const dropped = nameFacets(
    freeFacets.filter((facet) => !lead.has(facet)),
    DRAIN_LABELS,
  )
  const relation = contrastRelation(added.length, dropped.length)

  return {
    contrast: {
      added,
      dropped,
      freeShown,
      relation,
      sentence: paidOnly ? DRAIN_WINDOW_SENTENCE : DRAIN_CONTRAST_SENTENCES[relation],
    },
    leaders,
    merged: paidOnly === null,
    spread: DRAIN_SPREAD_PAID[tally.spread],
  }
}

function contrastRelation(added: number, dropped: number): DrainContrastRelation {
  if (added === 0 && dropped === 0) {
    return 'same'
  }
  if (added === 0) {
    return 'narrowed'
  }
  return dropped === 0 ? 'widened' : 'shifted'
}

const DRAIN_CONTRAST_SENTENCES = {
  same: '무료 결과에서 보여 준 조건과 같아요.',
  narrowed: '무료 결과에서 보여 준 조건 가운데 일부만 앞에 남았어요.',
  widened: '무료 결과에서 보여 준 조건에 새 조건이 더해졌어요.',
  shifted: '무료 결과에서 보여 준 조건과 앞에 놓인 자리가 달라졌어요.',
} as const satisfies Record<DrainContrastRelation, string>

const DRAIN_WINDOW_SENTENCE = '무료 답과 사이가 많이 벌어져서 이번 조건은 심층 답만 읽었어요.'

function paidOnlyDrain(
  merged: DrainTally<DrainSpread>,
  free: FreeAssessmentProfile['work']['drain'],
): DrainTally<DrainSpread> | null {
  const counts = {} as Record<DrainFacet, number>
  let picks = 0

  for (const facet of WORK_FACETS.drain) {
    const remainder = merged.counts[facet] - free.counts[facet]
    if (remainder < 0) {
      return null
    }
    counts[facet] = remainder
    picks += remainder
  }

  // The paid drain block is three forced choices, so an inconsistent subtraction shows up here as a pick count
  // that is not three. `resolveDrainBand` throws on exactly that, which is why the guard runs before the call.
  if (picks !== PAID_DRAIN_PICKS) {
    return null
  }

  const { leaders, separation } = rankFacetCounts(WORK_FACETS.drain, counts)

  return { counts, exposure: 2, leaders, separation, spread: resolveDrainBand(counts, 2) }
}

const PAID_DRAIN_PICKS = 3

type DrainSpread = RefinedAssessmentProfile['work']['drain']['spread']

function drainSignatureBlock(drain: DrainRead): EngineBlockOf<'drainSignature', DrainSignatureData> {
  const leaders = nameFacets(drain.leaders, DRAIN_LABELS)
  const data: DrainSignatureData = {
    contrast: drain.contrast,
    leaders,
    meaning: DRAIN_SPREAD_MEANING,
    mergedWindow: drain.merged,
    spread: drain.spread,
  }

  const body = paragraphs(
    ['지금 답에서 앞에 놓인 조건이에요.', bullets(labelsOf(leaders))].join('\n'),
    [field('갈래', drain.spread.label), drain.spread.detail, DRAIN_SPREAD_MEANING].join('\n'),
    [field('무료 결과와 견주면', drain.contrast.sentence), contrastDetail(drain.contrast)].join('\n'),
    ['지금 해 볼 선택이에요.', bullets(actionsOf(leaders))].join('\n'),
  )

  return block('drainSignature', ['life_work_profile'], data, body)
}

function contrastDetail(contrast: DrainContrast): string {
  const lines = [field('무료에서 본 조건', labelsOf(contrast.freeShown).join(' · '))]
  if (contrast.added.length > 0) {
    lines.push(field('새로 앞에 온 조건', labelsOf(contrast.added).join(' · ')))
  }
  if (contrast.dropped.length > 0) {
    lines.push(field('뒤로 물러난 조건', labelsOf(contrast.dropped).join(' · ')))
  }
  return lines.join('\n')
}

// Section 4 ------------------------------------------------------------------------------------------------

function happinessConditionsBlock(
  refined: RefinedAssessmentProfile,
): EngineBlockOf<'happinessConditions', HappinessConditionsData> {
  const needs = nameFacets(refined.work.need.leaders, NEED_LABELS)
  const environments = nameFacets(refined.work.environment.leaders, ENVIRONMENT_LABELS)

  const body = paragraphs(
    ['답에서 함께 앞에 놓인 조건이에요.', bullets(labelsOf(needs))].join('\n'),
    ['일하는 자리 쪽에서 앞에 놓인 것이에요.', bullets(labelsOf(environments))].join('\n'),
    '이 조건이 갖춰진 자리에서 힘이 덜 빠져요. 조건이 빠진 자리에서는 같은 일도 더 무겁게 느껴져요.',
    ['지금 해 볼 선택이에요.', bullets(actionsOf(needs))].join('\n'),
  )

  return block('happinessConditions', ['life_work_profile'], { environments, needs }, body)
}

// Section 5 ------------------------------------------------------------------------------------------------

function interestProfileBlock(
  refined: RefinedAssessmentProfile,
): EngineBlockOf<'interestProfile', InterestProfileData> {
  const interests = nameFacets(refined.work.interest.leaders, INTEREST_LABELS)
  const purposes = nameFacets(refined.work.purpose.leaders, PURPOSE_LABELS)

  const body = paragraphs(
    ['고른 답에서 앞에 놓인 관심이에요.', bullets(labelsOf(interests))].join('\n'),
    ['일이 의미 있게 느껴진 순간이에요.', bullets(labelsOf(purposes))].join('\n'),
    '관심은 잘한다는 뜻이 아니에요. 손이 먼저 가는 쪽을 말해요.',
  )

  return block('interestProfile', ['life_work_profile'], { interests, purposes }, body)
}

// Section 6 ------------------------------------------------------------------------------------------------

function roleFamilyCards(refined: RefinedAssessmentProfile): readonly RoleFamilyCard[] {
  return resolveRoleFamilies(refined.work.interest, refined.work.environment).map((pick) => ({
    carryOver: ROLE_FAMILY_CARRY_OVER,
    confidence: pick.confidence,
    confidenceLabel: CONFIDENCE_LABELS[pick.confidence],
    family: ROLE_FAMILIES[pick.familyId],
    pick,
  }))
}

// §4.1 allows this section to be omitted when the mapping table is missing. The table now covers all 36 cells
// and `resolveRoleFamilies` is total, so the omission branch is unreachable and is not written.
function roleFamiliesBlock(cards: readonly RoleFamilyCard[]): EngineBlockOf<'roleFamilies', RoleFamiliesData> {
  const body = paragraphs(...cards.map(roleFamilyBody), EXAMPLE_ROLE_NOTICE)
  return block('roleFamilies', ['life_work_profile', 'world_role_card'], { cards, notice: EXAMPLE_ROLE_NOTICE }, body)
}

function roleFamilyBody(card: RoleFamilyCard): string {
  const { family } = card
  return [
    `${family.name} · ${card.confidenceLabel}`,
    family.summary,
    field('잘 맞을 가능성이 있는 이유', family.whyFit),
    field('필요한 자리', family.environment),
    '자주 하는 업무',
    bullets(family.dailyWork),
    '확인이 필요한 부분',
    bullets(family.checkPoints),
    field('돈을 쓰기 전 해 볼 작은 실험', family.experiment),
    `가져갈 경험 · ${CONFIDENCE_LABELS[card.carryOver.confidence]}`,
    card.carryOver.text,
    field('예시 직무', family.exampleRoles.join(' · ')),
  ].join('\n')
}

// Section 7 ------------------------------------------------------------------------------------------------

const QUEST_CLOSING =
  '7일 동안 모은 기록은 직업을 정해 주는 답이 아니에요. 어떤 자리와 역할을 더 살펴볼지 고르는 단서예요.'

const GENERIC_STRENGTH_TASK = '오늘 한 일 가운데 잘 풀린 것 하나를 골라 어떻게 했는지 세 줄로 적어요.'

// The skeleton is 09 §9.1 verbatim in intent: seven days that each fit in half an hour, cost nothing and need
// no one else. Only days 3, 4 and 5 read the profile — the drain leader, the first strength card and the
// leading role family's own experiment — so the other four are the same week for every reader by design.
function weekQuestBlock(
  drainLeaders: readonly DrainFacet[],
  strength: FreeStrengthCard | null,
  cards: readonly RoleFamilyCard[],
): EngineBlockOf<'weekQuest', WeekQuestData> {
  const drainLabel = drainLeaders.map((facet) => DRAIN_LABELS[facet].name).join(' · ')
  const leading = cards[0]

  const days: QuestWeek = [
    {
      completionCheck: '다섯 줄에 표시가 모두 붙었어요.',
      day: 1,
      estimatedMinutes: 15,
      needsExternalContact: false,
      purpose: '하루가 어떤 일로 채워지는지 눈으로 봐요.',
      reflectionQuestion: '다섯 줄 가운데 힘이 빠짐은 몇 개였나요?',
      requiredCost: 0,
      safetyNote: '기록은 내 손 안에 두고 회사 문서에는 올리지 않아요.',
      task: '오늘 기억나는 일 다섯 개를 적고 줄마다 힘이 남음·비슷함·힘이 빠짐을 표시해요.',
      title: '내가 실제로 하는 일 적기',
    },
    {
      completionCheck: '순간 하나에 사람과 일과 결과가 함께 적혔어요.',
      day: 2,
      estimatedMinutes: 15,
      needsExternalContact: false,
      purpose: '힘이 나던 순간에 무엇이 함께 있었는지 찾아요.',
      reflectionQuestion: '그 순간에 옆에 사람이 있었나요 없었나요?',
      requiredCost: 0,
      safetyNote: '집중이 잘된 순간이 없었다면 없었다고 적어요. 지어내지 않아요.',
      task: '오늘 조금이라도 집중이 잘된 순간을 하나 적고 혼자였는지 함께였는지 무엇을 만들거나 풀었는지 같이 적어요.',
      title: '힘이 난 순간 찾기',
    },
    {
      completionCheck: '힘이 빠진 일 옆에 내용과 조건이 나뉘어 적혔어요.',
      day: 3,
      estimatedMinutes: 20,
      needsExternalContact: false,
      purpose: '힘이 빠지는 이유가 일 자체인지 둘레의 조건인지 갈라요.',
      reflectionQuestion: '오늘 힘이 빠진 이유는 일 쪽이었나요 조건 쪽이었나요?',
      requiredCost: 0,
      safetyNote: '사람 이름 대신 상황만 적어요.',
      task: `힘이 빠진 일을 하나 골라 업무 내용 때문인지 둘레의 조건 때문인지 나눠 적어요.\n${field('결과에서 앞에 놓인 조건', drainLabel)}`,
      title: '마찰 조건 확인',
    },
    {
      completionCheck: '강점을 쓴 자리와 그 결과가 한 줄로 남았어요.',
      day: 4,
      estimatedMinutes: 25,
      needsExternalContact: false,
      purpose: '이미 가진 힘을 오늘 일에 한 번 얹어 봐요.',
      reflectionQuestion: '그 힘을 쓸 때 시간이 더 걸렸나요 덜 걸렸나요?',
      requiredCost: 0,
      safetyNote: '새로 배우는 것을 넣지 않아요. 오늘은 이미 하는 방식으로 충분해요.',
      task: strength
        ? `${field('오늘 쓸 강점', strength.copy.name)}\n${strength.copy.shine} 작은 정리표를 만들거나 빠진 부분을 하나 찾는 정도면 충분해요.`
        : GENERIC_STRENGTH_TASK,
      title: '강점 한 번 더 쓰기',
    },
    {
      completionCheck: '30분 안에 끝나는 결과물 하나가 남았어요.',
      day: 5,
      estimatedMinutes: 30,
      needsExternalContact: false,
      purpose: '살펴볼 역할군의 일이 실제로 어떤 느낌인지 손으로 확인해요.',
      reflectionQuestion: '해 보는 동안 시간이 빨리 갔나요 느리게 갔나요?',
      requiredCost: 0,
      safetyNote: '돈이 드는 등록이나 자격 준비는 넣지 않아요.',
      task: leading
        ? `${field('살펴볼 역할군', leading.family.name)}\n${leading.family.experiment}`
        : '오늘 궁금한 일 하나를 30분 안에 끝나는 크기로 줄여 결과물 하나를 만들어 봐요.',
      title: '인접 역할 맛보기',
    },
    {
      completionCheck: '고른 경로 하나와 이유 두 줄이 적혔어요.',
      day: 6,
      estimatedMinutes: 20,
      needsExternalContact: false,
      purpose: '세 갈래를 나란히 놓고 지금 부담이 적은 쪽을 골라 봐요.',
      reflectionQuestion: '고른 이유가 관심 때문이었나요 부담 때문이었나요?',
      requiredCost: 0,
      safetyNote: '오늘 고른 경로는 오늘의 선택이에요. 큰 결정은 여기서 정하지 않아요.',
      task: '지금 자리에서 넓히기·옆으로 한 칸 옮겨 보기·새 분야를 작게 시험하기 가운데 부담이 적은 쪽을 고르고 이유를 두 줄로 적어요.',
      title: '세 경로 비교',
    },
    {
      completionCheck: '다시 해 볼 일 하나와 하지 않을 일 하나가 적혔어요.',
      day: 7,
      estimatedMinutes: 20,
      needsExternalContact: false,
      purpose: '일주일 기록에서 반복된 신호만 남겨요.',
      reflectionQuestion: '일곱 날 가운데 힘이 남은 날은 어떤 날이었나요?',
      requiredCost: 0,
      safetyNote: '한 걸음은 다음 주 안에 끝나는 크기로 잡아요.',
      task: '지난 기록에서 반복된 신호를 세 개 고르고 다음 주에 다시 해 볼 일 하나와 하지 않을 일 하나를 정해요.',
      title: '다음 한 걸음 정하기',
    },
  ]

  const body = paragraphs(...days.map(questDayBody), QUEST_CLOSING)
  return block('weekQuest', ['ability_card_ranking', 'life_work_profile'], { closing: QUEST_CLOSING, days }, body)
}

function questDayBody(day: QuestDay): string {
  return [
    `${day.day}일차 · ${day.title}`,
    day.purpose,
    day.task,
    field('걸리는 시간', `약 ${day.estimatedMinutes}분`),
    field('오늘의 질문', day.reflectionQuestion),
    field('끝난 기준', day.completionCheck),
    day.safetyNote,
  ].join('\n')
}

// Section 8 ------------------------------------------------------------------------------------------------

const CONTEXT_SHIFT_CLOSING =
  '두 결과가 다르다고 한쪽이 틀린 건 아니에요. 고른 네 글자는 스스로 본 모습이고 이번 네 글자는 오늘 고른 답이에요.'

// Returns zero or one block. §4.1 row 8 omits the section when nothing was declared, and D13 removed the
// measured persona, so there is no second reading to contrast against — an omitted section is the honest shape.
function contextShiftBlocks(input: EngineReportInput): readonly EngineBlockOf<'contextShift', ContextShiftData>[] {
  const declaredCode = input.declaredPersona
  if (!declaredCode || input.refined.personaSource === 'unknown') {
    return []
  }

  const copy = axisCopyFor(input.locale)
  const measuredCode = input.refined.inner.code
  const axes: SelfReportAxis[] = TYPE_AXES.map((id, index) => {
    const content = copy[id]
    const declaredLetter = declaredCode[index] ?? ''
    const measuredLetter = measuredCode[index] ?? ''
    return {
      axisName: content.name,
      declared: { code: declaredLetter, label: poleLabel(id, declaredLetter, content) },
      id,
      matched: declaredLetter === measuredLetter,
      measured: { code: measuredLetter, label: poleLabel(id, measuredLetter, content) },
    }
  })

  const matched = axes.filter((axis) => axis.matched)
  const split = axes.filter((axis) => !axis.matched)

  const body = paragraphs(
    [field('고른 네 글자', declaredCode), field('이번 답의 네 글자', measuredCode)].join('\n'),
    split.length > 0
      ? [
          '갈린 자리',
          bullets(
            split.map((axis) => `${axis.axisName} — 고른 쪽 ${axis.declared.label} / 이번 답 ${axis.measured.label}`),
          ),
        ].join('\n')
      : '네 자리가 모두 같았어요.',
    matched.length > 0
      ? ['같은 자리', bullets(matched.map((axis) => `${axis.axisName} — ${axis.measured.label}`))].join('\n')
      : null,
    CONTEXT_SHIFT_CLOSING,
  )

  return [block('contextShift', ['persona_inner_gap'], { axes, declaredCode, measuredCode }, body)]
}

type AxisContentShape = ReturnType<typeof axisCopyFor>[TypeAxisId]

function poleLabel(axis: TypeAxisId, letter: string, content: AxisContentShape): string {
  return isFirstPole(axis, letter) ? content.first.label : content.second.label
}

// Section 9 ------------------------------------------------------------------------------------------------

const PATH_GUARDRAILS = [
  '경로를 대신 골라 주지 않아요.',
  '돈이 드는 등록은 첫 행동으로 두지 않아요.',
  '큰 결정은 이 카드에서 정하지 않아요.',
] as const

const STAY_NOTE = '지금 어떤 일을 하고 있는지는 묻지 않았어요. 그래서 이 경로는 이번 답만으로 확인할 수 없어요.'

function threePathsBlock(cards: readonly RoleFamilyCard[]): EngineBlockOf<'threePaths', ThreePathsData> {
  const leading = cards[0]
  const other = cards[1] ?? cards[0]

  const stay: StayPath = {
    actions: [
      '이번 주에 맡은 일 가운데 앞에 놓인 관심과 겹치는 일을 하나 골라 조금 더 맡아 봐요.',
      '힘이 빠지는 조건이 붙은 일을 하나 골라 방식만 바꿔 봐요.',
      '팀에 부탁할 수 있는 작은 변화를 하나만 적어 봐요.',
    ],
    confidence: 'needsMoreInput',
    confidenceLabel: CONFIDENCE_LABELS.needsMoreInput,
    id: 'stay',
    note: STAY_NOTE,
    purpose: '자리를 옮기지 않고 잘 맞는 일의 비중을 늘려 봐요.',
    title: '지금 자리에서 넓히기',
  }

  const reshape: EnginePath = {
    actions: leading
      ? [
          field('살펴볼 역할군', leading.family.name),
          leading.family.experiment,
          leading.family.checkPoints[0] ?? '',
          '그 자리에서 하루가 어떻게 흘러가는지 적어 둔 글을 찾아 읽어 봐요.',
        ].filter((action) => action.length > 0)
      : ['지금 하는 일과 이어지는 역할을 하나 적고 무엇이 겹치는지 세 줄로 적어 봐요.'],
    confidence: leading?.confidence ?? 'needsMoreInput',
    confidenceLabel: CONFIDENCE_LABELS[leading?.confidence ?? 'needsMoreInput'],
    id: 'reshape',
    note: null,
    purpose: '지금 경험을 버리지 않고 비슷한 자리에서 다른 역할을 살펴봐요.',
    title: '옆으로 한 칸 옮겨 보기',
  }

  const explore: EnginePath = {
    actions: [
      '30분에서 두 시간 안에 끝나는 결과물 하나를 정해 만들어 봐요.',
      other ? other.family.experiment : '궁금한 것 하나를 이번 주에 끝나는 크기로 줄여 해 봐요.',
      '해 본 뒤에 무엇이 남았는지 세 줄로 적어 봐요.',
      '재미가 없거나 시간이 나지 않으면 멈춰도 돼요.',
    ],
    confidence: other?.confidence ?? 'needsMoreInput',
    confidenceLabel: CONFIDENCE_LABELS[other?.confidence ?? 'needsMoreInput'],
    id: 'explore',
    note: null,
    purpose: '큰 비용 없이 새 역할의 실제 일을 한 번 해 봐요.',
    title: '새 분야를 작게 시험하기',
  }

  const paths: ThreePathsData['paths'] = [stay, reshape, explore]
  const body = paragraphs(
    ...paths.map(pathBody),
    ['세 갈래에 함께 걸린 선이에요.', bullets(PATH_GUARDRAILS)].join('\n'),
  )

  return block('threePaths', ['life_work_profile', 'world_role_card'], { guardrails: PATH_GUARDRAILS, paths }, body)
}

function pathBody(path: EnginePath): string {
  return [
    `${path.title} · ${path.confidenceLabel}`,
    path.purpose,
    bullets(path.actions),
    ...(path.note ? [path.note] : []),
  ].join('\n')
}

// Section 10 -----------------------------------------------------------------------------------------------

const FIT_CONTEXT_NOTE =
  '지금 어떤 일을 하고 있는지는 묻지 않았어요. 그래서 아래는 이번 답에서 읽은 조건이고 실제 자리와 맞춰 보는 건 직접 해야 해요.'

// §5.1 and §5.2 each list a field that only a current-work description can fill — '현재 업무 장면' and
// '사용자 입력 근거'. D3 does not collect it, so those two fields are absent rather than filled with a guess,
// and the rung is pinned for the whole section instead of per item.
const DRAIN_CHECK_QUESTIONS = {
  BREAK: '오늘 끊기지 않고 이어서 일한 시간이 몇 분이었나요?',
  VAGUE: '이 일이 어디서 끝나는지 적어 둔 곳이 있나요?',
  EMPTY: '이 결과를 누가 받아 가는지 알고 있나요?',
  TENSION: '오늘 못 한 말이 몇 번 남았나요?',
  OVERLOAD: '이번 주에 겹친 일이 몇 개였나요?',
  STUCK: '방법을 바꿔 보자고 말할 수 있는 자리인가요?',
} as const satisfies Record<DrainFacet, string>

// §5.1's '더 잘 쓰는 방법' is a different sentence from its 검사 근거, so it may not reuse the facet's own
// `action`: the evidence line already carries that string, and printing it twice turns a two-field structure
// into one field said louder.
const INTEREST_BETTER_USE = {
  MAKE: '만들어 놓고 고치는 일을 한 번 더 맡아 봐요.',
  ANALYZE: '결론을 내기 전에 확인한 근거를 한 장으로 남겨 봐요.',
  CREATE: '없던 형태를 먼저 만들어 보고 반응을 받아 봐요.',
  HELP: '막힌 사람을 먼저 살피고 무엇이 필요했는지 적어 봐요.',
  LEAD: '다음 행동과 맡을 사람을 먼저 정해 나눠 봐요.',
  ORDER: '빠진 순서와 준비물을 먼저 적어 두고 시작해 봐요.',
} as const satisfies Record<InterestFacet, string>

function fitAndFrictionBlock(
  refined: RefinedAssessmentProfile,
  drainLeaders: readonly DrainFacet[],
): EngineBlockOf<'fitAndFriction', FitAndFrictionData> {
  const conditions = nameFacets(refined.work.environment.leaders, ENVIRONMENT_LABELS)
  const fits: FitPoint[] = refined.work.interest.leaders.map((facet) => ({
    betterUse: INTEREST_BETTER_USE[facet],
    evidence: `${INTEREST_LABELS[facet].action}이 이어졌어요.`,
    possibility: '조건이 갖춰진 자리에서 이 힘이 더 잘 보일 가능성이 있어요.',
    title: INTEREST_LABELS[facet].name,
  }))
  // The evidence names the pick, not the coping choice. `DRAIN_LABELS[facet].action` is what to try next, and
  // reporting it as what the reader answered would put words in their mouth.
  const frictions: FrictionPoint[] = drainLeaders.map((facet) => ({
    adjustment: DRAIN_LABELS[facet].action,
    checkQuestion: DRAIN_CHECK_QUESTIONS[facet],
    condition: '이 조건이 자주 겹치는 자리에서 마찰이 생길 수 있어요.',
    evidence: '같은 조건을 고른 답이 이어졌어요.',
    title: DRAIN_LABELS[facet].name,
  }))

  const data: FitAndFrictionData = {
    confidence: 'needsMoreInput',
    conditions,
    contextNote: FIT_CONTEXT_NOTE,
    fits,
    frictions,
  }

  const body = paragraphs(
    `${FIT_CONTEXT_NOTE}\n${field('신뢰 수준', CONFIDENCE_LABELS.needsMoreInput)}`,
    ['이 힘이 살아나는 자리예요.', bullets(labelsOf(conditions))].join('\n'),
    ['맞물리는 지점', ...fits.map(fitBody)].join('\n'),
    ['부딪히는 지점', ...frictions.map(frictionBody)].join('\n'),
  )

  return block('fitAndFriction', ['life_work_profile'], data, body)
}

function fitBody(fit: FitPoint): string {
  return [
    `${BULLET}${fit.title}`,
    field('  이번 답', fit.evidence),
    `  ${fit.possibility}`,
    field('  더 잘 쓰는 방법', fit.betterUse),
  ].join('\n')
}

function frictionBody(friction: FrictionPoint): string {
  return [
    `${BULLET}${friction.title}`,
    `  ${friction.condition}`,
    field('  이번 답', friction.evidence),
    field('  확인할 질문', friction.checkQuestion),
    field('  작은 조정', friction.adjustment),
  ].join('\n')
}
