// Shared shape of the per-locale daily reading tables. Unlike the natal
// interpretations these are NOT routed through next-intl messages — they are
// plain data modules loaded per locale on demand, so the home page bundle
// never carries them.

import type { ElementId, SignId } from '../../chart'
import type { AspectTone } from '../../interpretations/types'
import type { MoonPhaseId } from '../sky'
import type { MoonTargetId, SlowPlanetId, SlowPointId } from '../transits'

export type StationPlanetId = 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto'

export type TodayReadings = {
  /** Today's Moon by sign — the day's base mood. */
  moonInSign: Record<SignId, string>
  /** Today's lunar phase — the day's direction of energy. */
  moonPhase: Record<MoonPhaseId, string>
  /** Transiting Moon touching a natal personal planet, by aspect tone. */
  moonContact: Record<MoonTargetId, Record<AspectTone, string>>
  /** Which natal house today's Moon lights up — "today's stage". Keys 1–12. */
  moonHouse: Record<number, string>
  /** The multi-day slow-transit story. `{point}` is replaced with a localized point name. */
  slowTransit: Record<SlowPlanetId, Record<AspectTone, string>>
  /** Localized names for the natal points a slow transit can touch. */
  points: Record<SlowPointId, string>
  /** Retrograde begins/ends notices. */
  station: Record<StationPlanetId, { begins: string; ends: string }>
  /** Frame for the global headline aspect. `{a}`/`{b}` are replaced with planet names. */
  headline: Record<AspectTone, string>
  /** Daily do/don't pools, keyed by the element of today's Moon sign. */
  do: Record<ElementId, string[]>
  dont: Record<ElementId, string[]>
}
