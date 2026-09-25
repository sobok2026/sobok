import { RECIPES, type RecipeId } from './catalog'
import type { GameState } from './state'

export const serviceModes = ['dine-in', 'takeout'] as const
export type ServiceMode = (typeof serviceModes)[number]
export const SERVICE_NAMES = { 'dine-in': '매장', takeout: '포장' } as const
export const disposableCupKinds = ['hot-paper', 'iced-plastic'] as const
export const reusableCupKinds = ['hot-mug', 'iced-glass'] as const
export const cupKinds = [...disposableCupKinds, ...reusableCupKinds] as const
export type DisposableCupKind = (typeof disposableCupKinds)[number]
export type ReusableCupKind = (typeof reusableCupKinds)[number]
export type CupKind = (typeof cupKinds)[number]
export type ReusableCupCounts = Record<ReusableCupKind, number>
export const CUP_NAMES: Record<CupKind, string> = {
  'hot-paper': 'HOT 종이컵',
  'iced-plastic': 'ICED 일회용 컵',
  'hot-mug': 'HOT 머그',
  'iced-glass': 'ICED 유리잔',
}
export const isReusableCup = (kind: CupKind): kind is ReusableCupKind => kind === 'hot-mug' || kind === 'iced-glass'
export const emptyCupCounts = (): ReusableCupCounts => ({ 'hot-mug': 0, 'iced-glass': 0 })
export const cupCount = (counts: ReusableCupCounts | undefined) =>
  counts ? counts['hot-mug'] + counts['iced-glass'] : 0
export const reusableCupFor = (recipe: RecipeId): ReusableCupKind =>
  RECIPES[recipe].variant === 'HOT' ? 'hot-mug' : 'iced-glass'
export function cupKindFor(recipe: RecipeId, service: ServiceMode): CupKind {
  return service === 'dine-in'
    ? reusableCupFor(recipe)
    : RECIPES[recipe].variant === 'HOT'
      ? 'hot-paper'
      : 'iced-plastic'
}
export function cleanCupCount(state: GameState, kind: CupKind) {
  return isReusableCup(kind) ? state.reusableCups[kind].clean : state.disposableCups[kind].bar
}

export const REUSABLE_CUPS_PER_KIND = 4
export const CUP_SUPPLY = {
  initialBar: 2,
  initialReserve: 12,
  barCapacity: 12,
  refill: 6,
  reserveLimit: 48,
  pack: 24,
  price: 2000,
} as const
