import { closestAspect, houseOfLon, type NatalChart, type PlanetPosition } from '../chart'
import { type AspectTone, aspectTone } from '../interpretations/types'

/** Natal bodies the transiting Moon is read against — the personal planets. */
export const MOON_TARGETS = ['sun', 'moon', 'mercury', 'venus', 'mars'] as const
export type MoonTargetId = (typeof MOON_TARGETS)[number]

export const SLOW_PLANETS = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const
export type SlowPlanetId = (typeof SLOW_PLANETS)[number]

/** Natal points a slow transit is read against. */
export type SlowPointId = 'sun' | 'moon' | 'ascendant'

export type MoonContact = { target: MoonTargetId; tone: AspectTone; orb: number }
export type SlowContact = { planet: SlowPlanetId; point: SlowPointId; tone: AspectTone; orb: number }

export type PersonalToday = {
  /** Which natal house today's Moon moves through — null without a birth time. */
  moonHouse: number | null
  /** Today's tightest Moon→natal contacts (at most two). */
  moonContacts: MoonContact[]
  /** The slow transit currently in effect, if any — the multi-day story line. */
  slowTransit: SlowContact | null
}

const MOON_ORB = 4
const SLOW_ORB = 2.5

function natalLon(natal: NatalChart, id: string): number | null {
  return natal.planets.find((p) => p.id === id)?.lon ?? null
}

export function computePersonalToday(sky: readonly PlanetPosition[], natal: NatalChart): PersonalToday {
  const moonLon = sky.find((p) => p.id === 'moon')?.lon ?? 0
  const moonContacts: MoonContact[] = []

  for (const target of MOON_TARGETS) {
    const lon = natalLon(natal, target)

    if (lon === null) {
      continue
    }

    const match = closestAspect(moonLon, lon, MOON_ORB)

    if (match) {
      moonContacts.push({ target, tone: aspectTone(match.type), orb: Math.round(match.orb * 10) / 10 })
    }
  }

  moonContacts.sort((a, b) => a.orb - b.orb)

  const slowPoints: { point: SlowPointId; lon: number }[] = []
  const natalSun = natalLon(natal, 'sun')
  const natalMoon = natalLon(natal, 'moon')

  if (natalSun !== null) {
    slowPoints.push({ point: 'sun', lon: natalSun })
  }
  if (natalMoon !== null) {
    slowPoints.push({ point: 'moon', lon: natalMoon })
  }
  if (natal.ascendant !== null) {
    slowPoints.push({ point: 'ascendant', lon: natal.ascendant })
  }

  let slowTransit: SlowContact | null = null

  for (const planet of SLOW_PLANETS) {
    const transitLon = sky.find((p) => p.id === planet)?.lon

    if (transitLon === undefined) {
      continue
    }

    for (const { point, lon } of slowPoints) {
      const match = closestAspect(transitLon, lon, SLOW_ORB)

      if (match && (!slowTransit || match.orb < slowTransit.orb)) {
        slowTransit = { planet, point, tone: aspectTone(match.type), orb: Math.round(match.orb * 10) / 10 }
      }
    }
  }

  return {
    moonHouse: houseOfLon(moonLon, natal.cusps, natal.ascendant),
    moonContacts: moonContacts.slice(0, 2),
    slowTransit,
  }
}
