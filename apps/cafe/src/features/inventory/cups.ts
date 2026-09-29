import { DRINK_SIZES } from '../../content/drink-sizes'
import type { CatalogSize } from '../../content/recipe-schema'
import { josa } from '../../shared/format'
import type { GameState } from '../../simulation/state'

export const serviceModes = ['dine-in', 'takeout'] as const
export type ServiceMode = (typeof serviceModes)[number]
export const SERVICE_NAMES = { 'dine-in': '매장', takeout: '포장' } as const
export type Temperature = 'hot' | 'iced'
export type CupBody = 'paper' | 'plastic' | 'ceramic' | 'glass'
export const cupStyles = ['hot-paper', 'iced-plastic', 'hot-mug', 'iced-glass'] as const
export type CupStyle = (typeof cupStyles)[number]

type CupLine = {
  name: string
  service: ServiceMode
  temperature: Temperature
  body: CupBody
  sizes: readonly CatalogSize[]
}
type VesselCup = { name: string; label: string; service: ServiceMode; temperature: Temperature; body: CupBody }

// Starbucks Korea serves Short for HOT drinks only and Trenta for ICED takeout only.
const CUP_LINES = {
  'hot-paper': {
    name: 'HOT 종이컵',
    service: 'takeout',
    temperature: 'hot',
    body: 'paper',
    sizes: ['short', 'tall', 'grande', 'venti'],
  },
  'iced-plastic': {
    name: 'ICED 일회용 컵',
    service: 'takeout',
    temperature: 'iced',
    body: 'plastic',
    sizes: ['tall', 'grande', 'venti', 'trenta'],
  },
  'hot-mug': {
    name: 'HOT 머그',
    service: 'dine-in',
    temperature: 'hot',
    body: 'ceramic',
    sizes: ['short', 'tall', 'grande', 'venti'],
  },
  'iced-glass': {
    name: 'ICED 유리잔',
    service: 'dine-in',
    temperature: 'iced',
    body: 'glass',
    sizes: ['tall', 'grande', 'venti'],
  },
} as const satisfies Record<CupStyle, CupLine>

const VESSEL_CUPS = {
  demitasse: { name: '데미타스 잔', label: '데미타스', service: 'dine-in', temperature: 'hot', body: 'ceramic' },
  'vin-chaud-glass': { name: '뱅쇼 글라스', label: '뱅쇼', service: 'dine-in', temperature: 'hot', body: 'glass' },
  'martini-glass': { name: '마티니 글라스', label: '마티니', service: 'dine-in', temperature: 'iced', body: 'glass' },
  'tulip-glass': { name: '튤립 글라스', label: '튤립', service: 'dine-in', temperature: 'iced', body: 'glass' },
  'cocktail-glass': { name: '칵테일 전용잔', label: '칵테일', service: 'dine-in', temperature: 'iced', body: 'glass' },
  'white-wine-glass': {
    name: '화이트 와인 글라스',
    label: '와인',
    service: 'dine-in',
    temperature: 'iced',
    body: 'glass',
  },
  'double-shot-glass': {
    name: '더블샷 전용잔',
    label: '더블샷',
    service: 'dine-in',
    temperature: 'iced',
    body: 'glass',
  },
  'double-shot-cup': {
    name: '더블샷 일회용 컵',
    label: '더블샷',
    service: 'takeout',
    temperature: 'iced',
    body: 'plastic',
  },
} as const satisfies Record<string, VesselCup>

type LineCup<S extends CupStyle> = `${S}-${(typeof CUP_LINES)[S]['sizes'][number]}`
export type VesselCupKind = keyof typeof VESSEL_CUPS
type ServedIn<M extends ServiceMode> =
  | { [S in CupStyle]: (typeof CUP_LINES)[S]['service'] extends M ? LineCup<S> : never }[CupStyle]
  | { [K in VesselCupKind]: (typeof VESSEL_CUPS)[K]['service'] extends M ? K : never }[VesselCupKind]
export type ReusableCupKind = ServedIn<'dine-in'>
export type DisposableCupKind = ServedIn<'takeout'>
export type CupKind = ReusableCupKind | DisposableCupKind
export type ReusableCupCounts = Record<ReusableCupKind, number>

type CupSpec = VesselCup & { style: CupStyle | null; size: CatalogSize | null }

const CUPS = Object.fromEntries([
  ...cupStyles.flatMap((style) => {
    const { sizes, ...line }: CupLine = CUP_LINES[style]

    return sizes.map((size) => [
      `${style}-${size}`,
      {
        ...line,
        name: `${line.name} · ${DRINK_SIZES[size].name}`,
        label: DRINK_SIZES[size].name,
        style,
        size,
      },
    ])
  }),
  ...Object.entries(VESSEL_CUPS).map(([kind, cup]) => [kind, { ...cup, style: null, size: null }]),
]) as Record<CupKind, CupSpec>

