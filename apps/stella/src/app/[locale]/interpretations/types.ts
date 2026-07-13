// Shared types + pair-key helpers for the per-locale reading modules. Kept apart
// from the data files so each locale bundle stays pure string tables.

import type { AspectType, ComputedPlanetId, ElementId, PlanetId, SignId } from '../chart/types'

export type SignText = Record<SignId, string>
export type PlanetReadings = Record<PlanetId, SignText>

/**
 * Retrograde-specific readings. Only the personal/social planets (Mercury–Pluto)
 * carry these; when a planet is retrograde its energy turns inward, so each sign
 * gets a distinct inward-facing line. Bodies without a variant fall back to their
 * single direct reading.
 */
export type RetroReadings = Partial<Record<PlanetId, SignText>>

export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
export type HouseText = Record<HouseNumber, string>

/**
 * Placement-by-house readings — the sign says how a planet acts, the house says
 * where in life it plays out. All fourteen bodies carry these. Houses need a
 * birth time, so the panel simply omits the paragraph when the house is unknown.
 */
export type PlanetHouseReadings = Partial<Record<PlanetId, HouseText>>

export type ReportChapterId = 'closing' | 'core' | 'love' | 'mind' | 'money' | 'path' | 'root' | 'signature' | 'work'
export type AngleKey = 'ascendant' | 'midheaven'

/**
 * Copy for the composed long-form reading. Fragment tables above stay the raw
 * material; this adds the scaffolding the composer needs — chapter titles,
 * kickers, bridge templates and the new axes (rising personas, planets on the
 * angles, dignity, stellium). Every locale ships this in full.
 */
export type ReportKicker = {
  sun: string
  moon: string
  mercury: string
  venus: string
  southNode: string
  northNode: string
  rising: string
  aspect: string
  house: string
  dignity: string
  stellium: string
  ruler: string
  rulerPlacement: string
  mcRuler: string
}

export type ReportContent = {
  title: string
  subtitle: string
  noTimeNote: string
  chapterTitles: Record<ReportChapterId, string>
  signatureIntro: string
  kicker: ReportKicker
  angleKicker: Record<AngleKey, string>
  rising: SignText
  angles: Record<ComputedPlanetId, Record<AngleKey, string>>
  dignity: { domicile: string; exaltation: string; chartRulerNote: string }
  stellium: string
  core: { bridge: string; bridgeNoTime: string }
  path: { bridge: string; houseNote: string }
  work: { mc: string }
  money: { empty: string }
  root: { ruler: string }
  closing: Record<ElementId, string> & { outro: string }
  /** CTA under the love chapter linking to the /love vertical. */
  loveCta: string
}

// The five major aspects map to four tones:
//   conjunction — the two energies fuse into one
//   flow        — trine + sextile, they support each other with ease
//   square      — they grind against each other; an inner friction that drives growth
//   opposition  — they swing to opposite poles; a seesaw often mirrored in others
export type AspectTone = 'conjunction' | 'flow' | 'square' | 'opposition'

export type PairText = Partial<Record<AspectTone, string>>
export type AspectPairReadings = Partial<Record<string, PairText>>

/** Call-out lines for orb tiers — tight aspects get emphasis, wide ones a softener. */
export type AspectIntensity = Record<'tight' | 'wide', string>

/** Everything one locale's natal-reading chunk carries, as `loadInterpretations` returns it. */
export type Interpretations = {
  planets: PlanetReadings
  retro: RetroReadings
  houses: PlanetHouseReadings
  aspects: AspectPairReadings
  aspectIntensity: AspectIntensity
  report: ReportContent
}

/** Replaces `{key}` placeholders in reading copy — the data modules use plain templates, not ICU. */
export function fill(template: string, params: Record<string, number | string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in params ? String(params[key]) : match))
}

/** Narrows a runtime house number (1–12 or out-of-range) onto the exhaustive house table. */
export function houseText(table: HouseText | undefined, n: number): string | undefined {
  return table?.[n as HouseNumber]
}

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
  'lilith',
  'chiron',
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
