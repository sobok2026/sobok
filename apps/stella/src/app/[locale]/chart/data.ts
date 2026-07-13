// Structural, non-localized data for the natal chart: sign/planet tables,
// element colors, aspect styles and the decorative sample chart.

import type { AspectType, ComputedPlanetId, ElementId, ModalityId, NatalChart, PlanetId, SignId } from './types'

/** Zodiac signs in order. Each covers 30° of longitude starting at `index * 30`. */
export const SIGNS: readonly { id: SignId; glyph: string; element: ElementId; modality: ModalityId }[] = [
  {
    id: 'aries',
    glyph: '♈',
    element: 'fire',
    modality: 'cardinal',
  },
  {
    id: 'taurus',
    glyph: '♉',
    element: 'earth',
    modality: 'fixed',
  },
  {
    id: 'gemini',
    glyph: '♊',
    element: 'air',
    modality: 'mutable',
  },
  {
    id: 'cancer',
    glyph: '♋',
    element: 'water',
    modality: 'cardinal',
  },
  {
    id: 'leo',
    glyph: '♌',
    element: 'fire',
    modality: 'fixed',
  },
  {
    id: 'virgo',
    glyph: '♍',
    element: 'earth',
    modality: 'mutable',
  },
  {
    id: 'libra',
    glyph: '♎',
    element: 'air',
    modality: 'cardinal',
  },
  {
    id: 'scorpio',
    glyph: '♏',
    element: 'water',
    modality: 'fixed',
  },
  {
    id: 'sagittarius',
    glyph: '♐',
    element: 'fire',
    modality: 'mutable',
  },
  {
    id: 'capricorn',
    glyph: '♑',
    element: 'earth',
    modality: 'cardinal',
  },
  {
    id: 'aquarius',
    glyph: '♒',
    element: 'air',
    modality: 'fixed',
  },
  {
    id: 'pisces',
    glyph: '♓',
    element: 'water',
    modality: 'mutable',
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
  lilith: '⚸',
}

export const ELEMENT_IDS: readonly ElementId[] = ['fire', 'earth', 'air', 'water']

export const ELEMENT_COLORS: Record<ElementId, string> = {
  fire: '#f5866b',
  earth: '#eacd84',
  air: '#8fcf96',
  water: '#6fb3f0',
}

export const ASPECT_STYLE: Record<AspectType, { color: string; dashed: boolean; glyph: string }> = {
  conjunction: {
    color: '#f5bcff',
    dashed: false,
    glyph: '☌',
  },
  trine: {
    color: '#6ee7b7',
    dashed: false,
    glyph: '△',
  },
  sextile: {
    color: '#7dd3fc',
    dashed: true,
    glyph: '⚹',
  },
  square: {
    color: '#fb7185',
    dashed: false,
    glyph: '□',
  },
  opposition: {
    color: '#fbbf24',
    dashed: false,
    glyph: '☍',
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
