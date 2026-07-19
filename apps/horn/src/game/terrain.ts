/**
 * Deterministic, infinite water bodies. Lakes are convex circles on a coarse grid so they read as
 * terrain to route around without ever trapping the player. Both the renderer (draw) and the engine
 * (collision) derive them from the same function, so they always agree.
 */
export interface Lake {
  x: number
  y: number
  r: number
}

const CELL = 560
/** Percent of grid cells that contain a lake. */
const DENSITY = 20

function hash2(a: number, b: number): number {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) | 0
  return (h ^ (h >>> 16)) >>> 0
}

export function lakeForCell(cx: number, cy: number): Lake | null {
  const h = hash2(cx, cy)
  if (h % 100 >= DENSITY) return null
  let s = h
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
  const x = cx * CELL + CELL * (0.28 + rnd() * 0.44)
  const y = cy * CELL + CELL * (0.28 + rnd() * 0.44)
  const r = 64 + rnd() * 92
  return { x, y, r }
}

export function forEachLakeNear(x: number, y: number, range: number, cb: (lake: Lake) => void): void {
  const c0x = Math.floor((x - range) / CELL)
  const c1x = Math.floor((x + range) / CELL)
  const c0y = Math.floor((y - range) / CELL)
  const c1y = Math.floor((y + range) / CELL)
  for (let cy = c0y; cy <= c1y; cy++) {
    for (let cx = c0x; cx <= c1x; cx++) {
      const lake = lakeForCell(cx, cy)
      if (lake) cb(lake)
    }
  }
}

/** Push a point (moving entity of the given radius) out of any lake it overlaps. */
export function pushOutOfWater(x: number, y: number, radius: number): { x: number; y: number } {
  let ox = x
  let oy = y
  forEachLakeNear(x, y, radius + 180, (l) => {
    const dx = ox - l.x
    const dy = oy - l.y
    const min = l.r + radius
    const d = Math.hypot(dx, dy)
    if (d >= min) return
    if (d > 0.001) {
      ox = l.x + (dx / d) * min
      oy = l.y + (dy / d) * min
    } else {
      ox = l.x + min
      oy = l.y
    }
  })
  return { x: ox, y: oy }
}
