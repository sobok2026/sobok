// Domain vocabulary for the natal chart. All human-readable copy lives in
// `messages.ts` (localized) — these modules only know angles, glyphs and colors.
// Actual planetary longitudes are computed from birth data in `ephemeris.ts`.

export type ElementId = 'fire' | 'earth' | 'air' | 'water'

export type ModalityId = 'cardinal' | 'fixed' | 'mutable'

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
export type PlanetId = ComputedPlanetId | 'northNode' | 'southNode' | 'fortune' | 'lilith' | 'chiron'

export type AspectType = 'conjunction' | 'trine' | 'square' | 'sextile' | 'opposition'

/** A house index on the wheel, 1–12. */
export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/** The four chart angles (cusps of the angular houses): ASC/IC/DSC/MC. */
export type AngleId = 'asc' | 'ic' | 'dsc' | 'mc'

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

/** Classic multi-body aspect patterns (the standard five beyond the stellium). */
export type ChartPatternType = 'grandTrine' | 'tSquare' | 'grandCross' | 'yod' | 'kite'

/**
 * A detected aspect pattern among the ten classical planets.
 * `apex` is the focal planet of a T-square/Yod (the one squared/quincunxed by the
 * other two); null for the symmetric patterns. `element` carries the shared
 * element of a Grand Trine or the shared modality flavor of a Grand Cross.
 */
export type ChartPattern = {
  type: ChartPatternType
  planets: ComputedPlanetId[]
  apex: ComputedPlanetId | null
}

/** Marc Edmund Jones planetary-distribution shapes. */
export type ChartShapeId = 'bundle' | 'bowl' | 'bucket' | 'locomotive' | 'seesaw' | 'splash' | 'splay'

/** The chart's overall shape, with the singleton `handle` (Bucket) or `leading` planet where meaningful. */
export type ChartShape = {
  id: ChartShapeId
  handle: ComputedPlanetId | null
  leading: ComputedPlanetId | null
}
