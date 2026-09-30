import type { GameState } from '../../simulation/state'

// Game storage amounts and batch timing, not a store's measured production or hygiene specification.
export const ICE = {
  capacity: 380000,
  barCapacity: 40000,
  bucketCapacity: 6000,
  batchGrams: 5200,
  cycleSeconds: 600,
  initialStored: 40000,
  initialBar: 10000,
} as const

export const iceKilograms = (grams: number) => `${(grams / 1000).toFixed(1)} kg`

export function settleIce(state: GameState) {
  const ice = state.ice
  if (!ice.enabled || ice.stored >= ICE.capacity) {
    ice.cycleStartedAt = null
    return
  }
  if (ice.cycleStartedAt === null) {
    ice.cycleStartedAt = state.time
    return
  }

  const cycles = Math.floor((state.time - ice.cycleStartedAt) / ICE.cycleSeconds)
  if (cycles <= 0) return
  const made = Math.min(ICE.capacity - ice.stored, cycles * ICE.batchGrams)
  ice.stored += made
  ice.produced += made
  ice.cycleStartedAt = ice.stored >= ICE.capacity ? null : ice.cycleStartedAt + cycles * ICE.cycleSeconds
}

export function consumeIce(state: GameState, grams: number) {
  const used = Math.min(state.ice.bar, grams)
  state.ice.bar = Math.max(0, state.ice.bar - used)
  state.ice.used += used
}
