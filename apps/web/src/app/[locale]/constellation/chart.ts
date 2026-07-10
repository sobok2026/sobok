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

/** Derive the major aspects present between the bodies (closest aspect per pair, within orb). */
export function computeAspects(planets: readonly PlanetPosition[]): ChartAspect[] {
  const bodies = planets.filter((p) => !ASPECT_EXCLUDED.has(p.id))
  const result: ChartAspect[] = []

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const sep = angularGap(bodies[i].lon, bodies[j].lon)
      let best: { type: AspectType; delta: number } | null = null

      for (const def of ASPECT_DEFS) {
        const delta = Math.abs(sep - def.angle)
        if (delta <= def.orb && (!best || delta < best.delta)) {
          best = { type: def.type, delta }
        }
      }

      if (best) {
        result.push({ a: bodies[i].id, b: bodies[j].id, type: best.type, orb: Math.round(best.delta * 10) / 10 })
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

export type PlacedPlanet = {
  planet: PlanetPosition & { glyph: string }
  /** Where the token is drawn (may be nudged apart from its true longitude to avoid overlap). */
  point: { x: number; y: number }
  /** A marker at the body's real longitude, so a nudged glyph never loses its position. */
  truePoint: { x: number; y: number }
  /** True when the token was moved far enough to warrant a connector to `truePoint`. */
  displaced: boolean
}

/**
 * Spread out the display longitudes of bodies that sit closer than `minSep`, so
 * their glyphs never stack. Each cluster of close bodies is fanned evenly around
 * its own center; isolated bodies stay on their true longitude. `lons` must be
 * sorted ascending.
 */
function spreadLongitudes(lons: number[], minSep: number): number[] {
  const display = lons.slice()
  let i = 0

  while (i < display.length) {
    let j = i

    while (j + 1 < display.length && display[j + 1] - display[j] < minSep) {
      j++
    }

    if (j > i) {
      const count = j - i + 1
      const center = (display[i] + display[j]) / 2
      const start = center - ((count - 1) * minSep) / 2

      for (let k = 0; k < count; k++) {
        display[i + k] = start + k * minSep
      }
    }

    i = j + 1
  }

  return display
}

/**
 * Place each body's token on a single ring, fanning apart any that would
 * overlap. Returns entries sorted by longitude for stable render order; each
 * keeps a `truePoint` marker at its real longitude.
 */
export function placePlanets(planets: readonly PlanetPosition[], ascendant: number, minSepDeg = 16): PlacedPlanet[] {
  const sorted = [...planets].sort((a, b) => a.lon - b.lon)

  const display = spreadLongitudes(
    sorted.map((p) => p.lon),
    minSepDeg,
  )

  return sorted.map((planet, i) => ({
    planet: { ...planet, glyph: PLANET_GLYPHS[planet.id] },
    point: polar(display[i], RADIUS.planet, ascendant),
    truePoint: polar(planet.lon, RADIUS.trueMark, ascendant),
    displaced: angularGap(display[i], planet.lon) > 2.5,
  }))
}
