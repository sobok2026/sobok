import type { StationId } from './catalog'
import type { CleaningStation } from './cleaning'
import type { GameState } from './state'

export type ActiveInput =
  | { kind: 'drink'; cupId: string; step: number; station: StationId; operation: string }
  | { kind: 'prep'; preparationId: string; step: number; station: 'prep' }
  | { kind: 'cold'; preparationId: string; step: number; station: 'cold-prep' }
  | { kind: 'wash'; washingId: string; stage: 'scrub' | 'rinse'; station: 'wash' }
  | { kind: 'clean'; cleaningId: string; station: CleaningStation }
  | null

export type WorkContext = { state: GameState; input: ActiveInput }
