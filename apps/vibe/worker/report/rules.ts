import {
  AXIS_POLES,
  type AxisId,
  type ClarityBand,
  type DrainFacet,
  type DrainTally,
  type FreeAssessmentProfile,
  GEM_AXES,
  type InterestFacet,
  type PersonaCode,
  type RefinedAssessmentProfile,
  type RefinedAxisScore,
  TYPE_AXES,
  type TypeAxisId,
  WORK_FACETS,
  type WorkFacetId,
} from '@deep-type/model'

import {
  BAND_SHIFT_PAID,
  CLARITY_BANDS_PAID,
  CLARITY_NOTE_PAID,
  DRAIN_SPREAD_MEANING,
  DRAIN_SPREAD_PAID,
} from '../../deep-type/content/band-labels.paid'
import {
  DRAIN_DETAILS,
  ENVIRONMENT_DETAILS,
  INTEREST_DETAILS,
  NEED_DETAILS,
  PURPOSE_DETAILS,
} from '../../deep-type/content/facet-details.paid'
import {
  BLOCK_NOTES_KO,
  SECTION_INTROS_KO,
  SECTION_TITLES_KO,
  SELF_REPORT_AXIS_NOTES,
  SELF_REPORT_CLOSING,
} from '../../deep-type/content/section-copy.paid'
import { DRAIN_LABELS } from '../../deep-type/content/work-labels.free'
import {
  ENVIRONMENT_LABELS,
  INTEREST_LABELS,
  NEED_LABELS,
  PURPOSE_LABELS,
} from '../../deep-type/content/work-labels.paid'
import {
  CONFIDENCE_LABELS,
  EXAMPLE_ROLE_NOTICE,
  ROLE_FAMILIES,
  ROLE_FAMILY_CARRY_OVER,
  resolveRoleFamilies,
} from '../../deep-type/role-families'
import { buildFreeReport, type FreeReport, type FreeStrengthCard } from '../../deep-type/rules/free'
import { resolveDrainBand } from '../../deep-type/scoring'
import { type AxisCopy, axisCopyFor, type ReportLocale } from './axis-copy'
import { assertClaims, type ClaimableEvidenceId, INTERPRETATION_BOUNDARY } from './claims'
import { composeOpeningRead, composeReflectionQuestions } from './compose'
import type {
  AxisBandMovement,
  ContextShiftData,
  DrainContrast,
  DrainContrastRelation,
  DrainSignatureData,
  EngineBlock,
  EnginePath,
  FitAndFrictionData,
  FitPoint,
  FrictionPoint,
  NamedFacet,
  QuestWeek,
  ReportSection,
  RoleFamilyCard,
  SelfReportAxis,
  StayPath,
  StrengthCardGroup,
  ThreePathsData,
} from './section-data'
import { REPORT_DISPLAY_ORDER, REPORT_SECTION_CONTRACT, type ReportSectionKey } from './section-keys'

// The paid rule engine. Server-only, and the import list is where that is enforced: the `*.paid` content
// modules and `role-families` are the tables the free bundle may not carry, and this module names all of them.
//
// The engine owns the result and the model only narrates it, so `generateEngineReport` is a total-generation
// contract (§4.2). Nothing here throws, reads a clock, or draws a random number. A case that would need an
// exception is a design defect, not a runtime branch: every table it reads is complete over every code, band
// and facet, and the two functions that could refuse (`resolveDrainBand`, `assertClaims`) are called only
// where their preconditions were established two lines earlier.
//
// WHAT A SECTION IS. It used to be a string: each builder rendered its own result into '· ' bullets and
// ' — ' fields, stored that, and dropped the typed value that produced it. The reader then got twelve
// identical paragraphs, and a strength card, a quest day and a band ladder — three completely different
// shapes — arrived as the same shape and were drawn as the same shape. Sections carry their data now. The
// renderer decides what a quest week looks like, the narrator receives the same structure as JSON, and the
// string-assembly layer that sat between them is gone rather than reimplemented on the client.
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
  locale: ReportLocale
  /**
   * False when the two drain sittings fall outside the recall window. It describes what the engine did, not
   * what the caller intended: see `mergeDrainSittings` for the decision and `drainRead` for the fallback.
   */
  mergedDrainWindow: boolean
  /** The paid sitting. Its poles and `band3` values are copies of the free ones — payment re-draws the ruler. */
  refined: RefinedAssessmentProfile
}

