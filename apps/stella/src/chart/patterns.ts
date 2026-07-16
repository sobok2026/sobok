// Detection of the classic multi-body aspect patterns among the ten classical
// planets — Grand Trine, T-Square, Grand Cross, Yod and Kite. Stelliums live in
// `signature.ts`. Pure geometry from longitudes, so it also sees the quincunxes
// that `computeAspects` (major aspects only) doesn't surface.

import { angularGap } from './astrology'
import { PLANET_ORDER } from './data'
import type { ChartPattern, ComputedPlanetId, PlanetPosition } from './types'

// Pattern orbs — a touch tighter than the wheel's aspect orbs, per convention.
const ORB = { trine: 8, sextile: 6, opposition: 8, square: 7, quincunx: 3 } as const

type Body = { id: ComputedPlanetId; lon: number }

const has = (bodies: Body[], i: number, j: number, angle: number, orb: number) =>
  Math.abs(angularGap(bodies[i].lon, bodies[j].lon) - angle) <= orb

const byOrder = (a: ComputedPlanetId, b: ComputedPlanetId) => PLANET_ORDER.indexOf(a) - PLANET_ORDER.indexOf(b)
const key = (ids: ComputedPlanetId[]) => [...ids].sort(byOrder).join('-')

/** The standard five aspect patterns present in the chart, deduplicated. */
export function findPatterns(planets: readonly PlanetPosition[]): ChartPattern[] {
  const bodies: Body[] = PLANET_ORDER.map((id) => {
    const p = planets.find((q) => q.id === id)
    return { id, lon: p ? p.lon : 0 }
  }).filter((b) => planets.some((p) => p.id === b.id))

  const n = bodies.length
  const trine = (i: number, j: number) => has(bodies, i, j, 120, ORB.trine)
  const sextile = (i: number, j: number) => has(bodies, i, j, 60, ORB.sextile)
  const square = (i: number, j: number) => has(bodies, i, j, 90, ORB.square)
  const opposition = (i: number, j: number) => has(bodies, i, j, 180, ORB.opposition)
  const quincunx = (i: number, j: number) => has(bodies, i, j, 150, ORB.quincunx)

  const ids = (idx: number[]) => idx.map((i) => bodies[i].id)

  // ── Grand Trines: three planets in a mutual-trine triangle ──────────────────
  const grandTrines: number[][] = []
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      for (let c = b + 1; c < n; c++) {
        if (trine(a, b) && trine(b, c) && trine(a, c)) {
          grandTrines.push([a, b, c])
        }
      }
    }
  }

  // ── Kites: a Grand Trine plus a fourth planet opposing one vertex and ───────
  //    sextiling the other two. The Kite consumes its Grand Trine.
  const kites: ChartPattern[] = []
  const consumedTrines = new Set<string>()
  for (const [a, b, c] of grandTrines) {
    for (let d = 0; d < n; d++) {
      if (d === a || d === b || d === c) continue
      const vertices = [a, b, c]
      const opposed = vertices.find((v) => opposition(d, v))
      if (opposed === undefined) continue
      const others = vertices.filter((v) => v !== opposed)
      if (others.every((v) => sextile(d, v))) {
        kites.push({ type: 'kite', planets: ids([a, b, c, d]).sort(byOrder), apex: bodies[d].id })
        consumedTrines.add(key(ids([a, b, c])))
        break
      }
    }
  }

  // ── Grand Crosses: two oppositions whose four legs are mutually square ──────
  const grandCrosses: ChartPattern[] = []
  const crossMembers: Set<string>[] = []
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      for (let c = b + 1; c < n; c++) {
        for (let d = c + 1; d < n; d++) {
          const quad = [a, b, c, d]
          // Try to pair them into two oppositions with all four connecting squares.
          const pairs: [number, number][] = [
            [a, b],
            [a, c],
            [a, d],
          ]
          for (const [x, y] of pairs) {
            const rest = quad.filter((q) => q !== x && q !== y)
            const [p, q] = rest
            if (opposition(x, y) && opposition(p, q) && square(x, p) && square(x, q) && square(y, p) && square(y, q)) {
              grandCrosses.push({ type: 'grandCross', planets: ids(quad).sort(byOrder), apex: null })
              crossMembers.push(new Set(ids(quad)))
              break
            }
          }
        }
      }
    }
  }

  // ── T-Squares: two planets in opposition both square a shared apex ──────────
  //    Suppressed when all three sit inside a reported Grand Cross.
  const tSquares: ChartPattern[] = []
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      if (!opposition(a, b)) continue
      for (let c = 0; c < n; c++) {
        if (c === a || c === b) continue
        if (square(c, a) && square(c, b)) {
          const members = ids([a, b, c])
          if (crossMembers.some((set) => members.every((m) => set.has(m)))) continue
          tSquares.push({ type: 'tSquare', planets: [...members].sort(byOrder), apex: bodies[c].id })
        }
      }
    }
  }

  // ── Yods: two sextile planets both quincunx a shared apex ("Finger of God") ─
  const yods: ChartPattern[] = []
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      if (!sextile(a, b)) continue
      for (let c = 0; c < n; c++) {
        if (c === a || c === b) continue
        if (quincunx(c, a) && quincunx(c, b)) {
          yods.push({ type: 'yod', planets: ids([a, b, c]).sort(byOrder), apex: bodies[c].id })
        }
      }
    }
  }

  const bareTrines: ChartPattern[] = grandTrines
    .filter(([a, b, c]) => !consumedTrines.has(key(ids([a, b, c]))))
    .map(([a, b, c]) => ({ type: 'grandTrine', planets: ids([a, b, c]).sort(byOrder), apex: null }))

  // Report the rarer, more structured patterns first.
  return [...grandCrosses, ...kites, ...tSquares, ...yods, ...bareTrines]
}
