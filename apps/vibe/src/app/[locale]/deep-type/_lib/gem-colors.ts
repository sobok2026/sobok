import type { GemCode } from './types'

// Per-gem accent color (source: GEMCOLOR, keyed by Korean gem name there — remapped to GemCode here so it
// stays stable across locales). Presentation-only, not translated.
export const GEM_COLORS: Record<GemCode, readonly [string, string]> = {
  ROVU: ['#ff2d55', '#8e0e2e'],
  ROVO: ['#ffb347', '#b46a1e'],
  ROHU: ['#b0173a', '#5a0a20'],
  ROHO: ['#4cd7a5', '#1e7a5a'],
  RAVU: ['#30d5c8', '#1585a0'],
  RAVO: ['#7fd8f0', '#3aa0c8'],
  RAHU: ['#6a6a78', '#16161e'],
  RAHO: ['#f0f4ff', '#9fb2d8'],
  MOVU: ['#ffd166', '#d88a1e'],
  MOVO: ['#ffb6c9', '#e07a97'],
  MOHU: ['#dfe8ff', '#8fa3d8'],
  MOHO: ['#fff2e0', '#d8c2a8'],
  MAVU: ['#cdb4f5', '#7ad0c0'],
  MAVO: ['#b6e35a', '#6a9a1e'],
  MAHU: ['#3a6cff', '#122a8e'],
  MAHO: ['#a08a78', '#4a3a30'],
}