export interface EngineReportDocument {
  blocks: readonly EngineBlock[]
  interpretationBoundary: string
  /** Storage shape — exactly what `report.sections` holds, already in reading order. */
  sections: readonly ReportSection[]
}

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
  const copy = axisCopyFor(input.locale)
  const drain = drainRead(input)
  const drainLeaders = nameFacets(drain.leaders, DRAIN_LABELS, DRAIN_DETAILS)
  const interestLeaders = nameFacets(input.refined.work.interest.leaders, INTEREST_LABELS, INTEREST_DETAILS)
  const roleCards = roleFamilyCards(input.refined)
  const leadingStrength = firstStrengthCard(free)

  // Generation order, which is section-table order: `openingRead` reads what the seven above it settled, so it
  // cannot be built before them. Reading order is applied once at the end and is a different sequence.
  const blocks: EngineBlock[] = [
    worldJobBlock(free),
    strengthCardsBlock(free, input.refined, copy),
    drainSignatureBlock(drain, drainLeaders),
    happinessConditionsBlock(input.refined),
    interestProfileBlock(input.refined, interestLeaders),
    roleFamiliesBlock(roleCards),
    weekQuestBlock(drainLeaders, leadingStrength, roleCards),
    ...contextShiftBlocks(input, copy),
    threePathsBlock(roleCards),
    fitAndFrictionBlock(input.refined, drain.leaders),
    openingReadBlock({
      copy,
      drainLeaders,
      drainSpread: drain.spread,
      free,
      interestLeaders,
      refined: input.refined,
    }),
    reflectionQuestionsBlock(input.refined),
  ]

  return {
    blocks,
    interpretationBoundary: INTERPRETATION_BOUNDARY,
    sections: inReadingOrder(blocks),
  }
}

// Reading order is applied to what was actually built, not to the full key list: `contextShift` is absent for a
// reader who declared nothing, and an index-based reorder over a table with a hole would silently drop a
// section or leave a gap. Filtering the display order by what exists cannot do either.
function inReadingOrder(blocks: readonly EngineBlock[]): readonly ReportSection[] {
  const byKey = new Map<ReportSectionKey, ReportSection>(blocks.map((block) => [block.section.key, block.section]))
  return REPORT_DISPLAY_ORDER.map((key) => byKey.get(key)).filter((section): section is ReportSection => !!section)
}

// `claims` is authored per block rather than copied out of SECTION_CLAIMS, so the assertion compares two
// independent statements: what this section actually rests on against what it is permitted to rest on.
// Copying the table in would make the check a tautology.
function block(section: ReportSection, claims: readonly ClaimableEvidenceId[]): EngineBlock {
  assertClaims(section.key, claims)
  return { claims, inputSource: REPORT_SECTION_CONTRACT[section.key].inputSource, section }
}

/** Fills the two fields every section carries the same way, so no builder can ship one untitled. */
function heading<Key extends ReportSectionKey>(key: Key): { intro: string; key: Key; title: string } {
  return { intro: SECTION_INTROS_KO[key], key, title: SECTION_TITLES_KO[key] }
}

type FacetLabelTable<Facet extends WorkFacetId> = Readonly<Record<Facet, { action: string; name: string }>>

function nameFacets<Facet extends WorkFacetId>(
  facets: readonly Facet[],
  labels: FacetLabelTable<Facet>,
  details: Readonly<Record<Facet, string>>,
): readonly NamedFacet[] {
  return facets.map((id) => ({ action: labels[id].action, detail: details[id], id, label: labels[id].name }))
}

// Section 1 ------------------------------------------------------------------------------------------------

function worldJobBlock(free: FreeReport): EngineBlock {
  const { codes, core, family, name } = free.worldJob
  return block({ ...heading('worldJob'), data: { codes, core, family, name } }, [
    'inner_axis_profile',
    'mind_axis_and_gem',
    'world_role_card',
  ])
}

// Section 2 ------------------------------------------------------------------------------------------------

