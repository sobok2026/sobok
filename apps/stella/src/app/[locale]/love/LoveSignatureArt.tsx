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
          <circle
            cx="28"
            cy="28"
            fill="var(--color-surface-2)"
            r="9"
            stroke="var(--color-accent)"
            strokeOpacity={0.35}
          />
          <path
            d="M28 34.5c-1.1-1-6.2-4.8-6.2-8.6 0-2.2 1.7-3.9 3.9-3.9 1.2 0 2.2.5 2.9 1.4.7-.9 1.8-1.4 2.9-1.4 2.2 0 3.9 1.7 3.9 3.9 0 3.8-5.1 7.6-6.2 8.6a.9.9 0 0 1-1.2 0Z"
            fill="var(--color-accent)"
          />
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
        <div className="flex min-w-0 items-center gap-2 px-3 py-2.5">
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

        <div className="flex min-w-0 items-center gap-2 border-l border-border-2 px-3 py-2.5">
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
