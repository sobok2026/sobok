import type { ReactNode } from 'react'

import { HERO_TITLE_STYLE } from './hero-title-style'

const TONE_CLASSES = {
  brand: 'from-accent-cool via-brand to-accent-warm',
  love: 'from-accent via-brand to-love-warm',
} as const

type HeroTitleProps = {
  children: ReactNode
  tone?: keyof typeof TONE_CLASSES
}

export function HeroTitle({ children, tone = 'brand' }: HeroTitleProps) {
  return (
    <h1
      className={`mx-auto mt-2 w-fit max-w-full bg-linear-to-r bg-center bg-no-repeat bg-clip-text text-balance text-transparent forced-colors:bg-none forced-colors:text-[CanvasText] ${TONE_CLASSES[tone]}`}
      style={{
        // The gradient is what paints the glyphs, so a band narrower than the title
        // leaves its ends with nothing to clip and they render as blank space. Titles
        // under the band keep the designed slice; only longer ones widen it.
        backgroundSize: `max(${HERO_TITLE_STYLE.gradientWidthRem}rem, 100%) 100%`,
        fontSize: `${HERO_TITLE_STYLE.fontSizeRem}rem`,
        fontWeight: HERO_TITLE_STYLE.fontWeight,
        lineHeight: HERO_TITLE_STYLE.lineHeight,
      }}
    >
      {children}
    </h1>
  )
}
