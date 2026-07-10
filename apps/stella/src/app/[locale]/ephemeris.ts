// Computes a natal chart (tropical planetary longitudes + ascendant/midheaven)
// from birth data using the `astronomy-engine` ephemeris. The library is
// dynamically imported so its ~100 KB only loads when a user actually submits.

import { type ComputedPlanetId, type NatalChart, PLANET_ORDER, type PlanetPosition } from './chart'

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

const BODY_NAME: Record<ComputedPlanetId, string> = {
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

  // Mean lunar nodes (Meeus) — always retrograde; the south node is the antipode.
  const T = time.tt / 36525
  const node = norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441)

  planets.push({
    id: 'northNode',
    lon: node,
    retrograde: true,
  })

  planets.push({
    id: 'southNode',
    lon: norm360(node + 180),
    retrograde: true,
  })

  let ascendant: number | null = null
  let midheaven: number | null = null
  let cusps: number[] | null = null

  if (input.timeKnown) {
    const eps = meanObliquityDeg(T) * DEG
    const cosE = Math.cos(eps)
    const sinE = Math.sin(eps)
    const ramcDeg = norm360(Astronomy.SiderealTime(time) * 15 + input.longitude)
    const ramc = ramcDeg * DEG
    const phi = input.latitude * DEG
    midheaven = norm360(Math.atan2(Math.sin(ramc), Math.cos(ramc) * cosE) * RAD)
    ascendant = norm360(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * cosE + Math.tan(phi) * sinE)) * RAD)
    cusps = placidusCusps(ramcDeg, ascendant, midheaven, eps, phi)

    // Part of Fortune — day formula above the horizon, night formula below.
    const sun = planets.find((p) => p.id === 'sun')?.lon ?? 0
    const moon = planets.find((p) => p.id === 'moon')?.lon ?? 0
    const sunAboveHorizon = norm360(sun - ascendant) >= 180
    const fortune = norm360(sunAboveHorizon ? ascendant + moon - sun : ascendant + sun - moon)

    planets.push({
      id: 'fortune',
      lon: fortune,
      retrograde: false,
    })
  }

  return { planets, ascendant, midheaven, cusps }
}

/** Standard Placidus house cusps (12 longitudes, index 0 = house 1). */
function placidusCusps(ramcDeg: number, asc: number, mc: number, eps: number, phi: number): number[] {
  const cosE = Math.cos(eps)
  const sinE = Math.sin(eps)
  const tanPhi = Math.tan(phi)
  const norm = (x: number) => ((x % 360) + 360) % 360
  const clamp = (x: number) => Math.max(-1, Math.min(1, x))
  const lonFromRA = (a: number) => norm(Math.atan2(Math.sin(a * DEG), Math.cos(a * DEG) * cosE) * RAD)

  // A cusp trisects a semi-arc: iterate until its own semi-diurnal arc is consistent.
  function cusp(fraction: number, west: boolean): number {
    const dir = west ? -1 : 1
    let a = ramcDeg + dir * fraction * 90

    for (let i = 0; i < 40; i++) {
      const lon = lonFromRA(a)
      const dec = Math.asin(sinE * Math.sin(lon * DEG))
      const ad = Math.asin(clamp(tanPhi * Math.tan(dec))) * RAD
      a = ramcDeg + dir * fraction * (90 + ad)
    }

    return lonFromRA(a)
  }

  const c = new Array<number>(12)
  c[0] = asc // house 1
  c[9] = mc // house 10
  c[3] = norm(mc + 180) // house 4 (IC)
  c[6] = norm(asc + 180) // house 7 (DSC)
  c[10] = cusp(1 / 3, false) // house 11
  c[11] = cusp(2 / 3, false) // house 12
  c[7] = cusp(2 / 3, true) // house 8
  c[8] = cusp(1 / 3, true) // house 9
  c[1] = norm(c[7] + 180) // house 2
  c[2] = norm(c[8] + 180) // house 3
  c[4] = norm(c[10] + 180) // house 5
  c[5] = norm(c[11] + 180) // house 6
  return c
}
