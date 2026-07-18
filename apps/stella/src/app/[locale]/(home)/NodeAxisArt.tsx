'use client'

import { useTranslations } from 'next-intl'

import { PLANET_GLYPHS } from '@/chart/data'
import type { SignId } from '@/chart/types'
import AstroGlyph from '@/components/AstroGlyph'
import { SignFigure } from '@/components/SignFigure'

type NodeAxisArtProps = {
  familiarLabel: string
  growthLabel: string
  northSign: SignId
  southSign: SignId
}

type NodeEndpointProps = {
  emphasized?: boolean
  label: string
  node: 'northNode' | 'southNode'
  sign: SignId
}

function NodeEndpoint({ emphasized = false, label, node, sign }: NodeEndpointProps) {
  const t = useTranslations('Constellation')

  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <p
        className={`flex items-end justify-center text-[11px] font-semibold leading-tight ${emphasized ? 'text-accent' : 'text-foreground-subtle'}`}
      >
        {label}
      </p>
      <div className="relative mt-1 flex h-14 w-14 items-center justify-center">
        {emphasized && <span className="absolute inset-1 rounded-full bg-accent/15 blur-md" />}
        <SignFigure className={`relative h-14 w-14 ${emphasized ? '' : 'opacity-80'}`} sign={sign} />
      </div>
      <p
        className={`mt-1 text-[11px] font-semibold leading-tight ${emphasized ? 'text-accent' : 'text-foreground-subtle'}`}
      >
        <AstroGlyph className="mr-1" glyph={PLANET_GLYPHS[node]} />
        {t(`planets.${node}`)}
      </p>
      <p className="mt-0.5 text-[11px] leading-tight text-foreground-subtle">{t(`signs.${sign}`)}</p>
    </div>
  )
}

/** The South and North Nodes shown as two poles of one life axis. */
export function NodeAxisArt({ familiarLabel, growthLabel, northSign, southSign }: NodeAxisArtProps) {
  return (
    <div
      aria-hidden
      className="mt-4 grid grid-cols-[minmax(4.75rem,5.5rem)_minmax(2.5rem,1fr)_minmax(4.75rem,5.5rem)] items-center rounded-xl border border-accent/10 bg-surface px-2.5 pt-6 pb-3.5 sm:grid-cols-[6rem_minmax(3rem,1fr)_6rem] sm:px-4"
    >
      <NodeEndpoint label={familiarLabel} node="southNode" sign={southSign} />
      <div className="px-1 sm:px-2">
        <div className="h-0.5 w-full rounded-full bg-linear-to-r from-foreground-subtle/60 via-accent/65 to-accent/80 forced-colors:bg-[CanvasText]" />
      </div>
      <NodeEndpoint emphasized label={growthLabel} node="northNode" sign={northSign} />
    </div>
  )
}
