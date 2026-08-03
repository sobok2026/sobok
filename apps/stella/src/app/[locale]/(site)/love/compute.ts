// Pure derivations for the love vertical: the natal love profile (Venus/Mars,
// the tightest Venus aspect, the descendant persona) and a year-ahead scan of
// the transits that color relationships. All copy lives in `./readings`.

import ms from 'ms'
import { big3, closestAspect, houseOfLon, norm360, reliableAspects, signOfLon } from '@/chart/astrology'
import { PLANET_ORDER } from '@/chart/data'
import { computeLongitudeSeries } from '@/chart/ephemeris'
import { dignityOf } from '@/chart/signature'
import type { AspectType, ChartAspect, ComputedPlanetId, NatalChart, PlanetId, SignId } from '@/chart/types'
import { type AspectTone, aspectTone } from '@/content/interpretations/types'

/** Venus pairs that carry aspect copy in the interpretation tables. */
const VENUS_PARTNERS: ReadonlySet<PlanetId> = new Set([
  'sun',
  'moon',
  'mercury',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
])

const COMPUTED_BODIES: ReadonlySet<PlanetId> = new Set(PLANET_ORDER)

/**
 * The natal love baseline — one qualitative tone derived from the chart's
 * loudest love signal. Ranked so the feature that most colors the felt
 * experience wins; without a birth time the house signals drop out and the
 * chart settles honestly toward `flowing`/`balanced`.
 */
export type NatalLoveTone = 'flowing' | 'slowDeep' | 'intense' | 'unconventional' | 'balanced'

export type LoveProfile = {
  venusSign: SignId
  venusRetro: boolean
  marsSign: SignId
  /** Rising sign — the first impression. Null without a birth time. */
  risingSign: SignId | null
  /** One reliable sign, or the two chronological possibilities for a date-only birth. */
  moonSigns: readonly SignId[]
  /** The tightest natal Venus aspect that carries copy, if any. */
  venusAspect: ChartAspect | null
  /** Descendant sign — the exact axis with a birth time, solar (Sun-opposite) without. */
  descendantSign: SignId
  solarDescendant: boolean
  /** Bodies living in the 7th house (birth time required, else empty). */
  seventhHouse: ComputedPlanetId[]
  /** The natal love baseline tone. */
  natalLove: NatalLoveTone
}

/** Whether a natal aspect ties Venus to the given body (either orientation). */
function venusTouches(aspects: readonly ChartAspect[], partner: PlanetId): boolean {
  return aspects.some((a) => (a.a === 'venus' && a.b === partner) || (a.b === 'venus' && a.a === partner))
}

/** First matching signal wins — loudest features first. See `NatalLoveTone`. */
function deriveNatalLoveTone(
  venusSign: SignId,
  descendantSign: SignId,
  seventhHouse: readonly ComputedPlanetId[],
  aspects: readonly ChartAspect[],
): NatalLoveTone {
  const venusDignity = dignityOf('venus', venusSign)

  if (
    venusTouches(aspects, 'saturn') ||
    seventhHouse.includes('saturn') ||
    venusDignity === 'fall' ||
    venusDignity === 'detriment'
  ) {
    return 'slowDeep'
  }
  if (venusTouches(aspects, 'pluto') || venusTouches(aspects, 'mars') || seventhHouse.includes('pluto')) {
    return 'intense'
  }
  if (venusTouches(aspects, 'uranus') || seventhHouse.includes('uranus') || descendantSign === 'aquarius') {
    return 'unconventional'
  }
  if (
    venusDignity === 'domicile' ||
    venusDignity === 'exaltation' ||
    venusTouches(aspects, 'jupiter') ||
    seventhHouse.includes('jupiter') ||
    seventhHouse.includes('venus')
  ) {
    return 'flowing'
  }
  return 'balanced'
}

export function deriveLoveProfile(
  chart: NatalChart,
  aspects: readonly ChartAspect[],
  dateOnlyMoonSigns?: readonly SignId[],
): LoveProfile {
  const venus = chart.planets.find((p) => p.id === 'venus')
  const mars = chart.planets.find((p) => p.id === 'mars')
  const moon = chart.planets.find((p) => p.id === 'moon')
  const sun = chart.planets.find((p) => p.id === 'sun')

  const filteredAspects = reliableAspects(aspects, dateOnlyMoonSigns !== undefined)

  const venusAspect =
    filteredAspects
      .filter((a) => (a.a === 'venus' && VENUS_PARTNERS.has(a.b)) || (a.b === 'venus' && VENUS_PARTNERS.has(a.a)))
      .sort((a, b) => a.orb - b.orb)[0] ?? null

  const descendantLon = chart.ascendant !== null ? chart.ascendant + 180 : (sun?.lon ?? 0) + 180
  const descendantSign = signOfLon(descendantLon)
  const venusSign = signOfLon(venus?.lon ?? 0)

  const seventhHouse =
    chart.ascendant === null
      ? []
      : chart.planets
          .filter((p) => COMPUTED_BODIES.has(p.id))
          .filter((p) => houseOfLon(p.lon, chart.cusps, chart.ascendant) === 7)
          .map((p) => p.id as ComputedPlanetId)

  return {
    venusSign,
    venusRetro: venus?.retrograde ?? false,
    marsSign: signOfLon(mars?.lon ?? 0),
    risingSign: big3(chart).risingSign,
    moonSigns: dateOnlyMoonSigns ?? [signOfLon(moon?.lon ?? 0)],
    venusAspect,
    descendantSign,
    solarDescendant: chart.ascendant === null,
    seventhHouse,
    natalLove: deriveNatalLoveTone(venusSign, descendantSign, seventhHouse, filteredAspects),
  }
}

