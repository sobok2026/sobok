'use client'

import { useTranslations } from 'next-intl'

import { PLANET_GLYPHS } from '@/chart/data'
import type { SignId } from '@/chart/types'
import AstroGlyph from '@/components/AstroGlyph'
import { SignFigure } from '@/components/SignFigure'

type NodeAxisArtProps = {
  northSign: SignId
  southSign: SignId
}

/** The familiar South Node pattern opening toward the North Node direction. */
export function NodeAxisArt({ northSign, southSign }: NodeAxisArtProps) {
  const t = useTranslations('Constellation')

  return (
    <div
      aria-hidden
      className="mt-4 grid grid-cols-[5rem_1fr_5rem] items-center rounded-xl border border-accent/10 bg-surface px-2 py-3 sm:grid-cols-[6rem_1fr_6rem]"
    >
      <div className="text-center">
        <SignFigure className="mx-auto h-14 w-14" sign={southSign} />
        <p className="mt-1 text-[10px] font-semibold text-foreground-subtle">
          <AstroGlyph className="mr-1" glyph={PLANET_GLYPHS.southNode} />
          {t('planets.southNode')}
        </p>
        <p className="text-[10px] text-foreground-faint">{t(`signs.${southSign}`)}</p>
      </div>

      <svg aria-hidden className="h-10 w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 30">
        <path
          d="M2 15H96"
          fill="none"
          stroke="var(--color-accent)"
          strokeDasharray="2 4"
          strokeLinecap="round"
          strokeOpacity={0.55}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="m88 7 10 8-10 8"
          fill="none"
          stroke="var(--color-accent)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
        <circle cx="50" cy="15" fill="var(--color-surface-2)" r="6" />
        <path d="M50 10.5 51 14l3.5 1-3.5 1-1 3.5-1-3.5-3.5-1 3.5-1z" fill="var(--color-accent)" />
      </svg>

      <div className="text-center">
        <SignFigure className="mx-auto h-14 w-14" sign={northSign} />
        <p className="mt-1 text-[10px] font-semibold text-accent">
          <AstroGlyph className="mr-1" glyph={PLANET_GLYPHS.northNode} />
          {t('planets.northNode')}
        </p>
        <p className="text-[10px] text-foreground-subtle">{t(`signs.${northSign}`)}</p>
      </div>
    </div>
  )
}
