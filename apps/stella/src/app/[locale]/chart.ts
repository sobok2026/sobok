// Structural, non-localized data for the natal chart plus the geometry helpers
// that place everything on the wheel. All human-readable copy lives in
// `messages.ts` (localized) — this file only knows angles, glyphs and colors.
// Actual planetary longitudes are computed from birth data in `ephemeris.ts`.

export type ElementId = 'fire' | 'earth' | 'air' | 'water'

export type SignId =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces'

/** The ten bodies computed directly from the ephemeris. */
export type ComputedPlanetId =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'

/** Every point placed on the wheel — the ten bodies plus derived sensitive points. */
export type PlanetId = ComputedPlanetId | 'northNode' | 'southNode' | 'fortune'

export type AspectType = 'conjunction' | 'trine' | 'square' | 'sextile' | 'opposition'

/** A single body's position on the ecliptic (tropical longitude, 0–360°). */
export type PlanetPosition = { id: PlanetId; lon: number; retrograde: boolean }

/** A fully computed natal chart. `ascendant`/`midheaven`/`cusps` are null when the birth time is unknown. */
export type NatalChart = {
  planets: PlanetPosition[]
  ascendant: number | null
  midheaven: number | null
  /** 12 Placidus house-cusp longitudes (index 0 = house 1), or null without a birth time. */
  cusps: number[] | null
}

/** Zodiac signs in order. Each covers 30° of longitude starting at `index * 30`. */
export const SIGNS: readonly { id: SignId; glyph: string; element: ElementId }[] = [
  {
    id: 'aries',
    glyph: '♈',
    element: 'fire',
  },
  {
    id: 'taurus',
    glyph: '♉',
    element: 'earth',
  },
  {
    id: 'gemini',
    glyph: '♊',
    element: 'air',
  },
  {
    id: 'cancer',
    glyph: '♋',
    element: 'water',
  },
  {
    id: 'leo',
    glyph: '♌',
    element: 'fire',
  },
  {
    id: 'virgo',
    glyph: '♍',
    element: 'earth',
  },
  {
    id: 'libra',
    glyph: '♎',
    element: 'air',
  },
  {
    id: 'scorpio',
    glyph: '♏',
    element: 'water',
  },
  {
    id: 'sagittarius',
    glyph: '♐',
    element: 'fire',
  },
  {
    id: 'capricorn',
    glyph: '♑',
    element: 'earth',
  },
  {
    id: 'aquarius',
    glyph: '♒',
    element: 'air',
  },
  {
    id: 'pisces',
    glyph: '♓',
    element: 'water',
  },
]

/** The ten bodies the ephemeris computes directly, in render order. */
export const PLANET_ORDER: readonly ComputedPlanetId[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
]

export const PLANET_GLYPHS: Record<PlanetId, string> = {
  sun: '☉',
  moon: '☾',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
  northNode: '☊',
  southNode: '☋',
  fortune: '⊗',
}

export const ELEMENT_IDS: readonly ElementId[] = ['fire', 'earth', 'air', 'water']

export const ELEMENT_COLORS: Record<ElementId, string> = {
  fire: '#ff7a59',
  earth: '#8bd66b',
  air: '#ffd66b',
  water: '#5eb3ff',
}

export const ASPECT_STYLE: Record<AspectType, { color: string; dashed: boolean }> = {
  conjunction: {
    color: '#f5bcff',
    dashed: false,
  },
  trine: {
    color: '#6ee7b7',
    dashed: false,
  },
  sextile: {
    color: '#7dd3fc',
    dashed: true,
  },
  square: {
    color: '#fb7185',
    dashed: false,
  },
  opposition: {
    color: '#fbbf24',
    dashed: false,
  },
}

/** Major aspects with their exact angle and orb (max allowed deviation, degrees). */
const ASPECT_DEFS: readonly { type: AspectType; angle: number; orb: number }[] = [
  { type: 'conjunction', angle: 0, orb: 8 },
  { type: 'opposition', angle: 180, orb: 8 },
  { type: 'trine', angle: 120, orb: 7 },
  { type: 'square', angle: 90, orb: 7 },
  { type: 'sextile', angle: 60, orb: 6 },
]

/** Points that don't take part in aspects (each node aspects the same things as its axis). */
const ASPECT_EXCLUDED: ReadonlySet<PlanetId> = new Set(['southNode'])

/**
 * A fixed sample chart, used as the decorative backdrop before the user enters
 * their birth data. Longitudes are illustrative, not computed.
 */
export const DEFAULT_CHART: NatalChart = {
  planets: [
    {
      id: 'sun',
      lon: 288,
      retrograde: false,
    },
    {
      id: 'moon',
      lon: 24,
      retrograde: false,
    },
    {
      id: 'mercury',
      lon: 300,
      retrograde: true,
    },
    {
      id: 'venus',
      lon: 330,
      retrograde: false,
    },
    {
      id: 'mars',
      lon: 210,
      retrograde: false,
    },
    {
      id: 'jupiter',
      lon: 132,
      retrograde: false,
    },
    {
      id: 'saturn',
      lon: 6,
      retrograde: false,
    },
    {
      id: 'uranus',
      lon: 54,
      retrograde: true,
    },
    {
      id: 'neptune',
      lon: 348,
      retrograde: false,
    },
    {
      id: 'pluto',
      lon: 276,
      retrograde: false,
    },
  ],
  ascendant: 96,
  midheaven: 6,
  cusps: null,
}

// ── Derivations ────────────────────────────────────────────────────────────

export function signOfLon(lon: number): SignId {
  return SIGNS[Math.floor((((lon % 360) + 360) % 360) / 30)].id
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
export function houseOfLon(lon: number, cusps: number[] | null, ascendant: number | null): number | null {
  if (cusps) {
    const l = ((lon % 360) + 360) % 360

    for (let h = 0; h < 12; h++) {
      const start = cusps[h]
      const span = (((cusps[(h + 1) % 12] - start) % 360) + 360) % 360
      const offset = (((l - start) % 360) + 360) % 360

      if (offset < span) {
        return h + 1
      }
    }

    return 12
  }

  if (ascendant === null) {
    return null
  }

  return Math.floor(((((lon - ascendant) % 360) + 360) % 360) / 30) + 1
}

export function elementOfSign(id: SignId): ElementId {
  return SIGNS.find((s) => s.id === id)?.element ?? 'fire'
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

export type ChartAspect = { a: PlanetId; b: PlanetId; type: AspectType; orb: number }

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
      const best = closestAspect(bodies[i].lon, bodies[j].lon)

      if (best) {
        result.push({
          a: bodies[i].id,
          b: bodies[j].id,
          type: best.type,
          orb: Math.round(best.orb * 10) / 10,
        })
      }
    }
  }
  return result
}

// ── Geometry ─────────────────────────────────────────────────────────────

export const VIEW = 360
export const CENTER = VIEW / 2
const DEG = Math.PI / 180

/** Round to 3 decimals so server and client render byte-identical SVG (no hydration drift). */
function round(n: number): number {
  return Math.round(n * 1000) / 1000
}

/**
 * Map an ecliptic longitude to an (x, y) on the wheel. The ascendant sits at
 * the 9-o'clock position and longitude increases counter-clockwise, matching a
 * conventional chart.
 */
export function polar(lon: number, radius: number, ascendant: number): { x: number; y: number } {
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
  planet: 96,
  trueMark: 114,
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

type Point = { x: number; y: number }

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