export type LoveWindowKind = 'jupiterDescendant' | 'jupiterVenus' | 'saturnVenus' | 'venusRetro'

type AspectWindowKind = Exclude<LoveWindowKind, 'venusRetro'>

type AspectLoveWindow = {
  kind: AspectWindowKind
  /** Exact aspect is preserved for the premium technical label; copy still groups it by tone. */
  aspect: AspectType
  start: Date
  end: Date
}

type RetrogradeLoveWindow = {
  kind: 'venusRetro'
  aspect: null
  start: Date
  end: Date
}

export type LoveWindow = AspectLoveWindow | RetrogradeLoveWindow

/** What a timing window is good for — the purpose framing the section reads by. */
export type LoveWindowPurpose = 'meeting' | 'opening' | 'deepening' | 'caution'

/** The four editorial copy tones; retrograde has its own dedicated reading. */
export function windowTone(w: LoveWindow): AspectTone | null {
  return w.kind === 'venusRetro' ? null : aspectTone(w.aspect)
}

/** Map a scanned window to its purpose. Hard aspects and retrograde read as caution. */
export function windowPurpose(w: LoveWindow): LoveWindowPurpose {
  if (w.kind === 'jupiterDescendant') {
    return 'meeting'
  }
  if (w.kind === 'venusRetro') {
    return 'caution'
  }

  const tone = windowTone(w)
  const hard = tone === 'square' || tone === 'opposition'

  if (w.kind === 'jupiterVenus') {
    return hard ? 'caution' : 'opening'
  }
  // saturnVenus
  return hard ? 'caution' : 'deepening'
}

/** How far ahead the scan looks — a bit past a year so year-edge windows still close. */
const SCAN_DAYS = 380
const STEP_DAYS = 5
const JUPITER_ORB = 3
const SATURN_ORB = 2.5

const DAY_MS = ms('1 day')

/** Walk the samples and merge consecutive contacts of the same exact aspect. */
function collectAspectWindows(
  kind: AspectWindowKind,
  dates: readonly Date[],
  aspectAt: (index: number) => AspectType | null,
): AspectLoveWindow[] {
  const windows: AspectLoveWindow[] = []
  let open: AspectLoveWindow | null = null

  for (let i = 0; i < dates.length; i++) {
    const aspect = aspectAt(i)

    if (open && aspect !== open.aspect) {
      windows.push(open)
      open = null
    }

    if (aspect !== null && !open) {
      open = { kind, aspect, start: dates[i], end: dates[i] }
    } else if (open) {
      open.end = dates[i]
    }
  }

  if (open) {
    windows.push(open)
  }

  return windows
}

/** Venus retrograde has no aspect, so its active samples use a separate boolean collector. */
function collectRetrogradeWindows(
  dates: readonly Date[],
  activeAt: (index: number) => boolean,
): RetrogradeLoveWindow[] {
  const windows: RetrogradeLoveWindow[] = []
  let open: RetrogradeLoveWindow | null = null

  for (let i = 0; i < dates.length; i++) {
    const active = activeAt(i)

    if (open && !active) {
      windows.push(open)
      open = null
    }

    if (active && !open) {
      open = { kind: 'venusRetro', aspect: null, start: dates[i], end: dates[i] }
    } else if (open) {
      open.end = dates[i]
    }
  }

  if (open) {
    windows.push(open)
  }

  return windows
}

/**
 * Scan the year ahead for the transits the timing section narrates: Jupiter
 * meeting the natal Venus or the descendant, Saturn testing the natal Venus
 * and Venus retrograde seasons. Windows already in effect start today.
 */
export async function scanLoveTransits(chart: NatalChart, now: Date): Promise<LoveWindow[]> {
  const venusLon = chart.planets.find((p) => p.id === 'venus')?.lon ?? null
  const descendantLon = chart.ascendant === null ? null : norm360(chart.ascendant + 180)
  const dates: Date[] = []

  for (let day = 0; day <= SCAN_DAYS; day += STEP_DAYS) {
    dates.push(new Date(now.getTime() + day * DAY_MS))
  }

  const samples = await computeLongitudeSeries(dates, ['venus', 'jupiter', 'saturn'])
  const windows: LoveWindow[] = []

  if (venusLon !== null) {
    windows.push(
      ...collectAspectWindows('jupiterVenus', dates, (i) => {
        const match = closestAspect(samples[i].jupiter, venusLon, JUPITER_ORB)
        return match?.type ?? null
      }),
      ...collectAspectWindows('saturnVenus', dates, (i) => {
        const match = closestAspect(samples[i].saturn, venusLon, SATURN_ORB)
        return match?.type ?? null
      }),
    )
  }

  if (descendantLon !== null) {
    windows.push(
      ...collectAspectWindows('jupiterDescendant', dates, (i) => {
        const match = closestAspect(samples[i].jupiter, descendantLon, JUPITER_ORB)
        return match?.type === 'conjunction' ? match.type : null
      }),
    )
  }

  // Venus retrograde: the 5-day longitude delta turns negative for ~40 days.
  windows.push(
    ...collectRetrogradeWindows(dates, (i) => {
      if (i === dates.length - 1) {
        return false
      }
      let delta = samples[i + 1].venus - samples[i].venus
      if (delta > 180) delta -= 360
      if (delta < -180) delta += 360
      return delta < 0
    }),
  )

  return windows.sort((a, b) => a.start.getTime() - b.start.getTime())
}
