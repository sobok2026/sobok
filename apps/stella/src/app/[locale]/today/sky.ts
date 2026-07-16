// Today's global sky — the layer every visitor shares. Everything is derived
// from a chosen local-noon snapshot so the page is stable for a whole calendar
// day (the one-update-per-day rhythm is deliberate).

import { angularGap, signOfLon } from '@/chart/astrology'
import { PLANET_ORDER } from '@/chart/data'
import { computePositions } from '@/chart/ephemeris'
import type { AspectType, ComputedPlanetId, PlanetPosition, SignId } from '@/chart/types'

export type MoonPhaseId =
  | 'newMoon'
  | 'waxingCrescent'
  | 'firstQuarter'
  | 'waxingGibbous'
  | 'fullMoon'
  | 'waningGibbous'
  | 'lastQuarter'
  | 'waningCrescent'

export type SkyHeadline = { a: ComputedPlanetId; b: ComputedPlanetId; type: AspectType; orb: number }
export type Station = { planet: ComputedPlanetId; kind: 'begins' | 'ends' }

export type SkyToday = {
  positions: PlanetPosition[]
  moonLon: number
  moonSign: SignId
  /** Moon − Sun elongation, 0–360°. 0 = new, 90 = first quarter, 180 = full. */
  phaseAngle: number
  phase: MoonPhaseId
  /** The most notable planet-pair aspect that turns exact today, if any. */
  headline: SkyHeadline | null
  /** Planets that flip between direct and retrograde today. */
  stations: Station[]
  /** Planets currently retrograde (Mercury–Pluto). */
  retrogrades: ComputedPlanetId[]
}

const PHASES: readonly MoonPhaseId[] = [
  'newMoon',
  'waxingCrescent',
  'firstQuarter',
  'waxingGibbous',
  'fullMoon',
  'waningGibbous',
  'lastQuarter',
  'waningCrescent',
]

/** Bucket a Moon−Sun elongation into the eight phases (each centered on its exact angle). */
export function moonPhaseOf(phaseAngle: number): MoonPhaseId {
  const normalized = ((phaseAngle % 360) + 360) % 360
  return PHASES[Math.floor(((normalized + 22.5) % 360) / 45)]
}

/** The Sun and everything from Mercury out — the Moon is handled separately (it aspects daily). */
const HEADLINE_BODIES: readonly ComputedPlanetId[] = PLANET_ORDER.filter((id) => id !== 'moon')

const ASPECT_ANGLES: readonly { type: AspectType; angle: number }[] = [
  { type: 'conjunction', angle: 0 },
  { type: 'sextile', angle: 60 },
  { type: 'square', angle: 90 },
  { type: 'trine', angle: 120 },
  { type: 'opposition', angle: 180 },
]

function lonOf(positions: readonly PlanetPosition[], id: ComputedPlanetId): number {
  return positions.find((p) => p.id === id)?.lon ?? 0
}

/**
 * Find the planet-pair aspect that turns exact today: the deviation from the
 * aspect's angle changes sign between the start and end of the local day.
 * Slower pairs win (they are rarer, hence more notable), ties broken by
 * closeness at noon.
 */
function findHeadline(
  dayStart: readonly PlanetPosition[],
  noon: readonly PlanetPosition[],
  dayEnd: readonly PlanetPosition[],
): SkyHeadline | null {
  let best: (SkyHeadline & { weight: number }) | null = null

  for (let i = 0; i < HEADLINE_BODIES.length; i++) {
    for (let j = i + 1; j < HEADLINE_BODIES.length; j++) {
      const a = HEADLINE_BODIES[i]
      const b = HEADLINE_BODIES[j]

      for (const def of ASPECT_ANGLES) {
        const devStart = angularGap(lonOf(dayStart, a), lonOf(dayStart, b)) - def.angle
        const devEnd = angularGap(lonOf(dayEnd, a), lonOf(dayEnd, b)) - def.angle

        if (devStart === 0 || devStart * devEnd < 0) {
          const orb = Math.abs(angularGap(lonOf(noon, a), lonOf(noon, b)) - def.angle)
          // Positions in PLANET_ORDER double as a speed rank: later = slower = rarer pair.
          const weight = PLANET_ORDER.indexOf(a) + PLANET_ORDER.indexOf(b)

          if (!best || weight > best.weight || (weight === best.weight && orb < best.orb)) {
            best = { a, b, type: def.type, orb: Math.round(orb * 10) / 10, weight }
          }
        }
      }
    }
  }

  return best ? { a: best.a, b: best.b, type: best.type, orb: best.orb } : null
}

const STATION_BODIES: readonly ComputedPlanetId[] = PLANET_ORDER.filter((id) => id !== 'sun' && id !== 'moon')

export async function computeSkyToday(noonLocal: Date): Promise<SkyToday> {
  const dayMs = 24 * 60 * 60 * 1000

  const [yesterday, dayStart, noon, dayEnd] = await Promise.all([
    computePositions(new Date(noonLocal.getTime() - dayMs)),
    computePositions(new Date(noonLocal.getTime() - 12 * 60 * 60 * 1000)),
    computePositions(noonLocal),
    computePositions(new Date(noonLocal.getTime() + 12 * 60 * 60 * 1000)),
  ])

  const moonLon = lonOf(noon, 'moon')
  const phaseAngle = (((moonLon - lonOf(noon, 'sun')) % 360) + 360) % 360
  const stations: Station[] = []

  for (const id of STATION_BODIES) {
    const was = yesterday.find((p) => p.id === id)?.retrograde ?? false
    const is = noon.find((p) => p.id === id)?.retrograde ?? false

    if (was !== is) {
      stations.push({ planet: id, kind: is ? 'begins' : 'ends' })
    }
  }

  return {
    positions: noon,
    moonLon,
    moonSign: signOfLon(moonLon),
    phaseAngle,
    phase: moonPhaseOf(phaseAngle),
    headline: findHeadline(dayStart, noon, dayEnd),
    stations,
    retrogrades: STATION_BODIES.filter((id) => noon.find((p) => p.id === id)?.retrograde),
  }
}