// The recipe's '숏 일회용 컵' for espresso to go is the Short HOT paper cup on the rack.
const VESSEL_ALIASES: Partial<Record<string, CupKind>> = { 'short-paper-cup': 'hot-paper-short' }

export const cupKinds = Object.keys(CUPS) as CupKind[]
export const CUP_NAMES = Object.fromEntries(cupKinds.map((kind) => [kind, CUPS[kind].name])) as Record<CupKind, string>
export const cupLabel = (kind: CupKind) => CUPS[kind].label
export const cupService = (kind: CupKind) => CUPS[kind].service
export const cupTemperature = (kind: CupKind) => CUPS[kind].temperature
export const cupBody = (kind: CupKind) => CUPS[kind].body
export const cupStyle = (kind: CupKind) => CUPS[kind].style
export const cupSize = (kind: CupKind) => CUPS[kind].size

export const isReusableCup = (kind: CupKind): kind is ReusableCupKind => cupService(kind) === 'dine-in'
export const reusableCupKinds = cupKinds.filter(isReusableCup)
export const disposableCupKinds = cupKinds.filter((kind): kind is DisposableCupKind => !isReusableCup(kind))

export const cupRows = [...cupStyles, 'dine-in-vessel', 'takeout-vessel'] as const
export type CupRow = (typeof cupRows)[number]
export const CUP_ROW_NAMES: Record<CupRow, string> = {
  ...(Object.fromEntries(cupStyles.map((style) => [style, CUP_LINES[style].name])) as Record<CupStyle, string>),
  'dine-in-vessel': '전용 잔',
  'takeout-vessel': '전용 컵',
}
export const cupRow = (kind: CupKind): CupRow => CUPS[kind].style ?? `${CUPS[kind].service}-vessel`
export const rowCupKinds = (row: CupRow) => cupKinds.filter((kind) => cupRow(kind) === row)

export function servingLine(temperature: Temperature, service: ServiceMode): CupStyle {
  const style = cupStyles.find((id) => CUP_LINES[id].temperature === temperature && CUP_LINES[id].service === service)
  if (!style) {
    throw new Error(`${SERVICE_NAMES[service]} ${temperature.toUpperCase()} 컵이 없어요.`)
  }
  return style
}

export function servingCup(
  vessel: string,
  temperature: Temperature,
  service: ServiceMode,
  size: CatalogSize | undefined,
): CupKind {
  const kind = vessel === 'serving-cup' ? lineCup(servingLine(temperature, service), size) : vesselCup(vessel)
  if (cupService(kind) !== service || cupTemperature(kind) !== temperature) {
    throw new Error(
      `${josa(CUP_NAMES[kind], '은', '는')} ${SERVICE_NAMES[service]} ${temperature.toUpperCase()} 음료에 쓸 수 없어요.`,
    )
  }
  return kind
}

function lineCup(style: CupStyle, size: CatalogSize | undefined): CupKind {
  const line: CupLine = CUP_LINES[style]
  if (!size || !line.sizes.includes(size)) {
    throw new Error(`${line.name}에는 ${size ? DRINK_SIZES[size].name : '단일 제공'} 규격이 없어요.`)
  }
  return `${style}-${size}` as CupKind
}

function vesselCup(vessel: string): CupKind {
  const kind = VESSEL_ALIASES[vessel] ?? (vessel in VESSEL_CUPS ? (vessel as VesselCupKind) : undefined)
  if (!kind) {
    throw new Error(`제공 용기에 맞는 컵이 없어요: ${vessel}`)
  }
  return kind
}

export type CupAttribute = 'service' | 'temperature' | 'size' | 'vessel'

export function cupMismatch(chosen: CupKind, needed: CupKind): CupAttribute[] {
  const standard = !!cupStyle(chosen) && !!cupStyle(needed)
  const checks: [CupAttribute, boolean][] = [
    ['service', cupService(chosen) !== cupService(needed)],
    ['temperature', cupTemperature(chosen) !== cupTemperature(needed)],
    standard ? ['size', cupSize(chosen) !== cupSize(needed)] : ['vessel', chosen !== needed],
  ]
  return checks.filter(([, wrong]) => wrong).map(([attribute]) => attribute)
}

export const emptyCupCounts = (): ReusableCupCounts =>
  Object.fromEntries(reusableCupKinds.map((kind) => [kind, 0])) as ReusableCupCounts

export const cupCount = (counts: ReusableCupCounts | undefined) =>
  counts ? reusableCupKinds.reduce((sum, kind) => sum + counts[kind], 0) : 0

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
