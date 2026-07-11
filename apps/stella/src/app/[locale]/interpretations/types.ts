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

// The five major aspects map to four tones:
//   conjunction — the two energies fuse into one
//   flow        — trine + sextile, they support each other with ease
//   square      — they grind against each other; an inner friction that drives growth
//   opposition  — they swing to opposite poles; a seesaw often mirrored in others
// 'friction' is a legacy key kept only as a fallback for locales not yet split
// into square/opposition — those fall back to their single friction line.
export type AspectTone = 'conjunction' | 'flow' | 'square' | 'opposition'
export type PairText = Partial<Record<AspectTone | 'friction', string>>
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
  if (aspect === 'square') {
    return 'square'
  }
  return 'opposition'
}

/** Orb-based intensity tier for a matched aspect. `null` = mid-range, no extra copy. */
export function orbTier(orb: number): 'tight' | 'wide' | null {
  if (orb <= 1.5) {
    return 'tight'
  }
  if (orb > 4) {
    return 'wide'
  }
  return null
}
