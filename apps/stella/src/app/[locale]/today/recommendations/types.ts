import type { ElementId } from '../../chart/types'

export const LUCKY_COLOR_IDS = [
  'coralGlow',
  'vermilion',
  'amberSpark',
  'apricotLight',
  'roseFlame',
  'wineRed',
  'mossGreen',
  'oliveLeaf',
  'oatBeige',
  'sandGold',
  'cedarBrown',
  'sageGreen',
  'skyBlue',
  'mintBreeze',
  'lavenderMist',
  'silverCloud',
  'lemonLight',
  'iceBlue',
  'deepBlue',
  'tealWave',
  'indigoNight',
  'moonBlue',
  'plumShadow',
  'pearlLilac',
] as const

export type LuckyColorId = (typeof LUCKY_COLOR_IDS)[number]
export type LuckyEnergy = 'begin' | 'build' | 'peak' | 'release'
export type LuckyTone = 'lift' | 'flow' | 'ground'

export type LuckyCandidate = {
  element: ElementId
  resonatesWith: readonly ElementId[]
  energies: readonly LuckyEnergy[]
  tones: readonly LuckyTone[]
}

export type LuckyCopy = {
  name: string
  reason: string
  action: string
}

export type LuckyFood = LuckyCandidate &
  LuckyCopy & {
    id: string
  }

export type LuckyColorDefinition = LuckyCandidate & {
  id: LuckyColorId
  hex: `#${string}`
}

export type LuckyContent = {
  foods: readonly LuckyFood[]
  colors: Record<LuckyColorId, LuckyCopy>
}

export type LuckyColor = LuckyColorDefinition & LuckyCopy

export type LuckyRecommendations = {
  personalized: boolean
  food: LuckyFood
  color: LuckyColor
}
