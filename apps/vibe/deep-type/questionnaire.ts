import type { AxisId, GemAxisId, TypeAxisId } from './model'

export type BaseLayer = 'persona' | 'inner' | 'gem'

export type BaseItem = {
  readonly axis: AxisId
  readonly id: string
  readonly layer: BaseLayer
  /** When true, agreement contributes toward the axis's second pole. */
  readonly reverse: boolean
}

export type RefinementItem = {
  readonly axis: TypeAxisId | GemAxisId
  readonly id: string
  readonly layer: 'inner' | 'gem'
  readonly reverse: boolean
}

export const PERSONA_ITEMS = [
  { id: 'persona-ei-1', layer: 'persona', axis: 'EI', reverse: false },
  { id: 'persona-ei-2', layer: 'persona', axis: 'EI', reverse: true },
  { id: 'persona-ei-3', layer: 'persona', axis: 'EI', reverse: false },
  { id: 'persona-sn-1', layer: 'persona', axis: 'SN', reverse: false },
  { id: 'persona-sn-2', layer: 'persona', axis: 'SN', reverse: true },
  { id: 'persona-sn-3', layer: 'persona', axis: 'SN', reverse: false },
  { id: 'persona-tf-1', layer: 'persona', axis: 'TF', reverse: false },
  { id: 'persona-tf-2', layer: 'persona', axis: 'TF', reverse: true },
  { id: 'persona-tf-3', layer: 'persona', axis: 'TF', reverse: false },
  { id: 'persona-jp-1', layer: 'persona', axis: 'JP', reverse: false },
  { id: 'persona-jp-2', layer: 'persona', axis: 'JP', reverse: true },
  { id: 'persona-jp-3', layer: 'persona', axis: 'JP', reverse: false },
  { id: 'persona-ne-1', layer: 'persona', axis: 'NE', reverse: false },
  { id: 'persona-ne-2', layer: 'persona', axis: 'NE', reverse: true },
  { id: 'persona-ne-3', layer: 'persona', axis: 'NE', reverse: false },
] as const satisfies readonly BaseItem[]

// The Inner bank intentionally mirrors Persona's constructs and keying. Only the context changes, so the
// comparison reflects context-dependent expression instead of two different questionnaires.
export const INNER_ITEMS = [
  { id: 'inner-ei-1', layer: 'inner', axis: 'EI', reverse: false },
  { id: 'inner-ei-2', layer: 'inner', axis: 'EI', reverse: true },
  { id: 'inner-ei-3', layer: 'inner', axis: 'EI', reverse: false },
  { id: 'inner-sn-1', layer: 'inner', axis: 'SN', reverse: false },
  { id: 'inner-sn-2', layer: 'inner', axis: 'SN', reverse: true },
  { id: 'inner-sn-3', layer: 'inner', axis: 'SN', reverse: false },
  { id: 'inner-tf-1', layer: 'inner', axis: 'TF', reverse: false },
  { id: 'inner-tf-2', layer: 'inner', axis: 'TF', reverse: true },
  { id: 'inner-tf-3', layer: 'inner', axis: 'TF', reverse: false },
  { id: 'inner-jp-1', layer: 'inner', axis: 'JP', reverse: false },
  { id: 'inner-jp-2', layer: 'inner', axis: 'JP', reverse: true },
  { id: 'inner-jp-3', layer: 'inner', axis: 'JP', reverse: false },
  { id: 'inner-ne-1', layer: 'inner', axis: 'NE', reverse: false },
  { id: 'inner-ne-2', layer: 'inner', axis: 'NE', reverse: true },
  { id: 'inner-ne-3', layer: 'inner', axis: 'NE', reverse: false },
] as const satisfies readonly BaseItem[]

