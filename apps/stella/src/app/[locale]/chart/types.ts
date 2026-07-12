// Domain vocabulary for the natal chart. All human-readable copy lives in
// `messages.ts` (localized) — these modules only know angles, glyphs and colors.
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

/** A major aspect present between two bodies, with its deviation from exact (orb, degrees). */
export type ChartAspect = { a: PlanetId; b: PlanetId; type: AspectType; orb: number }
