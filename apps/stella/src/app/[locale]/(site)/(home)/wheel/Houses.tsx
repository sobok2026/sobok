// biome-ignore-all lint/a11y/useSemanticElements: SVG has no native button element; each interactive shape implements the complete button keyboard contract below.
import { useTranslations } from 'next-intl'

import type { AngleId, HouseNumber } from '@/chart/types'

import styles from '../constellation.module.css'
import type { Selection } from '../selection'
import type { WheelControlId } from './control'
import { WHEEL_STYLE, type WheelAngle, type WheelHouse } from './wheel-scene'

interface HousesProps {
  angles: readonly WheelAngle[]
  houses: readonly WheelHouse[]
  onSelect: (n: HouseNumber) => void
  onSelectAngle: (id: AngleId) => void
  selection: Selection
  tabStop: WheelControlId
}

export default function Houses({ angles, houses, onSelect, onSelectAngle, selection, tabStop }: HousesProps) {
  const t = useTranslations('Constellation')

  return (
    <g className={`${styles.house} [animation-delay:0.15s]`}>
      {houses.map((house) => {
        const active = selection?.kind === 'house' && selection.n === house.n
        const id: WheelControlId = `house:${house.n}`

        return (
          <g key={house.n}>
            <line
              stroke={house.cuspStroke}
              strokeWidth={house.cuspStrokeWidth}
              x1={house.cuspFrom.x}
              x2={house.cuspTo.x}
              y1={house.cuspFrom.y}
              y2={house.cuspTo.y}
            />
            <g
              aria-label={`${t('panel.house', { n: house.n })} · ${t(`houseThemes.${house.n}`)}`}
              aria-pressed={active}
              className={`${styles.wheelButton} cursor-pointer`}
              data-wheel-control={id}
              onClick={() => onSelect(house.n)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(house.n)
                }
              }}
              role="button"
              tabIndex={tabStop === id ? 0 : -1}
            >
              {/* Houses carry a neutral (white-alpha) identity, so selection reads as a
                  brighter version of their own colour — matching the sign/planet idiom.
                  Brand pink stays reserved for the ASC/MC axes and labels below. */}
              <path
                d={house.sectorPath}
                fill={WHEEL_STYLE.house.fill}
                fillOpacity={active ? WHEEL_STYLE.house.selectedFillOpacity : WHEEL_STYLE.house.fillOpacity}
                stroke={active ? WHEEL_STYLE.house.selectedStroke : 'transparent'}
                strokeWidth={active ? WHEEL_STYLE.house.selectedStrokeWidth : 0}
              />
              <text
                dominantBaseline="central"
                fill={active ? WHEEL_STYLE.house.selectedLabelFill : WHEEL_STYLE.house.labelFill}
                fontSize={WHEEL_STYLE.house.labelFontSize}
                textAnchor="middle"
                x={house.labelPoint.x}
                y={house.labelPoint.y}
              >
                {t(`houseThemes.${house.n}`)}
              </text>
              <circle className={styles.focusRing} cx={house.labelPoint.x} cy={house.labelPoint.y} r={11} />
            </g>
          </g>
        )
      })}
      {angles.map((angle) => {
        const active = selection?.kind === 'angle' && selection.id === angle.id
        const id: WheelControlId = `angle:${angle.id}`

        return (
          <g
            aria-label={t(`angleNames.${angle.id}`)}
            aria-pressed={active}
            className={`${styles.wheelButton} cursor-pointer`}
            data-wheel-control={id}
            key={angle.id}
            onClick={() => onSelectAngle(angle.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectAngle(angle.id)
              }
            }}
            role="button"
            tabIndex={tabStop === id ? 0 : -1}
          >
            <text
              dominantBaseline="central"
              fill={active ? WHEEL_STYLE.angle.selectedFill : angle.fill}
              fontSize={angle.fontSize}
              fontWeight={active ? WHEEL_STYLE.angle.primaryFontWeight : angle.fontWeight}
              textAnchor="middle"
              x={angle.point.x}
              y={angle.point.y}
            >
              {angle.id.toUpperCase()}
            </text>
            {active && (
              <line
                stroke={WHEEL_STYLE.angle.selectedFill}
                strokeWidth={WHEEL_STYLE.angle.selectedUnderlineWidth}
                x1={angle.point.x - 7}
                x2={angle.point.x + 7}
                y1={angle.point.y + 6}
                y2={angle.point.y + 6}
              />
            )}
            <path d={angle.hitPath} fill="transparent" />
            <circle className={styles.focusRing} cx={angle.point.x} cy={angle.point.y} r={10} />
          </g>
        )
      })}
    </g>
  )
}
