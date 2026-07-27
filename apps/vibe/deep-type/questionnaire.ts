import {
  AXES,
  type AxisId,
  type DrainFacet,
  type DrainFraming,
  type EnvironmentFacet,
  type InterestFacet,
  type NeedFacet,
  type PurposeFacet,
} from './model'

export type BaseLayer = 'persona' | 'inner' | 'gem'

export type BaseItem = {
  readonly axis: AxisId | 'NE'
  readonly id: string
  readonly layer: BaseLayer
  /** When true, agreement contributes toward the axis's second pole. */
  readonly reverse: boolean
}

export type RefinementItem = {
  readonly axis: AxisId
  readonly id: string
  readonly layer: 'inner' | 'gem'
  readonly reverse: boolean
}

// Three banks below are the authored inventory, not the scored instrument. `PERSONA_ITEMS`, the `NE` axis and
// the unselected two thirds of `REFINEMENT_ITEMS` stay exported and stay out of every scoring path: the split
// has to be reversible, and deleting the records would make reverting a selection decision an authoring job.
//
// Keying inside a bank is two forward + two reverse per axis. That balance no longer cancels straight-line
// responding, because the scored instrument draws an odd count per axis on purpose (see FREE_SELECTION).
export const PERSONA_ITEMS = [
  { id: 'persona-ei-1', layer: 'persona', axis: 'EI', reverse: false },
  { id: 'persona-ei-2', layer: 'persona', axis: 'EI', reverse: true },
  { id: 'persona-ei-3', layer: 'persona', axis: 'EI', reverse: false },
  { id: 'persona-ei-4', layer: 'persona', axis: 'EI', reverse: true },
  { id: 'persona-sn-1', layer: 'persona', axis: 'SN', reverse: false },
  { id: 'persona-sn-2', layer: 'persona', axis: 'SN', reverse: true },
  { id: 'persona-sn-3', layer: 'persona', axis: 'SN', reverse: false },
  { id: 'persona-sn-4', layer: 'persona', axis: 'SN', reverse: true },
  { id: 'persona-tf-1', layer: 'persona', axis: 'TF', reverse: false },
  { id: 'persona-tf-2', layer: 'persona', axis: 'TF', reverse: true },
  { id: 'persona-tf-3', layer: 'persona', axis: 'TF', reverse: false },
  { id: 'persona-tf-4', layer: 'persona', axis: 'TF', reverse: true },
  { id: 'persona-jp-1', layer: 'persona', axis: 'JP', reverse: false },
  { id: 'persona-jp-2', layer: 'persona', axis: 'JP', reverse: true },
  { id: 'persona-jp-3', layer: 'persona', axis: 'JP', reverse: false },
  { id: 'persona-jp-4', layer: 'persona', axis: 'JP', reverse: true },
  { id: 'persona-ne-1', layer: 'persona', axis: 'NE', reverse: false },
  { id: 'persona-ne-2', layer: 'persona', axis: 'NE', reverse: true },
  { id: 'persona-ne-3', layer: 'persona', axis: 'NE', reverse: false },
  { id: 'persona-ne-4', layer: 'persona', axis: 'NE', reverse: true },
] as const satisfies readonly BaseItem[]

export const INNER_ITEMS = [
  { id: 'inner-ei-1', layer: 'inner', axis: 'EI', reverse: false },
  { id: 'inner-ei-2', layer: 'inner', axis: 'EI', reverse: true },
  { id: 'inner-ei-3', layer: 'inner', axis: 'EI', reverse: false },
  { id: 'inner-ei-4', layer: 'inner', axis: 'EI', reverse: true },
  { id: 'inner-sn-1', layer: 'inner', axis: 'SN', reverse: false },
  { id: 'inner-sn-2', layer: 'inner', axis: 'SN', reverse: true },
  { id: 'inner-sn-3', layer: 'inner', axis: 'SN', reverse: false },
  { id: 'inner-sn-4', layer: 'inner', axis: 'SN', reverse: true },
  { id: 'inner-tf-1', layer: 'inner', axis: 'TF', reverse: false },
  { id: 'inner-tf-2', layer: 'inner', axis: 'TF', reverse: true },
  { id: 'inner-tf-3', layer: 'inner', axis: 'TF', reverse: false },
  { id: 'inner-tf-4', layer: 'inner', axis: 'TF', reverse: true },
  { id: 'inner-jp-1', layer: 'inner', axis: 'JP', reverse: false },
  { id: 'inner-jp-2', layer: 'inner', axis: 'JP', reverse: true },
  { id: 'inner-jp-3', layer: 'inner', axis: 'JP', reverse: false },
  { id: 'inner-jp-4', layer: 'inner', axis: 'JP', reverse: true },
  { id: 'inner-ne-1', layer: 'inner', axis: 'NE', reverse: false },
  { id: 'inner-ne-2', layer: 'inner', axis: 'NE', reverse: true },
  { id: 'inner-ne-3', layer: 'inner', axis: 'NE', reverse: false },
  { id: 'inner-ne-4', layer: 'inner', axis: 'NE', reverse: true },
] as const satisfies readonly BaseItem[]

