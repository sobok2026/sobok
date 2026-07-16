// Computes a natal chart (tropical planetary longitudes + ascendant/midheaven +
// Placidus houses) from birth data using `circular-natal-horoscope-js` (public
// domain), which wraps the Moshier analytic ephemeris — geocentric positions
// accurate to well under an arcsecond, i.e. astrologically exact. The library is
// dynamically imported so its weight only loads when a user actually submits.

import { signOfLon } from './astrology'
import { PLANET_ORDER } from './data'
import type { ComputedPlanetId, NatalChart, PlanetPosition, SignId } from './types'

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

/** What can be stated safely about the Moon when only the local birth date is known. */
export type UnknownBirthTimeAnalysis = {
  /** One sign when the Moon stays put all day, otherwise the chronological start/end signs. */
  moonSigns: readonly [SignId] | readonly [SignId, SignId]
  /** Moon longitudes at 00:00 and 23:59 local time, used only as a visible uncertainty range. */
  moonLongitudeRange: readonly [start: number, end: number]
}

export type BirthChartAnalysis = {
  chart: NatalChart
  unknownTime: UnknownBirthTimeAnalysis | null
}

const norm360 = (x: number) => ((x % 360) + 360) % 360

type Lib = typeof import('circular-natal-horoscope-js')
type OriginCtor = Lib['Origin']
type HoroscopeCtor = Lib['Horoscope']
type Horoscope = InstanceType<HoroscopeCtor>

// The library's public types are largely `any`; these are the exact views we read.
type EclipticDD = { ChartPosition: { Ecliptic: { DecimalDegrees: number } } }
type LibBody = { key: string; isRetrograde: boolean } & EclipticDD
type LibHouse = { id: number; ChartPosition: { StartPosition: { Ecliptic: { DecimalDegrees: number } } } }

/** The ten Sun–Pluto bodies, in `PLANET_ORDER`, with the library's retrograde flags. */
function bodyPositions(horoscope: Horoscope): PlanetPosition[] {
  const byKey = new Map<string, LibBody>()

  for (const body of horoscope.CelestialBodies.all as LibBody[]) {
    byKey.set(body.key, body)
  }

  return PLANET_ORDER.map((id) => {
    // The library keys bodies by lowercase name, matching `ComputedPlanetId` 1:1.
    const body = byKey.get(id) as LibBody
    return {
      id,
      lon: norm360(body.ChartPosition.Ecliptic.DecimalDegrees),
      retrograde: body.isRetrograde,
    }
  })
}

/**
 * A location-agnostic chart for a bare UTC instant — the transit side of the app.
 * `tz-lookup(0, 0)` resolves to `Etc/GMT` (offset 0, no DST), so feeding the UTC
 * wall-clock as the "local" time makes `Origin.utcTime` equal the instant we want;
 * planetary longitudes are geocentric, so the (0, 0) observer never shifts them.
 */
function transitHoroscope(Origin: OriginCtor, Horoscope: HoroscopeCtor, utc: Date): Horoscope {
  const origin = new Origin({
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth(), // Origin months are 0-indexed, like getUTCMonth()
    date: utc.getUTCDate(),
    hour: utc.getUTCHours(),
    minute: utc.getUTCMinutes(),
    second: utc.getUTCSeconds(),
    latitude: 0,
    longitude: 0,
  })

  return new Horoscope({ origin, houseSystem: 'placidus', zodiac: 'tropical', aspectTypes: [] })
}

/** Sun–Pluto positions for an arbitrary instant — the transit side of the /today page. */
export async function computePositions(utc: Date): Promise<PlanetPosition[]> {
  const { Origin, Horoscope } = await import('circular-natal-horoscope-js')
  return bodyPositions(transitHoroscope(Origin, Horoscope, utc))
}

/**
 * Tropical longitudes for selected bodies over a series of instants — the
 * months-ahead transit scans only need a few bodies' longitudes per sample.
 */
export async function computeLongitudeSeries<T extends ComputedPlanetId>(
  dates: readonly Date[],
  ids: readonly T[],
): Promise<Record<T, number>[]> {
  const { Origin, Horoscope } = await import('circular-natal-horoscope-js')

  return dates.map((date) => {
    const byKey = new Map<string, LibBody>()

    for (const body of transitHoroscope(Origin, Horoscope, date).CelestialBodies.all as LibBody[]) {
      byKey.set(body.key, body)
    }

    const lons = {} as Record<T, number>

    for (const id of ids) {
      lons[id] = norm360((byKey.get(id) as LibBody).ChartPosition.Ecliptic.DecimalDegrees)
    }

    return lons
  })
}

