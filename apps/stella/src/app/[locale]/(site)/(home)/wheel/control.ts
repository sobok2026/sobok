import type { AngleId, HouseNumber, PlanetId, SignId } from '@/chart/types'

/** Roving-tabindex id for every interactive element on the wheel. */
export type WheelControlId = `sign:${SignId}` | `house:${HouseNumber}` | `angle:${AngleId}` | `planet:${PlanetId}`

export const INITIAL_WHEEL_CONTROL: WheelControlId = 'sign:aries'

export const WHEEL_CONTROL_SELECTOR = '[data-wheel-control]'
