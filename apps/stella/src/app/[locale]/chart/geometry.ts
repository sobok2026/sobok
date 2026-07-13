// Geometry that places everything on the SVG wheel: polar mapping, sector
// paths, ring radii, token sizing and the overlap-avoiding planet layout.

import { angularGap } from './astrology'
import { PLANET_GLYPHS } from './data'
import type { PlanetPosition } from './types'

export const VIEW = 360
export const CENTER = VIEW / 2
const DEG = Math.PI / 180

/** Round to 3 decimals so server and client render byte-identical SVG (no hydration drift). */
function round(n: number): number {
  return Math.round(n * 1000) / 1000
}

export type Point = { x: number; y: number }

/**
 * Map an ecliptic longitude to an (x, y) on the wheel. The ascendant sits at
 * the 9-o'clock position and longitude increases counter-clockwise, matching a
 * conventional chart.
 */
export function polar(lon: number, radius: number, ascendant: number): Point {
  const angle = (180 + (lon - ascendant)) * DEG
  return {
    x: round(CENTER + radius * Math.cos(angle)),
    y: round(CENTER - radius * Math.sin(angle)),
  }
}

/** SVG path for an annular wedge spanning [lonStart, lonEnd] between two radii. */
export function annularSector(
  lonStart: number,
  lonEnd: number,
  rOuter: number,
  rInner: number,
  ascendant: number,
): string {
  const oStart = polar(lonStart, rOuter, ascendant)
  const oEnd = polar(lonEnd, rOuter, ascendant)
  const iEnd = polar(lonEnd, rInner, ascendant)
  const iStart = polar(lonStart, rInner, ascendant)

  return [
    `M ${oStart.x} ${oStart.y}`,
    `A ${rOuter} ${rOuter} 0 0 0 ${oEnd.x} ${oEnd.y}`,
    `L ${iEnd.x} ${iEnd.y}`,
    `A ${rInner} ${rInner} 0 0 1 ${iStart.x} ${iStart.y}`,
    'Z',
  ].join(' ')
}

export const RADIUS = {
  zodiacOuter: 172,
  zodiacInner: 146,
  zodiacGlyph: 159,
  houseOuter: 146,
  houseInner: 112,
  houseLabel: 129,
  // Planet ring pulled toward the centre (was 96) so the glyphs' outer edge
  // (≈ 101) clears the house ring at 112, opening a ~11px lane for the
  // true-longitude ticks + leader lines. The house band keeps its full width;
  // the space comes from the planet ring instead. Only cost: a slightly wider
  // fan in tight clusters, since a smaller ring makes PLANET_MIN_SEP_DEG grow
  // (~19.2° → ~21°).
  planet: 88,
  // Centred in that lane (103.5–110.5 with TICK_HALF): ~2.5px above the glyph
  // ring, ~1.5px below the house-ring circle at 112.
  trueMark: 107,
  aspect: 66,
} as const

/**
 * Pixel geometry of a planet token, shared by the renderer (`Planets`) and the
 * spacing math below so a change to the token size automatically re-derives the
 * minimum separation. `hit` is the transparent click target that actually
 * receives pointer events; the glows are purely decorative.
 */
export const TOKEN = {
  hit: 15,
  disc: 13,
  glow: 15,
  glowActive: 18,
} as const

/** Centre-to-centre gap (px) that keeps two hit targets from overlapping, plus 2px for the float bob. */
const TOKEN_MIN_GAP_PX = 2 * TOKEN.hit + 2

/**
 * The angular separation that gap subtends at the planet ring — i.e. the minimum
 * spacing `placePlanets` fans overlapping bodies to. Derived from the token size
 * rather than hard-coded, so tokens on the wheel are guaranteed individually
 * clickable however dense the chart.
 */
export const PLANET_MIN_SEP_DEG = (2 * Math.asin(Math.min(1, TOKEN_MIN_GAP_PX / (2 * RADIUS.planet)))) / DEG

export type PlacedPlanet = {
  planet: PlanetPosition & { glyph: string }
  /** Where the token is drawn (may be nudged apart from its true longitude to avoid overlap). */
  point: Point
  /** A short radial tick on the inner ring, marking the body's real longitude. */
  tick: { inner: Point; outer: Point }
  /** Leader line from the glyph's edge to that tick — null unless the glyph was nudged. */
  connector: { from: Point; to: Point } | null
  /** True when the token was moved far enough to warrant the connector. */
  displaced: boolean
}