export const GEM_ITEMS = [
  { id: 'gem-rm-1', layer: 'gem', axis: 'RM', reverse: false },
  { id: 'gem-rm-2', layer: 'gem', axis: 'RM', reverse: true },
  { id: 'gem-rm-3', layer: 'gem', axis: 'RM', reverse: false },
  { id: 'gem-rm-4', layer: 'gem', axis: 'RM', reverse: true },
  { id: 'gem-oa-1', layer: 'gem', axis: 'OA', reverse: false },
  { id: 'gem-oa-2', layer: 'gem', axis: 'OA', reverse: true },
  { id: 'gem-oa-3', layer: 'gem', axis: 'OA', reverse: false },
  { id: 'gem-oa-4', layer: 'gem', axis: 'OA', reverse: true },
  { id: 'gem-vh-1', layer: 'gem', axis: 'VH', reverse: false },
  { id: 'gem-vh-2', layer: 'gem', axis: 'VH', reverse: true },
  { id: 'gem-vh-3', layer: 'gem', axis: 'VH', reverse: false },
  { id: 'gem-vh-4', layer: 'gem', axis: 'VH', reverse: true },
  { id: 'gem-uo-1', layer: 'gem', axis: 'UO', reverse: false },
  { id: 'gem-uo-2', layer: 'gem', axis: 'UO', reverse: true },
  { id: 'gem-uo-3', layer: 'gem', axis: 'UO', reverse: false },
  { id: 'gem-uo-4', layer: 'gem', axis: 'UO', reverse: true },
] as const satisfies readonly BaseItem[]

export const REFINEMENT_ITEMS = [
  { id: 'refine-inner-ei-1', layer: 'inner', axis: 'EI', reverse: true },
  { id: 'refine-inner-ei-2', layer: 'inner', axis: 'EI', reverse: false },
  { id: 'refine-inner-ei-3', layer: 'inner', axis: 'EI', reverse: false },
  { id: 'refine-inner-ei-4', layer: 'inner', axis: 'EI', reverse: true },
  { id: 'refine-inner-sn-1', layer: 'inner', axis: 'SN', reverse: true },
  { id: 'refine-inner-sn-2', layer: 'inner', axis: 'SN', reverse: false },
  { id: 'refine-inner-sn-3', layer: 'inner', axis: 'SN', reverse: false },
  { id: 'refine-inner-sn-4', layer: 'inner', axis: 'SN', reverse: true },
  { id: 'refine-inner-tf-1', layer: 'inner', axis: 'TF', reverse: false },
  { id: 'refine-inner-tf-2', layer: 'inner', axis: 'TF', reverse: true },
  { id: 'refine-inner-tf-3', layer: 'inner', axis: 'TF', reverse: false },
  { id: 'refine-inner-tf-4', layer: 'inner', axis: 'TF', reverse: true },
  { id: 'refine-inner-jp-1', layer: 'inner', axis: 'JP', reverse: false },
  { id: 'refine-inner-jp-2', layer: 'inner', axis: 'JP', reverse: true },
  { id: 'refine-inner-jp-3', layer: 'inner', axis: 'JP', reverse: false },
  { id: 'refine-inner-jp-4', layer: 'inner', axis: 'JP', reverse: true },
  { id: 'refine-gem-rm-1', layer: 'gem', axis: 'RM', reverse: false },
  { id: 'refine-gem-rm-2', layer: 'gem', axis: 'RM', reverse: true },
  { id: 'refine-gem-rm-3', layer: 'gem', axis: 'RM', reverse: false },
  { id: 'refine-gem-rm-4', layer: 'gem', axis: 'RM', reverse: true },
  { id: 'refine-gem-oa-1', layer: 'gem', axis: 'OA', reverse: false },
  { id: 'refine-gem-oa-2', layer: 'gem', axis: 'OA', reverse: true },
  { id: 'refine-gem-oa-3', layer: 'gem', axis: 'OA', reverse: false },
  { id: 'refine-gem-oa-4', layer: 'gem', axis: 'OA', reverse: true },
  { id: 'refine-gem-vh-1', layer: 'gem', axis: 'VH', reverse: false },
  { id: 'refine-gem-vh-2', layer: 'gem', axis: 'VH', reverse: true },
  { id: 'refine-gem-vh-3', layer: 'gem', axis: 'VH', reverse: false },
  { id: 'refine-gem-vh-4', layer: 'gem', axis: 'VH', reverse: true },
  { id: 'refine-gem-uo-1', layer: 'gem', axis: 'UO', reverse: false },
  { id: 'refine-gem-uo-2', layer: 'gem', axis: 'UO', reverse: true },
  { id: 'refine-gem-uo-3', layer: 'gem', axis: 'UO', reverse: false },
  { id: 'refine-gem-uo-4', layer: 'gem', axis: 'UO', reverse: true },
] as const satisfies readonly RefinementItem[]

