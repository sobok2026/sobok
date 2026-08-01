// Marc Edmund Jones chart-shape classification from the ten classical planets'
// distribution around the wheel. A single catchy characterization of the whole
// chart. Heuristic by construction — the boundaries between shapes are soft.

import { norm360 } from './astrology'
import { PLANET_ORDER } from './data'
import type { ChartShape, ChartShapeId, ComputedPlanetId, PlanetPosition } from './types'

type Body = { id: ComputedPlanetId; lon: number }

export function findShape(planets: readonly PlanetPosition[]): ChartShape {
  const bodies: Body[] = PLANET_ORDER.map((id) => {
    const p = planets.find((q) => q.id === id)
    return p ? { id, lon: norm360(p.lon) } : null
  })
    .filter((b): b is Body => b !== null)
    .sort((a, b) => a.lon - b.lon)

  const n = bodies.length

  // gaps[i] = the empty arc running from bodies[i] to the next planet (wrapping).
  const gaps = bodies.map((b, i) => norm360(bodies[(i + 1) % n].lon - b.lon))

  let i1 = 0
  for (let i = 1; i < n; i++) if (gaps[i] > gaps[i1]) i1 = i
  const g1 = gaps[i1]

  let i2 = -1
  for (let i = 0; i < n; i++) {
    if (i === i1) continue
    if (i2 === -1 || gaps[i] > gaps[i2]) i2 = i
  }
  const g2 = gaps[i2]

  const span = 360 - g1
  // The planet just after the largest void — the chart's "leading" planet in zodiacal order.
  const leading = bodies[(i1 + 1) % n].id

  // Bucket handle: the lone planet stranded between the two largest voids.
  const handleOf = (): ComputedPlanetId | null => {
    const order: number[] = []
    for (let k = 1; k <= n; k++) order.push((i1 + k) % n) // planets in occupied order, after g1
    const pos = order.indexOf(i2)
    if (pos === -1) return null
    const left = pos + 1
    const right = n - left
    if (left === 1) return bodies[order[0]].id
    if (right === 1) return bodies[order[n - 1]].id
    return null
  }

  let id: ChartShapeId
  let handle: ComputedPlanetId | null = null

  if (span <= 120) {
    id = 'bundle'
  } else if (g2 >= 60) {
    // Two real voids: a stranded singleton reads as a Bucket handle, else two clusters seesaw.
    const h = handleOf()
    if (h) {
      id = 'bucket'
      handle = h
    } else {
      id = 'seesaw'
    }
  } else if (g1 >= 180) {
    id = 'bowl'
  } else if (g1 >= 95) {
    id = 'locomotive'
  } else if (g1 < 55) {
    id = 'splash'
  } else {
    id = 'splay'
  }

  return { id, handle, leading }
}
