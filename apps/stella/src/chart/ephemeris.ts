// Computes tropical planetary positions, sensitive points and Placidus houses
// entirely in the browser with Swiss Ephemeris 2.10.03 compiled to WebAssembly.
// The standard 1800–2400 ephemeris files are self-hosted and load only when a
// chart or transit calculation is requested.

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

const EPHEMERIS_BASE_PATH = '/ephemeris/2.10.03'
const EPHEMERIS_FILE_NAMES = ['sepl_18.se1', 'semo_18.se1', 'seas_18.se1'] as const
const norm360 = (x: number) => ((x % 360) + 360) % 360

type SwissModule = typeof import('@swisseph/browser')
type SwissEphemeris = InstanceType<SwissModule['SwissEphemeris']>
type SwissBody = Parameters<SwissEphemeris['calculatePosition']>[1]
type SwissCalculationFlags = Parameters<SwissEphemeris['calculatePosition']>[2]
type SwissPosition = ReturnType<SwissEphemeris['calculatePosition']>
type MomentTimezone = Pick<typeof import('moment-timezone'), 'tz'>

type SwissRuntime = {
  ephemeris: SwissEphemeris
  bodies: Record<ComputedPlanetId, SwissBody>
  northNode: SwissBody
  lilith: SwissBody
  chiron: SwissBody
  calculationFlags: SwissCalculationFlags
  swissEphemerisFlag: number
  placidus: Parameters<SwissEphemeris['calculateHouses']>[3]
}

let swissRuntimePromise: Promise<SwissRuntime> | null = null
let momentTimezonePromise: Promise<MomentTimezone> | null = null

/** One lazily initialized WASM instance and ephemeris data set shared by all calculations. */
function getSwissRuntime(): Promise<SwissRuntime> {
  if (!swissRuntimePromise) {
    swissRuntimePromise = import('@swisseph/browser')
      .then(
        async ({
          Asteroid,
          CalculationFlag,
          CommonCalculationFlags,
          HouseSystem,
          LunarPoint,
          Planet,
          SwissEphemeris,
        }) => {
          const ephemeris = new SwissEphemeris()
          await ephemeris.init()

          await ephemeris.loadEphemerisFiles(
            EPHEMERIS_FILE_NAMES.map((name) => ({
              name,
              url: `${EPHEMERIS_BASE_PATH}/${name}`,
            })),
          )

          return {
            ephemeris,
            bodies: {
              sun: Planet.Sun,
              moon: Planet.Moon,
              mercury: Planet.Mercury,
              venus: Planet.Venus,
              mars: Planet.Mars,
              jupiter: Planet.Jupiter,
              saturn: Planet.Saturn,
              uranus: Planet.Uranus,
              neptune: Planet.Neptune,
              pluto: Planet.Pluto,
            },
            northNode: LunarPoint.MeanNode,
            lilith: LunarPoint.MeanApogee,
            chiron: Asteroid.Chiron,
            calculationFlags: CommonCalculationFlags.DefaultSwissEphemeris,
            swissEphemerisFlag: CalculationFlag.SwissEphemeris,
            placidus: HouseSystem.Placidus,
          }
        },
      )
      .catch((error: unknown) => {
        swissRuntimePromise = null
        throw error
      })
  }

  return swissRuntimePromise
}

/** Lazy-load the IANA database only for local birth-time conversion. */
function getMomentTimezone(): Promise<MomentTimezone> {
  if (momentTimezonePromise) {
    return momentTimezonePromise
  }

  const pending = import('moment-timezone')
    .then(({ tz }) => ({ tz }))
    .catch((error: unknown) => {
      momentTimezonePromise = null
      throw error
    })
  momentTimezonePromise = pending
  return pending
}

/** Convert a birthplace wall-clock reading into the UTC instant Swiss Ephemeris expects. */
async function localDateTimeToUtc(input: BirthInput, hour: number, minute: number): Promise<Date> {
  const moment = await getMomentTimezone()

  if (!moment.tz.zone(input.timeZone)) {
    throw new Error(`Unknown IANA time zone: ${input.timeZone}`)
  }

  const local = moment.tz(
    {
      year: input.year,
      month: input.month - 1,
      date: input.day,
      hour,
      minute,
      second: 0,
      millisecond: 0,
    },
    input.timeZone,
  )

  if (!local.isValid()) {
    throw new Error('Invalid local birth date and time')
  }

  return local.toDate()
}

/**
 * Ask for Swiss-file precision explicitly and reject an unexpected fallback to
 * Moshier, which would otherwise be silent when a self-hosted file is missing.
 */
function calculateSwissPosition(runtime: SwissRuntime, julianDay: number, body: SwissBody): SwissPosition {
  const position = runtime.ephemeris.calculatePosition(julianDay, body, runtime.calculationFlags)

  if ((position.flags & runtime.swissEphemerisFlag) === 0) {
    throw new Error(`Swiss Ephemeris data file unavailable for body ${body}`)
  }

  return position
}

