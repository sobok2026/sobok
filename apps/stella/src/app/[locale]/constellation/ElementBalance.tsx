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

/** Column-major pairing of the four elements into the 2×2 grid's left and right columns. */
const COLUMN_GROUPS: readonly (readonly ElementId[])[] = [
  ['fire', 'air'],
  ['earth', 'water'],
]

/**
 * One segmented bar splits the whole chart across the four elements, so the mix reads as a
 * single balance rather than four independent ratings. The rows beneath carry each element's
 * share — an absent element still shows there as 0.0% even though it contributes no segment.
 */
export default function ElementBalance({ counts, dominant, total }: ElementBalanceProps) {
  const t = useTranslations('Constellation')

  const descriptions: Record<string, string> = {
    fire: t('elements.fireDesc'),
    earth: t('elements.earthDesc'),
    air: t('elements.airDesc'),
    water: t('elements.waterDesc'),
  }

  return (
    <section className="p-4 rounded-2xl border bg-surface sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">{t('elements.title')}</h2>
        <span className="text-xs text-foreground-subtle">
          {t('elements.dominant', { element: t(`elements.${dominant}`) })}
        </span>
      </div>

      <div aria-hidden="true" className="mb-4 flex h-2.5 overflow-hidden rounded-full bg-surface-2">
        <div className={`${styles.balanceBar} flex h-full w-full`}>
          {ELEMENT_IDS.map((id) => {
            const pct = total > 0 ? (counts[id] / total) * 100 : 0

            if (pct === 0) {
              return null
            }

            return <div key={id} style={{ background: ELEMENT_COLORS[id], width: `${pct}%` }} />
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 items-start gap-x-4 sm:gap-x-5">
        {COLUMN_GROUPS.map((group) => (
          <div key={group[0]} className="grid grid-cols-[auto_1fr_auto] gap-x-2 gap-y-2">
            {group.map((id) => {
              const pct = total > 0 ? (counts[id] / total) * 100 : 0

              return (
                <div key={id} className="col-span-3 grid grid-cols-subgrid items-baseline">
                  <span className="text-xs font-semibold" style={{ color: ELEMENT_COLORS[id] }}>
                    {t(`elements.${id}`)}
                  </span>
                  <span className="text-[10px] text-foreground-faint">{descriptions[id]}</span>
                  <span className="text-right text-xs tabular-nums text-foreground-subtle">{pct.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}
