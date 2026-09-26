import type { GameState, Washing } from '../../simulation/state'
import {
  CUP_NAMES,
  CUP_STYLE_NAMES,
  type CupKind,
  cupStyle,
  type ReusableCupKind,
  reusableCupKinds,
} from '../inventory/cups'

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

/**
 * What the sink can start right now, one entry per kind of vessel. The cup the current order needs comes first
 * within its kind so washing never picks an unrelated size.
 */
export function washQueue(state: GameState, needed: CupKind | null) {
  return (['pitcher', 'hot-mug', 'iced-glass'] as const)
    .map((group) => {
      const items = washItems.filter((item) => (item === 'pitcher' ? item : cupStyle(item)) === group)
      const next = (key: 'dirty' | 'washed') =>
        items.find((item) => item === needed && washStock(state, item)[key] > 0) ??
        items.find((item) => washStock(state, item)[key] > 0)

      return {
        group,
        name: group === 'pitcher' ? WASH_NAMES.pitcher : CUP_STYLE_NAMES[group],
        dirty: items.reduce((sum, item) => sum + washStock(state, item).dirty, 0),
        washed: items.reduce((sum, item) => sum + washStock(state, item).washed, 0),
        dirtyItem: next('dirty'),
        washedItem: next('washed'),
      }
    })
    .filter((stock) => stock.dirty > 0 || stock.washed > 0)
}
