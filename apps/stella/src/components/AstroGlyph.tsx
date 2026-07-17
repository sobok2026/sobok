import { twMerge } from 'tailwind-merge'

import { ASTROLOGY_GLYPH_UNITS_PER_EM, getAstrologyGlyphPath } from '@/chart/astrology-glyph-paths'

type AstroGlyphProps = {
  className?: string
  glyph: string
}

/** Inline astrology glyph drawn from its vector outline so every platform renders the same shape. */
export default function AstroGlyph({ className, glyph }: AstroGlyphProps) {
  const half = ASTROLOGY_GLYPH_UNITS_PER_EM / 2

  return (
    <svg
      aria-hidden
      className={twMerge('inline-block align-[-0.125em]', className)}
      fill="currentColor"
      height="1em"
      viewBox={`${-half} ${-half} ${ASTROLOGY_GLYPH_UNITS_PER_EM} ${ASTROLOGY_GLYPH_UNITS_PER_EM}`}
      width="1em"
    >
      <path d={getAstrologyGlyphPath(glyph)} />
    </svg>
  )
}