// The free band copy stays in the card data and out of the movement block. Its labels carry the tentativeness
// marker that the paid ruler has already resolved, and repeating '지금까지는' on a paid screen would reopen a
// reading the paid pass just settled (N7). The grouping is the band; the wording is not.
//
// The cards are still the free engine's, unrecomputed. What the paid tier adds is the movement list — the same
// arrangement `drainSignature` has, which is why this section's input source is `mixed`.
function strengthCardsBlock(free: FreeReport, refined: RefinedAssessmentProfile, copy: AxisCopy): EngineBlock {
  const { axis, combo } = free.strengthCards
  const bandMovement = axisBandMovement(refined, copy)
  const groups: StrengthCardGroup[] = [
    { cards: axis.distinct3, heading: BLOCK_NOTES_KO.strengthDistinct },
    { cards: axis.moderate3, heading: BLOCK_NOTES_KO.strengthModerate },
    { cards: combo.distinct3, heading: `${BLOCK_NOTES_KO.strengthComboPrefix} · ${BLOCK_NOTES_KO.strengthDistinct}` },
    { cards: combo.moderate3, heading: `${BLOCK_NOTES_KO.strengthComboPrefix} · ${BLOCK_NOTES_KO.strengthModerate}` },
  ].filter((group) => group.cards.length > 0)

  const splitAxisNames = bandMovement.filter((entry) => entry.evidenceSplit).map((entry) => entry.name)

  return block(
    {
      ...heading('strengthCards'),
      data: {
        bandMovement,
        clarityNote: CLARITY_NOTE_PAID,
        emptyNote: groups.length === 0 ? BLOCK_NOTES_KO.strengthEmpty : null,
        groups,
        movementHeading: BLOCK_NOTES_KO.bandMovementHeading,
        splitAxisNames,
        splitLabel: BLOCK_NOTES_KO.evidenceSplitLabel,
        // Every string a reader sees about the movement comes out of `band-labels.paid`, never off a literal
        // here: that table is the one place §8.5's REMEASURE gate exempts, and an engine that inlined
        // '답이 갈렸어요' would put the wording somewhere the gate can no longer hold it.
        splitNote: splitAxisNames.length > 0 ? BAND_SHIFT_PAID.down.detail : BLOCK_NOTES_KO.noEvidenceSplit,
      },
    },
    ['ability_card_ranking', 'inner_axis_profile', 'mind_axis_and_gem'],
  )
}

// Inner first and then the core, the order the eight letters are printed in everywhere else.
function axisBandMovement(refined: RefinedAssessmentProfile, copy: AxisCopy): readonly AxisBandMovement[] {
  return [
    ...TYPE_AXES.map((id, index) => axisMovement(id, refined.inner.code[index], refined.inner.axes[id], copy)),
    ...GEM_AXES.map((id, index) => axisMovement(id, refined.gem.code[index], refined.gem.axes[id], copy)),
  ]
}

/**
 * Which rung the band sits on, for a renderer that draws the ladder instead of naming it. Three discrete
 * steps, never a length proportional to a score: `|lean|` is a distance from even and drawing it as a bar is
 * exactly the reading the band wording exists to prevent. `tie` shares the near-even rung because that is what
 * it describes.
 */
const BAND_STEP = { distinct: 3, faint: 1, moderate: 2, tie: 1 } as const satisfies Record<ClarityBand, 1 | 2 | 3>

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
    // Read off the frozen code letter rather than `score.pole`, which is null at a tie. Same fold as `poleLabel`.
    leading: letter === AXIS_POLES[id][0] ? content.first.label : content.second.label,
    name: content.name,
    shift: BAND_SHIFT_PAID[score.shift],
    shiftDirection: score.shift,
    step: BAND_STEP[score.band5],
  }
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
  spread: (typeof DRAIN_SPREAD_PAID)[DrainSpread]
  strands: 1 | 2 | 3
}

// How many facets the band puts on screen. The band is a confidence statement, not a count of ties: at
// `double` there IS a top facet, but the runner-up sits one pick behind, so naming both is what keeps the real
// leader inside the shown set. `tally.leaders` cannot serve this — it holds the tied set, which is a single
// facet in every reachable `double` vector and in most `triple` ones, so reading it made the copy ("두 조건이
// 비슷하게 나왔어요") describe a list of one.
const DRAIN_SHOWN_COUNT = { double: 2, single: 1, triple: 3 } as const

