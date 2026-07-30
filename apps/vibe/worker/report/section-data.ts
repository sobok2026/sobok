import type { NamedFacet } from '@deep-type/facets'
import type { AxisId, BandCopy, GemCode, InnerCode, PersonaCode, TypeAxisId, WorkFacetId } from '@deep-type/model'

import type { ConfidenceLevel, RoleFamily, RoleFamilyPick } from '../../deep-type/role-families'
import type { FreeStrengthCard } from '../../deep-type/rules/free'
import type { ReportSectionKey, SectionInputSource } from './section-keys'

// What a section IS, as data. The engine used to render each section into one pre-formatted string and store
// that; the reader then got twelve identical paragraphs of '· ' bullets and ' — ' separators while the typed
// result that produced them was thrown away at the storage boundary. A card, a quest day and a band ladder are
// not the same shape and should not arrive as the same shape, so what crosses the boundary is the shape.
//
// Type-only imports throughout. This module is named by the Next client tree — the report screen renders these
// — and a value import here would pull the paid content tables into the browser bundle, which §4.2 forbids.
// Every import above is erased at compile time; adding a value import to this file is the mistake to catch in
// review.

/** Kicker + body, the composed reading's basic unit. `note` carries an aside the kicker cannot hold. */
export interface ReportParagraph {
  kicker: string
  note: string | null
  text: string
}

export interface WorldJobData {
  codes: { gem: GemCode; inner: InnerCode }
  core: { name: string; strength: string }
  family: { method: string; name: string; role: string }
  /** One of 256 authored names. Hand-written, not composed from the two halves above. */
  name: string
  /** A paragraph under each half — what the method looks like at work, and what pushes it. */
  reading: { core: string; family: string }
}

/**
 * One axis as the paid ruler leaves it. D14's other half: the free tier labels its bands tentatively, and the
 * only thing that earns that hedge is the paid pass actually saying where the ruler landed and which way it
 * moved.
 */
export interface AxisBandMovement {
  /** Paid band copy. The settled ruler, not the tentative one the cards above were grouped by. */
  band: BandCopy
  /** Which of the three rungs the band sits on, for renderers that draw the ladder rather than name it. */
  step: 1 | 2 | 3
  /** True when the added items leaned against the frozen letter. Forces `shift` to `down` before any compare. */
  evidenceSplit: boolean
  id: AxisId
  /** The frozen pole's label, read off the code rather than off the recomputed score. */
  leading: string
  name: string
  shift: BandCopy
  /** Direction of `shift`, so a renderer need not compare label strings to pick a glyph. */
  shiftDirection: 'down' | 'same' | 'up'
}

/**
 * One band's worth of cards under its own heading. Grouped, never ranked (§4.3): comparing |lean| across axes
 * measured by three items each is an unequated within-person comparison, so the cards are grouped by the band
 * they landed in and the order inside a group is the engine's fixed declaration order. Combos keep their own
 * groups — `min(A, B)` ties a parent by definition, so a shared list would present a tie as an ordering.
 *
 * Empty groups are not emitted. A heading over nothing is a hole where a reader looks for a finding.
 */
export interface StrengthCardGroup {
  cards: readonly FreeStrengthCard[]
  heading: string
}

export interface StrengthCardsData {
  /** All eight axes, always. A list that skipped the unmoved ones would make its own length a signal. */
  bandMovement: readonly AxisBandMovement[]
  /** Heading over the movement list, and the label naming the split axes under it. */
  movementHeading: string
  splitLabel: string
  /** The engine's own note on what the paid ruler re-drew and what it left alone. */
  clarityNote: string
  /** Present only when every axis landed near even and no card cleared the bar. */
  emptyNote: string | null
  groups: readonly StrengthCardGroup[]
  /** Named when at least one axis answered both ways, empty otherwise. Never a count presented as a finding. */
  splitAxisNames: readonly string[]
  /** Said once under the movement list when nothing split, so absence is stated rather than left blank. */
  splitNote: string
}

/**
 * A named facet plus the authored paragraph that turns a label into something worth reading.
 *
 * It extends `NamedFacet` rather than widening it. `deep-type/facets.ts` is importable by the free bundle
 * precisely because it carries no copy, and `detail` comes out of `facet-details.paid.ts` — so putting the field
 * there would either drag a paid table into the free engine's call sites or make `nameFacets` take a details
 * argument the free tier has nothing to pass. The extra data belongs to the layer that owns it.
 */
export interface DetailedFacet<Facet extends WorkFacetId = WorkFacetId> extends NamedFacet<Facet> {
  /** The same condition read from the other side. See `facet-details.paid.ts` for the per-dimension direction. */
  contrast: string
  detail: string
}

export type DrainContrastRelation = 'narrowed' | 'same' | 'shifted' | 'widened'

/**
 * Required, not optional. `drainSignature` is the one section both tiers render, so a paid drain block that
 * cannot say how it relates to the block the reader already saw is incomplete.
 */
export interface DrainContrast {
  /** Paid leaders the free block did not show. */
  added: readonly DetailedFacet[]
  /** Free leaders the paid read no longer leads with. */
  dropped: readonly DetailedFacet[]
  freeShown: readonly DetailedFacet[]
  relation: DrainContrastRelation
  sentence: string
}

export interface DrainSignatureData {
  contrast: DrainContrast
  contrastLabels: { added: string; dropped: string; free: string }
  leaders: readonly DetailedFacet[]
  meaning: string
  /** True when the paid read summed both sittings. It reports the computation, so it cannot describe a wish. */
  mergedWindow: boolean
  spread: BandCopy
  /** How many facets the spread put on screen. The renderer draws that many strands. */
  strands: 1 | 2 | 3
}

