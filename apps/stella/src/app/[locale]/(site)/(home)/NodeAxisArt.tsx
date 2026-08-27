'use client'

import { useTranslations } from 'next-intl'

import { PLANET_GLYPHS } from '@/chart/data'
import type { SignId } from '@/chart/types'
import AstroGlyph from '@/components/AstroGlyph'
import { SignFigure } from '@/components/SignFigure'

import styles from './constellation.module.css'

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
        className={`flex items-end justify-center text-xs font-semibold leading-tight ${emphasized ? 'text-accent' : 'text-foreground-subtle'}`}
      >
        {label}
      </p>
      <div className="relative mt-1 flex h-14 w-14 items-center justify-center">
        {emphasized && <span className="absolute inset-1 rounded-full bg-accent/15 blur-md" />}
        <SignFigure className={`relative h-14 w-14 ${emphasized ? '' : 'opacity-80'}`} sign={sign} />
      </div>
      <p
        className={`mt-1 text-xs font-semibold leading-tight ${emphasized ? 'text-accent' : 'text-foreground-subtle'}`}
      >
        <AstroGlyph className="mr-1" glyph={PLANET_GLYPHS[node]} />
        {t(`planets.${node}`)}
      </p>
      <p className="mt-0.5 text-xs leading-tight text-foreground-subtle">{t(`signs.${sign}`)}</p>
    </div>
  )
}

/** A visual overview of the South-to-North Node life axis. */
export function NodeAxisArt({ familiarLabel, growthLabel, northSign, southSign }: NodeAxisArtProps) {
  return (
    <div
      aria-hidden
      className="mt-3 grid grid-cols-[minmax(4.75rem,5.5rem)_minmax(2.5rem,1fr)_minmax(4.75rem,5.5rem)] items-center rounded-xl border border-accent/10 bg-surface px-2.5 pt-6 pb-3.5 sm:grid-cols-[6rem_minmax(3rem,1fr)_6rem] sm:px-4"
    >
      <NodeEndpoint label={familiarLabel} node="southNode" sign={southSign} />
      <div className="flex items-center px-1 sm:px-2">
        <div
          className={`${styles.nodeAxisTrack} h-0.5 min-w-0 flex-1 rounded-full bg-linear-to-r from-foreground-subtle/60 via-accent/65 to-accent/80 forced-colors:bg-[CanvasText]`}
        />
        <svg
          className="-ml-px h-3 w-2.5 shrink-0 text-accent/80 forced-colors:text-[CanvasText]"
          focusable="false"
          viewBox="0 0 10 12"
        >
          <path
            d="M0 6h8M4 2l4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <NodeEndpoint emphasized label={growthLabel} node="northNode" sign={northSign} />
    </div>
  )
}