// Ties break on declaration order, matching the fixed display order the strength cards use. Array#sort is
// stable, so starting from WORK_FACETS.drain is the whole tiebreak.
function shownDrainFacets(counts: Readonly<Record<DrainFacet, number>>, spread: DrainSpread): readonly DrainFacet[] {
  return [...WORK_FACETS.drain].sort((a, b) => counts[b] - counts[a]).slice(0, DRAIN_SHOWN_COUNT[spread])
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
  const freeShown = nameFacets(freeFacets, DRAIN_LABELS, DRAIN_DETAILS)
  const shown = new Set<DrainFacet>(freeFacets)
  const lead = new Set<DrainFacet>(leaders)

  const added = nameFacets(
    leaders.filter((facet) => !shown.has(facet)),
    DRAIN_LABELS,
    DRAIN_DETAILS,
  )
  const dropped = nameFacets(
    freeFacets.filter((facet) => !lead.has(facet)),
    DRAIN_LABELS,
    DRAIN_DETAILS,
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
    strands: DRAIN_SHOWN_COUNT[tally.spread],
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

  const ranked = WORK_FACETS.drain.map((facet) => counts[facet]).sort((a, b) => b - a)
  const top = ranked[0] ?? 0

  return {
    counts,
    exposure: 2,
    leaders: WORK_FACETS.drain.filter((facet) => counts[facet] === top),
    separation: top - (ranked[1] ?? 0),
    spread: resolveDrainBand(counts, 2),
  }
}

const PAID_DRAIN_PICKS = 3

type DrainSpread = RefinedAssessmentProfile['work']['drain']['spread']

function drainSignatureBlock(drain: DrainRead, leaders: readonly NamedFacet[]): EngineBlock {
  const data: DrainSignatureData = {
    contrast: drain.contrast,
    contrastLabels: {
      added: BLOCK_NOTES_KO.drainAdded,
      dropped: BLOCK_NOTES_KO.drainDropped,
      free: BLOCK_NOTES_KO.drainFreeShown,
    },
    leaders,
    meaning: DRAIN_SPREAD_MEANING,
    mergedWindow: drain.merged,
    spread: drain.spread,
    strands: drain.strands,
  }

  return block({ ...heading('drainSignature'), data }, ['life_work_profile'])
}

// Section 4 ------------------------------------------------------------------------------------------------

function happinessConditionsBlock(refined: RefinedAssessmentProfile): EngineBlock {
  return block(
    {
      ...heading('happinessConditions'),
      data: {
        environments: nameFacets(refined.work.environment.leaders, ENVIRONMENT_LABELS, ENVIRONMENT_DETAILS),
        headings: { environments: BLOCK_NOTES_KO.happinessEnvironments, needs: BLOCK_NOTES_KO.happinessNeeds },
        meaning: BLOCK_NOTES_KO.happinessMeaning,
        needs: nameFacets(refined.work.need.leaders, NEED_LABELS, NEED_DETAILS),
      },
    },
    ['life_work_profile'],
  )
}

// Section 5 ------------------------------------------------------------------------------------------------

function interestProfileBlock(refined: RefinedAssessmentProfile, interests: readonly NamedFacet[]): EngineBlock {
  return block(
    {
      ...heading('interestProfile'),
      data: {
        headings: { interests: BLOCK_NOTES_KO.interestInterests, purposes: BLOCK_NOTES_KO.interestPurposes },
        interests,
        meaning: BLOCK_NOTES_KO.interestMeaning,
        purposes: nameFacets(refined.work.purpose.leaders, PURPOSE_LABELS, PURPOSE_DETAILS),
      },
    },
    ['life_work_profile'],
  )
}

// Section 6 ------------------------------------------------------------------------------------------------

function roleFamilyCards(refined: RefinedAssessmentProfile): readonly RoleFamilyCard[] {
  return resolveRoleFamilies(refined.work.interest, refined.work.environment).map((pick) => ({
    carryOver: ROLE_FAMILY_CARRY_OVER,
    carryOverLabel: CONFIDENCE_LABELS[ROLE_FAMILY_CARRY_OVER.confidence],
    confidence: pick.confidence,
    confidenceLabel: CONFIDENCE_LABELS[pick.confidence],
    family: ROLE_FAMILIES[pick.familyId],
    pick,
  }))
}

// §4.1 allows this section to be omitted when the mapping table is missing. The table now covers all 36 cells
// and `resolveRoleFamilies` is total, so the omission branch is unreachable and is not written.
function roleFamiliesBlock(cards: readonly RoleFamilyCard[]): EngineBlock {
  const labels = {
    carryOver: BLOCK_NOTES_KO.roleCarryOver,
    checkPoints: BLOCK_NOTES_KO.roleCheckPoints,
    dailyWork: BLOCK_NOTES_KO.roleDailyWork,
    environment: BLOCK_NOTES_KO.roleEnvironment,
    examples: BLOCK_NOTES_KO.roleExamples,
    experiment: BLOCK_NOTES_KO.roleExperiment,
    whyFit: BLOCK_NOTES_KO.roleWhyFit,
  }
  return block({ ...heading('roleFamilies'), data: { cards, labels, notice: EXAMPLE_ROLE_NOTICE } }, [
    'life_work_profile',
    'world_role_card',
  ])
}

// Section 7 ------------------------------------------------------------------------------------------------

const QUEST_CLOSING =
  '7일 동안 모은 기록은 직업을 정해 주는 답이 아니에요. 어떤 자리와 역할을 더 살펴볼지 고르는 단서예요.'

const GENERIC_STRENGTH_TASK = '오늘 한 일 가운데 잘 풀린 것 하나를 골라 어떻게 했는지 세 줄로 적어요.'

// The skeleton is 09 §9.1 verbatim in intent: seven days that each fit in half an hour, cost nothing and need
// no one else. Only days 3, 4 and 5 read the profile — the drain leaders, the first strength card and the
// leading role family's own experiment — so the other four are the same week for every reader by design.
// `taskAnchor` is where a day quotes the reader's own result; a day with none is a day that did not need one.
function weekQuestBlock(
  drainLeaders: readonly NamedFacet[],
  strength: FreeStrengthCard | null,
  cards: readonly RoleFamilyCard[],
): EngineBlock {
  const drainLabel = drainLeaders.map((facet) => facet.label).join(' · ')
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
      taskAnchor: null,
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
      taskAnchor: null,
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
      task: '힘이 빠진 일을 하나 골라 업무 내용 때문인지 둘레의 조건 때문인지 나눠 적어요.',
      taskAnchor: { label: '결과에서 앞에 놓인 조건', value: drainLabel },
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
        ? `${strength.copy.shine} 작은 정리표를 만들거나 빠진 부분을 하나 찾는 정도면 충분해요.`
        : GENERIC_STRENGTH_TASK,
      taskAnchor: strength ? { label: '오늘 쓸 강점', value: strength.copy.name } : null,
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
        ? leading.family.experiment
        : '오늘 궁금한 일 하나를 30분 안에 끝나는 크기로 줄여 결과물 하나를 만들어 봐요.',
      taskAnchor: leading ? { label: '살펴볼 역할군', value: leading.family.name } : null,
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
      taskAnchor: null,
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
      taskAnchor: null,
      title: '다음 한 걸음 정하기',
    },
  ]

  const labels = {
    dayUnit: BLOCK_NOTES_KO.questDayUnit,
    done: BLOCK_NOTES_KO.questDoneLabel,
    minutes: BLOCK_NOTES_KO.questMinutesLabel,
    minutesUnit: BLOCK_NOTES_KO.questMinutesUnit,
    question: BLOCK_NOTES_KO.questQuestionLabel,
  }
  return block({ ...heading('weekQuest'), data: { closing: QUEST_CLOSING, days, labels } }, [
    'ability_card_ranking',
    'life_work_profile',
  ])
}

