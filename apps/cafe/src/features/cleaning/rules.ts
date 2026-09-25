import type { CupSurfaceId, TableId } from '../../content/stations'
import type { Cleaning, GameState } from '../../simulation/state'
import { cupCount, type ReusableCupCounts } from '../inventory/cups'

export const cleaningStationIds = ['table', 'table-left', 'condiment', 'mix', 'trash'] as const
export type CleaningStation = (typeof cleaningStationIds)[number]

// Interaction times for the prototype, not real sanitation procedures.
export const CLEANING_SECONDS = { wipe: 3, bag: 2.5 } as const
export const cleaningHandsBusy = (cleaning: Cleaning | null) =>
  !!cleaning && (cleaning.clothHeld || cupCount(cleaning.heldCups) > 0)

export function cupSurface(state: GameState, station: CupSurfaceId) {
  return station === 'condiment' ? state.condiment : state.tables[station]
}
export function dirtyTableCount(tables: Record<TableId, { dirty: boolean; cups: ReusableCupCounts }>) {
  return Object.values(tables).filter((table) => table.dirty || cupCount(table.cups) > 0).length
}