// Selection tables, in `[forward, forward, reverse]` and `[forward, reverse]` order. Three rules produced them:
// an axis draws its free three from one source layer and its paid two from one source layer, so keying is never
// confounded with context; no `-4` id is drawn, which is what keeps the three non-ko locales free of the 90
// placeholder strings each; and the count per axis stays odd on both passes so no tie can occur.
const FREE_SELECTION = {
  EI: ['inner-ei-1', 'inner-ei-3', 'inner-ei-2'],
  SN: ['inner-sn-1', 'inner-sn-3', 'inner-sn-2'],
  TF: ['inner-tf-1', 'inner-tf-3', 'inner-tf-2'],
  JP: ['inner-jp-1', 'inner-jp-3', 'inner-jp-2'],
  RM: ['gem-rm-1', 'gem-rm-3', 'gem-rm-2'],
  OA: ['gem-oa-1', 'gem-oa-3', 'gem-oa-2'],
  VH: ['gem-vh-1', 'gem-vh-3', 'gem-vh-2'],
  UO: ['gem-uo-1', 'gem-uo-3', 'gem-uo-2'],
} as const satisfies Record<AxisId, readonly [string, string, string]>

const PAID_SELECTION = {
  EI: ['refine-inner-ei-2', 'refine-inner-ei-1'],
  SN: ['refine-inner-sn-2', 'refine-inner-sn-1'],
  TF: ['refine-inner-tf-1', 'refine-inner-tf-2'],
  JP: ['refine-inner-jp-3', 'refine-inner-jp-2'],
  RM: ['refine-gem-rm-1', 'refine-gem-rm-2'],
  OA: ['refine-gem-oa-1', 'refine-gem-oa-2'],
  VH: ['refine-gem-vh-1', 'refine-gem-vh-2'],
  // `refine-gem-uo-3`, not `-1`: `-1` restates `gem-uo-3` almost verbatim ("목표를 세울 때 피해야 할 손실/위험부터
  // 떠올린다"), and the two scored together at 4-gram Jaccard 0.1718 — the worst pair in the instrument and well
  // over the 0.10 gate. Swapping to `-3` drops the UO maximum to 0.0316 and keeps the one forward + one reverse
  // keying, because `-3` is forward exactly as `-1` was. See `_content/question-similarity.test.ts`.
  UO: ['refine-gem-uo-3', 'refine-gem-uo-2'],
} as const satisfies Record<AxisId, readonly [string, string]>

function pick<Item extends { id: string }>(bank: readonly Item[], ids: readonly string[]): readonly Item[] {
  return ids.map((id) => {
    const item = bank.find((candidate) => candidate.id === id)
    if (!item) {
      throw new Error(`DeepType selection references an unknown item: ${id}`)
    }
    return item
  })
}

const BASE_BANK = [...INNER_ITEMS, ...GEM_ITEMS] as readonly BaseItem[]

/** 24 items, eight axes × two forward + one reverse, drawn from the base layer. */
export const FREE_LIKERT_ITEMS: readonly BaseItem[] = AXES.flatMap((axis) => pick(BASE_BANK, FREE_SELECTION[axis]))

