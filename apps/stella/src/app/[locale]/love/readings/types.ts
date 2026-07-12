// Shared shape of the per-locale love reading tables. Like the /today readings
// these are plain data modules loaded per locale on demand — the natal Venus
// fragments stay in the Constellation messages and are reused as-is.

import type { ComputedPlanetId, SignId } from '../../chart/types'
import type { AspectTone } from '../../interpretations/types'

export type PartnerPersona = {
  /** Card headline, e.g. '먼저 손 내미는 불꽃'. */
  name: string
  text: string
  /** One line each — the textures that fit and the ones that drift. */
  match: string
  friction: string
}

export type LoveTiming = {
  jupiterVenus: Record<AspectTone, string>
  jupiterDescendant: string
  saturnVenus: Record<AspectTone, string>
  venusRetro: string
  /** Shown when the year ahead holds no scanned windows. */
  empty: string
}

export type LoveReadings = {
  /** Mars by sign through the attraction lens — how desire approaches. */
  marsInLove: Record<SignId, string>
  /** Venus by sign — the charm to lean on and how to use it. */
  charm: Record<SignId, string>
  /** Descendant-sign partner personas. */
  persona: Record<SignId, PartnerPersona>
  /** A body living in the 7th house colors the partnership stage. */
  seventhPlanet: Record<ComputedPlanetId, string>
  timing: LoveTiming
}
