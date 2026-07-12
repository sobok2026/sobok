'use client'

import { useTranslations } from 'next-intl'

import { ELEMENT_COLORS, ELEMENT_IDS } from '../chart/data'
import type { ElementId } from '../chart/types'
import styles from '../constellation.module.css'

export interface ElementBalanceProps {
  counts: Record<ElementId, number>
  dominant: ElementId
  total: number
}

/** Horizontal gauges showing how the bodies spread across the four elements. */
export default function ElementBalance({ counts, dominant, total }: ElementBalanceProps) {
  const t = useTranslations('Constellation')

  const descriptions: Record<string, string> = {
    fire: t('elements.fireDesc'),
    earth: t('elements.earthDesc'),
    air: t('elements.airDesc'),
    water: t('elements.waterDesc'),
  }

  return (
    <section className="sm:rounded-2xl sm:border sm:bg-surface sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">{t('elements.title')}</h2>
        <span className="text-xs text-foreground-subtle">
          {t('elements.dominant', { element: t(`elements.${dominant}`) })}
        </span>
      </div>
      <div className="space-y-2.5">
        {ELEMENT_IDS.map((id) => {
          const pct = total > 0 ? (counts[id] / total) * 100 : 0
          const color = ELEMENT_COLORS[id]

          return (
            <div className="flex items-center gap-2 sm:gap-3" key={id}>
              <span className="w-10 shrink-0 text-xs font-semibold" style={{ color }}>
                {t(`elements.${id}`)}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`${styles.gaugeFill} h-full rounded-full`}
                  style={{ background: `linear-gradient(90deg, ${color}88, ${color})`, width: `${pct}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-[10px] text-foreground-faint">{descriptions[id]}</span>
              <span className="w-4 shrink-0 text-right text-xs text-foreground-subtle">{counts[id]}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