/** 16 items, eight axes × one forward + one reverse, drawn from the refine layer. Bands only — poles are frozen. */
export const PAID_LIKERT_ITEMS: readonly RefinementItem[] = AXES.flatMap((axis) =>
  pick(REFINEMENT_ITEMS, PAID_SELECTION[axis]),
)

export type WorkItem =
  | {
      readonly dimension: 'interest'
      readonly facets: readonly [InterestFacet, InterestFacet, InterestFacet, InterestFacet]
      readonly framing: null
      readonly id: string
    }
  | {
      readonly dimension: 'need'
      readonly facets: readonly [NeedFacet, NeedFacet, NeedFacet, NeedFacet]
      readonly framing: null
      readonly id: string
    }
  | {
      readonly dimension: 'drain'
      readonly facets: readonly [DrainFacet, DrainFacet, DrainFacet, DrainFacet]
      readonly framing: DrainFraming
      readonly id: string
    }
  | {
      readonly dimension: 'purpose'
      readonly facets: readonly [PurposeFacet, PurposeFacet, PurposeFacet, PurposeFacet]
      readonly framing: null
      readonly id: string
    }
  | {
      readonly dimension: 'environment'
      readonly facets: readonly [EnvironmentFacet, EnvironmentFacet, EnvironmentFacet, EnvironmentFacet]
      readonly framing: null
      readonly id: string
    }

// Forced-choice blocks. `facets` is positional: index i names the facet that option i credits, and every option
// carries the same weight, so separation is a difference in pick counts and never in summed weights.
//
// Item counts per dimension are forced, not chosen: four options over six facets means a dimension needs a
// multiple of three items for equal exposure, and exposure has to be equal or the facet with more chances wins
// on arithmetic alone. That is why drain splits 3 free + 3 paid, and why purpose and environment drop to three.
const INTEREST_ITEMS = [
  { id: 'B01', dimension: 'interest', framing: null, facets: ['MAKE', 'ANALYZE', 'CREATE', 'HELP'] },
  { id: 'B02', dimension: 'interest', framing: null, facets: ['LEAD', 'ORDER', 'MAKE', 'HELP'] },
  { id: 'B03', dimension: 'interest', framing: null, facets: ['ANALYZE', 'CREATE', 'LEAD', 'ORDER'] },
  { id: 'B04', dimension: 'interest', framing: null, facets: ['MAKE', 'ANALYZE', 'HELP', 'ORDER'] },
  { id: 'B05', dimension: 'interest', framing: null, facets: ['CREATE', 'HELP', 'LEAD', 'ANALYZE'] },
  { id: 'B06', dimension: 'interest', framing: null, facets: ['MAKE', 'CREATE', 'LEAD', 'ORDER'] },
] as const satisfies readonly WorkItem[]

// B26 and B27 are newly authored. Equal exposure fixes what they must *contain* — the deficit over B07..B10 is
// {STABLE×2, NOVEL×2, AUT, MASTER, IMPACT, BELONG}, eight slots — but it does not fix how those eight split into
// two four-facet items. STABLE and NOVEL each need two exposures across two items, so one of each lands in each
// item; the remaining four then split into pairs three ways, and the three are not equivalent:
//
//   {AUT,MASTER} + {IMPACT,BELONG} → AUT·MASTER 4, IMPACT·BELONG 4   (worst)
//   {AUT,IMPACT} + {MASTER,BELONG} → every such pair 3               (chosen)
//   {AUT,BELONG} + {MASTER,IMPACT} → every such pair 3               (isomorphic to the chosen one)
//
// Counts are co-occurrences over all six need items. B07 and B10 already pair AUT·MASTER and IMPACT·BELONG
// twice each, so repeating either pair here takes it to four of six items — two facets that almost always
// compete head to head, which decides the tally by pairing rather than by preference. STABLE·NOVEL sits at four
// no matter what and is excluded from the comparison: both new items must carry both. The third split ties the
// second on every pair count, so the choice between them is arbitrary and the tie is recorded rather than hidden.
//
// Option order also keeps no facet in the same slot as the preceding need item.
const NEED_ITEMS = [
  { id: 'B07', dimension: 'need', framing: null, facets: ['AUT', 'MASTER', 'IMPACT', 'BELONG'] },
  { id: 'B08', dimension: 'need', framing: null, facets: ['STABLE', 'NOVEL', 'AUT', 'MASTER'] },
  { id: 'B09', dimension: 'need', framing: null, facets: ['BELONG', 'IMPACT', 'STABLE', 'NOVEL'] },
  { id: 'B10', dimension: 'need', framing: null, facets: ['AUT', 'MASTER', 'IMPACT', 'BELONG'] },
  { id: 'B26', dimension: 'need', framing: null, facets: ['STABLE', 'NOVEL', 'AUT', 'IMPACT'] },
  { id: 'B27', dimension: 'need', framing: null, facets: ['MASTER', 'BELONG', 'STABLE', 'NOVEL'] },
] as const satisfies readonly WorkItem[]