/** Half-length (px) of a true-longitude tick, and the ring the ticks sit on. */
const TICK_HALF = 3.5

/**
 * Spread the display longitudes of bodies that would sit closer than `minSep` so
 * their glyphs never stack — including across the 0°/360° seam, which a plain
 * ascending scan misses (a body at 359° and one at 2° land at opposite ends of
 * the array yet are 3° apart on the wheel).
 *
 * The circle is cut at its largest empty gap so the seam falls where there is
 * the most room, unwrapped into an ascending line, then any run of bodies closer
 * than `minSep` is repeatedly re-centred and fanned at `minSep` until every
 * neighbour clears it. Re-centring a run can push it into an adjacent one, so the
 * pass repeats to a fixpoint — runs only ever merge, so it always converges.
 *
 * `lons` must be sorted ascending in [0, 360); the result is aligned to that same
 * input order, normalised back into [0, 360).
 */
function spreadLongitudes(lons: number[], minSep: number): number[] {
  const n = lons.length

  if (n < 2) {
    return lons.slice()
  }

  // Never demand more room than the circle holds; leave one gap free at the seam.
  const sep = Math.min(minSep, (360 / n) * 0.98)

  // 1. Find the largest circular gap and cut the circle just after it.
  let cut = 0
  let maxGap = -1

  for (let i = 0; i < n; i++) {
    const gap = (((lons[(i + 1) % n] - lons[i]) % 360) + 360) % 360

    if (gap > maxGap) {
      maxGap = gap
      cut = i
    }
  }

  // 2. Unwrap into an ascending line `x`, remembering each slot's input index.
  const order = new Array<number>(n)
  const x = new Array<number>(n)

  for (let k = 0; k < n; k++) {
    const idx = (cut + 1 + k) % n
    order[k] = idx
    x[k] = k === 0 ? lons[idx] : x[k - 1] + ((((lons[idx] - lons[order[k - 1]]) % 360) + 360) % 360)
  }

  // 3. Re-centre overlapping runs until no neighbours are closer than `sep`.
  let changed = true

  while (changed) {
    changed = false
    let i = 0

    while (i < n) {
      let j = i

      while (j + 1 < n && x[j + 1] - x[j] < sep - 1e-6) {
        j++
      }

      if (j > i) {
        const count = j - i + 1
        const center = (x[i] + x[j]) / 2
        const start = center - ((count - 1) * sep) / 2

        for (let k = 0; k < count; k++) {
          x[i + k] = start + k * sep
        }

        changed = true
      }

      i = j + 1
    }
  }

  // 4. Map back to the input order, normalised into [0, 360).
  const display = new Array<number>(n)

  for (let k = 0; k < n; k++) {
    display[order[k]] = ((x[k] % 360) + 360) % 360
  }

  return display
}

/**
 * Place each body's token on a single ring, fanning apart any that would
 * overlap. Returns entries sorted by longitude for stable render order; each
 * keeps a tick at its real longitude, plus a leader line back to the glyph when
 * the glyph had to be nudged away from it.
 */
export function placePlanets(
  planets: readonly PlanetPosition[],
  ascendant: number,
  minSepDeg = PLANET_MIN_SEP_DEG,
): PlacedPlanet[] {
  const sorted = [...planets].sort((a, b) => a.lon - b.lon)

  const display = spreadLongitudes(
    sorted.map((p) => p.lon),
    minSepDeg,
  )

  return sorted.map((planet, i) => {
    const displayLon = display[i]
    const displaced = angularGap(displayLon, planet.lon) > 2.5
    const tickInner = polar(planet.lon, RADIUS.trueMark - TICK_HALF, ascendant)

    return {
      planet: { ...planet, glyph: PLANET_GLYPHS[planet.id] },
      point: polar(displayLon, RADIUS.planet, ascendant),
      tick: {
        inner: tickInner,
        outer: polar(planet.lon, RADIUS.trueMark + TICK_HALF, ascendant),
      },
      // Run the leader along the ring gap (glyph rim → tick) so it never crosses
      // under the glyph the way a centre-anchored line did.
      connector: displaced
        ? { from: polar(displayLon, RADIUS.planet + TOKEN.disc - 1, ascendant), to: tickInner }
        : null,
      displaced,
    }
  })
}