export interface HappinessConditionsData {
  environments: readonly DetailedFacet[]
  headings: { environments: string; needs: string }
  meaning: string
  needs: readonly DetailedFacet[]
}

export interface InterestProfileData {
  headings: { interests: string; purposes: string }
  interests: readonly DetailedFacet[]
  meaning: string
  purposes: readonly DetailedFacet[]
}

export interface RoleFamilyCarryOver {
  confidence: Extract<ConfidenceLevel, 'needsMoreInput'>
  text: string
}

export interface RoleFamilyCard {
  carryOver: RoleFamilyCarryOver
  carryOverLabel: string
  confidence: ConfidenceLevel
  confidenceLabel: string
  family: RoleFamily
  pick: RoleFamilyPick
}

export interface RoleFamiliesData {
  cards: readonly RoleFamilyCard[]
  labels: {
    carryOver: string
    checkPoints: string
    dailyWork: string
    environment: string
    examples: string
    experiment: string
    whyFit: string
  }
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
  /** Set where the day reads the reader's own result rather than running the same week for everyone. */
  taskAnchor: { label: string; value: string } | null
  title: string
}

export type QuestWeek = readonly [QuestDay, QuestDay, QuestDay, QuestDay, QuestDay, QuestDay, QuestDay]

export interface WeekQuestData {
  closing: string
  days: QuestWeek
  labels: { dayUnit: string; done: string; minutes: string; minutesUnit: string; question: string }
}

export interface SelfReportAxis {
  axisName: string
  declared: { code: string; label: string }
  id: TypeAxisId
  matched: boolean
  measured: { code: string; label: string }
  /** Authored line for this axis, in the matched or the split reading. Never a verdict on which is true. */
  note: string
}

export interface ContextShiftData {
  axes: readonly SelfReportAxis[]
  closing: string
  declaredCode: PersonaCode
  labels: { declared: string; measured: string }
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
  guardrailsHeading: string
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
  confidenceLabel: string
  conditions: readonly DetailedFacet[]
  contextNote: string
  fits: readonly FitPoint[]
  frictions: readonly FrictionPoint[]
  labels: {
    adjust: string
    betterUse: string
    check: string
    conditions: string
    confidence: string
    evidence: string
    fit: string
    friction: string
  }
}

/**
 * A run of paragraphs under one heading. Three of them make the opening readable at eleven paragraphs: without
 * the headings the section is one wall, and with them it is the two layers of letters and then the work read.
 */
export interface OpeningBlock {
  heading: string
  paragraphs: readonly ReportParagraph[]
}

/**
 * The composed opening. `lead` names the world job and what it is made of; the blocks read every axis of both
 * layers and then what the work answers point at. Nothing in here is ranked — see `compose.ts`.
 */
export interface OpeningReadData {
  blocks: readonly OpeningBlock[]
  lead: string
  closing: string
  codes: { gem: GemCode; inner: InnerCode }
  /** The world job name, repeated as data so the renderer need not parse it back out of `lead`. */
  worldJobName: string
}

export interface ReflectionQuestion {
  /** Which section it was drawn from, in the reader's words, so they can go back and re-read that block. */
  source: string
  text: string
  /** What a week of carrying the question shows that today cannot. Never a hint at the answer. */
  why: string
}

export interface ReflectionQuestionsData {
  closing: string
  questions: readonly ReflectionQuestion[]
}

interface SectionOf<Key extends ReportSectionKey, Data> {
  data: Data
  /** One authored line under the heading. Every section has one; none of them are composed per reader. */
  intro: string
  key: Key
  title: string
}

/**
 * Exactly what a row of `report.sections` holds, and what `GET /report` hands the screen. Discriminated by
 * `key`, so a renderer that switches on it gets the right `data` without a cast and a new section key does not
 * compile until something renders it.
 */
export type ReportSection =
  | SectionOf<'contextShift', ContextShiftData>
  | SectionOf<'drainSignature', DrainSignatureData>
  | SectionOf<'fitAndFriction', FitAndFrictionData>
  | SectionOf<'happinessConditions', HappinessConditionsData>
  | SectionOf<'interestProfile', InterestProfileData>
  | SectionOf<'openingRead', OpeningReadData>
  | SectionOf<'reflectionQuestions', ReflectionQuestionsData>
  | SectionOf<'roleFamilies', RoleFamiliesData>
  | SectionOf<'strengthCards', StrengthCardsData>
  | SectionOf<'threePaths', ThreePathsData>
  | SectionOf<'weekQuest', WeekQuestData>
  | SectionOf<'worldJob', WorldJobData>

/**
 * What a row of `report.narrative` holds. Prose, because that is what the model writes — it narrates over a
 * section the engine has already structured, and asking it for structure would let it re-decide findings that
 * are not its to decide.
 */
export interface NarrativeSection {
  body: string
  key: ReportSectionKey
  title: string
}

/** Server-side envelope: the section plus the bookkeeping that never leaves the Worker. */
export interface EngineBlock<Section extends ReportSection = ReportSection> {
  /** What this section rests on. Verified against `SECTION_CLAIMS` at construction, never merely declared. */
  claims: readonly string[]
  /** §4.1 '입력 출처', read from the contract rather than restated. */
  inputSource: SectionInputSource
  section: Section
}
