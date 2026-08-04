// biome-ignore-all lint/a11y/useSemanticElements: SVG has no native button element; each interactive shape implements the complete button keyboard contract below.
import { useTranslations } from 'next-intl'

import type { PlanetId } from '@/chart/types'

import styles from '../constellation.module.css'
import type { Selection } from '../selection'
import type { WheelControlId } from './control'
import { TOKEN } from './geometry'
import VectorGlyph from './VectorGlyph'
import { WHEEL_STYLE, type WheelPlanet } from './wheel-scene'

// Animation timing (seconds).
const PLANET_BASE = 0.15
const PLANET_STAGGER = 0.09

interface PlanetsProps {
  isDimmed: (id: string) => boolean
  onSelect: (id: PlanetId) => void
  planets: readonly WheelPlanet[]
  selection: Selection
  tabStop: WheelControlId
}

export default function Planets({ isDimmed, onSelect, planets, selection, tabStop }: PlanetsProps) {
  const t = useTranslations('Constellation')

  return (
    <g>
      {/* True-longitude ticks (+ leader lines for nudged glyphs) drawn under the tokens. */}
      {planets.map(({ color, planet, tick, connector }) => {
        const dim = isDimmed(planet.id)
        const isDirectlySelected = selection?.kind === 'planet' && selection.id === planet.id

        return (
          <g className={styles.fade} key={`mark-${planet.id}`} style={{ opacity: dim ? 0.3 : 1 }}>
            {connector && (
              <line
                opacity={
                  isDirectlySelected ? WHEEL_STYLE.planet.selectedConnectorOpacity : WHEEL_STYLE.planet.connectorOpacity
                }
                stroke={color}
                strokeDasharray={WHEEL_STYLE.planet.connectorDash.join(' ')}
                strokeLinecap="round"
                strokeWidth={
                  isDirectlySelected
                    ? WHEEL_STYLE.planet.selectedConnectorStrokeWidth
                    : WHEEL_STYLE.planet.connectorStrokeWidth
                }
                x1={connector.from.x}
                x2={connector.to.x}
                y1={connector.from.y}
                y2={connector.to.y}
              />
            )}
            <line
              opacity={isDirectlySelected ? WHEEL_STYLE.planet.selectedTickOpacity : WHEEL_STYLE.planet.tickOpacity}
              stroke={color}
              strokeLinecap="round"
              strokeWidth={
                isDirectlySelected ? WHEEL_STYLE.planet.selectedTickStrokeWidth : WHEEL_STYLE.planet.tickStrokeWidth
              }
              x1={tick.inner.x}
              x2={tick.outer.x}
              y1={tick.inner.y}
              y2={tick.outer.y}
            />
          </g>
        )
      })}
      {planets.map(({ color, planet, point, displaced, sign }, i) => {
        const dim = isDimmed(planet.id)
        const delay = PLANET_BASE + i * PLANET_STAGGER
        const id: WheelControlId = `planet:${planet.id}`

        // Visual involvement and the pressed toggle state are intentionally separate.
        const isAspectEndpoint =
          selection?.kind === 'aspect' && (selection.a === planet.id || selection.b === planet.id)

        const isDirectlySelected = selection?.kind === 'planet' && selection.id === planet.id
        const isEmphasized = isDirectlySelected || isAspectEndpoint

        return (
          <g className={styles.token} key={planet.id} style={{ animationDelay: `${delay}s` }}>
            <g
              className={displaced ? undefined : styles.tokenFloat}
              style={displaced ? undefined : { animationDelay: `${delay + 0.55}s` }}
            >
              <g
                aria-label={`${t(`planets.${planet.id}`)} · ${t(`signs.${sign}`)}${planet.retrograde ? ` · ${t('panel.retrograde')}` : ''}`}
                aria-pressed={isDirectlySelected}
                className={`${styles.wheelButton} ${styles.fade} cursor-pointer`}
                data-wheel-control={id}
                onClick={() => onSelect(planet.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(planet.id)
                  }
                }}
                role="button"
                style={{ opacity: dim ? 0.35 : 1 }}
                tabIndex={tabStop === id ? 0 : -1}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill={color}
                  opacity={WHEEL_STYLE.planet.glowOpacity}
                  pointerEvents="none"
                  r={isEmphasized ? TOKEN.glowActive : TOKEN.glow}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill="var(--color-background)"
                  pointerEvents="none"
                  r={TOKEN.disc}
                  stroke={color}
                  strokeWidth={
                    isEmphasized ? WHEEL_STYLE.planet.selectedDiscStrokeWidth : WHEEL_STYLE.planet.discStrokeWidth
                  }
                  style={isEmphasized ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
                />
                <VectorGlyph
                  fill={color}
                  glyph={planet.glyph}
                  pointerEvents="none"
                  size={WHEEL_STYLE.planet.glyphSize}
                  x={point.x}
                  y={point.y}
                />
                {planet.retrograde && (
                  <g pointerEvents="none">
                    <circle
                      cx={point.x + WHEEL_STYLE.planet.retrogradeOffset}
                      cy={point.y - WHEEL_STYLE.planet.retrogradeOffset}
                      fill="var(--color-background)"
                      r={WHEEL_STYLE.planet.retrogradeRadius}
                      stroke="var(--color-danger)"
                      strokeOpacity={WHEEL_STYLE.planet.retrogradeStrokeOpacity}
                      strokeWidth={WHEEL_STYLE.planet.retrogradeStrokeWidth}
                    />
                    <VectorGlyph
                      fill="var(--color-danger)"
                      glyph="℞"
                      size={WHEEL_STYLE.planet.retrogradeGlyphSize}
                      x={point.x + WHEEL_STYLE.planet.retrogradeOffset}
                      y={point.y - WHEEL_STYLE.planet.retrogradeOffset}
                    />
                  </g>
                )}
                {/* Sole, selection-independent hit target — kept last so it wins hit-testing
                    over the decorative glow, whose radius changes when selected. */}
                <circle cx={point.x} cy={point.y} fill="transparent" r={TOKEN.hit} />
                <circle className={styles.focusRing} cx={point.x} cy={point.y} pointerEvents="none" r={TOKEN.hit + 3} />
              </g>
            </g>
          </g>
        )
      })}
    </g>
  )
}
