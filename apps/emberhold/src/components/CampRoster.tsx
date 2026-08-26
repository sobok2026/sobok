import type { PointerEventHandler, PointerEvent as ReactPointerEvent } from 'react'
import type { DeploymentForecast, Unit } from './game-model'
import { KIND_META, SPECIALIZATIONS, TIER_LABELS } from './game-model'

const LANES = [0, 1, 2] as const

export type RosterMergeReadiness = {
  partnerCount: number
  fromTier: number
  toTier: number
  powerBefore: number
  powerAfter: number
  heatGain: number
  opensPromotion: boolean
  specializationMayReset: boolean
  chainReady: boolean
}

type CampRosterGridProps = {
  slots: readonly (Unit | null)[]
  mergeReadinessByUnit: ReadonlyMap<string, RosterMergeReadiness>
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
  mergeReadinessByUnit,
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
  const comparisonUnitId = draggingUnitId ?? selectedUnitId
  const selectedUnit = slots.find((unit) => unit?.id === comparisonUnitId) ?? null
  const selectedMergeReady = selectedUnit ? mergeReadinessByUnit.has(selectedUnit.id) : false

  return (
    <div className="roster-grid" data-tutorial-highlight={tutorialMerge ? 'true' : 'false'}>
      {slots.map((unit, index) => {
        const mergeReadiness = unit ? mergeReadinessByUnit.get(unit.id) : null
        const mergeTarget = Boolean(
          unit &&
            selectedUnit &&
            unit.id !== selectedUnit.id &&
            unit.kind === selectedUnit.kind &&
            unit.tier === selectedUnit.tier &&
            selectedMergeReady,
        )
        const mergeDimmed = Boolean(
          unit && selectedUnit && selectedMergeReady && unit.id !== selectedUnit.id && !mergeTarget,
        )
        const resetsSpecialization = Boolean(
          mergeTarget &&
            unit?.tier === 3 &&
            selectedUnit?.tier === 3 &&
            unit.specialization !== selectedUnit.specialization,
        )
        const mergeStatus = mergeTarget
          ? resetsSpecialization
            ? '길 재선택'
            : unit?.tier === 2
              ? '진급 대상'
              : '합성 대상'
          : mergeReadiness
            ? mergeReadiness.opensPromotion
              ? '진급 가능'
              : '합성 가능'
            : null

        return (
          <div className="roster-slot" data-roster-slot={index} key={`slot-${index}`}>
            {unit ? (
              <button
                className={`unit-card kind-${unit.kind} ${selectedUnitId === unit.id ? 'is-selected' : ''} ${draggingUnitId === unit.id ? 'is-dragging' : ''}`}
                type="button"
                data-merge-ready={mergeReadiness ? 'true' : 'false'}
                data-merge-target={mergeTarget ? 'true' : 'false'}
                data-merge-dimmed={mergeDimmed ? 'true' : 'false'}
                aria-label={`${getSurvivorName(unit)} ${KIND_META[unit.kind].name} ${TIER_LABELS[unit.tier]} 등급${unit.specialization ? `, ${SPECIALIZATIONS[unit.specialization].name}` : ''}, 전투력 ${getUnitPower(unit)}${mergeTarget ? `, 선택한 생존자와 합성 가능${resetsSpecialization ? ', 합성 뒤 전문화 재선택' : ''}` : mergeDimmed ? ', 현재 선택과 병과 또는 등급이 달라 합성 불가' : mergeReadiness ? `, 같은 등급 합성 짝 ${mergeReadiness.partnerCount}명` : ''}`}
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
                {mergeStatus ? (
                  <span className="unit-merge-status" data-target={mergeTarget ? 'true' : 'false'}>
                    <i aria-hidden="true">↟</i>
                    {mergeStatus}
                  </span>
                ) : null}
                <span className="unit-portrait" aria-hidden="true">
                  <i className="portrait-glow" />
                  <i className="portrait-head" />
                  <i className="portrait-body" />
                  <strong>{KIND_META[unit.kind].glyph}</strong>
                </span>
                <span className="unit-card-bottom">
                  <strong>{getSurvivorName(unit)}</strong>
                  <small>
                    {unit.specialization ? SPECIALIZATIONS[unit.specialization].name : KIND_META[unit.kind].name} ·
                    전투력 {getUnitPower(unit)}
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
        )
      })}
    </div>
  )
}

type SelectedUnitReadoutProps = {
  selectedUnit: Unit | null
  selectedUnitLane: number | null
  deploymentForecasts: readonly DeploymentForecast[]
  recommendedDeploymentLane: number | null
  mergeReadiness: RosterMergeReadiness | null
  rosterCount: number
  getSurvivorName: (unit: Unit) => string
  onQuickDeploy: (lane: number) => void
}

const QUICK_DEPLOYMENT_ACTIONS: Record<DeploymentForecast['action'], string> = {
  current: '현재',
  deploy: '배치',
  replace: '교체',
  move: '이동',
  swap: '교환',
}

function quickDeploymentOutcome(forecast: DeploymentForecast): string {
  if (forecast.action === 'current') return forecast.won ? '현재 방어' : '현재 위험'
  if (forecast.securesVictory) return '승리선 확보'
  if (forecast.losesVictory) return '승리선 상실'
  if (!forecast.lineupReadyBefore && forecast.lineupReadyAfter) return '3인 대열 완성'
  if (forecast.currentWon === null) return forecast.won ? '전선 확보' : '붕괴 위험'
  if (forecast.securesLane) return '방어 전환'
  if (forecast.losesLane) return '붕괴 전환'
  if (forecast.winsAfter !== forecast.winsBefore) {
    return `방어 ${forecast.winsBefore}→${forecast.winsAfter}`
  }
  return forecast.won ? '방어 유지' : '붕괴 위험'
}

export function SelectedUnitReadout({
  selectedUnit,
  selectedUnitLane,
  deploymentForecasts,
  recommendedDeploymentLane,
  mergeReadiness,
  rosterCount,
  getSurvivorName,
  onQuickDeploy,
}: SelectedUnitReadoutProps) {
  return (
    <div
      className="selected-readout"
      data-active={selectedUnit ? 'true' : 'false'}
      data-merge-ready={mergeReadiness ? 'true' : 'false'}
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
            <span>전선별 실제 승패 · 눌러서 적용</span>
            {LANES.map((lane) => {
              const forecast = deploymentForecasts.find((candidate) => candidate.lane === lane) ?? null
              const outcome = forecast ? quickDeploymentOutcome(forecast) : '배치'
              const action = forecast ? QUICK_DEPLOYMENT_ACTIONS[forecast.action] : '배치'
              const recommended = recommendedDeploymentLane === lane
              return (
                <button
                  type="button"
                  onClick={() => onQuickDeploy(lane)}
                  aria-label={`${getSurvivorName(selectedUnit)}을 ${lane + 1}전선에 ${action}. ${
                    forecast
                      ? `예상 전투력 ${forecast.playerPower} 대 적 위협 ${forecast.enemyPower}, ${outcome}, 방어 전선 ${forecast.winsBefore}에서 ${forecast.winsAfter}${recommended ? ', 추천 전선' : ''}`
                      : '전투 결과 계산 대기'
                  }`}
                  aria-pressed={selectedUnitLane === lane}
                  data-current={selectedUnitLane === lane ? 'true' : 'false'}
                  data-outcome={forecast?.outcome}
                  data-recommended={recommended ? 'true' : undefined}
                  key={`quick-deploy-${lane}`}
                >
                  <span>
                    <b>0{lane + 1}</b>
                    <small>{action}</small>
                  </span>
                  <strong>{outcome}</strong>
                  {forecast ? (
                    <small>
                      {forecast.playerPower} / {forecast.enemyPower} · {forecast.winsBefore}→{forecast.winsAfter}
                    </small>
                  ) : null}
                </button>
              )
            })}
          </nav>
          <span className="selected-unit-status">
            {rosterCount <= 3
              ? '세 전선 유지 · 합성 잠김'
              : mergeReadiness
                ? `합성 짝 ${mergeReadiness.partnerCount}명`
                : selectedUnit.specialization
                  ? `${SPECIALIZATIONS[selectedUnit.specialization].glyph} ${SPECIALIZATIONS[selectedUnit.specialization].name}`
                  : KIND_META[selectedUnit.kind].advantageCopy}
          </span>
          {mergeReadiness ? (
            <section className="selected-merge-preview" aria-label="선택한 생존자 합성 결과 미리보기">
              <span className="selected-merge-tier" aria-hidden="true">
                <b>{TIER_LABELS[mergeReadiness.fromTier]}</b>
                <i>→</i>
                <strong>{TIER_LABELS[mergeReadiness.toTier]}</strong>
              </span>
              <div>
                <small>MERGE READY · 빛나는 같은 등급 짝을 선택하세요</small>
                <strong>
                  단일 전선 기본 전투력 {mergeReadiness.powerBefore} → {mergeReadiness.powerAfter}
                </strong>
                <p>
                  {mergeReadiness.heatGain > 0 ? `화로 온기 +${mergeReadiness.heatGain}` : '화로 온기 상한 유지'}
                  {mergeReadiness.specializationMayReset
                    ? ' · 다른 길과 합치면 전문화 재선택'
                    : mergeReadiness.opensPromotion
                      ? ' · 베테랑 전문화 개방'
                      : mergeReadiness.chainReady
                        ? ' · 다음 등급 합성 짝 연결'
                        : ' · 즉시 전선 강화'}
                </p>
              </div>
              <b>
                {mergeReadiness.opensPromotion
                  ? '전문화 열림'
                  : mergeReadiness.specializationMayReset
                    ? '길 확인'
                    : mergeReadiness.chainReady
                      ? '연속 성장'
                      : '짝 선택'}
              </b>
            </section>
          ) : null}
        </>
      ) : (
        <p>생존자를 누르거나 끌어서 합치고 배치하세요.</p>
      )}
    </div>
  )
}
