import { DRINK_SIZES } from '../../content/drink-sizes'
import {
  type CupBody,
  type CupKind,
  cupBody,
  cupKinds,
  cupSize,
  type VesselCupKind,
} from '../../features/inventory/cups'

/** [radius, height] in scene units, where a Tall cold glass stands 0.3 high. */
type ProfilePoint = readonly [number, number]

export type CupProfile = {
  outline: readonly ProfilePoint[]
  /** Where the drink starts: above a stem, a thick glass base or the inner floor of a double wall. */
  floor: number
  /** Radius of the saucer under the cup; the outline starts on top of it. */
  saucer?: number
  innerWall?: boolean
}

const STANDARD = {
  paper: { top: 0.112, bottom: 0.078, height: 0.285 },
  plastic: { top: 0.112, bottom: 0.078, height: 0.285 },
  ceramic: { top: 0.132, bottom: 0.12, height: 0.215 },
  glass: { top: 0.108, bottom: 0.092, height: 0.3 },
} as const satisfies Record<CupBody, { top: number; bottom: number; height: number }>

const stemmed = (foot: number, stem: number, bowl: ProfilePoint[]): ProfilePoint[] => [
  [foot, 0],
  [foot, 0.006],
  [0.012, 0.016],
  [0.008, 0.05],
  [0.008, stem],
  ...bowl,
]

// Martini and tulip glasses follow photos from the Jangchung Lounge R store. The dedicated cocktail glass is not
// confirmed, so it is drawn as a highball. A double-wall glass is recognised by its raised inner floor.
const VESSEL_PROFILES: Record<VesselCupKind, CupProfile> = {
  demitasse: {
    outline: [
      [0.048, 0.012],
      [0.056, 0.022],
      [0.074, 0.06],
      [0.08, 0.14],
    ],
    floor: 0.022,
    saucer: 0.14,
  },
  'vin-chaud-glass': {
    outline: [
      [0.084, 0],
      [0.096, 0.014],
      [0.1, 0.045],
      [0.1, 0.26],
    ],
    floor: 0.06,
    innerWall: true,
  },
  'martini-glass': {
    outline: stemmed(0.09, 0.19, [
      [0.02, 0.2],
      [0.138, 0.39],
    ]),
    floor: 0.2,
  },
  'tulip-glass': {
    outline: stemmed(0.085, 0.11, [
      [0.03, 0.125],
      [0.075, 0.16],
      [0.098, 0.22],
      [0.108, 0.3],
      [0.112, 0.37],
    ]),
    floor: 0.125,
  },
  'cocktail-glass': {
    outline: [
      [0.08, 0],
      [0.0875, 0.35],
    ],
    floor: 0.025,
  },
  'white-wine-glass': {
    outline: stemmed(0.09, 0.19, [
      [0.03, 0.21],
      [0.085, 0.25],
      [0.105, 0.31],
      [0.1, 0.39],
      [0.088, 0.46],
    ]),
    floor: 0.21,
  },
  'double-shot-glass': {
    outline: [
      [0.072, 0],
      [0.08, 0.225],
    ],
    floor: 0.025,
  },
  'double-shot-cup': {
    outline: [
      [0.058, 0],
      [0.085, 0.2],
    ],
    floor: 0,
  },
}

function standardProfile(kind: CupKind): CupProfile {
  const size = cupSize(kind) ?? 'tall'
  const scale = Math.cbrt(DRINK_SIZES[size].ml / DRINK_SIZES.tall.ml)
  const { top, bottom, height } = STANDARD[cupBody(kind)]

  return {
    outline: [
      [bottom * scale, 0],
      [top * scale, height * scale],
    ],
    floor: 0,
  }
}

export const CUP_PROFILES = Object.fromEntries(
  cupKinds.map((kind) => [kind, cupSize(kind) ? standardProfile(kind) : VESSEL_PROFILES[kind as VesselCupKind]]),
) as Record<CupKind, CupProfile>

const last = (profile: CupProfile) => profile.outline[profile.outline.length - 1]
export const profileHeight = (profile: CupProfile) => last(profile)[1]
export const profileRim = (profile: CupProfile) => last(profile)[0]

export function profileRadius(profile: CupProfile, y: number) {
  const points = profile.outline
  if (y <= points[0][1]) {
    return points[0][0]
  }

  for (let index = 1; index < points.length; index++) {
    const [radius, top] = points[index]
    if (y <= top) {
      const [lowerRadius, bottom] = points[index - 1]
      return lowerRadius + ((radius - lowerRadius) * (y - bottom)) / Math.max(top - bottom, 1e-6)
    }
  }

  return profileRim(profile)
}

export const cupScale = (kind: CupKind) => {
  const profile = CUP_PROFILES[kind]
  return (profileHeight(profile) - profile.outline[0][1]) / STANDARD[cupBody(kind)].height
}
