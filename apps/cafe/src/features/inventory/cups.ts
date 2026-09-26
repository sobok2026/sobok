import { DRINK_SIZES, type DrinkSize, drinkSizeIds } from '../../content/drink-sizes'
import { RECIPES, type RecipeId } from '../../content/recipes'
import type { GameState } from '../../simulation/state'

export const serviceModes = ['dine-in', 'takeout'] as const
export type ServiceMode = (typeof serviceModes)[number]
export const SERVICE_NAMES = { 'dine-in': '매장', takeout: '포장' } as const
export const cupStyles = ['hot-paper', 'iced-plastic', 'hot-mug', 'iced-glass'] as const
export type CupStyle = (typeof cupStyles)[number]
type StandardCupSize = Exclude<DrinkSize, 'trenta'>
export type DisposableCupKind = `hot-paper-${StandardCupSize}` | `iced-plastic-${DrinkSize}`
export type ReusableCupKind = `hot-mug-${StandardCupSize}` | `iced-glass-${StandardCupSize}`
export type CupKind = DisposableCupKind | ReusableCupKind
export type ReusableCupCounts = Record<ReusableCupKind, number>

export const CUP_STYLE_NAMES: Record<CupStyle, string> = {
  'hot-paper': 'HOT 종이컵',
  'iced-plastic': 'ICED 일회용 컵',
  'hot-mug': 'HOT 머그',
  'iced-glass': 'ICED 유리잔',
}

export const cupStyle = (kind: CupKind) => kind.slice(0, kind.lastIndexOf('-')) as CupStyle
export const cupSize = (kind: CupKind) => kind.slice(kind.lastIndexOf('-') + 1) as DrinkSize

export const isReusableCup = (kind: CupKind): kind is ReusableCupKind =>
  cupStyle(kind) === 'hot-mug' || cupStyle(kind) === 'iced-glass'

export const cupKinds: CupKind[] = cupStyles.flatMap((style) =>
  drinkSizeIds
    .filter((size) => size !== 'trenta' || style === 'iced-plastic')
    .map((size) => `${style}-${size}` as CupKind),
)

export const reusableCupKinds = cupKinds.filter(isReusableCup)
export const disposableCupKinds = cupKinds.filter((kind): kind is DisposableCupKind => !isReusableCup(kind))

export const CUP_NAMES = Object.fromEntries(
  cupKinds.map((kind) => [kind, `${CUP_STYLE_NAMES[cupStyle(kind)]} · ${DRINK_SIZES[cupSize(kind)].name}`]),
) as Record<CupKind, string>

export const cupService = (kind: CupKind): ServiceMode => (isReusableCup(kind) ? 'dine-in' : 'takeout')

export const emptyCupCounts = (): ReusableCupCounts =>
  Object.fromEntries(reusableCupKinds.map((kind) => [kind, 0])) as ReusableCupCounts

export const cupCount = (counts: ReusableCupCounts | undefined) =>
  counts ? reusableCupKinds.reduce((sum, kind) => sum + counts[kind], 0) : 0

export function reusableCupFor(recipe: RecipeId, size: DrinkSize): ReusableCupKind {
  if (size === 'trenta') throw new Error('Trenta는 포장 전용이에요.')
  return `${RECIPES[recipe].temperature === 'hot' ? 'hot-mug' : 'iced-glass'}-${size}`
}

export function cupKindFor(recipe: RecipeId, service: ServiceMode, size: DrinkSize): CupKind {
  if (service === 'dine-in') return reusableCupFor(recipe, size)

  if (RECIPES[recipe].temperature === 'hot') {
    if (size === 'trenta') throw new Error('HOT 음료에는 Trenta 컵을 사용할 수 없어요.')
    return `hot-paper-${size}`
  }

  return `iced-plastic-${size}`
}

export function cleanCupCount(state: GameState, kind: CupKind) {
  return isReusableCup(kind) ? state.reusableCups[kind].clean : state.disposableCups[kind].bar
}

// Each size keeps its own stock; washing uses the same workflow for every size.
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
