import type { GameState, Washing } from '../../simulation/state'
import {
  CUP_NAMES,
  CUP_ROW_NAMES,
  type CupKind,
  cupRow,
  type ReusableCupKind,
  reusableCupKinds,
} from '../inventory/cups'

export const washItems = ['pitcher', ...reusableCupKinds] as const
export type WashItem = (typeof washItems)[number]
export const DISHWASHER = { capacity: 16, cycleSeconds: 120 } as const
export const rackSlots = (item: WashItem) => (item === 'pitcher' ? 4 : 1)
export const rackCount = (rack: Partial<Record<WashItem, number>>) =>
  Object.values(rack).reduce((sum, amount) => sum + (amount ?? 0), 0)
export const rackSpace = (rack: Partial<Record<WashItem, number>>) =>
  washItems.reduce((sum, item) => sum + (rack[item] ?? 0) * rackSlots(item), 0)
export const dishwasherJob = (state: GameState) => state.jobs.find((job) => job.kind === 'dishwasher')

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

/** Prioritize the current order's cup within its kind so washing never picks an unrelated size. */
export function washQueue(state: GameState, needed: CupKind | null) {
  return (['pitcher', 'hot-mug', 'iced-glass', 'dine-in-vessel'] as const)
    .map((group) => {
      const items = washItems.filter((item) => (item === 'pitcher' ? item : cupRow(item)) === group)
      const next = (key: 'dirty' | 'washed') =>
        items.find((item) => item === needed && washStock(state, item)[key] > 0) ??
        items.find((item) => washStock(state, item)[key] > 0)

      return {
        group,
        name: group === 'pitcher' ? WASH_NAMES.pitcher : CUP_ROW_NAMES[group],
        dirty: items.reduce((sum, item) => sum + washStock(state, item).dirty, 0),
        washed: items.reduce((sum, item) => sum + washStock(state, item).washed, 0),
        dirtyItem: next('dirty'),
        washedItem: next('washed'),
      }
    })
    .filter((stock) => stock.dirty > 0 || stock.washed > 0)
}
