// Pure astrological derivations: sign/house/element lookups and major-aspect
// detection between bodies. No rendering concerns — geometry lives in `geometry.ts`.

import { PLANET_ORDER, SIGNS } from './data'
import type {
  AngleId,
  AspectType,
  ChartAspect,
  ElementId,
  HouseNumber,
  ModalityId,
  NatalChart,
  PlanetId,
  PlanetPosition,
  SignId,
} from './types'

/**
 * Orb allowances (max deviation, degrees) by purpose — the single source for
 * every orb in the app. `major` feeds the natal wheel's aspect detection,
 * `pattern` the multi-body pattern detector, `angle` conjunctions to the angles.
 */
export const ORBS = {
  major: { conjunction: 8, opposition: 8, trine: 7, square: 7, sextile: 6 },
  pattern: { trine: 6, sextile: 5, opposition: 8, square: 7, quincunx: 3 },
  angle: 8,
} as const

/** Major aspects with their exact angle and orb (max allowed deviation, degrees). */
const ASPECT_DEFS: readonly { type: AspectType; angle: number; orb: number }[] = [
  { type: 'conjunction', angle: 0, orb: ORBS.major.conjunction },
  { type: 'opposition', angle: 180, orb: ORBS.major.opposition },
  { type: 'trine', angle: 120, orb: ORBS.major.trine },
  { type: 'square', angle: 90, orb: ORBS.major.square },
  { type: 'sextile', angle: 60, orb: ORBS.major.sextile },
]

/** Points that don't take part in aspects (each node aspects the same things as its axis). */
const ASPECT_EXCLUDED: ReadonlySet<PlanetId> = new Set(['southNode'])

/**
 * The ten classical planets. The Part of Fortune — a derived Sun/Moon/Ascendant
 * point — only conjuncts these, never the nodes, Lilith or Chiron; everything else
 * (planets, north node, Lilith, Chiron) aspects freely among itself.
 */
const CLASSICAL_BODIES: ReadonlySet<PlanetId> = new Set(PLANET_ORDER)

/** Normalize a longitude into [0, 360). */
export function norm360(x: number): number {
  return ((x % 360) + 360) % 360
}

export function signOfLon(lon: number): SignId {
  return SIGNS[Math.floor(norm360(lon) / 30)].id
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
    const l = norm360(lon)

    for (let h = 0; h < 12; h++) {
      const start = cusps[h]
      const span = norm360(cusps[(h + 1) % 12] - start)
      const offset = norm360(l - start)

      if (offset < span) {
        return (h + 1) as HouseNumber
      }
    }

    return 12
  }

  if (ascendant === null) {
    return null
  }

  return (Math.floor(norm360(lon - ascendant) / 30) + 1) as HouseNumber
}

/** Each angle's angular house — ASC→1, IC→4, DSC→7, MC→10. */
export const ANGLE_HOUSE: Record<AngleId, HouseNumber> = { asc: 1, ic: 4, dsc: 7, mc: 10 }

/**
 * Longitude of a chart angle, or null when its defining point is unknown (no
 * birth time). DSC/IC are the exact antipodes of ASC/MC.
 */
export function angleLongitude(id: AngleId, ascendant: number | null, midheaven: number | null): number | null {
  switch (id) {
    case 'asc':
      return ascendant === null ? null : norm360(ascendant)
    case 'dsc':
      return ascendant === null ? null : norm360(ascendant + 180)
    case 'mc':
      return midheaven === null ? null : norm360(midheaven)
    case 'ic':
      return midheaven === null ? null : norm360(midheaven + 180)
  }
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
 * Bodies whose longitude is certain. Without a birth time only the Moon is
 * unreliable (it moves ~13°/day); everything else can be stated safely.
 */
export function reliableBodies(planets: readonly PlanetPosition[], dateOnly: boolean): PlanetPosition[] {
  return dateOnly ? planets.filter((p) => p.id !== 'moon') : [...planets]
}

/** Aspects that don't touch the Moon — the only body uncertain without a birth time. */
export function reliableAspects(aspects: readonly ChartAspect[], dateOnly: boolean): ChartAspect[] {
  return dateOnly ? aspects.filter((aspect) => aspect.a !== 'moon' && aspect.b !== 'moon') : [...aspects]
}

/** The sign a body occupies in the chart, or null when the body is absent. */
export function signOfPlanet(chart: Pick<NatalChart, 'planets'>, planetId: PlanetId): SignId | null {
  const position = chart.planets.find((p) => p.id === planetId)
  return position ? signOfLon(position.lon) : null
}

export type Big3 = {
  sunSign: SignId | null
  moonSign: SignId | null
  risingSign: SignId | null
}

/** The three headline placements — Sun, Moon and Rising signs (Rising null without a birth time). */
export function big3(chart: NatalChart): Big3 {
  return {
    sunSign: signOfPlanet(chart, 'sun'),
    moonSign: signOfPlanet(chart, 'moon'),
    risingSign: chart.ascendant === null ? null : signOfLon(chart.ascendant),
  }
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

      const aFortune = a.id === 'fortune'
      const bFortune = b.id === 'fortune'

      // Fortune only relates to the ten classical planets (and only by conjunction).
      if (aFortune || bFortune) {
        const other = aFortune ? b : a

        if (!CLASSICAL_BODIES.has(other.id)) {
          continue
        }
      }

      const best = closestAspect(a.lon, b.lon)

      if (!best) {
        continue
      }

      if ((aFortune || bFortune) && best.type !== 'conjunction') {
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
