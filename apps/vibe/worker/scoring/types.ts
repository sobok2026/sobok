// Server-side mirror of the deep-type scoring domain (apps/vibe/src/.../deep-type/_lib/types.ts). Kept as
// a separate copy because the Worker can't import the Next src/ tree. Only the pieces the paid re-score
// needs are ported: the 8 axes, the unidimensional item shape, and the answer/response types. This bank +
// engine is the SERVER-AUTHORITATIVE scorer — the client's computed strengths are never trusted.

export type DichoAxisId = 'EI' | 'SN' | 'TF' | 'JP'
export type GemAxisId = 'RM' | 'OA' | 'VH' | 'UO'
export type AxisId = DichoAxisId | GemAxisId

// poles[0] is each axis's canonical `+` direction; every item value and every lean is measured toward it.
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

// Precision deepens the 속(inner, EI/SN/TF/JP) and 보석(gem, RM/OA/VH/UO) layers; the 겉(persona) surface
// stays a free-tier measurement. These orders map an axis to its letter position in the inner/gem codes.
export const DICHO_ORDER: readonly DichoAxisId[] = ['EI', 'SN', 'TF', 'JP']
export const GEM_ORDER: readonly GemAxisId[] = ['RM', 'OA', 'VH', 'UO']

export type ItemTier = 'common' | 'adaptive'
export interface Unlock {
  axis: AxisId
  pole: string
}

// A choice item's options carry signed strengths toward poles[0], drawn from {-2,-1,0,+1,+2}. A scale item
// maps a 0..100 slider onto [-2,+2] (midpoint 50 → 0), negated when `reverse` is set. Every item is
// unidimensional (one axis) so a refined axis is literally the mean of its own items — nothing bleeds.
export interface ChoiceItem {
  readonly id: string
  readonly axis: AxisId
  readonly kind: 'choice'
  readonly options: readonly number[]
  readonly tier: ItemTier
  readonly unlock?: Unlock
}
export interface ScaleItem {
  readonly id: string
  readonly axis: AxisId
  readonly kind: 'scale'
  readonly reverse: boolean
  readonly tier: ItemTier
  readonly unlock?: Unlock
}
export type PrecisionItem = ChoiceItem | ScaleItem

export type ChoiceAnswer = { kind: 'choice'; itemId: string; optionIndex: number }
export type ScaleAnswer = { kind: 'scale'; itemId: string; value: number }
export type ItemAnswer = ChoiceAnswer | ScaleAnswer

// A resolved answer's signed contribution to its axis, in [-2, +2] toward poles[0].
export type AxisResponse = { axis: AxisId; value: number }
