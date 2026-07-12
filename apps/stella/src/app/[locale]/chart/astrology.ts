// Pure astrological derivations: sign/house/element lookups and major-aspect
// detection between bodies. No rendering concerns — geometry lives in `geometry.ts`.

import { SIGNS } from './data'
import type {
  AspectType,
  ChartAspect,
  ElementId,
  HouseNumber,
  ModalityId,
  PlanetId,
  PlanetPosition,
  SignId,
} from './types'

/** Major aspects with their exact angle and orb (max allowed deviation, degrees). */
const ASPECT_DEFS: readonly { type: AspectType; angle: number; orb: number }[] = [
  { type: 'conjunction', angle: 0, orb: 8 },
  { type: 'opposition', angle: 180, orb: 8 },
  { type: 'trine', angle: 120, orb: 7 },
  { type: 'square', angle: 90, orb: 7 },
  { type: 'sextile', angle: 60, orb: 6 },
]

/** Points that don't take part in aspects (each node aspects the same things as its axis). */
const ASPECT_EXCLUDED: ReadonlySet<PlanetId> = new Set(['southNode'])

/** Calculated points (not bodies); pairs among themselves carry no standard reading. */
const POINT_IDS: ReadonlySet<PlanetId> = new Set(['northNode', 'fortune'])

export function signOfLon(lon: number): SignId {
  return SIGNS[Math.floor((((lon % 360) + 360) % 360) / 30)].id
}

/** Whole degrees and arcminutes within the sign, e.g. 21°57′. */
export function degreeMinuteInSign(lon: number): { degree: number; minute: number } {
  const within = ((lon % 30) + 30) % 30
  let degree = Math.floor(within)
  let minute = Math.round((within - degree) * 60)

  if (minute === 60) {
    minute = 0
    degree += 1
  }

  return { degree, minute }
}

/** House number 1–12 — Placidus when cusps are given, else equal from the ascendant. */
export function houseOfLon(lon: number, cusps: number[] | null, ascendant: number | null): HouseNumber | null {
  if (cusps) {
    const l = ((lon % 360) + 360) % 360

    for (let h = 0; h < 12; h++) {
      const start = cusps[h]
      const span = (((cusps[(h + 1) % 12] - start) % 360) + 360) % 360
      const offset = (((l - start) % 360) + 360) % 360

      if (offset < span) {
        return (h + 1) as HouseNumber
      }
    }

    return 12
  }

  if (ascendant === null) {
    return null
  }

  return (Math.floor(((((lon - ascendant) % 360) + 360) % 360) / 30) + 1) as HouseNumber
}

export function elementOfSign(id: SignId): ElementId {
  return SIGNS.find((s) => s.id === id)?.element ?? 'fire'
}

export function modalityOfSign(id: SignId): ModalityId {
  return SIGNS.find((s) => s.id === id)?.modality ?? 'cardinal'
}

/** Count how many bodies fall in each element. */
export function elementCounts(planets: readonly PlanetPosition[]): Record<ElementId, number> {
  const counts: Record<ElementId, number> = { fire: 0, earth: 0, air: 0, water: 0 }
  for (const p of planets) {
    counts[elementOfSign(signOfLon(p.lon))] += 1
  }
  return counts
}

export function angularGap(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360
  return diff > 180 ? 360 - diff : diff
}

/**
 * The closest major aspect for two longitudes, or null when none is in orb.
 * `maxOrb` tightens every aspect's allowance uniformly — transit matching uses
 * far tighter orbs than the natal wheel.
 */
export function closestAspect(lonA: number, lonB: number, maxOrb?: number): { type: AspectType; orb: number } | null {
  const sep = angularGap(lonA, lonB)
  let best: { type: AspectType; orb: number } | null = null

  for (const def of ASPECT_DEFS) {
    const delta = Math.abs(sep - def.angle)
    const cap = maxOrb === undefined ? def.orb : Math.min(def.orb, maxOrb)

    if (delta <= cap && (!best || delta < best.orb)) {
      best = { type: def.type, orb: delta }
    }
  }

  return best
}

/** Derive the major aspects present between the bodies (closest aspect per pair, within orb). */
export function computeAspects(planets: readonly PlanetPosition[]): ChartAspect[] {
  const bodies = planets.filter((p) => !ASPECT_EXCLUDED.has(p.id))
  const result: ChartAspect[] = []

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i]
      const b = bodies[j]

      if (POINT_IDS.has(a.id) && POINT_IDS.has(b.id)) {
        continue
      }

      const best = closestAspect(a.lon, b.lon)

      if (!best) {
        continue
      }

      // The Part of Fortune derives from Sun/Moon/Ascendant; standard practice reads only its conjunctions.
      if ((a.id === 'fortune' || b.id === 'fortune') && best.type !== 'conjunction') {
        continue
      }

      result.push({
        a: a.id,
        b: b.id,
        type: best.type,
        orb: Math.round(best.orb * 10) / 10,
      })
    }
  }
  return result
}