// Only four of the twenty possible 3+3 drain splits give both halves equal facet exposure. This is one of them,
// and it is the one whose free half stays on low-recall scenes. B25 is newly authored; its facet set was forced
// by the other five, and it completes the resource trio as the prospective, structural counterpart to B13/B14.
const FREE_DRAIN_ITEMS = [
  { id: 'B11', dimension: 'drain', framing: 'demand', facets: ['BREAK', 'VAGUE', 'OVERLOAD', 'TENSION'] },
  { id: 'B12', dimension: 'drain', framing: 'demand', facets: ['EMPTY', 'STUCK', 'BREAK', 'VAGUE'] },
  { id: 'B13', dimension: 'drain', framing: 'resource', facets: ['OVERLOAD', 'TENSION', 'EMPTY', 'STUCK'] },
] as const satisfies readonly WorkItem[]

const PAID_DRAIN_ITEMS = [
  { id: 'B14', dimension: 'drain', framing: 'resource', facets: ['BREAK', 'VAGUE', 'OVERLOAD', 'TENSION'] },
  { id: 'B15', dimension: 'drain', framing: 'demand', facets: ['EMPTY', 'STUCK', 'BREAK', 'OVERLOAD'] },
  { id: 'B25', dimension: 'drain', framing: 'resource', facets: ['VAGUE', 'EMPTY', 'TENSION', 'STUCK'] },
] as const satisfies readonly WorkItem[]

// B19 is dropped from purpose and B23/B24 from environment. Equal exposure at three items admits exactly one
// combination in each dimension, so the drops are forced by the arithmetic rather than by an editorial call.
const PURPOSE_ITEMS = [
  { id: 'B16', dimension: 'purpose', framing: null, facets: ['SOLVE', 'UNDERSTAND', 'EXPRESS', 'CARE'] },
  { id: 'B17', dimension: 'purpose', framing: null, facets: ['MOVE', 'STEADY', 'SOLVE', 'CARE'] },
  { id: 'B18', dimension: 'purpose', framing: null, facets: ['UNDERSTAND', 'EXPRESS', 'MOVE', 'STEADY'] },
] as const satisfies readonly WorkItem[]

const ENVIRONMENT_ITEMS = [
  {
    id: 'B20',
    dimension: 'environment',
    framing: null,
    facets: ['FOCUS_ENV', 'TOGETHER_ENV', 'FREEDOM_ENV', 'CLEAR_ENV'],
  },
  {
    id: 'B21',
    dimension: 'environment',
    framing: null,
    facets: ['VARIETY_ENV', 'VISIBLE_ENV', 'FOCUS_ENV', 'TOGETHER_ENV'],
  },
  {
    id: 'B22',
    dimension: 'environment',
    framing: null,
    facets: ['FREEDOM_ENV', 'CLEAR_ENV', 'VARIETY_ENV', 'VISIBLE_ENV'],
  },
] as const satisfies readonly WorkItem[]

/** 3 items. Drain only, at two exposures per facet. */
export const FREE_WORK_ITEMS: readonly WorkItem[] = FREE_DRAIN_ITEMS

/** 21 items across all five dimensions, in block order. */
export const PAID_WORK_ITEMS: readonly WorkItem[] = [
  ...INTEREST_ITEMS,
  ...NEED_ITEMS,
  ...PAID_DRAIN_ITEMS,
  ...PURPOSE_ITEMS,
  ...ENVIRONMENT_ITEMS,
]

export const WORK_ITEMS: readonly WorkItem[] = [...FREE_WORK_ITEMS, ...PAID_WORK_ITEMS]

/** 27 = 24 Likert + 3 drain. Constant for every respondent; copy must read it rather than restate it. */
export const FREE_ITEM_COUNT = FREE_LIKERT_ITEMS.length + FREE_WORK_ITEMS.length

/** 37 = 16 Likert + 21 work. */
export const PAID_ITEM_COUNT = PAID_LIKERT_ITEMS.length + PAID_WORK_ITEMS.length
