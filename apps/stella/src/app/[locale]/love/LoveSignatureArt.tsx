'use client'

import { useTranslations } from 'next-intl'

import { PLANET_GLYPHS } from '@/chart/data'
import AstroGlyph from '@/components/AstroGlyph'
import { SignFigure } from '@/components/SignFigure'

import type { LoveProfile } from './compute'

type LoveSignatureArtProps = {
  profile: LoveProfile
}

/** Venus and Mars lead the signature; Rising and Moon add its outward and inward texture. */
export function LoveSignatureArt({ profile }: LoveSignatureArtProps) {
  const tc = useTranslations('Constellation')

  return (
    <div aria-hidden className="mt-3 overflow-hidden rounded-xl border border-accent/10 bg-surface">
      <div className="grid grid-cols-[1fr_3.5rem_1fr] items-center px-3 py-3">
        <div className="min-w-0 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
            <AstroGlyph className="mr-1" glyph={PLANET_GLYPHS.venus} />
            {tc('planets.venus')}
          </p>
          <SignFigure className="mx-auto mt-1 h-16 w-16" sign={profile.venusSign} />
          <p className="mt-0.5 text-xs font-semibold text-foreground-secondary">{tc(`signs.${profile.venusSign}`)}</p>
        </div>

        <svg aria-hidden className="h-14 w-full overflow-visible" viewBox="0 0 56 56">
          <path
            d="M2 28c11-13 20-13 26 0 6 13 15 13 26 0"
            fill="none"
            stroke="var(--color-accent)"
            strokeDasharray="2 4"
            strokeLinecap="round"
            strokeOpacity={0.6}
            strokeWidth={1.4}
          />
          {/* Keep the heart on the orbit's origin so it stays centered at every rendered size. */}
          <g transform="translate(28 28)">
            <path
              d="M0 6.5C-1.1 5.5-6.2 1.7-6.2-2.1-6.2-4.3-4.5-6-2.3-6-1.35-6-.55-5.6 0-5 .55-5.6 1.35-6 2.3-6 4.5-6 6.2-4.3 6.2-2.1 6.2 1.7 1.1 5.5 0 6.5Z"
              fill="var(--color-accent)"
            />
          </g>
        </svg>

        <div className="min-w-0 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
            <AstroGlyph className="mr-1" glyph={PLANET_GLYPHS.mars} />
            {tc('planets.mars')}
          </p>
          <SignFigure className="mx-auto mt-1 h-16 w-16" sign={profile.marsSign} />
          <p className="mt-0.5 text-xs font-semibold text-foreground-secondary">{tc(`signs.${profile.marsSign}`)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 border-t border-border-2">
        <div className="flex min-w-0 items-center justify-center gap-2 px-3 py-2.5">
          {profile.risingSign ? (
            <SignFigure className="h-10 w-10 shrink-0" sign={profile.risingSign} />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-foreground-faint/50 text-foreground-faint">
              ?
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-foreground-faint">
              Asc · {tc('big3.risingLabel')}
            </p>
            <p className="mt-0.5 text-[10px] font-medium leading-tight text-foreground-subtle">
              {profile.risingSign ? tc(`signs.${profile.risingSign}`) : tc('form.risingUnknown')}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-2 border-l border-border-2 px-3 py-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
            {profile.moonSigns.map((sign) => (
              <SignFigure
                className={profile.moonSigns.length > 1 ? '-mx-1 h-9 w-9' : 'h-10 w-10'}
                key={sign}
                sign={sign}
              />
            ))}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-foreground-faint">
              <AstroGlyph className="mr-1" glyph={PLANET_GLYPHS.moon} />
              {tc('big3.moonLabel')}
            </p>
            <p className="mt-0.5 text-[10px] font-medium leading-tight text-foreground-subtle">
              {profile.moonSigns.map((sign) => tc(`signs.${sign}`)).join(' ↔ ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
