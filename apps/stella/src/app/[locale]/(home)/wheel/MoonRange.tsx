// biome-ignore-all lint/a11y/useSemanticElements: SVG has no native button element; each interactive shape implements the complete button keyboard contract below.
import { useTranslations } from 'next-intl'

import styles from '../constellation.module.css'
import type { WheelControlId } from './control'
import VectorGlyph from './VectorGlyph'
import { WHEEL_STYLE, type WheelMoonRange } from './wheel-scene'

interface MoonRangeProps {
  isDimmed: boolean
  onSelect: () => void
  range: WheelMoonRange
  selected: boolean
  tabStop: WheelControlId
}

/** Date-only Moon: a full-day longitude band, never a falsely exact token. */
export default function MoonRange({ isDimmed, onSelect, range, selected, tabStop }: MoonRangeProps) {
  const t = useTranslations('Constellation')
  const opacity = isDimmed ? 0.3 : 1
  const id: WheelControlId = 'planet:moon'

  const label =
    range.startSign === range.endSign
      ? t('a11y.moonRangeWithin', { sign: t(`signs.${range.startSign}`) })
      : t('a11y.moonRange', {
          from: t(`signs.${range.startSign}`),
          to: t(`signs.${range.endSign}`),
        })

  return (
    <g
      aria-label={label}
      aria-pressed={selected}
      className={`${styles.wheelButton} ${styles.fade} cursor-pointer`}
      data-wheel-control={id}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      role="button"
      style={{ opacity }}
      tabIndex={tabStop === id ? 0 : -1}
    >
      {range.segments.map((segment) => (
        <path
          d={segment.sectorPath}
          fill={segment.color}
          fillOpacity={selected ? WHEEL_STYLE.moonRange.selectedFillOpacity : WHEEL_STYLE.moonRange.fillOpacity}
          key={segment.key}
        />
      ))}
      <line
        opacity={WHEEL_STYLE.moonRange.endpointOpacity}
        stroke={range.startTick.color}
        strokeLinecap="round"
        strokeWidth={WHEEL_STYLE.moonRange.endpointStrokeWidth}
        x1={range.startTick.inner.x}
        x2={range.startTick.outer.x}
        y1={range.startTick.inner.y}
        y2={range.startTick.outer.y}
      />
      <line
        opacity={WHEEL_STYLE.moonRange.endpointOpacity}
        stroke={range.endTick.color}
        strokeLinecap="round"
        strokeWidth={WHEEL_STYLE.moonRange.endpointStrokeWidth}
        x1={range.endTick.inner.x}
        x2={range.endTick.outer.x}
        y1={range.endTick.inner.y}
        y2={range.endTick.outer.y}
      />
      <circle cx={range.glyphPoint.x} cy={range.glyphPoint.y} fill="var(--color-background)" opacity={0.82} r={7} />
      <VectorGlyph
        fill={range.glyphColor}
        glyph={range.glyph}
        pointerEvents="none"
        size={WHEEL_STYLE.moonRange.glyphSize}
        x={range.glyphPoint.x}
        y={range.glyphPoint.y}
      />
      <path d={range.hitPath} fill="transparent" />
      <circle className={styles.focusRing} cx={range.glyphPoint.x} cy={range.glyphPoint.y} r={12} />
    </g>
  )
}
