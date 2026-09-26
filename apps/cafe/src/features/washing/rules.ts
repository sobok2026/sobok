import type { GameState, Washing } from '../../simulation/state'
import { CUP_NAMES, type ReusableCupKind, reusableCupKinds } from '../inventory/cups'

export const washItems = ['pitcher', ...reusableCupKinds] as const
export type WashItem = (typeof washItems)[number]

export const WASH_NAMES = {
  pitcher: '피처',
  ...Object.fromEntries(reusableCupKinds.map((kind) => [kind, CUP_NAMES[kind]])),
} as Record<WashItem, string>

export const washDestination = (item: WashItem) => (item === 'pitcher' ? ('rack' as const) : ('cups' as const))

export function washStock(state: GameState, item: 'pitcher' | ReusableCupKind) {
  return item === 'pitcher' ? state.tools : state.reusableCups[item]
}

// Prototype interaction times; these are not real sanitation procedures.
export const WASH_STEPS = {
  scrub: { label: '문지르기', seconds: 2.5 },
  rinse: { label: '헹구기', seconds: 1.5 },
} as const

export function washingHandsBusy(washing: Washing | null) {
  return !!washing && (washing.spongeHeld || washing.stage === 'carrying')
}
