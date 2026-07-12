// Structural, non-localized data for the natal chart: sign/planet tables,
// element colors, aspect styles and the decorative sample chart.

import type { AspectType, ComputedPlanetId, ElementId, NatalChart, PlanetId, SignId } from './types'

/** Zodiac signs in order. Each covers 30° of longitude starting at `index * 30`. */
export const SIGNS: readonly { id: SignId; glyph: string; element: ElementId }[] = [
  {
    id: 'aries',
    glyph: '♈',
    element: 'fire',
  },
  {
    id: 'taurus',
    glyph: '♉',
    element: 'earth',
  },
  {
    id: 'gemini',
    glyph: '♊',
    element: 'air',
  },
  {
    id: 'cancer',
    glyph: '♋',
    element: 'water',
  },
  {
    id: 'leo',
    glyph: '♌',
    element: 'fire',
  },
  {
    id: 'virgo',
    glyph: '♍',
    element: 'earth',
  },
  {
    id: 'libra',
    glyph: '♎',
    element: 'air',
  },
  {
    id: 'scorpio',
    glyph: '♏',
    element: 'water',
  },
  {
    id: 'sagittarius',
    glyph: '♐',
    element: 'fire',
  },
  {
    id: 'capricorn',
    glyph: '♑',
    element: 'earth',
  },
  {
    id: 'aquarius',
    glyph: '♒',
    element: 'air',
  },
  {
    id: 'pisces',
    glyph: '♓',
    element: 'water',
  },
]

/** The ten bodies the ephemeris computes directly, in render order. */
export const PLANET_ORDER: readonly ComputedPlanetId[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
]

export const PLANET_GLYPHS: Record<PlanetId, string> = {
  sun: '☉',
  moon: '☾',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
  northNode: '☊',
  southNode: '☋',
  fortune: '⊗',
}

export const ELEMENT_IDS: readonly ElementId[] = ['fire', 'earth', 'air', 'water']

export const ELEMENT_COLORS: Record<ElementId, string> = {
  fire: '#f5866b',
  earth: '#eacd84',
  air: '#8fcf96',
  water: '#6fb3f0',
}

export const ASPECT_STYLE: Record<AspectType, { color: string; dashed: boolean }> = {
  conjunction: {
    color: '#f5bcff',
    dashed: false,
  },
  trine: {
    color: '#6ee7b7',
    dashed: false,
  },
  sextile: {
    color: '#7dd3fc',
    dashed: true,
  },
  square: {
    color: '#fb7185',
    dashed: false,
  },
  opposition: {
    color: '#fbbf24',
    dashed: false,
  },
}

/**
 * A fixed sample chart, used as the decorative backdrop before the user enters
 * their birth data. Longitudes are illustrative, not computed.
 */
export const DEFAULT_CHART: NatalChart = {
  planets: [
    {
      id: 'sun',
      lon: 288,
      retrograde: false,
    },
    {
      id: 'moon',
      lon: 24,
      retrograde: false,
    },
    {
      id: 'mercury',
      lon: 300,
      retrograde: true,
    },
    {
      id: 'venus',
      lon: 330,
      retrograde: false,
    },
    {
      id: 'mars',
      lon: 210,
      retrograde: false,
    },
    {
      id: 'jupiter',
      lon: 132,
      retrograde: false,
    },
    {
      id: 'saturn',
      lon: 6,
      retrograde: false,
    },
    {
      id: 'uranus',
      lon: 54,
      retrograde: true,
    },
    {
      id: 'neptune',
      lon: 348,
      retrograde: false,
    },
    {
      id: 'pluto',
      lon: 276,
      retrograde: false,
    },
  ],
  ascendant: 96,
  midheaven: 6,
  cusps: null,
}