/**
 * Samples the beginning and end of the birth date in the birthplace's local time.
 * The Moon moves far enough for its sign to depend on the missing time;
 * the slower bodies remain represented by the noon chart returned by `computeChart`.
 */
export async function computeUnknownBirthTimeAnalysis(input: BirthInput): Promise<UnknownBirthTimeAnalysis> {
  const [start, end] = await Promise.all([
    computeChart({ ...input, hour: 0, minute: 0, timeKnown: true }),
    computeChart({ ...input, hour: 23, minute: 59, timeKnown: true }),
  ])

  const startMoon = start.planets.find((planet) => planet.id === 'moon')
  const endMoon = end.planets.find((planet) => planet.id === 'moon')

  if (!startMoon || !endMoon) {
    throw new Error('Moon position unavailable')
  }

  const startSign = signOfLon(startMoon.lon)
  const endSign = signOfLon(endMoon.lon)

  return {
    moonSigns: startSign === endSign ? [startSign] : [startSign, endSign],
    moonLongitudeRange: [startMoon.lon, endMoon.lon],
  }
}

/**
 * The one entry point for a saved birth across natal, today and love views.
 * Date-only charts retain a noon chart for slow bodies, plus a separate Moon
 * range that callers must use instead of treating the noon Moon as exact.
 */
export async function computeBirthChartAnalysis(input: BirthInput): Promise<BirthChartAnalysis> {
  const [chart, unknownTime] = await Promise.all([
    computeChart(input),
    input.timeKnown ? Promise.resolve(null) : computeUnknownBirthTimeAnalysis(input),
  ])

  return { chart, unknownTime }
}

export async function computeChart(input: BirthInput): Promise<NatalChart> {
  const { Origin, Horoscope } = await import('circular-natal-horoscope-js')

  // Origin takes the birth *local* wall-clock and derives the zone (with historical
  // DST) from the coordinates — which, in this app, always travel together as one
  // city record, so the derived zone matches `input.timeZone`.
  const origin = new Origin({
    year: input.year,
    month: input.month - 1, // 1–12 → 0-indexed
    date: input.day,
    hour: input.timeKnown ? input.hour : 12,
    minute: input.timeKnown ? input.minute : 0,
    second: 0,
    latitude: input.latitude,
    longitude: input.longitude,
  })

  const horoscope = new Horoscope({
    origin,
    houseSystem: 'placidus',
    zodiac: 'tropical',
    aspectTypes: [],
  })

  const planets = bodyPositions(horoscope)

  // Mean lunar nodes (always retrograde; south node is the antipode) and mean Black
  // Moon Lilith (the Moon's mean apogee, which advances direct → never retrograde).
  const points = horoscope.CelestialPoints as Record<string, EclipticDD>

  planets.push({
    id: 'northNode',
    lon: norm360(points.northnode.ChartPosition.Ecliptic.DecimalDegrees),
    retrograde: true,
  })

  planets.push({
    id: 'southNode',
    lon: norm360(points.southnode.ChartPosition.Ecliptic.DecimalDegrees),
    retrograde: true,
  })

  planets.push({
    id: 'lilith',
    lon: norm360(points.lilith.ChartPosition.Ecliptic.DecimalDegrees),
    retrograde: false,
  })

  // Chiron — a real orbiting body the ephemeris returns (unlike node/Lilith), so it
  // carries a genuine retrograde flag. Read planet-grade in the reading layer.
  const chiron = (horoscope.CelestialBodies.all as LibBody[]).find((body) => body.key === 'chiron')

  if (chiron) {
    planets.push({
      id: 'chiron',
      lon: norm360(chiron.ChartPosition.Ecliptic.DecimalDegrees),
      retrograde: chiron.isRetrograde,
    })
  }

  let ascendant: number | null = null
  let midheaven: number | null = null
  let cusps: number[] | null = null

  if (input.timeKnown) {
    ascendant = norm360(horoscope.Ascendant.ChartPosition.Ecliptic.DecimalDegrees)
    midheaven = norm360(horoscope.Midheaven.ChartPosition.Ecliptic.DecimalDegrees)
    cusps = (horoscope.Houses as LibHouse[])
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((house) => norm360(house.ChartPosition.StartPosition.Ecliptic.DecimalDegrees))

    // Part of Fortune — day formula above the horizon, night formula below. The
    // library doesn't compute it, so it stays derived here from Asc/Sun/Moon.
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
