// Chart-signature derivations powering the composed reading: conjunctions to the
// angles, rulership/dignity, stelliums and a weighting that ranks the chart's
// loudest features. Pure math and tables — copy lives in `messages.ts`.

import { angularGap, signOfLon } from './astrology'
import { PLANET_ORDER, SIGNS } from './data'
import type { ChartAspect, ComputedPlanetId, NatalChart, PlanetId, PlanetPosition, SignId } from './types'

export type AngleId = 'ascendant' | 'midheaven'

/** A body sitting on the Ascendant or Midheaven — the classic "angular planet" emphasis. */
export type AngleConjunction = {
  planet: PlanetId
  angle: AngleId
  orb: number
}

export type Dignity = 'domicile' | 'exaltation' | 'detriment' | 'fall'

/** Only strong dignities headline the signature; debilities read as nuance elsewhere. */
export type StrongDignity = Extract<Dignity, 'domicile' | 'exaltation'>

export type Stellium = {
  sign: SignId
  planets: PlanetId[]
}

/** One ranked highlight of the chart, ordered by `score` (higher = louder). */
export type SignatureFeature =
  | { kind: 'angle'; planet: PlanetId; angle: AngleId; orb: number; score: number }
  | { kind: 'aspect'; aspect: ChartAspect; score: number }
  | { kind: 'dignity'; planet: PlanetId; sign: SignId; dignity: StrongDignity; isChartRuler: boolean; score: number }
  | { kind: 'stellium'; stellium: Stellium; score: number }

/** The ten ephemeris bodies in traditional order — points don't sit on angles or form stelliums here. */
const BODY_IDS: ReadonlySet<PlanetId> = new Set(PLANET_ORDER)

/** Modern sign rulers — the chart ruler is the ruler of the rising sign. */
export const SIGN_RULERS: Record<SignId, PlanetId> = {
  aries: 'mars',
  taurus: 'venus',
  gemini: 'mercury',
  cancer: 'moon',
  leo: 'sun',
  virgo: 'mercury',
  libra: 'venus',
  scorpio: 'pluto',
  sagittarius: 'jupiter',
  capricorn: 'saturn',
  aquarius: 'uranus',
  pisces: 'neptune',
}

/** Domiciles including traditional co-rulerships (Mars–Scorpio, Jupiter–Pisces, Saturn–Aquarius). */
const DOMICILES: Partial<Record<PlanetId, readonly SignId[]>> = {
  sun: ['leo'],
  moon: ['cancer'],
  mercury: ['gemini', 'virgo'],
  venus: ['taurus', 'libra'],
  mars: ['aries', 'scorpio'],
  jupiter: ['sagittarius', 'pisces'],
  saturn: ['capricorn', 'aquarius'],
  uranus: ['aquarius'],
  neptune: ['pisces'],
  pluto: ['scorpio'],
}

/** Classical exaltations (the seven visible bodies only). */
const EXALTATIONS: Partial<Record<PlanetId, SignId>> = {
  sun: 'aries',
  moon: 'taurus',
  mercury: 'virgo',
  venus: 'pisces',
  mars: 'capricorn',
  jupiter: 'cancer',
  saturn: 'libra',
}

const SIGN_ORDER: readonly SignId[] = SIGNS.map((s) => s.id)

function oppositeSign(sign: SignId): SignId {
  return SIGN_ORDER[(SIGN_ORDER.indexOf(sign) + 6) % 12]
}

/** Essential dignity of a body in a sign, or null when it stands on neutral ground. */
export function dignityOf(planet: PlanetId, sign: SignId): Dignity | null {
  const homes = DOMICILES[planet]

  if (homes?.includes(sign)) {
    return 'domicile'
  }
  if (EXALTATIONS[planet] === sign) {
    return 'exaltation'
  }
  if (homes?.some((home) => oppositeSign(home) === sign)) {
    return 'detriment'
  }
  if (EXALTATIONS[planet] && oppositeSign(EXALTATIONS[planet]) === sign) {
    return 'fall'
  }

  return null
}

/** Conjunctions to the angles. Wider than planet pairs is conventional; 8° keeps it consistent here. */
const ANGLE_ORB = 8

