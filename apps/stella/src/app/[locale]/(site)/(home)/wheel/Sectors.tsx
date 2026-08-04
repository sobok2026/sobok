// biome-ignore-all lint/a11y/useSemanticElements: SVG has no native button element; each interactive shape implements the complete button keyboard contract below.
import { useTranslations } from 'next-intl'

import type { SignId } from '@/chart/types'

import styles from '../constellation.module.css'
import type { Selection } from '../selection'
import type { WheelControlId } from './control'
import VectorGlyph from './VectorGlyph'
import { WHEEL_STYLE, type WheelSign } from './wheel-scene'

interface SectorsProps {
  interactive: boolean
  onSelect: (id: SignId) => void
  selection: Selection
  signs: readonly WheelSign[]
  tabStop: WheelControlId
}

export default function Sectors({ interactive, onSelect, selection, signs, tabStop }: SectorsProps) {
  const t = useTranslations('Constellation')

  return (
    <g>
      {signs.map((sign) => {
        const active = selection?.kind === 'sign' && selection.id === sign.id
        const id: WheelControlId = `sign:${sign.id}`

        return (
          <g
            aria-label={t(`signs.${sign.id}`)}
            aria-pressed={active}
            className={`${styles.wheelButton} cursor-pointer`}
            data-wheel-control={id}
            key={sign.id}
            onClick={() => onSelect(sign.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(sign.id)
              }
            }}
            role="button"
            tabIndex={interactive && tabStop === id ? 0 : -1}
          >
            <path
              className={styles.sector}
              d={sign.sectorPath}
              fill={sign.color}
              fillOpacity={active ? WHEEL_STYLE.sign.selectedFillOpacity : WHEEL_STYLE.sign.fillOpacity}
              stroke={active ? sign.color : 'transparent'}
              strokeWidth={active ? WHEEL_STYLE.sign.selectedStrokeWidth : 0}
              style={{ animationDelay: `${sign.index * 0.03}s` }}
            />
            <VectorGlyph
              className={styles.signGlyph}
              fill={sign.color}
              glyph={sign.glyph}
              size={WHEEL_STYLE.sign.glyphSize}
              style={{ animationDelay: `${0.2 + sign.index * 0.03}s` }}
              x={sign.glyphPoint.x}
              y={sign.glyphPoint.y}
            />
            <circle className={styles.focusRing} cx={sign.glyphPoint.x} cy={sign.glyphPoint.y} r={13} />
          </g>
        )
      })}
    </g>
  )
}
