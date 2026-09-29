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

export function stairGuide(x: number, z: number, elevation: number, destination: number): [number, number, number] {
  const up = destination > elevation
  const base = Math.floor((elevation + 0.02) / FLOOR_HEIGHT) * FLOOR_HEIGHT
  const progress = elevation - base
  const onStairs = progress > 0.05 && progress < FLOOR_HEIGHT - 0.05
  const { leftX, rightX, startZ, endZ, landingEndZ } = STAIRCASE
  const landingZ = (endZ + landingEndZ) / 2
  if (!onStairs) return [up ? leftX : rightX, elevation + 0.8, startZ - 0.6]
  const onLeft = Math.abs(x - leftX) < Math.abs(x - rightX)

  if (z >= endZ - 0.1) {
    const targetX = up ? rightX : leftX
    if (Math.abs(x - targetX) > 0.2) return [targetX, base + FLOOR_HEIGHT / 2 + 0.8, landingZ]
    return [targetX, base + (up ? FLOOR_HEIGHT : 0) + 0.8, startZ - 0.6]
  }

  if ((up && onLeft) || (!up && !onLeft)) return [onLeft ? leftX : rightX, base + FLOOR_HEIGHT / 2 + 0.8, landingZ]
  return [onLeft ? leftX : rightX, base + (up ? FLOOR_HEIGHT : 0) + 0.8, startZ - 0.6]
}
