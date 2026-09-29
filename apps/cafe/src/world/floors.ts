import { FLOOR_HEIGHT, STAIRCASE } from '../content/stations'

export function floorElevation(x: number, z: number, current: number): number | null {
  const stairs = STAIRCASE
  const progress = (z - stairs.startZ) / (stairs.endZ - stairs.startZ)
  const onFlight = progress >= 0 && progress <= 1
  const left = Math.abs(x - stairs.leftX) <= stairs.width / 2 - 0.08
  const right = Math.abs(x - stairs.rightX) <= stairs.width / 2 - 0.08
  const inShaft =
    x > stairs.leftX - stairs.width / 2 &&
    x < stairs.rightX + stairs.width / 2 &&
    z > stairs.startZ &&
    z < stairs.landingEndZ
  const landing = inShaft && z >= stairs.endZ

  for (const base of [0, FLOOR_HEIGHT]) {
    let height: number | null = null
    if (left && onFlight) height = base + (progress * FLOOR_HEIGHT) / 2
    if (right && onFlight) height = base + FLOOR_HEIGHT - (progress * FLOOR_HEIGHT) / 2
    if (landing) height = base + FLOOR_HEIGHT / 2
    if (height !== null && Math.abs(height - current) <= 0.24) return height
  }

  for (const height of [0, FLOOR_HEIGHT, FLOOR_HEIGHT * 2]) {
    if (height > 0 && inShaft) continue
    if (Math.abs(height - current) <= 0.24) return height
  }

  return null
}
