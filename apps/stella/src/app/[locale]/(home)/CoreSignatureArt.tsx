'use client'

import { useTranslations } from 'next-intl'

import { PLANET_GLYPHS } from '@/chart/data'
import type { SignId } from '@/chart/types'
import { SignFigure } from '@/components/SignFigure'

type CoreSignatureArtProps = {
  moonSigns: readonly SignId[]
  risingSign: SignId | null
  sunSign: SignId
}

/** A compact visual index for the Sun, Moon and Rising readings that follow. */
export function CoreSignatureArt({ moonSigns, risingSign, sunSign }: CoreSignatureArtProps) {
  const t = useTranslations('Constellation')

  const items = [
    { glyph: PLANET_GLYPHS.sun, id: 'sun', label: t('big3.sunLabel'), signs: [sunSign] },
    { glyph: PLANET_GLYPHS.moon, id: 'moon', label: t('big3.moonLabel'), signs: moonSigns },
    { glyph: 'Asc', id: 'rising', label: t('big3.risingLabel'), signs: risingSign ? [risingSign] : [] },
  ] as const

  return (
    <div
      aria-hidden
      className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl border-accent/10 sm:border sm:bg-surface sm:p-2 sm:gap-2"
    >
      {items.map((item) => (
        <div className="flex min-w-0 flex-col rounded-lg bg-surface-2 px-1.5 py-2 text-center" key={item.id}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
            <span className="mr-1 normal-case tracking-normal">{item.glyph}</span>
            {item.label}
          </p>
          <div className="mx-auto mt-1 flex h-16 items-center justify-center">
            {item.signs.length === 0 ? (
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-foreground-faint/50 text-lg text-foreground-faint">
                ?
              </span>
            ) : (
              item.signs.map((sign) => (
                <SignFigure
                  className={item.signs.length > 1 ? '-mx-1 h-11 w-11' : 'h-16 w-16'}
                  key={sign}
                  sign={sign}
                />
              ))
            )}
          </div>
          <p className="mt-auto pt-0.5 text-[10px] leading-tight text-foreground-subtle">
            {item.signs.length > 0 ? item.signs.map((sign) => t(`signs.${sign}`)).join(' ↔ ') : t('form.risingUnknown')}
          </p>
        </div>
      ))}
    </div>
  )
}
