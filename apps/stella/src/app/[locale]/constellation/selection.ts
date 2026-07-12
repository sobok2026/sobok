// What the user has tapped on the wheel, plus the spotlight logic deciding
// which planets and aspect lines stay bright for the current selection.

import { houseOfLon, signOfLon } from '../chart/astrology'
import type { AspectType, ChartAspect, HouseNumber, PlanetId, PlanetPosition, SignId } from '../chart/types'

export type Selection =
  | { kind: 'planet'; id: PlanetId }
  | { kind: 'sign'; id: SignId }
  | { kind: 'aspect'; a: PlanetId; b: PlanetId; aspectType: AspectType; orb: number }
  | { kind: 'house'; n: HouseNumber }
  | null

/** True when `selection` is exactly this aspect (same pair and type). */
export function isAspectSelection(selection: Selection, asp: ChartAspect): boolean {
  return (
    selection?.kind === 'aspect' && selection.a === asp.a && selection.b === asp.b && selection.aspectType === asp.type
  )
}

/**
 * Which planets stay bright for the current selection.
 * - planet:  the planet + everything it aspects, and all of its lines
 * - aspect:  only the two involved planets and that single line
 * - house:   only the planets sitting inside that house
 * - sign:    only the planets sitting inside that sign
 */
export function computeBrightPlanets(
  selection: Selection,
  aspects: readonly ChartAspect[],
  planets: readonly PlanetPosition[],
  cusps: number[] | null,
  ascendant: number | null,
): Set<string> {
  const bright = new Set<string>()

  if (selection?.kind === 'planet') {
    bright.add(selection.id)

    for (const a of aspects) {
      if (a.a === selection.id) {
        bright.add(a.b)
      }
      if (a.b === selection.id) {
        bright.add(a.a)
      }
    }
  } else if (selection?.kind === 'aspect') {
    bright.add(selection.a)
    bright.add(selection.b)
  } else if (selection?.kind === 'house') {
    for (const p of planets) {
      if (houseOfLon(p.lon, cusps, ascendant) === selection.n) {
        bright.add(p.id)
      }
    }
  } else if (selection?.kind === 'sign') {
    for (const p of planets) {
      if (signOfLon(p.lon) === selection.id) {
        bright.add(p.id)
      }
    }
  }

  return bright
}

export function isPlanetDimmed(id: string, selection: Selection, brightPlanets: ReadonlySet<string>): boolean {
  return selection != null && !brightPlanets.has(id)
}

export function isAspectDimmed(asp: ChartAspect, selection: Selection, brightPlanets: ReadonlySet<string>): boolean {
  if (selection?.kind === 'planet') {
    return asp.a !== selection.id && asp.b !== selection.id
  }
  if (selection?.kind === 'aspect') {
    return !isAspectSelection(selection, asp)
  }
  if (selection?.kind === 'house' || selection?.kind === 'sign') {
    return !brightPlanets.has(asp.a) && !brightPlanets.has(asp.b)
  }
  return false
}

/** Stable key per selection so the detail panel remounts (and re-animates) when it changes. */
export function selectionKey(selection: Selection): string {
  if (!selection) {
    return 'empty'
  }

  if (selection.kind === 'aspect') {
    return `a-${selection.a}-${selection.b}-${selection.aspectType}`
  }

  if (selection.kind === 'house') {
    return `h-${selection.n}`
  }

  return `${selection.kind}-${selection.id}`
}
