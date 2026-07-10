// Shared types + pair-key helpers for the per-locale reading modules. Kept apart
// from the data files so each locale bundle stays pure string tables.

import type { AspectType, PlanetId, SignId } from '../chart'

export type SignText = Record<SignId, string>
export type PlanetReadings = Record<PlanetId, SignText>

/**
 * Retrograde-specific readings. Only the personal/social planets (Mercury–Pluto)
 * carry these; when a planet is retrograde its energy turns inward, so each sign
 * gets a distinct inward-facing line. Bodies without a variant fall back to their
 * single direct reading.
 */
export type RetroReadings = Partial<Record<PlanetId, SignText>>

// The five major aspects collapse into three tones:
//   conjunction — the two energies fuse into one
//   flow        — trine + sextile, they support each other with ease
//   friction    — square + opposition, they pull against each other
export type AspectTone = 'conjunction' | 'flow' | 'friction'
export type PairText = Record<AspectTone, string>
export type AspectPairReadings = Partial<Record<string, PairText>>

/** Canonical ordering used to build a stable, order-independent key per pair. */
export const ASPECT_PAIR_ORDER: readonly PlanetId[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
  'northNode',
  'fortune',
]

export function pairKey(a: PlanetId, b: PlanetId): string {
  return ASPECT_PAIR_ORDER.indexOf(a) <= ASPECT_PAIR_ORDER.indexOf(b) ? `${a}-${b}` : `${b}-${a}`
}

export function aspectTone(aspect: AspectType): AspectTone {
  if (aspect === 'conjunction') {
    return 'conjunction'
  }
  if (aspect === 'trine' || aspect === 'sextile') {
    return 'flow'
  }
  return 'friction'
}
