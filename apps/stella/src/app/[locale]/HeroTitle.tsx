import type { ReactNode } from 'react'

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
      className={`mx-auto mt-2 w-fit max-w-full bg-linear-to-r bg-size-[24rem_100%] bg-center bg-no-repeat bg-clip-text text-balance text-3xl font-extrabold text-transparent forced-colors:bg-none forced-colors:text-[CanvasText] ${TONE_CLASSES[tone]}`}
    >
      {children}
    </h1>
  )
}
