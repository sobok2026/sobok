// Placement / retrograde / aspect readings, split per locale so only the active
// locale's ~15 KB of copy ships to the client instead of all four. Each locale is
// dynamically imported once, on first use (alongside the ephemeris), and cached.

import type { PublicLocale } from '@sobok/domain/locale'

import type { AspectType, PlanetId, SignId } from '../chart'
import { type AspectPairReadings, aspectTone, type PlanetReadings, pairKey, type RetroReadings } from './types'

export type InterpretationBundle = {
  planets: PlanetReadings
  retro: RetroReadings
  aspects: AspectPairReadings
}

const cache = new Map<PublicLocale, InterpretationBundle>()

function importLocale(locale: PublicLocale): Promise<InterpretationBundle> {
  switch (locale) {
    case 'en':
      return import('./en')
    case 'zh-CN':
      return import('./zh-CN')
    case 'ja':
      return import('./ja')
    default:
      return import('./ko')
  }
}

/** Load (and cache) the reading tables for a locale. Safe to call repeatedly. */
export async function loadInterpretations(locale: PublicLocale): Promise<InterpretationBundle> {
  const cached = cache.get(locale)

  if (cached) {
    return cached
  }

  const bundle = await importLocale(locale)
  cache.set(locale, bundle)
  return bundle
}

/**
 * Placement-based reading for any body. When `retrograde` is true and the body
 * has a retrograde variant (Mercury–Pluto only), the inward-facing reading is
 * returned; otherwise the direct reading is used.
 */
export function planetSignReading(
  bundle: InterpretationBundle,
  planet: PlanetId,
  sign: SignId,
  retrograde = false,
): string {
  if (retrograde) {
    const retro = bundle.retro[planet]?.[sign]

    if (retro) {
      return retro
    }
  }

  return bundle.planets[planet][sign]
}

/**
 * Pair-specific reading for an aspect — e.g. what a Sun–Saturn conjunction means,
 * distinct from Venus–Saturn. Returns null for pairs without dedicated copy (nodes
 * / Part of Fortune), so callers can fall back to the generic per-aspect-type copy.
 */
export function aspectPairReading(
  bundle: InterpretationBundle,
  a: PlanetId,
  b: PlanetId,
  aspect: AspectType,
): string | null {
  return bundle.aspects[pairKey(a, b)]?.[aspectTone(aspect)] ?? null
}
