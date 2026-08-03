import { LUCKY_COLOR_IDS, type LuckyColorDefinition, type LuckyColorId } from './types'

/**
 * Structural palette shared by every locale. Display names and copy stay in the
 * locale modules, while the stable ids and hex values keep a color unchanged
 * when a visitor switches language. The Record keyed by `LuckyColorId` makes a
 * missing, duplicated, or mistyped color a compile error.
 */
export const LUCKY_COLORS = {
  coralGlow: {
    hex: '#f27d72',
    element: 'fire',
    resonatesWith: ['air'],
    energies: ['begin', 'build'],
    tones: ['lift', 'flow'],
  },
  vermilion: {
    hex: '#d84a3a',
    element: 'fire',
    resonatesWith: ['earth'],
    energies: ['build', 'peak'],
    tones: ['lift', 'ground'],
  },
  amberSpark: {
    hex: '#e8a43a',
    element: 'fire',
    resonatesWith: ['air'],
    energies: ['begin', 'peak'],
    tones: ['lift', 'flow'],
  },
  apricotLight: {
    hex: '#f3a76f',
    element: 'fire',
    resonatesWith: ['water'],
    energies: ['begin', 'release'],
    tones: ['flow', 'lift'],
  },
  roseFlame: {
    hex: '#d95c78',
    element: 'fire',
    resonatesWith: ['water'],
    energies: ['peak', 'release'],
    tones: ['lift', 'ground'],
  },
  wineRed: {
    hex: '#7b2d3d',
    element: 'fire',
    resonatesWith: ['earth'],
    energies: ['build', 'release'],
    tones: ['ground', 'flow'],
  },
  mossGreen: {
    hex: '#687454',
    element: 'earth',
    resonatesWith: ['water'],
    energies: ['build', 'release'],
    tones: ['ground', 'flow'],
  },
  oliveLeaf: {
    hex: '#7b7a45',
    element: 'earth',
    resonatesWith: ['fire'],
    energies: ['begin', 'release'],
    tones: ['ground', 'flow'],
  },
  oatBeige: {
    hex: '#c8b88a',
    element: 'earth',
    resonatesWith: ['air'],
    energies: ['begin', 'build'],
    tones: ['flow', 'ground'],
  },
  sandGold: {
    hex: '#b89b72',
    element: 'earth',
    resonatesWith: ['fire'],
    energies: ['build', 'peak'],
    tones: ['lift', 'flow'],
  },
  cedarBrown: {
    hex: '#8a6248',
    element: 'earth',
    resonatesWith: ['water'],
    energies: ['peak', 'release'],
    tones: ['ground', 'flow'],
  },
  sageGreen: {
    hex: '#91a184',
    element: 'earth',
    resonatesWith: ['air'],
    energies: ['begin', 'release'],
    tones: ['flow', 'ground'],
  },
  skyBlue: {
    hex: '#79b8d8',
    element: 'air',
    resonatesWith: ['water'],
    energies: ['begin', 'build'],
    tones: ['lift', 'flow'],
  },
  mintBreeze: {
    hex: '#8fcbb8',
    element: 'air',
    resonatesWith: ['earth'],
    energies: ['begin', 'release'],
    tones: ['flow', 'lift'],
  },
  lavenderMist: {
    hex: '#a99acb',
    element: 'air',
    resonatesWith: ['water'],
    energies: ['build', 'release'],
    tones: ['flow', 'ground'],
  },
  silverCloud: {
    hex: '#a8b0bc',
    element: 'air',
    resonatesWith: ['earth'],
    energies: ['peak', 'release'],
    tones: ['ground', 'flow'],
  },
  lemonLight: {
    hex: '#e1d36b',
    element: 'air',
    resonatesWith: ['fire'],
    energies: ['begin', 'peak'],
    tones: ['lift', 'flow'],
  },
  iceBlue: {
    hex: '#a6d5df',
    element: 'air',
    resonatesWith: ['water'],
    energies: ['build', 'release'],
    tones: ['flow', 'ground'],
  },
  deepBlue: {
    hex: '#3e5f8a',
    element: 'water',
    resonatesWith: ['earth'],
    energies: ['build', 'peak'],
    tones: ['ground', 'flow'],
  },
  tealWave: {
    hex: '#3c8585',
    element: 'water',
    resonatesWith: ['air'],
    energies: ['begin', 'build'],
    tones: ['flow', 'lift'],
  },
  indigoNight: {
    hex: '#52528c',
    element: 'water',
    resonatesWith: ['fire'],
    energies: ['peak', 'release'],
    tones: ['ground', 'flow'],
  },
  moonBlue: {
    hex: '#6c8fb8',
    element: 'water',
    resonatesWith: ['air'],
    energies: ['begin', 'release'],
    tones: ['flow', 'ground'],
  },
  plumShadow: {
    hex: '#72526e',
    element: 'water',
    resonatesWith: ['fire'],
    energies: ['build', 'release'],
    tones: ['ground', 'lift'],
  },
  pearlLilac: {
    hex: '#c4bed0',
    element: 'water',
    resonatesWith: ['earth'],
    energies: ['begin', 'peak'],
    tones: ['flow', 'lift'],
  },
} as const satisfies Record<LuckyColorId, LuckyColorDefinition>

export const LUCKY_COLOR_ENTRIES = LUCKY_COLOR_IDS.map((id) => ({ id, ...LUCKY_COLORS[id] }))
