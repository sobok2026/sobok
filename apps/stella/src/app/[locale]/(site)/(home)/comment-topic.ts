import { angleLongitude, signOfLon } from '@/chart/astrology'
import type { NatalChart, SignId } from '@/chart/types'
import { pairKey } from '@/content/interpretations/types'

import type { Selection } from './selection'

// The PERSISTENT PUBLIC identifier for a comment board — do NOT change these strings. Unlike selectionKey()
// (an ephemeral UI remount key that may be refactored freely), topicKey is stored in the database as the
// thread's identity, and there are no migrations (drizzle-kit push). Renaming a segment or reordering a pair
// would silently orphan every existing thread.
//
// Granularity (decided): planet & angle boards are split BY THE SIGN that drives the panel's reading text
// (Sun-in-Aries and Sun-in-Leo read differently, so they are different boards). sign & house boards are
// inherently shared (a sign description / house theme is the same for everyone). aspect boards are keyed by
// the canonical, order-independent pair + type (orb excluded). All segments are lowercase kind + the raw
// domain ids (planet ids may be camelCase, e.g. northNode — the server topic-key validation allows it).
export function commentTopicKey(
  selection: Selection,
  chart: NatalChart,
  moonSigns: readonly SignId[] | null,
): string | null {
  if (!selection) {
    return null
  }

  switch (selection.kind) {
    case 'sign':
      return `sign-${selection.id}`
    case 'house':
      return `house-${selection.n}`
    case 'aspect':
      // pairKey() yields the canonical "a-b" ordering, so the same pair maps to one board regardless of which
      // body was clicked first.
      return `aspect-${pairKey(selection.a, selection.b)}-${selection.aspectType}`
    case 'angle': {
      const lon = angleLongitude(selection.id, chart.ascendant, chart.midheaven)
      // No birth time → the angle panel itself renders nothing, so there is no board.
      return lon === null ? null : `angle-${selection.id}-${signOfLon(lon)}`
    }
    case 'planet': {
      const planet = chart.planets.find((p) => p.id === selection.id)
      if (!planet) {
        return null
      }
      // Unknown-time Moon can span two signs; the panel leads with the first, so the board follows it.
      const sign = planet.id === 'moon' && moonSigns ? moonSigns[0] : signOfLon(planet.lon)
      return `planet-${selection.id}-${sign}`
    }
  }
}