// Section 8 ------------------------------------------------------------------------------------------------

// Returns zero or one block. §4.1 row 8 omits the section when nothing was declared, and D13 removed the
// measured persona, so there is no second reading to contrast against — an omitted section is the honest shape.
function contextShiftBlocks(input: EngineReportInput, copy: AxisCopy): readonly EngineBlock[] {
  const declaredCode = input.declaredPersona
  if (!declaredCode || input.refined.personaSource === 'unknown') {
    return []
  }

  const measuredCode = input.refined.inner.code
  const axes: SelfReportAxis[] = TYPE_AXES.map((id, index) => {
    const content = copy[id]
    const declaredLetter = declaredCode[index] ?? ''
    const measuredLetter = measuredCode[index] ?? ''
    const matched = declaredLetter === measuredLetter
    return {
      axisName: content.name,
      declared: { code: declaredLetter, label: poleLabel(id, declaredLetter, content) },
      id,
      matched,
      measured: { code: measuredLetter, label: poleLabel(id, measuredLetter, content) },
      note: SELF_REPORT_AXIS_NOTES[id][matched ? 'matched' : 'split'],
    }
  })

  const data: ContextShiftData = {
    axes,
    closing: SELF_REPORT_CLOSING,
    declaredCode,
    labels: { declared: BLOCK_NOTES_KO.selfReportDeclared, measured: BLOCK_NOTES_KO.selfReportMeasured },
    measuredCode,
  }
  return [block({ ...heading('contextShift'), data }, ['persona_inner_gap'])]
}

