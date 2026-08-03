// biome-ignore-all lint/a11y/useSemanticElements: SVG has no native toolbar element; the root svg owns the roving-tabindex keyboard contract below.
'use client'

import { useTranslations } from 'next-intl'
import { type FocusEvent, type KeyboardEvent, type PointerEvent, useId, useState } from 'react'

import type { AngleId, ChartAspect, HouseNumber, NatalChart, PlanetId, SignId } from '@/chart/types'

import styles from '../constellation.module.css'
import type { Selection } from '../selection'
import Aspects from './Aspects'
import { INITIAL_WHEEL_CONTROL, WHEEL_CONTROL_SELECTOR, type WheelControlId } from './control'
import Houses from './Houses'
import MoonRange from './MoonRange'
import Planets from './Planets'
import Rings from './Rings'
import Sectors from './Sectors'
import { buildWheelScene } from './wheel-scene'

export interface ChartWheelProps {
  aspects: readonly ChartAspect[]
  chart: NatalChart
  isAspectDimmed: (asp: ChartAspect) => boolean
  isPlanetDimmed: (id: string) => boolean
  moonLongitudeRange: readonly [start: number, end: number] | null
  onSelectAngle: (id: AngleId) => void
  onSelectHouse: (n: HouseNumber) => void
  onSelectPlanet: (id: PlanetId) => void
  onSelectSign: (id: SignId) => void
  revealed: boolean
  selection: Selection
}

/**
 * The natal wheel SVG: zodiac ring, house sectors, aspect lines and planet
 * tokens. Key this component per chart run so the reveal animations restart.
 */
export default function ChartWheel({
  aspects,
  chart,
  isAspectDimmed,
  isPlanetDimmed,
  moonLongitudeRange,
  onSelectAngle,
  onSelectHouse,
  onSelectPlanet,
  onSelectSign,
  revealed,
  selection,
}: ChartWheelProps) {
  const t = useTranslations('Constellation')
  const scene = buildWheelScene(chart, aspects, { moonLongitudeRange })
  const instructionsId = useId()
  const [tabStop, setTabStop] = useState<WheelControlId>(INITIAL_WHEEL_CONTROL)

  const availableControls: WheelControlId[] = [
    ...scene.signs.map(({ id }) => `sign:${id}` as const),
    ...scene.houses.map(({ n }) => `house:${n}` as const),
    ...scene.angles.map(({ id }) => `angle:${id}` as const),
    ...(scene.moonRange ? (['planet:moon'] as const) : []),
    ...scene.planets.map(({ planet }) => `planet:${planet.id}` as const),
  ]

  const resolvedTabStop = availableControls.includes(tabStop) ? tabStop : INITIAL_WHEEL_CONTROL

  function controlFromTarget(target: EventTarget | null): SVGElement | null {
    return target instanceof Element ? target.closest<SVGElement>(WHEEL_CONTROL_SELECTOR) : null
  }

  function controlId(element: SVGElement | null): WheelControlId | null {
    return (element?.dataset.wheelControl as WheelControlId | undefined) ?? null
  }

  function syncTabStop(target: EventTarget | null) {
    const id = controlId(controlFromTarget(target))

    if (id) {
      setTabStop(id)
    }
  }

  function handleFocus(event: FocusEvent<SVGSVGElement>) {
    syncTabStop(event.target)
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    syncTabStop(event.target)
  }

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return
    }

    const current = controlFromTarget(event.target)

    if (!current) {
      return
    }

    const controls = Array.from(event.currentTarget.querySelectorAll<SVGElement>(WHEEL_CONTROL_SELECTOR))
    const currentIndex = controls.indexOf(current)

    if (currentIndex < 0 || controls.length === 0) {
      return
    }

    let nextIndex: number

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + controls.length) % controls.length
        break
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % controls.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = controls.length - 1
        break
      default:
        return
    }

    event.preventDefault()

    const next = controls[nextIndex]
    const nextId = controlId(next)

    if (nextId) {
      setTabStop(nextId)
      next.focus()
    }
  }

  return (
    <svg
      aria-hidden={!revealed}
      aria-describedby={instructionsId}
      aria-label={t('a11y.wheelLabel')}
      className={`w-full select-none transition-opacity duration-400 ${revealed ? styles.wheel : 'pointer-events-none'}`}
      onFocusCapture={handleFocus}
      onKeyDown={handleKeyDown}
      onPointerDownCapture={handlePointerDown}
      role="toolbar"
      style={{ opacity: revealed ? 1 : 0.4 }}
      viewBox={scene.viewBox}
    >
      <desc id={instructionsId}>{t('a11y.wheelInstructions')}</desc>
      <Rings rings={scene.rings} />
      <Sectors
        interactive={revealed}
        onSelect={onSelectSign}
        selection={selection}
        signs={scene.signs}
        tabStop={resolvedTabStop}
      />
      {revealed && scene.houses.length > 0 && (
        <Houses
          angles={scene.angles}
          houses={scene.houses}
          onSelect={onSelectHouse}
          onSelectAngle={onSelectAngle}
          selection={selection}
          tabStop={resolvedTabStop}
        />
      )}
      {revealed && (
        <>
          <Aspects
            aspects={scene.aspects}
            isDimmed={isAspectDimmed}
            pointById={scene.pointById}
            selection={selection}
          />
          {scene.moonRange && (
            <MoonRange
              isDimmed={isPlanetDimmed('moon')}
              onSelect={() => onSelectPlanet('moon')}
              range={scene.moonRange}
              selected={selection?.kind === 'planet' && selection.id === 'moon'}
              tabStop={resolvedTabStop}
            />
          )}
          <Planets
            isDimmed={isPlanetDimmed}
            onSelect={onSelectPlanet}
            planets={scene.planets}
            selection={selection}
            tabStop={resolvedTabStop}
          />
        </>
      )}
    </svg>
  )
}