function planetPositions(runtime: SwissRuntime, julianDay: number): PlanetPosition[] {
  return PLANET_ORDER.map((id) => {
    const position = calculateSwissPosition(runtime, julianDay, runtime.bodies[id])

    return {
      id,
      lon: norm360(position.longitude),
      retrograde: position.longitudeSpeed < 0,
    }
  })
}

/** Sun–Pluto positions for an arbitrary UTC instant — the transit side of /today. */
export async function computePositions(utc: Date): Promise<PlanetPosition[]> {
  const runtime = await getSwissRuntime()
  return planetPositions(runtime, runtime.ephemeris.dateToJulianDay(utc))
}

/**
 * Tropical longitudes for selected bodies over a series of instants — the
 * months-ahead transit scans only need a few bodies' longitudes per sample.
 */
export async function computeLongitudeSeries<T extends ComputedPlanetId>(
  dates: readonly Date[],
  ids: readonly T[],
): Promise<Record<T, number>[]> {
  const runtime = await getSwissRuntime()

  return dates.map((date) => {
    const julianDay = runtime.ephemeris.dateToJulianDay(date)
    const lons = {} as Record<T, number>

    for (const id of ids) {
      lons[id] = norm360(calculateSwissPosition(runtime, julianDay, runtime.bodies[id]).longitude)
    }

    return lons
  })
}

/**
 * Samples the beginning and end of the birth date in the birthplace's local time.
 * Only the Moon is needed, so this avoids constructing two otherwise unused charts.
 */
export async function computeUnknownBirthTimeAnalysis(input: BirthInput): Promise<UnknownBirthTimeAnalysis> {
  const [runtime, startUtc, endUtc] = await Promise.all([
    getSwissRuntime(),
    localDateTimeToUtc(input, 0, 0),
    localDateTimeToUtc(input, 23, 59),
  ])

  const startMoon = calculateSwissPosition(
    runtime,
    runtime.ephemeris.dateToJulianDay(startUtc),
    runtime.bodies.moon,
  ).longitude

  const endMoon = calculateSwissPosition(
    runtime,
    runtime.ephemeris.dateToJulianDay(endUtc),
    runtime.bodies.moon,
  ).longitude

  const startSign = signOfLon(startMoon)
  const endSign = signOfLon(endMoon)

  return {
    moonSigns: startSign === endSign ? [startSign] : [startSign, endSign],
    moonLongitudeRange: [norm360(startMoon), norm360(endMoon)],
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
  const [runtime, utc] = await Promise.all([
    getSwissRuntime(),
    localDateTimeToUtc(input, input.timeKnown ? input.hour : 12, input.timeKnown ? input.minute : 0),
  ])

  const julianDay = runtime.ephemeris.dateToJulianDay(utc)
  const planets = planetPositions(runtime, julianDay)

  // Mean lunar nodes (south is the antipode) and mean Black Moon Lilith.
  const northNode = calculateSwissPosition(runtime, julianDay, runtime.northNode)
  const lilith = calculateSwissPosition(runtime, julianDay, runtime.lilith)
  const chiron = calculateSwissPosition(runtime, julianDay, runtime.chiron)

  planets.push(
    {
      id: 'northNode',
      lon: norm360(northNode.longitude),
      retrograde: northNode.longitudeSpeed < 0,
    },
    {
      id: 'southNode',
      lon: norm360(northNode.longitude + 180),
      retrograde: northNode.longitudeSpeed < 0,
    },
    {
      id: 'lilith',
      lon: norm360(lilith.longitude),
      retrograde: lilith.longitudeSpeed < 0,
    },
    {
      id: 'chiron',
      lon: norm360(chiron.longitude),
      retrograde: chiron.longitudeSpeed < 0,
    },
  )

  let ascendant: number | null = null
  let midheaven: number | null = null
  let cusps: number[] | null = null

  if (input.timeKnown) {
    const houses = runtime.ephemeris.calculateHouses(julianDay, input.latitude, input.longitude, runtime.placidus)

    // Swiss Ephemeris follows the C API convention: cusp 0 is unused and the
    // twelve real Placidus cusps occupy indexes 1–12.
    const placidusCusps = houses.cusps.slice(1, 13)

    if (placidusCusps.length !== 12 || placidusCusps.some((cusp) => !Number.isFinite(cusp))) {
      throw new Error('Swiss Ephemeris returned invalid Placidus house cusps')
    }

    ascendant = norm360(houses.ascendant)
    midheaven = norm360(houses.mc)
    cusps = placidusCusps.map(norm360)

    // Part of Fortune — day formula above the horizon, night formula below.
    const sun = planets.find((planet) => planet.id === 'sun')?.lon ?? 0
    const moon = planets.find((planet) => planet.id === 'moon')?.lon ?? 0
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
