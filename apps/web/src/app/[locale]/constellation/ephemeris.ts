// Computes a natal chart (tropical planetary longitudes + ascendant/midheaven)
// from birth data using the `astronomy-engine` ephemeris. The library is
// dynamically imported so its ~100 KB only loads when a user actually submits.

import { type NatalChart, PLANET_ORDER, type PlanetId, type PlanetPosition } from './chart'

export type CityKey = string

export type BirthInput = {
  year: number
  month: number // 1–12
  day: number
  hour: number // 0–23
  minute: number // 0–59
  latitude: number // degrees, north positive
  longitude: number // degrees, east positive
  timeZone: string // IANA zone, e.g. "Asia/Seoul"
  timeKnown: boolean
}

const DEG = Math.PI / 180
const RAD = 180 / Math.PI

const BODY_NAME: Record<PlanetId, string> = {
  sun: 'Sun',
  moon: 'Moon',
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune',
  pluto: 'Pluto',
}

const norm360 = (x: number) => ((x % 360) + 360) % 360

/** Wall-clock offset (ms) of an IANA time zone at a given instant, DST-aware. */
function tzOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const parts: Record<string, number> = {}

  for (const part of dtf.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value)
  }

  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour === 24 ? 0 : parts.hour,
    parts.minute,
    parts.second,
  )

  return asUtc - date.getTime()
}

/** Convert a wall-clock time in `timeZone` to the corresponding UTC instant. */
function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute, 0)
  // Two passes resolve the DST fold at the boundary correctly.
  const guess = naive - tzOffsetMs(new Date(naive), timeZone)
  return new Date(naive - tzOffsetMs(new Date(guess), timeZone))
}

/** Mean obliquity of the ecliptic (degrees) for Julian centuries `T` past J2000 (Meeus). */
function meanObliquityDeg(T: number): number {
  const seconds = 84381.448 - 46.815 * T - 0.00059 * T * T + 0.001813 * T * T * T
  return seconds / 3600
}

export async function computeChart(input: BirthInput): Promise<NatalChart> {
  const Astronomy = await import('astronomy-engine')

  const utc = zonedTimeToUtc(
    input.year,
    input.month,
    input.day,
    input.timeKnown ? input.hour : 12,
    input.timeKnown ? input.minute : 0,
    input.timeZone,
  )

  const time = Astronomy.MakeTime(utc)

  /** Geocentric tropical ecliptic longitude of date (degrees) for a body. */
  function eclipticLon(name: string, at: import('astronomy-engine').AstroTime): number {
    const vec = name === 'Moon' ? Astronomy.GeoMoon(at) : Astronomy.GeoVector(Astronomy.Body[name as never], at, true)
    const ect = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(at), vec)
    return norm360(Astronomy.SphereFromVector(ect).lon)
  }

  const nextDay = time.AddDays(1)

  const planets: PlanetPosition[] = PLANET_ORDER.map((id) => {
    const name = BODY_NAME[id]
    const lon = eclipticLon(name, time)
    let retrograde = false

    if (id !== 'sun' && id !== 'moon') {
      let delta = eclipticLon(name, nextDay) - lon
      if (delta > 180) delta -= 360
      if (delta < -180) delta += 360
      retrograde = delta < 0
    }

    return { id, lon, retrograde }
  })

  let ascendant: number | null = null
  let midheaven: number | null = null

  if (input.timeKnown) {
    const eps = meanObliquityDeg(time.tt / 36525) * DEG
    const cosE = Math.cos(eps)
    const sinE = Math.sin(eps)
    // Right ascension of the midheaven = local apparent sidereal time.
    const ramc = norm360(Astronomy.SiderealTime(time) * 15 + input.longitude) * DEG
    const phi = input.latitude * DEG
    midheaven = norm360(Math.atan2(Math.sin(ramc), Math.cos(ramc) * cosE) * RAD)
    ascendant = norm360(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * cosE + Math.tan(phi) * sinE)) * RAD)
  }

  return { planets, ascendant, midheaven }
}
