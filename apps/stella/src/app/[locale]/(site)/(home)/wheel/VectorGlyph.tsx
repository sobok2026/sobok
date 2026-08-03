import type { CSSProperties } from 'react'

import { ASTROLOGY_GLYPH_UNITS_PER_EM, getAstrologyGlyphPath } from '@/chart/astrology-glyph-paths'

type VectorGlyphProps = {
  className?: string
  fill: string
  glyph: string
  pointerEvents?: 'none'
  size: number
  style?: CSSProperties
  x: number
  y: number
}

/** Render one ink-bounds-centered glyph without relying on font metrics. */
export default function VectorGlyph({ className, fill, glyph, pointerEvents, size, style, x, y }: VectorGlyphProps) {
  const scale = size / ASTROLOGY_GLYPH_UNITS_PER_EM

  return (
    <path
      className={className}
      d={getAstrologyGlyphPath(glyph)}
      fill={fill}
      pointerEvents={pointerEvents}
      style={style}
      transform={`translate(${x} ${y}) scale(${scale})`}
    />
  )
}
