import type { PointerEventHandler, PointerEvent as ReactPointerEvent } from 'react'
import type { Unit } from './game-model'
import { KIND_META, SPECIALIZATIONS, TIER_LABELS } from './game-model'

const LANES = [0, 1, 2] as const

type CampRosterGridProps = {
  slots: readonly (Unit | null)[]
  selectedUnitId: string | null
  draggingUnitId: string | null
  tutorialMerge: boolean
  getSurvivorName: (unit: Unit) => string
  getUnitPower: (unit: Unit) => number
  onRosterTap: (unitId: string) => void
  onEmptySlot: (slot: number) => void
  onUnitPointerDown: (event: ReactPointerEvent<HTMLButtonElement>, unitId: string) => void
  onUnitPointerMove: PointerEventHandler<HTMLButtonElement>
  onUnitPointerUp: PointerEventHandler<HTMLButtonElement>
  onUnitPointerCancel: PointerEventHandler<HTMLButtonElement>
}

export function CampRosterGrid({
  slots,
  selectedUnitId,
  draggingUnitId,
  tutorialMerge,
  getSurvivorName,
  getUnitPower,
  onRosterTap,
  onEmptySlot,
  onUnitPointerDown,
  onUnitPointerMove,
  onUnitPointerUp,
  onUnitPointerCancel,
}: CampRosterGridProps) {
  return (
    <div className="roster-grid" data-tutorial-highlight={tutorialMerge ? 'true' : 'false'}>
      {slots.map((unit, index) => (
        <div className="roster-slot" data-roster-slot={index} key={`slot-${index}`}>
          {unit ? (
            <button
              className={`unit-card kind-${unit.kind} ${selectedUnitId === unit.id ? 'is-selected' : ''} ${draggingUnitId === unit.id ? 'is-dragging' : ''}`}
              type="button"
              aria-label={`${getSurvivorName(unit)} ${KIND_META[unit.kind].name} ${TIER_LABELS[unit.tier]} 등급${unit.specialization ? `, ${SPECIALIZATIONS[unit.specialization].name}` : ''}, 전투력 ${getUnitPower(unit)}`}
              onClick={(event) => {
                if (event.detail === 0) onRosterTap(unit.id)
              }}
              onPointerDown={(event) => onUnitPointerDown(event, unit.id)}
              onPointerMove={onUnitPointerMove}
              onPointerUp={onUnitPointerUp}
              onPointerCancel={onUnitPointerCancel}
              onLostPointerCapture={onUnitPointerCancel}
            >
              <span className="unit-card-top">
                <small>{KIND_META[unit.kind].role}</small>
                <b>{TIER_LABELS[unit.tier]}</b>
              </span>
              <span className="unit-portrait" aria-hidden="true">
                <i className="portrait-glow" />
                <i className="portrait-head" />
                <i className="portrait-body" />
                <strong>{KIND_META[unit.kind].glyph}</strong>
              </span>
              <span className="unit-card-bottom">
                <strong>{getSurvivorName(unit)}</strong>
                <small>
                  {unit.specialization ? SPECIALIZATIONS[unit.specialization].name : KIND_META[unit.kind].name} · 전투력{' '}
                  {getUnitPower(unit)}
                </small>
              </span>
              <span className="selection-ring" aria-hidden="true" />
            </button>
          ) : (
            <button
              className="empty-roster-slot"
              type="button"
              aria-label={`빈 대기소 ${index + 1}`}
              onClick={() => onEmptySlot(index)}
            >
              <span>+</span>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

type SelectedUnitReadoutProps = {
  selectedUnit: Unit | null
  selectedUnitLane: number | null
  rosterCount: number
  getSurvivorName: (unit: Unit) => string
  onQuickDeploy: (lane: number) => void
}

export function SelectedUnitReadout({
  selectedUnit,
  selectedUnitLane,
  rosterCount,
  getSurvivorName,
  onQuickDeploy,
}: SelectedUnitReadoutProps) {
  return (
    <div
      className="selected-readout"
      data-active={selectedUnit ? 'true' : 'false'}
      data-merge-locked={rosterCount <= 3 ? 'true' : 'false'}
    >
      {selectedUnit ? (
        <>
          <span className={`selected-glyph kind-${selectedUnit.kind}`}>{KIND_META[selectedUnit.kind].glyph}</span>
          <div>
            <small>선택됨</small>
            <strong>
              {getSurvivorName(selectedUnit)} · {KIND_META[selectedUnit.kind].name} · {TIER_LABELS[selectedUnit.tier]}{' '}
              등급
            </strong>
          </div>
          <nav className="mobile-quick-deploy" aria-label={`${getSurvivorName(selectedUnit)} 즉시 전선 배치`}>
            <span>배치</span>
            {LANES.map((lane) => (
              <button
                type="button"
                onClick={() => onQuickDeploy(lane)}
                aria-label={`${getSurvivorName(selectedUnit)}을 ${lane + 1}전선에 배치`}
                aria-pressed={selectedUnitLane === lane}
                data-current={selectedUnitLane === lane ? 'true' : 'false'}
                key={`quick-deploy-${lane}`}
              >
                0{lane + 1}
              </button>
            ))}
          </nav>
          <span>
            {rosterCount <= 3
              ? '세 전선 유지 · 합성 잠김'
              : selectedUnit.specialization
                ? `${SPECIALIZATIONS[selectedUnit.specialization].glyph} ${SPECIALIZATIONS[selectedUnit.specialization].name}`
                : KIND_META[selectedUnit.kind].advantageCopy}
          </span>
        </>
      ) : (
        <p>생존자를 누르거나 끌어서 합치고 배치하세요.</p>
      )}
    </div>
  )
}