export const GEM_ITEMS = [
  { id: 'gem-rm-1', layer: 'gem', axis: 'RM', reverse: false },
  { id: 'gem-rm-2', layer: 'gem', axis: 'RM', reverse: true },
  { id: 'gem-rm-3', layer: 'gem', axis: 'RM', reverse: false },
  { id: 'gem-rm-4', layer: 'gem', axis: 'RM', reverse: true },
  { id: 'gem-rm-5', layer: 'gem', axis: 'RM', reverse: false },
  { id: 'gem-oa-1', layer: 'gem', axis: 'OA', reverse: false },
  { id: 'gem-oa-2', layer: 'gem', axis: 'OA', reverse: true },
  { id: 'gem-oa-3', layer: 'gem', axis: 'OA', reverse: false },
  { id: 'gem-oa-4', layer: 'gem', axis: 'OA', reverse: true },
  { id: 'gem-oa-5', layer: 'gem', axis: 'OA', reverse: false },
  { id: 'gem-vh-1', layer: 'gem', axis: 'VH', reverse: false },
  { id: 'gem-vh-2', layer: 'gem', axis: 'VH', reverse: true },
  { id: 'gem-vh-3', layer: 'gem', axis: 'VH', reverse: false },
  { id: 'gem-vh-4', layer: 'gem', axis: 'VH', reverse: true },
  { id: 'gem-vh-5', layer: 'gem', axis: 'VH', reverse: false },
  { id: 'gem-uo-1', layer: 'gem', axis: 'UO', reverse: false },
  { id: 'gem-uo-2', layer: 'gem', axis: 'UO', reverse: true },
  { id: 'gem-uo-3', layer: 'gem', axis: 'UO', reverse: false },
  { id: 'gem-uo-4', layer: 'gem', axis: 'UO', reverse: true },
  { id: 'gem-uo-5', layer: 'gem', axis: 'UO', reverse: false },
] as const satisfies readonly BaseItem[]

export const BASE_ITEMS = [...PERSONA_ITEMS, ...INNER_ITEMS, ...GEM_ITEMS] as const

// Every paid visitor receives this same 24-item bank. It deepens Inner and Gem with three additional
// indicators per code-driving axis; it is deliberately not presented as IRT/CAT or adaptive testing.
export const REFINEMENT_ITEMS = [
  { id: 'refine-inner-ei-1', layer: 'inner', axis: 'EI', reverse: true },
  { id: 'refine-inner-ei-2', layer: 'inner', axis: 'EI', reverse: false },
  { id: 'refine-inner-ei-3', layer: 'inner', axis: 'EI', reverse: false },
  { id: 'refine-inner-sn-1', layer: 'inner', axis: 'SN', reverse: true },
  { id: 'refine-inner-sn-2', layer: 'inner', axis: 'SN', reverse: false },
  { id: 'refine-inner-sn-3', layer: 'inner', axis: 'SN', reverse: false },
  { id: 'refine-inner-tf-1', layer: 'inner', axis: 'TF', reverse: false },
  { id: 'refine-inner-tf-2', layer: 'inner', axis: 'TF', reverse: true },
  { id: 'refine-inner-tf-3', layer: 'inner', axis: 'TF', reverse: false },
  { id: 'refine-inner-jp-1', layer: 'inner', axis: 'JP', reverse: false },
  { id: 'refine-inner-jp-2', layer: 'inner', axis: 'JP', reverse: true },
  { id: 'refine-inner-jp-3', layer: 'inner', axis: 'JP', reverse: false },
  { id: 'refine-gem-rm-1', layer: 'gem', axis: 'RM', reverse: false },
  { id: 'refine-gem-rm-2', layer: 'gem', axis: 'RM', reverse: true },
  { id: 'refine-gem-rm-3', layer: 'gem', axis: 'RM', reverse: false },
  { id: 'refine-gem-oa-1', layer: 'gem', axis: 'OA', reverse: false },
  { id: 'refine-gem-oa-2', layer: 'gem', axis: 'OA', reverse: true },
  { id: 'refine-gem-oa-3', layer: 'gem', axis: 'OA', reverse: false },
  { id: 'refine-gem-vh-1', layer: 'gem', axis: 'VH', reverse: false },
  { id: 'refine-gem-vh-2', layer: 'gem', axis: 'VH', reverse: true },
  { id: 'refine-gem-vh-3', layer: 'gem', axis: 'VH', reverse: false },
  { id: 'refine-gem-uo-1', layer: 'gem', axis: 'UO', reverse: false },
  { id: 'refine-gem-uo-2', layer: 'gem', axis: 'UO', reverse: true },
  { id: 'refine-gem-uo-3', layer: 'gem', axis: 'UO', reverse: false },
] as const satisfies readonly RefinementItem[]