export function computeAngleConjunctions(chart: NatalChart): AngleConjunction[] {
  const angles: { id: AngleId; lon: number | null }[] = [
    { id: 'ascendant', lon: chart.ascendant },
    { id: 'midheaven', lon: chart.midheaven },
  ]

  const result: AngleConjunction[] = []

  for (const { id, lon } of angles) {
    if (lon === null) {
      continue
    }

    for (const p of chart.planets) {
      if (!BODY_IDS.has(p.id)) {
        continue
      }

      const orb = angularGap(p.lon, lon)

      if (orb <= ANGLE_ORB) {
        result.push({ planet: p.id, angle: id, orb: Math.round(orb * 10) / 10 })
      }
    }
  }

  return result
}

export function chartRuler(chart: NatalChart): { ascSign: SignId; ruler: PlanetId; position: PlanetPosition } | null {
  if (chart.ascendant === null) {
    return null
  }

  const ascSign = signOfLon(chart.ascendant)
  const ruler = SIGN_RULERS[ascSign]
  const position = chart.planets.find((p) => p.id === ruler)

  return position ? { ascSign, ruler, position } : null
}

/** Three or more bodies sharing a sign — a concentration worth calling out by itself. */
export function findStelliums(planets: readonly PlanetPosition[]): Stellium[] {
  const bySign = new Map<SignId, PlanetId[]>()

  for (const p of planets) {
    if (!BODY_IDS.has(p.id)) {
      continue
    }

    const sign = signOfLon(p.lon)
    const list = bySign.get(sign) ?? []
    list.push(p.id)
    bySign.set(sign, list)
  }

  return [...bySign.entries()]
    .filter(([, ids]) => ids.length >= 3)
    .map(([sign, ids]) => ({
      sign,
      planets: [...ids].sort(
        (a, b) => PLANET_ORDER.indexOf(a as ComputedPlanetId) - PLANET_ORDER.indexOf(b as ComputedPlanetId),
      ),
    }))
}

// ── Weighting ────────────────────────────────────────────────────────────────
// Heuristic scores mirroring traditional emphasis: angularity first, then orb
// tightness, luminary involvement and dignity. Tuned so an angular outer planet
// or a near-exact hard aspect outranks an ordinary placement.

const ASPECT_BASE: Record<ChartAspect['type'], number> = {
  conjunction: 30,
  opposition: 26,
  square: 26,
  trine: 18,
  sextile: 14,
}

const ASPECT_ALLOWANCE: Record<ChartAspect['type'], number> = {
  conjunction: 8,
  opposition: 8,
  square: 7,
  trine: 7,
  sextile: 6,
}

export function aspectScore(aspect: ChartAspect): number {
  let score = ASPECT_BASE[aspect.type] + (ASPECT_ALLOWANCE[aspect.type] - aspect.orb) * 2.5

  // Partile (near-exact) aspects speak with outsized force in traditional practice.
  if (aspect.orb <= 0.5) {
    score += 15
  } else if (aspect.orb <= 1.5) {
    score += 8
  }

  for (const id of [aspect.a, aspect.b]) {
    if (id === 'sun' || id === 'moon') {
      score += 7
    }
    if (id === 'northNode') {
      score += 4
    }
    if (id === 'fortune') {
      score -= 6
    }
  }

  return score
}

/** Every notable feature of the chart, strongest first. The composer slices the top. */
export function computeSignature(chart: NatalChart, aspects: readonly ChartAspect[]): SignatureFeature[] {
  const features: SignatureFeature[] = []
  const ruler = chartRuler(chart)

  for (const conj of computeAngleConjunctions(chart)) {
    features.push({ kind: 'angle', ...conj, score: 55 + (ANGLE_ORB - conj.orb) * 3 })
  }

  for (const aspect of aspects) {
    features.push({ kind: 'aspect', aspect, score: aspectScore(aspect) })
  }

  for (const p of chart.planets) {
    if (!BODY_IDS.has(p.id)) {
      continue
    }

    const sign = signOfLon(p.lon)
    const dignity = dignityOf(p.id, sign)

    // Only strong dignities headline the signature; debilities read as nuance elsewhere.
    if (dignity !== 'domicile' && dignity !== 'exaltation') {
      continue
    }

    const isChartRuler = ruler?.ruler === p.id

    features.push({
      kind: 'dignity',
      planet: p.id,
      sign,
      dignity,
      isChartRuler,
      score: (dignity === 'domicile' ? 34 : 30) + (isChartRuler ? 12 : 0),
    })
  }

  for (const stellium of findStelliums(chart.planets)) {
    features.push({
      kind: 'stellium',
      stellium,
      score: 38 + (stellium.planets.length - 3) * 6,
    })
  }

  return features.sort((a, b) => b.score - a.score)
}
