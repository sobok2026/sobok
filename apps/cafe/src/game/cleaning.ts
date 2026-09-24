import type { CupSurfaceId, TableId } from './catalog'
import type { GameState } from './state'

export const cleaningStationIds = ['table', 'table-left', 'condiment', 'mix', 'trash'] as const
export type CleaningStation = (typeof cleaningStationIds)[number]
export type Cleaning = {
  id: string
  station: CleaningStation
  stage: 'collect' | 'wipe' | 'bag'
  progress: number
  clothHeld: boolean
  heldCups: number
  trashCount: number
}

// Interaction times for the prototype, not real sanitation procedures.
export const CLEANING_SECONDS = { wipe: 3, bag: 2.5 } as const
export const cleaningHandsBusy = (cleaning: Cleaning | null) =>
  !!cleaning && (cleaning.clothHeld || cleaning.heldCups > 0)
export function cleaningSpot(station: CleaningStation): [number, number, number] {
  if (station === 'condiment') return [0, 1.085, 4.95]
  if (station === 'mix') return [4.1, 1.09, -1.48]
  if (station === 'trash') return [-5.4, 0.87, 5.1]
  return [station === 'table' ? 3.2 : -2.2, 0.85, 3.7]
}
export function cupSurface(state: GameState, station: CupSurfaceId) {
  return station === 'condiment' ? state.condiment : state.tables[station]
}
export function dirtyTableCount(tables: Record<TableId, { dirty: boolean; cups: number }>) {
  return Object.values(tables).filter((table) => table.dirty || table.cups > 0).length
}