type AxisContentShape = ReturnType<typeof axisCopyFor>[TypeAxisId]

// A declared letter is respondent input and reaches here as a bare `string`, so anything that is not the first
// pole folds onto the second — the same fold `free.ts` applies to the frozen code letters.
function poleLabel(axis: TypeAxisId, letter: string, content: AxisContentShape): string {
  return letter === AXIS_POLES[axis][0] ? content.first.label : content.second.label
}

// Section 9 ------------------------------------------------------------------------------------------------

const PATH_GUARDRAILS = [
  '경로를 대신 골라 주지 않아요.',
  '돈이 드는 등록은 첫 행동으로 두지 않아요.',
  '큰 결정은 이 카드에서 정하지 않아요.',
] as const

const STAY_NOTE = '지금 어떤 일을 하고 있는지는 묻지 않았어요. 그래서 이 경로는 이번 답만으로 확인할 수 없어요.'

function threePathsBlock(cards: readonly RoleFamilyCard[]): EngineBlock {
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
          leading.family.experiment,
          leading.family.checkPoints[0] ?? '',
          '그 자리에서 하루가 어떻게 흘러가는지 적어 둔 글을 찾아 읽어 봐요.',
        ].filter((action) => action.length > 0)
      : ['지금 하는 일과 이어지는 역할을 하나 적고 무엇이 겹치는지 세 줄로 적어 봐요.'],
    confidence: leading?.confidence ?? 'needsMoreInput',
    confidenceLabel: CONFIDENCE_LABELS[leading?.confidence ?? 'needsMoreInput'],
    id: 'reshape',
    note: leading ? `살펴볼 역할군 — ${leading.family.name}` : null,
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

  const data: ThreePathsData = {
    guardrails: PATH_GUARDRAILS,
    guardrailsHeading: BLOCK_NOTES_KO.pathGuardrailsHeading,
    paths: [stay, reshape, explore],
  }
  return block({ ...heading('threePaths'), data }, ['life_work_profile', 'world_role_card'])
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

function fitAndFrictionBlock(refined: RefinedAssessmentProfile, drainLeaders: readonly DrainFacet[]): EngineBlock {
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
    conditions: nameFacets(refined.work.environment.leaders, ENVIRONMENT_LABELS, ENVIRONMENT_DETAILS),
    confidence: 'needsMoreInput',
    confidenceLabel: CONFIDENCE_LABELS.needsMoreInput,
    contextNote: FIT_CONTEXT_NOTE,
    fits,
    frictions,
    labels: {
      adjust: BLOCK_NOTES_KO.frictionAdjustLabel,
      betterUse: BLOCK_NOTES_KO.fitBetterUseLabel,
      check: BLOCK_NOTES_KO.frictionCheckLabel,
      conditions: BLOCK_NOTES_KO.fitConditionsHeading,
      confidence: BLOCK_NOTES_KO.confidenceLabel,
      evidence: BLOCK_NOTES_KO.fitEvidenceLabel,
      fit: BLOCK_NOTES_KO.fitHeading,
      friction: BLOCK_NOTES_KO.frictionHeading,
    },
  }

  return block({ ...heading('fitAndFriction'), data }, ['life_work_profile'])
}

// Sections 11 and 12 ---------------------------------------------------------------------------------------
//
// Both used to be the model's alone, which meant the report opened and closed on nothing at all whenever the
// narrator was off — the deployment state this engine exists for. They are composed now, from tables authored
// for the purpose, and the model narrates over them if it is switched on.

function openingReadBlock(input: Parameters<typeof composeOpeningRead>[0]): EngineBlock {
  return block({ ...heading('openingRead'), data: composeOpeningRead(input) }, [
    'inner_axis_profile',
    'mind_axis_and_gem',
  ])
}

function reflectionQuestionsBlock(refined: RefinedAssessmentProfile): EngineBlock {
  const data = composeReflectionQuestions({
    drain: refined.work.drain,
    interest: refined.work.interest,
    need: refined.work.need,
  })
  return block({ ...heading('reflectionQuestions'), data }, ['life_work_profile'])
}
