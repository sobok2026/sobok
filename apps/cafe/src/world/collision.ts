export type Obstacle = {
  x: number
  z: number
  width: number
  depth: number
  minY?: number
  maxY?: number
  yaw?: number
  radius?: number
  blocksSight?: boolean
}

export const PLAYER_RADIUS = 0.24
export const EYE_HEIGHT = 1.65
const BODY_HEIGHT = 1.76

export function intersectsObstacle(
  x: number,
  z: number,
  elevation: number,
  obstacle: Obstacle,
  radius = PLAYER_RADIUS,
) {
  if (elevation >= (obstacle.maxY ?? 3.95) - 0.01 || elevation + BODY_HEIGHT <= (obstacle.minY ?? 0) + 0.01)
    return false
  const dx = x - obstacle.x,
    dz = z - obstacle.z
  if (obstacle.radius !== undefined) return Math.hypot(dx, dz) < obstacle.radius + radius
  const yaw = obstacle.yaw ?? 0
  const localX = Math.cos(yaw) * dx - Math.sin(yaw) * dz
  const localZ = Math.sin(yaw) * dx + Math.cos(yaw) * dz
  const gapX = Math.max(0, Math.abs(localX) - obstacle.width / 2)
  const gapZ = Math.max(0, Math.abs(localZ) - obstacle.depth / 2)
  return gapX * gapX + gapZ * gapZ < radius * radius
}
