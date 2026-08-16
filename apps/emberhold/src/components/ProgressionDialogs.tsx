import Image from 'next/image'
import { useState } from 'react'
import survivorTriadArt from '@/app/survivor-triad.webp'
import './deferred.css'

import type {
  BattleResult,
  CampUndo,
  FailureInsight,
  FinalCrownSeal,
  GameState,
  GrowthCeremony,
  LaneResult,
  LegacyId,
  RelicId,
  ResonanceId,
  SpecializationId,
  Unit,
} from './game-model'
import {
  BOSS_MECHANICS,
  ENEMY_DOCTRINES,
  FINAL_CROWN_REQUIRED_SEALS,
  FINAL_CROWN_SEALS,
  FIRST_CROWN_MARCH,
  KIND_META,
  LEGACY_UPGRADES,
  MASTERY_CONTRACTS,
  MAX_NIGHTS,
  MAX_TIER,
  NIGHT_STORIES,
  PLAYER_POWER,
  RELICS,
  REQUIRED_LANE_WINS,
  RESONANCES,
  SPECIALIZATIONS,
  TIER_LABELS,
} from './game-model'

export type PromotionChoiceInsight = {
  specializationId: SpecializationId
  deployed: boolean
  active: boolean
  status: string
  detail: string
  playerPowerBefore: number | null
  playerPowerAfter: number | null
  projectedWinsBefore: number | null
  projectedWinsAfter: number | null
  securesVictory: boolean
}

type PromotionDialogProps = {
  pendingPromotionUnit: Unit
  promotionChoices: readonly SpecializationId[]
  promotionChoiceInsights: readonly PromotionChoiceInsight[]
  recommendedSpecializationId: SpecializationId | null
  growthCeremony: GrowthCeremony | null
  campUndo: CampUndo | null
  previewSpecialization: (specializationId: SpecializationId) => void
  chooseSpecialization: (specializationId: SpecializationId) => void
  undoCampAction: () => void
  survivorName: (unit: Unit) => string
}

export function PromotionDialog({
  pendingPromotionUnit,
  promotionChoices,
  promotionChoiceInsights,
  recommendedSpecializationId,
  growthCeremony,
  campUndo,
  previewSpecialization,
  chooseSpecialization,
  undoCampAction,
  survivorName,
}: PromotionDialogProps) {
  const [selectedSpecializationId, setSelectedSpecializationId] = useState<SpecializationId | null>(null)
  const selectedSpecialization = selectedSpecializationId ? SPECIALIZATIONS[selectedSpecializationId] : null
  const selectedInsight = selectedSpecializationId
    ? (promotionChoiceInsights.find((insight) => insight.specializationId === selectedSpecializationId) ?? null)
    : null
  const fromTier = growthCeremony?.fromTier ?? Math.max(1, pendingPromotionUnit.tier - 1)
  const powerBefore = growthCeremony?.powerBefore ?? PLAYER_POWER[fromTier]
  const powerAfter = growthCeremony?.powerAfter ?? PLAYER_POWER[pendingPromotionUnit.tier]

  function selectSpecialization(specializationId: SpecializationId) {
    if (selectedSpecializationId === specializationId) return
    setSelectedSpecializationId(specializationId)
    previewSpecialization(specializationId)
  }

  function clearSelection() {
    const previousSelection = selectedSpecializationId
    setSelectedSpecializationId(null)
    window.requestAnimationFrame(() => {
      if (!previousSelection) return
      document
        .querySelector<HTMLButtonElement>(`[data-specialization-id="${previousSelection}"]`)
        ?.focus({ preventScroll: true })
    })
  }

  return (
    <div
      className="modal-backdrop promotion-backdrop"
      data-selection={selectedSpecializationId ? 'true' : 'false'}
      role="presentation"
    >
      <section
        className={`promotion-card kind-${pendingPromotionUnit.kind}`}
        data-selection={selectedSpecializationId ? 'true' : 'false'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-title"
        aria-describedby="promotion-lead promotion-growth-summary"
        data-focus-scope="promotion"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && selectedSpecializationId) {
            event.preventDefault()
            event.stopPropagation()
            clearSelection()
          } else if (
            ((event.key === 'Escape' && selectedSpecializationId === null) || event.code === 'KeyZ') &&
            campUndo?.kind === 'merge'
          ) {
            event.preventDefault()
            event.stopPropagation()
            undoCampAction()
          }
        }}
      >
        <div className="promotion-portrait">
          <Image
            src={survivorTriadArt}
            alt=""
            fill
            sizes="(max-width: 760px) 100vw, 420px"
            style={{
              objectPosition:
                pendingPromotionUnit.kind === 'warden'
                  ? '16% center'
                  : pendingPromotionUnit.kind === 'ranger'
                    ? '50% center'
                    : '84% center',
            }}
          />
          <div className="promotion-portrait-grade" aria-hidden="true" />
          <span className="promotion-tier">TIER {TIER_LABELS[pendingPromotionUnit.tier]}</span>
          <div>
            <small>
              {KIND_META[pendingPromotionUnit.kind].role} · {KIND_META[pendingPromotionUnit.kind].name}
            </small>
            <strong>{survivorName(pendingPromotionUnit)}</strong>
          </div>
        </div>
        <div className="promotion-body">
          <header>
            <p className="eyebrow">VETERAN PROMOTION · CHOOSE A PATH</p>
            <h2 id="promotion-title">
              {pendingPromotionUnit.tier === MAX_TIER ? '전설의 길을 완성하세요' : '한 생존자가 베테랑이 되었습니다'}
            </h2>
            <p id="promotion-lead">
              두 길을 눌러 현재 전선의 실제 전투력과 승리선을 비교하세요. 선택은 아래에서 다시 확정하기 전까지 기록되지
              않습니다.
            </p>
          </header>
          <section className="promotion-growth-summary" id="promotion-growth-summary" aria-label="진급 성장 결과">
            <div className="promotion-growth-tier" aria-hidden="true">
              <span>{TIER_LABELS[fromTier]}</span>
              <i>→</i>
              <strong>{TIER_LABELS[pendingPromotionUnit.tier]}</strong>
            </div>
            <div>
              <small>{growthCeremony ? 'MERGE ASCENSION · 합성 진급' : 'VETERAN ASCENSION · 등급 진급'}</small>
              <strong>
                기본 전투력 {powerBefore} → {powerAfter}
              </strong>
              <p>
                순수 전력 +{powerAfter - powerBefore}
                {growthCeremony ? ` · 화로 ${growthCeremony.heatBefore}% → ${growthCeremony.heatAfter}%` : ''}
              </p>
            </div>
            <b>+{powerAfter - powerBefore}</b>
          </section>
          <div className="promotion-options">
            {promotionChoices.map((specializationId, index) => {
              const specialization = SPECIALIZATIONS[specializationId]
              const insight = promotionChoiceInsights.find(
                (candidate) => candidate.specializationId === specializationId,
              )
              const selected = selectedSpecializationId === specializationId
              const recommended = recommendedSpecializationId === specializationId
              return (
                <button
                  type="button"
                  onClick={() => selectSpecialization(specializationId)}
                  aria-pressed={selected}
                  data-selected={selected ? 'true' : 'false'}
                  data-recommended={recommended ? 'true' : 'false'}
                  data-specialization-id={specializationId}
                  data-autofocus={
                    recommended || (recommendedSpecializationId === null && index === 0) ? 'true' : undefined
                  }
                  key={specializationId}
                >
                  <span className="promotion-option-number">0{index + 1}</span>
                  {recommended ? <span className="promotion-recommended">현재 전술 추천</span> : null}
                  <span className="promotion-option-glyph" aria-hidden="true">
                    {specialization.glyph}
                  </span>
                  <small>{specialization.subtitle}</small>
                  <strong>{specialization.name}</strong>
                  <p>{specialization.description}</p>
                  <em>{specialization.detail}</em>
                  {insight ? (
                    <span className="promotion-option-fit" data-active={insight.active ? 'true' : 'false'}>
                      <span>
                        <small>{insight.status}</small>
                        {insight.playerPowerBefore !== null && insight.playerPowerAfter !== null ? (
                          <b>
                            {insight.playerPowerBefore} → {insight.playerPowerAfter}{' '}
                            <i>+{insight.playerPowerAfter - insight.playerPowerBefore}</i>
                          </b>
                        ) : null}
                      </span>
                      {insight.projectedWinsBefore !== null && insight.projectedWinsAfter !== null ? (
                        <span
                          className="promotion-option-outcome"
                          data-breakthrough={insight.securesVictory ? 'true' : 'false'}
                        >
                          <small>{insight.securesVictory ? '승리선 확보' : '방어 예측'}</small>
                          <b>
                            {insight.projectedWinsBefore} → {insight.projectedWinsAfter} / 3
                          </b>
                        </span>
                      ) : null}
                      <em>{insight.detail}</em>
                    </span>
                  ) : null}
                  <b>
                    {selected ? '미리보기 선택됨' : '전술 미리보기'} <i aria-hidden="true">›</i>
                  </b>
                </button>
              )
            })}
          </div>
          <footer>
            <span>III 등급부터 전술 발동</span>
            <span>IV 등급에서 효과 +5%p</span>
            {campUndo?.kind === 'merge' ? (
              <button className="promotion-undo" type="button" onClick={undoCampAction}>
                합성 되돌리기 <kbd>Z</kbd>
              </button>
            ) : null}
          </footer>
        </div>
        {selectedSpecializationId && selectedSpecialization && selectedInsight ? (
          <section className="promotion-confirmation" aria-label={`${selectedSpecialization.name} 선택 확인`}>
            <span className="promotion-confirmation-glyph" aria-hidden="true">
              {selectedSpecialization.glyph}
            </span>
            <div>
              <small>VETERAN PATH PREVIEW · {selectedInsight.status}</small>
              <strong>{selectedSpecialization.name}의 길을 각인할까요?</strong>
              <p>{selectedInsight.detail}</p>
            </div>
            <dl>
              <div>
                <dt>현재 전선</dt>
                <dd>
                  {selectedInsight.playerPowerBefore !== null && selectedInsight.playerPowerAfter !== null
                    ? `${selectedInsight.playerPowerBefore} → ${selectedInsight.playerPowerAfter}`
                    : '배치 후 판정'}
                </dd>
              </div>
              <div>
                <dt>방어 예측</dt>
                <dd>
                  {selectedInsight.projectedWinsBefore !== null && selectedInsight.projectedWinsAfter !== null
                    ? `${selectedInsight.projectedWinsBefore} → ${selectedInsight.projectedWinsAfter} 전선`
                    : '대열 완성 후 판정'}
                </dd>
              </div>
            </dl>
            <footer>
              <button type="button" onClick={clearSelection}>
                다시 비교
              </button>
              <button
                className="promotion-confirm"
                type="button"
                onClick={() => chooseSpecialization(selectedSpecializationId)}
              >
                {selectedInsight.securesVictory ? '승리선을 확보하고 각인' : '이 길을 영구 각인'}
              </button>
            </footer>
          </section>
        ) : null}
      </section>
    </div>
  )
}

type DecisionImprintView = {
  id: string
  glyph: string
  sourceDay: number
  sourceChoice: string
  name: string
  crownLink: string
}

type ResultFinalMarchImprintView = {
  imprint: DecisionImprintView
  activeLanes: number
}

type ResultCrownStateView = {
  seal: FinalCrownSeal | null
  lane: LaneResult
  broken: boolean
}

type FinalMarchGateView = {
  night: 9 | 10 | 11
  name: string
  glyph: string
  label: string
  lesson: string
  crownPreparation: string
  doctrine: keyof typeof ENEMY_DOCTRINES
}

type DifficultyProtocolView = {
  name: string
  glyph: string
  label: string
  ruleName: string
}

type ResultProtocolMasteryView = {
  state: string
  copy: string
}

type FirstVictoryPreviewView = {
  nextNight: number
  title: string
  location: string
  weather: string
  omen: string
}

const FIRST_CROWN_RESULT_COPY = [
  {
    night: 2,
    title: '첫 유물이 불빛에 응답했습니다',
    description: '방어 보상으로 유물 하나를 선택할 수 있습니다. 첫 왕관을 향한 빌드의 방향이 여기서 시작됩니다.',
  },
  {
    night: 3,
    title: '왕관의 신호를 붙잡았습니다',
    description: '빈 갑옷의 푸른 박동이 국경 성문에서 멈췄습니다. 다음 밤이 첫 막의 왕관전입니다.',
  },
  {
    night: 4,
    title: '국경의 첫 왕관이 갈라졌습니다',
    description: '왕관 조각과 새 유물을 회수할 수 있습니다. 얼음 성당으로 가는 두 번째 막의 길이 열립니다.',
  },
] as const

type BattleResultDialogProps = {
  battleResult: BattleResult
  game: GameState
  currentStoryReport: string
  firstVictoryPreview: FirstVictoryPreviewView | null
  finalCrownMechanicBlocked: boolean
  resultCrownBreakCount: number
  primaryFailureInsight: FailureInsight | null
  resultFinalMarchImprints: readonly ResultFinalMarchImprintView[]
  resultFinalMarchImprintCount: number
  resultDecisionEchoCount: number
  resultFinalVowCount: number
  resultCrownStates: readonly ResultCrownStateView[]
  finalMarchGate: FinalMarchGateView | null | undefined
  nextFinalMarchGate: FinalMarchGateView | null | undefined
  resolvedDoctrineLane: LaneResult | null
  defeatInsights: readonly FailureInsight[]
  priorDefeatCount: number
  nextRetreatSupply: number
  nextRecoveryRecruitDiscount: number
  activeResonances: readonly ResonanceId[]
  difficultyProtocol: DifficultyProtocolView
  resultProtocolCopy: string
  resultProtocolMastery: ResultProtocolMasteryView | null
  legacyCommand: {
    limit: number
    limitBeforeLegacy: number
    appliedBonus: number
  } | null
  survivorName: (unit: Unit) => string
  continueAfterBattle: () => void
}

export function BattleResultDialog({
  battleResult,
  game,
  currentStoryReport,
  firstVictoryPreview,
  finalCrownMechanicBlocked,
  resultCrownBreakCount,
  primaryFailureInsight,
  resultFinalMarchImprints,
  resultFinalMarchImprintCount,
  resultDecisionEchoCount,
  resultFinalVowCount,
  resultCrownStates,
  finalMarchGate,
  nextFinalMarchGate,
  resolvedDoctrineLane,
  defeatInsights,
  priorDefeatCount,
  nextRetreatSupply,
  nextRecoveryRecruitDiscount,
  activeResonances,
  difficultyProtocol,
  resultProtocolCopy,
  resultProtocolMastery,
  legacyCommand,
  survivorName,
  continueAfterBattle,
}: BattleResultDialogProps) {
  const firstCrownResultCopy = battleResult.victory
    ? (FIRST_CROWN_RESULT_COPY.find((copy) => copy.night === game.day) ?? null)
    : null
  const firstCrownMarchResult = firstCrownResultCopy
    ? (FIRST_CROWN_MARCH.find((stage) => stage.night === firstCrownResultCopy.night) ?? null)
    : null
  const nextFirstCrownStage = firstCrownMarchResult
    ? (FIRST_CROWN_MARCH.find((stage) => stage.night === firstCrownMarchResult.night + 1) ?? null)
    : null
  const nextFirstCrownStory = nextFirstCrownStage ? NIGHT_STORIES[nextFirstCrownStage.night - 1] : null
  const nextFinalMarchStory = finalMarchGate && game.day < MAX_NIGHTS ? NIGHT_STORIES[game.day] : null
  const finalCrownMechanic = BOSS_MECHANICS[MAX_NIGHTS] ?? null
  const finalMarchHandoff =
    battleResult.victory && finalMarchGate && nextFinalMarchStory
      ? nextFinalMarchGate
        ? {
            final: false,
            routeLabel: `GATE 0${nextFinalMarchGate.night - 8} / 03`,
            targetGlyph: nextFinalMarchGate.glyph,
            targetLabel: nextFinalMarchGate.label,
            targetName: nextFinalMarchGate.name,
            threatName: ENEMY_DOCTRINES[nextFinalMarchGate.doctrine].name,
            directive: ENEMY_DOCTRINES[nextFinalMarchGate.doctrine].counterplay,
            preparation: nextFinalMarchGate.crownPreparation,
            story: nextFinalMarchStory,
          }
        : finalCrownMechanic
          ? {
              final: true,
              routeLabel: 'FINAL CROWN',
              targetGlyph: finalCrownMechanic.glyph,
              targetLabel: `${finalCrownMechanic.epithet} · ${finalCrownMechanic.phase}`,
              targetName: finalCrownMechanic.name,
              threatName: '삼중 왕관 칙령',
              directive: finalCrownMechanic.pressureCopy,
              preparation: `세 관문의 교훈과 누적 각인을 결집해 칙령 ${FINAL_CROWN_REQUIRED_SEALS}개와 전선 ${REQUIRED_LANE_WINS}곳을 함께 확보합니다.`,
              story: nextFinalMarchStory,
            }
          : null
      : null
  const secondCrownResult = game.day === 8 && battleResult.boss
  const secondCrownShieldBroken = battleResult.focusLane === 1
  const secondCrownHeartLane = battleResult.lanes[1]
  const secondCrownResultState = battleResult.victory
    ? secondCrownShieldBroken
      ? secondCrownHeartLane.won
        ? 'direct'
        : 'breached'
      : 'flanked'
    : secondCrownShieldBroken
      ? 'exposed'
      : 'sealed'
  const finalCrownResult = game.day === MAX_NIGHTS && battleResult.boss
  const finalCrownMastered = finalCrownResult && resultCrownBreakCount === FINAL_CROWN_SEALS.length
  const finalCrownMissingSeals = Math.max(0, FINAL_CROWN_REQUIRED_SEALS - resultCrownBreakCount)
  const finalCrownMissingFronts = Math.max(0, REQUIRED_LANE_WINS - battleResult.wins)
  const finalCrownReturnHeat = Math.max(0, Math.min(100, game.heat + battleResult.heatDelta))
  const defeatEndsRun = !battleResult.victory && finalCrownReturnHeat === 0
  const resultOutcome = battleResult.victory ? 'victory' : defeatEndsRun ? 'terminal' : 'retreat'
  const projectedRecoverySupplies = game.recoverySupplies + (battleResult.victory ? 0 : battleResult.supplyReward)
  const projectedSupplies = game.supplies + battleResult.supplyReward
  const projectedMorale = Math.max(0, Math.min(100, game.morale + battleResult.moraleDelta))
  const projectedRenown = game.score + battleResult.scoreReward
  const resultGrade = finalCrownMastered
    ? 'S+'
    : battleResult.victory
      ? battleResult.wins === 3
        ? 'S'
        : battleResult.boss
          ? 'A+'
          : 'A'
      : battleResult.wins >= REQUIRED_LANE_WINS
        ? 'B'
        : battleResult.wins === 1
          ? 'C'
          : 'D'
  const resultGradeTitle = finalCrownMastered
    ? '완전 파쇄'
    : battleResult.victory
      ? battleResult.wins === 3
        ? '완벽 방어'
        : battleResult.boss
          ? '왕관 돌파'
          : '전선 유지'
      : defeatEndsRun
        ? '최후 방어'
        : finalCrownMechanicBlocked
          ? '칙령 미달'
          : '전선 후퇴'
  const resultSignal = finalCrownMastered
    ? 'PERFECT SHATTER'
    : battleResult.victory
      ? battleResult.boss
        ? 'CROWN BROKEN'
        : battleResult.wins === 3
          ? 'ALL FRONTS HELD'
          : 'WATCH SECURED'
      : defeatEndsRun
        ? 'LAST EMBER SEALED'
        : finalCrownMechanicBlocked
          ? 'EDICT LOCKED'
          : 'RETREAT SECURED'
  const continueLabel = battleResult.victory
    ? game.day === MAX_NIGHTS
      ? '무너진 왕좌 너머, 마지막 새벽으로'
      : firstVictoryPreview
        ? '첫 승리를 기록하고 2일차로'
        : finalMarchHandoff
          ? finalMarchHandoff.final
            ? `NIGHT ${MAX_NIGHTS} · 백색 왕의 왕좌로 진군하기`
            : `NIGHT ${game.day + 1} · 다음 관문으로 진군하기`
          : firstCrownMarchResult?.night === 2
            ? '첫 유물 각인 선택하기'
            : firstCrownMarchResult?.night === 3
              ? '첫 왕관으로 진군하기'
              : battleResult.boss
                ? '왕관 조각 회수하기'
                : '다음 경로 선택하기'
    : finalCrownResult
      ? defeatEndsRun
        ? '마지막 불씨의 결말 기록하기'
        : '왕좌 앞 진형으로 돌아가기'
      : defeatEndsRun
        ? '이번 원정의 결말 기록하기'
        : '재정비하고 같은 밤 재도전'
  const resultSettlementTitle = finalCrownMastered
    ? '왕의 이름까지 지워냈습니다'
    : battleResult.victory
      ? finalCrownResult
        ? '마지막 새벽을 확보했습니다'
        : battleResult.boss
          ? '왕관 파편을 회수했습니다'
          : battleResult.wins === 3
            ? '완벽 방어 보상을 확보했습니다'
            : '귀환 보상을 확보했습니다'
      : defeatEndsRun
        ? '마지막 전투 기록을 봉인합니다'
        : '복구 자원과 재도전 정보를 확보했습니다'
  const resultSettlementCopy = battleResult.victory
    ? `보급 +${battleResult.supplyReward} · 명성 +${battleResult.scoreReward.toLocaleString('ko-KR')} · 귀환 온기 ${finalCrownReturnHeat}%가 계속하기와 함께 확정됩니다.`
    : defeatEndsRun
      ? `전선 ${battleResult.wins}곳의 기록과 마지막 전술 처방이 결말에 보존됩니다.`
      : `복구 보급 +${battleResult.supplyReward}과 신호탄 비용 −${nextRecoveryRecruitDiscount} 보호를 받고 같은 밤으로 돌아갑니다.`
  const battleLegacyEntries: {
    id: LegacyId
    state: 'applied' | 'waiting' | 'absorbed'
    stage: string
    value: string
    detail: string
    badge: string
  }[] = []
  if (legacyCommand) {
    battleLegacyEntries.push({
      id: 'command-seal',
      state: legacyCommand.appliedBonus > 0 ? 'applied' : 'absorbed',
      stage: 'COMMAND · 출전 한도',
      value:
        legacyCommand.appliedBonus > 0
          ? `지휘 한도 +${legacyCommand.appliedBonus}`
          : `지휘 한도 ${legacyCommand.limit}`,
      detail:
        legacyCommand.appliedBonus > 0
          ? `기본 ${legacyCommand.limitBeforeLegacy} → 실제 ${legacyCommand.limit} · 이번 교전에 항상 적용`
          : `유산 규칙 +1은 활성이나 ${legacyCommand.limit}점 교리 보장선이 더 높아 실제 증가는 0`,
      badge: legacyCommand.appliedBonus > 0 ? `+${legacyCommand.appliedBonus} 적용` : '교리선 포함',
    })
  }
  if (game.activeLegacy.includes('salvagers-instinct')) {
    battleLegacyEntries.push({
      id: 'salvagers-instinct',
      state: battleResult.victory ? 'applied' : 'waiting',
      stage: 'RETURN · 승리 보급',
      value: battleResult.victory ? `보급 +${battleResult.legacySupplyBonus}` : '보급 +0',
      detail: battleResult.victory
        ? `기본 귀환 +${battleResult.supplyReward - battleResult.legacySupplyBonus} → 실제 +${battleResult.supplyReward} · 위험도 배율과 반올림 후 기여`
        : '승리 조건을 충족하지 못해 이번 후퇴 복구 보급에는 더해지지 않음',
      badge: battleResult.victory ? '보상 적용' : '조건 대기',
    })
  }
  if (game.activeLegacy.includes('chroniclers-ink')) {
    battleLegacyEntries.push({
      id: 'chroniclers-ink',
      state: battleResult.victory ? 'applied' : 'waiting',
      stage: 'RENOWN · 승리 명성',
      value: battleResult.victory ? `명성 +${battleResult.legacyScoreBonus.toLocaleString('ko-KR')}` : '명성 +0',
      detail: battleResult.victory
        ? `기본 +${(
            battleResult.scoreReward - battleResult.legacyScoreBonus - battleResult.contractScoreBonus
          ).toLocaleString(
            'ko-KR',
          )} → 유산 적용 +${(battleResult.scoreReward - battleResult.contractScoreBonus).toLocaleString('ko-KR')} · ×1.08과 반올림 후 기여`
        : '승리 명성이 없어 이번 교전에서는 배율이 발동하지 않음',
      badge: battleResult.victory ? '배율 적용' : '조건 대기',
    })
  }
  const contributionSystemCount =
    1 +
    (resolvedDoctrineLane?.enemy.doctrine ? 1 : 0) +
    (activeResonances.length > 0 ? 1 : 0) +
    (battleLegacyEntries.length > 0 ? 1 : 0) +
    (game.masteryContract ? 1 : 0)

  return (
    <div
      className="modal-backdrop result-backdrop"
      data-boss={battleResult.boss ? 'true' : 'false'}
      data-outcome={resultOutcome}
      role="presentation"
    >
      <section
        className={`result-card ${battleResult.victory ? 'is-victory' : 'is-defeat'}${firstVictoryPreview ? ' is-first-victory' : ''}${firstCrownMarchResult ? ' is-first-crown-march' : ''}${secondCrownResult ? ' is-second-crown' : ''}${finalCrownResult ? ' is-final-crown' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        aria-describedby="result-lead"
        data-focus-scope="result"
        tabIndex={-1}
      >
        <div className="result-verdict-handoff" data-outcome={resultOutcome} aria-hidden="true">
          <div className="result-verdict-fronts">
            {battleResult.lanes.map((lane) => (
              <span data-state={lane.won ? 'held' : 'broken'} key={`verdict-front-${lane.lane}`}>
                <b>0{lane.lane + 1}</b>
                <i />
              </span>
            ))}
          </div>
          <div className="result-emblem">
            <span>{finalCrownResult ? (battleResult.victory ? '☼' : '♜') : battleResult.victory ? '✦' : '❄'}</span>
          </div>
          <small>{resultSignal}</small>
        </div>
        <p className="eyebrow">
          {finalCrownResult ? 'FINAL CROWN VERDICT' : `NIGHT ${String(game.day).padStart(2, '0')} REPORT`}
        </p>
        <h2 id="result-title">
          {battleResult.victory
            ? finalCrownResult
              ? finalCrownMastered
                ? '삼중 왕관 완전 파쇄'
                : '백색 왕의 지배 붕괴'
              : battleResult.boss
                ? '왕관 조각 파괴'
                : '방어선 유지'
            : finalCrownResult
              ? defeatEndsRun
                ? '마지막 불씨가 왕좌 앞에서 꺼졌다'
                : finalCrownMechanicBlocked
                  ? '칙령이 새벽을 봉인했다'
                  : '왕좌가 전선을 되감았다'
              : defeatEndsRun
                ? '마지막 불씨 소멸'
                : '방어선 붕괴'}
        </h2>
        <p className="result-lead" id="result-lead">
          {battleResult.victory
            ? finalCrownResult
              ? finalCrownMastered
                ? `세 전선과 세 칙령의 판정이 모두 맞물렸습니다. 왕의 이름까지 지워진 완전한 새벽이 열립니다.`
                : `전선 ${battleResult.wins}곳과 칙령 ${resultCrownBreakCount}개의 균열이 왕좌를 무너뜨렸습니다. 이제 이 원정이 남긴 새벽을 기록할 차례입니다.`
              : battleResult.wins === 3
                ? '세 전선을 모두 지켰습니다. 불빛이 설원 너머까지 닿습니다.'
                : '두 전선을 지켜냈습니다. 아직 화로는 꺼지지 않았습니다.'
            : defeatEndsRun
              ? `귀환 온기가 0%가 되어 같은 밤의 재도전은 끝났습니다. ${primaryFailureInsight ? `${primaryFailureInsight.label}이 마지막 전선의 결정적 붕괴 원인이었습니다.` : '이번 원정의 마지막 전투 기록을 확인하세요.'}`
              : finalCrownResult && finalCrownMechanicBlocked
                ? `전선 ${battleResult.wins}곳은 지켰지만 칙령은 ${resultCrownBreakCount}개만 해제했습니다. 최소 ${FINAL_CROWN_REQUIRED_SEALS}개의 전술 조건을 동시에 충족해야 왕관이 무너집니다.`
                : primaryFailureInsight
                  ? `${primaryFailureInsight.label}이 가장 먼저 고쳐야 할 붕괴 원인입니다. 같은 밤의 정보를 유지한 채 재정비하세요.`
                  : '눈보라가 성벽 안으로 밀려듭니다. 진형을 바꿔 다시 맞서세요.'}
        </p>
        {battleResult.victory ? (
          <blockquote className="story-report">
            <span>새벽 기록</span>
            <p>{currentStoryReport}</p>
          </blockquote>
        ) : null}

        <section
          className="result-settlement"
          data-outcome={resultOutcome}
          aria-label={`전투 결산 ${resultGrade} 등급 · ${resultGradeTitle}`}
        >
          <header>
            <div className="result-settlement-grade">
              <small>WATCH GRADE</small>
              <strong>{resultGrade}</strong>
              <span>{resultGradeTitle}</span>
            </div>
            <div className="result-settlement-copy">
              <small>
                {battleResult.victory
                  ? 'RETURN SECURED · REWARDS READY'
                  : defeatEndsRun
                    ? 'FINAL RECORD · EXPEDITION CLOSE'
                    : 'RETREAT SECURED · RETRY READY'}
              </small>
              <h3>{resultSettlementTitle}</h3>
              <p>{resultSettlementCopy}</p>
            </div>
            <div className="result-settlement-thresholds">
              <span data-state={battleResult.wins >= REQUIRED_LANE_WINS ? 'complete' : 'missing'}>
                전선 {battleResult.wins} / {REQUIRED_LANE_WINS}
              </span>
              {finalCrownResult ? (
                <span data-state={resultCrownBreakCount >= FINAL_CROWN_REQUIRED_SEALS ? 'complete' : 'missing'}>
                  칙령 {resultCrownBreakCount} / {FINAL_CROWN_REQUIRED_SEALS}
                </span>
              ) : (
                <span
                  data-state={finalCrownReturnHeat > 20 ? 'complete' : finalCrownReturnHeat > 0 ? 'warning' : 'missing'}
                >
                  귀환 {finalCrownReturnHeat}%
                </span>
              )}
            </div>
          </header>

          <dl className="result-settlement-resources" aria-label="계속하기 후 자원 변화">
            <div data-change={battleResult.supplyReward > 0 ? 'gain' : 'steady'}>
              <dt>
                보급품 <small>+{battleResult.supplyReward} 회수</small>
              </dt>
              <dd>
                <span>{game.supplies}</span>
                <i aria-hidden="true">→</i>
                <strong>{projectedSupplies}</strong>
              </dd>
            </div>
            <div data-change={battleResult.heatDelta > 0 ? 'gain' : battleResult.heatDelta < 0 ? 'loss' : 'steady'}>
              <dt>
                화로 온기{' '}
                <small>
                  {battleResult.heatDelta > 0 ? '+' : ''}
                  {battleResult.heatDelta}%
                </small>
              </dt>
              <dd>
                <span>{game.heat}%</span>
                <i aria-hidden="true">→</i>
                <strong>{finalCrownReturnHeat}%</strong>
              </dd>
            </div>
            <div data-change={battleResult.moraleDelta > 0 ? 'gain' : battleResult.moraleDelta < 0 ? 'loss' : 'steady'}>
              <dt>
                원정대 사기{' '}
                <small>
                  {battleResult.moraleDelta > 0 ? '+' : ''}
                  {battleResult.moraleDelta}
                </small>
              </dt>
              <dd>
                <span>{game.morale}</span>
                <i aria-hidden="true">→</i>
                <strong>{projectedMorale}</strong>
              </dd>
            </div>
            <div data-change={battleResult.scoreReward > 0 ? 'gain' : 'steady'}>
              <dt>
                원정 명성 <small>+{battleResult.scoreReward.toLocaleString('ko-KR')}</small>
              </dt>
              <dd>
                <span>{game.score.toLocaleString('ko-KR')}</span>
                <i aria-hidden="true">→</i>
                <strong>{projectedRenown.toLocaleString('ko-KR')}</strong>
              </dd>
            </div>
          </dl>

          <footer>
            <div className="result-settlement-fronts">
              {battleResult.lanes.map((lane) => (
                <span data-state={lane.won ? 'held' : 'broken'} key={`settlement-${lane.lane}`}>
                  0{lane.lane + 1} {lane.won ? 'HOLD' : 'BREAK'}
                </span>
              ))}
            </div>
            <button
              className="result-continue result-settlement-continue"
              type="button"
              onClick={continueAfterBattle}
              data-autofocus="true"
              aria-label={`빠르게 계속하기 · ${continueLabel}`}
            >
              <span>{continueLabel}</span>
              <i aria-hidden="true">›</i>
            </button>
          </footer>
        </section>

        {firstVictoryPreview ? (
          <section className="first-victory-moment" aria-label="첫 승리 이정표와 다음 밤 예고">
            <header>
              <span aria-hidden="true">01</span>
              <div>
                <small>NEW CHRONICLE ENTRY · FIRST WATCH</small>
                <strong>첫 번째 망루가 살아남았습니다</strong>
                <p>
                  당신의 첫 명령이 눈보라를 멈췄습니다. 이 승리는 계속하기와 함께 영구 업적과 현재 원정 기록에
                  새겨집니다.
                </p>
              </div>
              <b>첫 번째 망루</b>
            </header>
            <dl aria-label="첫 승리 전술 성과">
              <div>
                <dt>지킨 전선</dt>
                <dd>{battleResult.wins} / 3</dd>
              </div>
              <div>
                <dt>읽어낸 의도</dt>
                <dd>{battleResult.lanes.filter((lane) => lane.countered).length} / 3</dd>
              </div>
              <div>
                <dt>귀환 온기</dt>
                <dd>{Math.max(0, Math.min(100, game.heat + battleResult.heatDelta))}%</dd>
              </div>
            </dl>
            <footer>
              <div>
                <small>
                  NEXT NIGHT {String(firstVictoryPreview.nextNight).padStart(2, '0')} · {firstVictoryPreview.location} ·{' '}
                  {firstVictoryPreview.weather}
                </small>
                <strong>{firstVictoryPreview.title}</strong>
                <p>{firstVictoryPreview.omen}</p>
              </div>
              <span>새 위협</span>
            </footer>
          </section>
        ) : null}

        {firstCrownMarchResult && firstCrownResultCopy ? (
          <section
            className="first-crown-result"
            data-final={firstCrownMarchResult.night === 4 ? 'true' : 'false'}
            aria-label={`첫 왕관 행군 ${firstCrownMarchResult.night}단계 완료`}
          >
            <header>
              <span aria-hidden="true">{firstCrownMarchResult.glyph}</span>
              <div>
                <small>
                  FIRST CROWN MARCH · NIGHT 0{firstCrownMarchResult.night} / 04 · {firstCrownMarchResult.label}
                </small>
                <strong>{firstCrownResultCopy.title}</strong>
                <p>{firstCrownResultCopy.description}</p>
              </div>
              <b>{firstCrownMarchResult.reward}</b>
            </header>
            <footer>
              {nextFirstCrownStage && nextFirstCrownStory ? (
                <>
                  <span>
                    <b>NEXT · NIGHT 0{nextFirstCrownStage.night}</b> {nextFirstCrownStory.title}
                  </span>
                  <strong>{nextFirstCrownStage.reward}</strong>
                </>
              ) : (
                <>
                  <span>
                    <b>ACT I COMPLETE</b> 첫 왕관의 막간이 열립니다.
                  </span>
                  <strong>제2막 해금</strong>
                </>
              )}
            </footer>
          </section>
        ) : null}

        {secondCrownResult ? (
          <section className="second-crown-result" data-state={secondCrownResultState} aria-label="빙하 심장 방벽 판정">
            <header>
              <span aria-hidden="true">⬡</span>
              <div>
                <small>SECOND CROWN VERDICT · HEART SHIELD</small>
                <strong>
                  {battleResult.victory
                    ? secondCrownResultState === 'direct'
                      ? '중앙 방벽과 푸른 심장을 함께 꿰뚫었습니다'
                      : secondCrownResultState === 'breached'
                        ? '방벽의 균열로 푸른 박동을 끊었습니다'
                        : '측면 혈관을 끊어 심장을 멈췄습니다'
                    : secondCrownShieldBroken
                      ? '방벽은 갈랐지만 푸른 심장이 재생합니다'
                      : '심장 방벽이 왕관 조각을 다시 봉합합니다'}
                </strong>
                <p>
                  {battleResult.victory
                    ? secondCrownShieldBroken
                      ? '화로의 중앙 집중이 방벽을 해제했습니다. 지켜 낸 전선의 불씨가 균열 안으로 스며들어 두 번째 왕관 조각을 파괴했습니다.'
                      : '중앙 방벽은 남았지만 지켜 낸 전선들이 얼어붙은 혈관을 끊었습니다. 고립된 심장이 멎으며 극야로 가는 길이 열렸습니다.'
                    : secondCrownShieldBroken
                      ? '중앙 집중으로 방벽은 해제했습니다. 다음 시도에서는 두 번째 승리 전선을 확보해 심장의 재생 경로까지 끊어야 합니다.'
                      : '화로를 중앙 2전선에 집중하면 심장 방벽의 위협 보정이 해제됩니다. 방벽을 먼저 끊고 두 전선을 지키세요.'}
                </p>
              </div>
              <b>
                {battleResult.victory
                  ? secondCrownShieldBroken
                    ? '방벽 해제 · 왕관 파쇄'
                    : '혈관 절단 · 우회 파쇄'
                  : secondCrownShieldBroken
                    ? '방벽 해제 · 전선 부족'
                    : '방벽 유지 · 재생'}
              </b>
            </header>
            <dl>
              <div>
                <dt>화로 집중</dt>
                <dd>
                  {battleResult.focusLane + 1}전선 · {secondCrownShieldBroken ? '방벽 해제' : '방벽 유지'}
                </dd>
              </div>
              <div>
                <dt>심장 전선</dt>
                <dd>{secondCrownHeartLane.won ? '유지' : '붕괴'}</dd>
              </div>
              <div>
                <dt>전체 방어선</dt>
                <dd>{battleResult.wins} / 3</dd>
              </div>
            </dl>
            <footer>
              <span>
                {battleResult.victory
                  ? '푸른 심장의 마지막 박동이 극야 평원의 왕관 경보로 바뀝니다.'
                  : '명령과 배치는 그대로 다시 읽을 수 있습니다. 화로 위치와 두 번째 승리선을 먼저 조정하세요.'}
              </span>
              <strong>{battleResult.victory ? 'ACT II COMPLETE' : 'HEARTBEAT CONTINUES'}</strong>
            </footer>
          </section>
        ) : null}

        <div className="lane-report">
          {battleResult.lanes.map((lane) => (
            <div className={lane.won ? 'won' : 'lost'} key={lane.lane}>
              <span>0{lane.lane + 1}</span>
              <strong>{survivorName(lane.unit)}</strong>
              <i>vs</i>
              <strong>{lane.enemy.name}</strong>
              <b>
                {lane.enemy.doctrine
                  ? `${lane.doctrineBroken ? '교리 파훼' : '교리 압박'}·${lane.won ? '승리' : '패배'}`
                  : lane.resonanceIds.length > 0
                    ? `공명 +${Math.round(lane.resonanceBonus * 100)}%·${lane.won ? '승리' : '패배'}`
                    : lane.specializationActive
                      ? `진급 +${Math.round(lane.specializationBonus * 100)}%·${lane.won ? '승리' : '패배'}`
                      : lane.countered
                        ? `파훼·${lane.won ? '승리' : '패배'}`
                        : lane.won
                          ? '승리'
                          : '패배'}
              </b>
            </div>
          ))}
        </div>

        {resultFinalMarchImprints.length > 0 ? (
          <section className="result-final-march-imprints" aria-label="마지막 행군 각인 전투 결과">
            <header>
              <span aria-hidden="true">⚑</span>
              <div>
                <small>LAST MARCH VERDICT · CHOICE CONSEQUENCES</small>
                <strong>행군의 선택이 전선에서 회수되었습니다</strong>
              </div>
              <b>{resultFinalMarchImprintCount} / 3 전선 강화</b>
            </header>
            <ol>
              {resultFinalMarchImprints.map(({ imprint, activeLanes }) => (
                <li data-active={activeLanes > 0 ? 'true' : 'false'} key={imprint.id}>
                  <span aria-hidden="true">{imprint.glyph}</span>
                  <div>
                    <small>
                      DAY {String(imprint.sourceDay).padStart(2, '0')} · {imprint.sourceChoice}
                    </small>
                    <strong>{imprint.name}</strong>
                    <p>{imprint.crownLink}</p>
                  </div>
                  <b>{activeLanes > 0 ? `${activeLanes} / 3 발동` : '조건 미충족'}</b>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {battleResult.decisionEcho ? (
          <section
            className="result-decision-echo"
            data-triggered={battleResult.decisionHeatProtected > 0 || resultDecisionEchoCount > 0 ? 'true' : 'false'}
            aria-label="이전 결정의 전투 결과"
          >
            <span aria-hidden="true">{battleResult.decisionEcho.glyph}</span>
            <div>
              <small>
                PAST DECISION VERDICT · DAY {String(battleResult.decisionEcho.sourceDay).padStart(2, '0')} ·{' '}
                {battleResult.decisionEcho.sourceChoice}
              </small>
              <strong>{battleResult.decisionEcho.name}</strong>
              <p>{battleResult.decisionEcho.story}</p>
            </div>
            <em>
              <b>
                {battleResult.decisionHeatShield > 0
                  ? battleResult.decisionHeatProtected > 0
                    ? `실제 온기 손실 ${battleResult.decisionHeatProtected} 감소`
                    : '추가 온기 감소 없음'
                  : resultDecisionEchoCount > 0
                    ? `${resultDecisionEchoCount} / 3 전선 발동`
                    : '발동 조건 미충족'}
              </b>
              {battleResult.decisionEcho.effect}
            </em>
          </section>
        ) : null}

        {battleResult.finalVow ? (
          <section className="result-final-vow" data-vow={battleResult.finalVow.id} aria-label="최후의 맹세 전투 결과">
            <span aria-hidden="true">{battleResult.finalVow.glyph}</span>
            <div>
              <small>{battleResult.finalVow.label} · FINAL BATTLE VERDICT</small>
              <strong>{battleResult.finalVow.name}</strong>
              <p>{battleResult.finalVow.story}</p>
            </div>
            <em>
              <b>{resultFinalVowCount} / 3 전선 발동</b>
              {battleResult.finalVow.effect}
            </em>
          </section>
        ) : null}

        {game.day === MAX_NIGHTS ? (
          <section
            className="result-crown-report"
            data-victory={battleResult.victory ? 'true' : 'false'}
            aria-label="삼중 왕관 칙령 결과"
          >
            <header>
              <span>TRIPLE CROWN VERDICT</span>
              <strong>
                칙령 {resultCrownBreakCount} / {FINAL_CROWN_SEALS.length} · 승리 조건{' '}
                {Math.min(resultCrownBreakCount, FINAL_CROWN_REQUIRED_SEALS)} / {FINAL_CROWN_REQUIRED_SEALS}
                {battleResult.victory ? ` · 기본 파쇄 +${(resultCrownBreakCount * 320).toLocaleString('ko-KR')}` : ''}
              </strong>
            </header>
            <div>
              {resultCrownStates.map((state) =>
                state.seal ? (
                  <article data-state={state.broken ? 'broken' : 'active'} key={state.seal.name}>
                    <span aria-hidden="true">{state.seal.glyph}</span>
                    <div>
                      <small>
                        {state.seal.label} · 전선 0{state.lane.lane + 1}
                      </small>
                      <strong>{state.seal.name}</strong>
                      <p>{state.broken ? state.seal.requirement : state.seal.pressure}</p>
                    </div>
                    <b>{state.broken ? '왕관 파쇄' : '칙령 유지'}</b>
                  </article>
                ) : null,
              )}
            </div>
            <footer data-mastery={battleResult.crownMasteryBonus > 0 ? 'true' : 'false'}>
              <span>
                {battleResult.victory
                  ? battleResult.crownMasteryBonus > 0
                    ? '세 칙령을 모두 해제해 백색 왕의 완전한 패배를 기록했습니다.'
                    : '승리 조건을 넘긴 칙령의 파편이 최종 명성에 반영되었습니다.'
                  : defeatEndsRun
                    ? '귀환 온기가 모두 소진되어 이 왕좌 판정이 원정의 마지막 전투로 기록됩니다.'
                    : finalCrownMechanicBlocked
                      ? `전선은 버텼지만 칙령 ${FINAL_CROWN_REQUIRED_SEALS}개 해제 조건을 충족하지 못했습니다.`
                      : '같은 밤에 명령·집중·배치를 바꾸면 칙령 판정을 다시 시도할 수 있습니다.'}
              </span>
              {battleResult.crownMasteryBonus > 0 ? (
                <b>TRIPLE CROWN MASTERY · +{battleResult.crownMasteryBonus.toLocaleString('ko-KR')}</b>
              ) : null}
            </footer>
          </section>
        ) : null}

        {finalCrownResult ? (
          <section
            className="result-final-threshold"
            data-state={
              battleResult.victory ? (finalCrownMastered ? 'mastered' : 'opened') : defeatEndsRun ? 'ended' : 'sealed'
            }
            aria-label={
              battleResult.victory
                ? '왕좌에서 마지막 새벽으로 가는 길'
                : defeatEndsRun
                  ? '최종 왕관 원정 종료 판정'
                  : '최종 왕관 재도전 경로'
            }
          >
            <header>
              <span aria-hidden="true">{battleResult.victory ? '☼' : '♜'}</span>
              <div>
                <small>
                  {battleResult.victory
                    ? 'THRONE FALL · DAWN ROUTE OPEN'
                    : defeatEndsRun
                      ? 'LAST EMBER · EXPEDITION CLOSED'
                      : 'THRONE RETRY · SAME NIGHT'}
                </small>
                <strong>
                  {battleResult.victory
                    ? finalCrownMastered
                      ? '세 칙령의 파편이 마지막 새벽으로 길을 냅니다'
                      : '무너진 왕좌 너머로 첫 수평선이 열립니다'
                    : defeatEndsRun
                      ? '이 왕좌 판정이 이번 원정의 마지막 전투가 됩니다'
                      : finalCrownMechanicBlocked
                        ? `방어선은 버텼습니다. 남은 칙령 ${finalCrownMissingSeals}개만 고치면 됩니다.`
                        : `승리 전선 ${finalCrownMissingFronts}곳을 더 확보하면 왕좌를 다시 흔들 수 있습니다.`}
                </strong>
                <p>
                  {battleResult.victory
                    ? '계속하면 방금 전투의 실제 칙령 판정과 최후의 맹세를 그대로 이어 받아, 원정 보상을 확정하고 새벽의 이름을 기록합니다.'
                    : defeatEndsRun
                      ? `귀환 온기를 모두 잃어 같은 밤으로 돌아갈 수 없습니다. ${primaryFailureInsight ? `${primaryFailureInsight.action} 이 처방은 다음 원정의 왕좌 공략 기록에 남습니다.` : '전투 성과와 붕괴 원인은 다음 원정을 위한 기록으로 남습니다.'}`
                      : primaryFailureInsight
                        ? `${primaryFailureInsight.action} 적 구성과 현재 명령·화로 집중은 유지되므로 바꾼 한 수의 효과를 바로 비교할 수 있습니다.`
                        : '적 구성과 현재 명령·화로 집중은 유지됩니다. 같은 왕좌 앞에서 진형을 고쳐 다시 판정받을 수 있습니다.'}
                </p>
              </div>
              <b>
                {battleResult.victory
                  ? finalCrownMastered
                    ? 'PERFECT SHATTER'
                    : 'DAWN UNSEALED'
                  : defeatEndsRun
                    ? 'LAST STAND'
                    : finalCrownMissingSeals > 0
                      ? `칙령 ${finalCrownMissingSeals}개 부족`
                      : `전선 ${finalCrownMissingFronts}곳 부족`}
              </b>
            </header>
            <dl aria-label="최종 왕관 판정 요약">
              <div data-state={battleResult.wins >= REQUIRED_LANE_WINS ? 'complete' : 'missing'}>
                <dt>최종 방어선</dt>
                <dd>
                  {battleResult.wins} / 3 · {battleResult.wins >= REQUIRED_LANE_WINS ? '충족' : '미달'}
                </dd>
              </div>
              <div data-state={resultCrownBreakCount >= FINAL_CROWN_REQUIRED_SEALS ? 'complete' : 'missing'}>
                <dt>왕관 칙령</dt>
                <dd>
                  {resultCrownBreakCount} / 3 · {resultCrownBreakCount >= FINAL_CROWN_REQUIRED_SEALS ? '충족' : '미달'}
                </dd>
              </div>
              <div data-state={battleResult.victory || finalCrownReturnHeat > 0 ? 'complete' : 'missing'}>
                <dt>{battleResult.victory ? '새벽의 온기' : '귀환 온기'}</dt>
                <dd>{finalCrownReturnHeat}%</dd>
              </div>
            </dl>
            <footer>
              {battleResult.victory
                ? `최종 전선 ${battleResult.wins} / 3 · 실제 칙령 ${resultCrownBreakCount} / 3 · 피날레 기록 준비 완료`
                : defeatEndsRun
                  ? `최종 전선 ${battleResult.wins} / 3 · 실제 칙령 ${resultCrownBreakCount} / 3 · 원정 결말 기록 준비`
                  : `복구 보급 +${battleResult.supplyReward} · 같은 NIGHT 12 · 왕좌 판정 정보 유지`}
            </footer>
          </section>
        ) : null}

        {finalMarchGate ? (
          <section
            className="result-final-gate"
            data-state={battleResult.victory ? (resolvedDoctrineLane?.doctrineBroken ? 'mastered' : 'forced') : 'held'}
            aria-label={`${finalMarchGate.name} 결과`}
          >
            <header>
              <span>FINAL MARCH VERDICT</span>
              <strong>
                GATE 0{finalMarchGate.night - 8} / 03 ·{' '}
                {battleResult.victory
                  ? resolvedDoctrineLane?.doctrineBroken
                    ? '완전 돌파'
                    : '강행 돌파'
                  : '관문 유지'}
              </strong>
            </header>
            <div>
              <span aria-hidden="true">{finalMarchGate.glyph}</span>
              <div>
                <small>{finalMarchGate.label}</small>
                <strong>{finalMarchGate.name}</strong>
                <p>
                  {battleResult.victory
                    ? resolvedDoctrineLane?.doctrineBroken
                      ? finalMarchGate.lesson
                      : '정예 교리를 완전히 꺾지는 못했지만 두 전선을 지켜 관문을 통과했습니다.'
                    : `${ENEMY_DOCTRINES[finalMarchGate.doctrine].counterplay} 같은 밤의 관문에 다시 도전할 수 있습니다.`}
                </p>
              </div>
              <b>{battleResult.victory ? (resolvedDoctrineLane?.doctrineBroken ? 'MASTERED' : 'BREACHED') : 'RETRY'}</b>
            </div>
            {finalMarchHandoff ? (
              <footer className="result-final-gate-handoff" data-final={finalMarchHandoff.final ? 'true' : 'false'}>
                <div className="result-final-gate-route" aria-hidden="true">
                  <span data-state="cleared">GATE 0{finalMarchGate.night - 8} CLEARED</span>
                  <i />
                  <span data-state="next">{finalMarchHandoff.routeLabel}</span>
                </div>
                <div className="result-final-gate-next">
                  <span aria-hidden="true">{finalMarchHandoff.targetGlyph}</span>
                  <div>
                    <small>
                      NEXT NIGHT {String(game.day + 1).padStart(2, '0')} · {finalMarchHandoff.story.location} ·{' '}
                      {finalMarchHandoff.story.weather}
                    </small>
                    <strong>{finalMarchHandoff.story.title}</strong>
                    <p>{finalMarchHandoff.story.omen}</p>
                  </div>
                  <b>
                    <small>{finalMarchHandoff.targetLabel}</small>
                    {finalMarchHandoff.targetName}
                  </b>
                </div>
                <dl aria-label="다음 밤 위험과 왕관 준비">
                  <div>
                    <dt>다음 위협 · {finalMarchHandoff.threatName}</dt>
                    <dd>{finalMarchHandoff.directive}</dd>
                  </div>
                  <div>
                    <dt>{finalMarchHandoff.final ? '왕좌 진입 조건' : '왕관전 연결'}</dt>
                    <dd>{finalMarchHandoff.preparation}</dd>
                  </div>
                </dl>
              </footer>
            ) : (
              <footer>
                {battleResult.victory
                  ? nextFinalMarchGate
                    ? `다음 관문 · NIGHT ${String(nextFinalMarchGate.night).padStart(2, '0')} ${nextFinalMarchGate.name}`
                    : '세 관문 돌파 · 백색 왕의 왕좌가 열립니다.'
                  : `귀환 온기 ${Math.max(0, game.heat + battleResult.heatDelta)}% · 전선을 재정비해 다시 돌파하세요.`}
              </footer>
            )}
          </section>
        ) : null}

        {!battleResult.victory && primaryFailureInsight ? (
          <section
            className="result-recovery-report"
            data-terminal={defeatEndsRun ? 'true' : 'false'}
            aria-label={defeatEndsRun ? '마지막 전투 패배 원인 기록' : '패배 원인과 재도전 처방'}
          >
            <header>
              <span>{defeatEndsRun ? 'FINAL DEBRIEF' : 'RETRY BRIEFING'}</span>
              <strong>
                패배 원인 {defeatInsights.length}개 ·{' '}
                {defeatEndsRun ? '마지막 전투 기록' : `누적 후퇴 ${priorDefeatCount + 1}회`}
              </strong>
            </header>
            <div className="recovery-primary">
              <span aria-hidden="true">{primaryFailureInsight.glyph}</span>
              <div>
                <small>가장 먼저 수정</small>
                <strong>{primaryFailureInsight.label}</strong>
                <p>{primaryFailureInsight.action}</p>
              </div>
              <b>격차 {primaryFailureInsight.gap}</b>
            </div>
            <div className="recovery-lanes">
              {defeatInsights.map((insight) => (
                <article data-cause={insight.cause} key={insight.lane}>
                  <span>0{insight.lane + 1}</span>
                  <div>
                    <strong>{insight.label}</strong>
                    <p>{insight.detail}</p>
                    <em>{insight.action}</em>
                  </div>
                  <b>{insight.gap > 0 ? `-${insight.gap}` : '근소 열세'}</b>
                </article>
              ))}
            </div>
            <dl className="recovery-economy" aria-label="후퇴 복구 규칙">
              <div>
                <dt>{defeatEndsRun ? '마지막 회수 보급' : '이번 복구 보급'}</dt>
                <dd>{defeatEndsRun ? '기록만 유지' : `+${battleResult.supplyReward}`}</dd>
              </div>
              <div>
                <dt>{defeatEndsRun ? '최종 복구 기록' : '보호 중 복구 보급'}</dt>
                <dd>◈ {projectedRecoverySupplies}</dd>
              </div>
              <div>
                <dt>{defeatEndsRun ? '같은 밤 재도전' : '다음 후퇴 예상'}</dt>
                <dd>{defeatEndsRun ? '종료' : `+${nextRetreatSupply}`}</dd>
              </div>
              <div>
                <dt>{defeatEndsRun ? '왕좌 전술 처방' : '다음 신호탄 복구'}</dt>
                <dd>{defeatEndsRun ? '결말에 기록' : `−${nextRecoveryRecruitDiscount}`}</dd>
              </div>
            </dl>
            <footer>
              {defeatEndsRun
                ? '귀환 온기가 모두 소진되어 같은 밤의 정보는 재도전에 사용되지 않습니다. 마지막 전선의 붕괴 원인과 전술 처방은 결말 기록에 남아 다음 원정의 왕좌 공략 기준이 됩니다.'
                : '적 진형·의도와 현재 명령·화로 집중은 유지됩니다. 복구 보급은 화로·신호탄·유료 결단에 사용한 만큼 먼저 줄고, 남은 양만 행군 봉인에서 보호됩니다. 파훼 기록과 명성은 밤을 지켜낸 전투만 인정되며 신호탄 비용은 후퇴마다 2씩, 최대 6까지 낮아집니다.'}
            </footer>
          </section>
        ) : null}

        <details className="result-contribution-ledger">
          <summary>
            <span>
              <small>BATTLE CONTRIBUTION LEDGER</small>
              <strong>
                <span className="result-ledger-label-closed">전투 판정 근거 펼치기</span>
                <span className="result-ledger-label-open">전투 판정 근거 접기</span>
              </strong>
            </span>
            <b>{contributionSystemCount}개 체계</b>
            <i aria-hidden="true">⌄</i>
          </summary>
          <div className="result-contribution-ledger-body">
            {resolvedDoctrineLane?.enemy.doctrine ? (
              <section
                className="result-doctrine-report"
                data-state={resolvedDoctrineLane.doctrineBroken ? 'broken' : 'active'}
                aria-label="이번 전투의 정예 교리"
              >
                <header>
                  <span>ELITE DOCTRINE REPORT</span>
                  <strong>
                    {resolvedDoctrineLane.doctrineBroken
                      ? battleResult.victory
                        ? '파훼 성공 · 교리 명성 보너스'
                        : '교리 파훼'
                      : '파훼 실패 · 압박 유지'}
                  </strong>
                </header>
                <div>
                  <b aria-hidden="true">{ENEMY_DOCTRINES[resolvedDoctrineLane.enemy.doctrine].glyph}</b>
                  <div>
                    <small>
                      {resolvedDoctrineLane.enemy.name} · {ENEMY_DOCTRINES[resolvedDoctrineLane.enemy.doctrine].label}
                    </small>
                    <strong>{ENEMY_DOCTRINES[resolvedDoctrineLane.enemy.doctrine].name}</strong>
                    <p>{ENEMY_DOCTRINES[resolvedDoctrineLane.enemy.doctrine].description}</p>
                  </div>
                  <em>
                    <b>
                      정예 위협 {resolvedDoctrineLane.doctrineMultiplier > 1 ? '+' : ''}
                      {Math.round((resolvedDoctrineLane.doctrineMultiplier - 1) * 100)}%
                    </b>
                    {ENEMY_DOCTRINES[resolvedDoctrineLane.enemy.doctrine].counterplay}
                  </em>
                </div>
              </section>
            ) : null}

            {activeResonances.length > 0 ? (
              <section className="result-resonance-report" aria-label="이번 전투의 유물 공명">
                <header>
                  <span>ACTIVE RELIC RESONANCE</span>
                  <strong>{activeResonances.length}개 공명 연결</strong>
                </header>
                <div>
                  {activeResonances.map((resonanceId) => {
                    const triggered = battleResult.lanes.some((lane) => lane.resonanceIds.includes(resonanceId))
                    const rewardApplied = resonanceId === 'long-road-ledger' && battleResult.victory
                    return (
                      <article data-triggered={triggered || rewardApplied ? 'true' : 'false'} key={resonanceId}>
                        <b aria-hidden="true">{RESONANCES[resonanceId].glyph}</b>
                        <div>
                          <small>
                            {RESONANCES[resonanceId].category} ·{' '}
                            {triggered ? '전투 발동' : rewardApplied ? '보상 적용' : '조건 대기'}
                          </small>
                          <strong>{RESONANCES[resonanceId].name}</strong>
                          <p>{RESONANCES[resonanceId].description}</p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ) : null}

            {battleLegacyEntries.length > 0 ? (
              <section className="result-legacy-report" aria-label="이번 교전의 계승 유산 기여">
                <header>
                  <span>INHERITED EFFECT VERDICT</span>
                  <strong>
                    {battleLegacyEntries.filter((entry) => entry.state === 'applied').length} /{' '}
                    {battleLegacyEntries.length} 실효 보정
                  </strong>
                </header>
                <div>
                  {battleLegacyEntries.map((entry) => (
                    <article data-state={entry.state} key={entry.id}>
                      <b aria-hidden="true">{LEGACY_UPGRADES[entry.id].glyph}</b>
                      <div>
                        <small>{entry.stage}</small>
                        <strong>{LEGACY_UPGRADES[entry.id].name}</strong>
                        <p>{entry.detail}</p>
                      </div>
                      <em>
                        <strong>{entry.value}</strong>
                        <small>{entry.badge}</small>
                      </em>
                    </article>
                  ))}
                </div>
                <footer>합계가 아니라 현재 위험도·교리·반올림을 모두 거친 실제 추가분만 분리했습니다.</footer>
              </section>
            ) : null}

            {game.masteryContract ? (
              <section
                className="result-contract-report"
                data-state={battleResult.victory ? 'applied' : 'waiting'}
                aria-label="이번 교전의 영원 계약 기여"
              >
                <span aria-hidden="true">{MASTERY_CONTRACTS[game.masteryContract].glyph}</span>
                <div>
                  <small>{MASTERY_CONTRACTS[game.masteryContract].label} · BATTLE VERDICT</small>
                  <strong>{MASTERY_CONTRACTS[game.masteryContract].name}</strong>
                  <p>
                    {battleResult.victory
                      ? `계승 효과까지 반영한 명성 +${(
                          battleResult.scoreReward - battleResult.contractScoreBonus
                        ).toLocaleString('ko-KR')}에 계약 배율 ×${MASTERY_CONTRACTS[
                          game.masteryContract
                        ].scoreScale.toFixed(2)}와 반올림을 적용했습니다.`
                      : `이번 후퇴에는 승리 명성이 없어 계약 배율은 대기합니다. ${MASTERY_CONTRACTS[game.masteryContract].burden}은 계속 유지됩니다.`}
                  </p>
                </div>
                <b>
                  {battleResult.victory
                    ? `실제 +${battleResult.contractScoreBonus.toLocaleString('ko-KR')} 기여`
                    : MASTERY_CONTRACTS[game.masteryContract].reward}
                </b>
              </section>
            ) : null}

            <section
              className="result-protocol-report"
              data-difficulty={game.difficulty}
              aria-label={`${difficultyProtocol.name} 고유 규칙 결과`}
            >
              <span aria-hidden="true">{difficultyProtocol.glyph}</span>
              <div>
                <small>
                  {difficultyProtocol.label} · {difficultyProtocol.name}
                </small>
                <strong>{difficultyProtocol.ruleName}</strong>
                <p>{resultProtocolCopy}</p>
                {resultProtocolMastery ? (
                  <small className="result-protocol-mastery-copy" data-state={resultProtocolMastery.state}>
                    {resultProtocolMastery.copy}
                  </small>
                ) : null}
              </div>
              <b>
                {battleResult.victory
                  ? battleResult.protocolScoreBonus > 0
                    ? `보급 +${battleResult.protocolSupplyBonus} · 완벽 명성`
                    : battleResult.protocolSupplyBonus > 0
                      ? `보급 +${battleResult.protocolSupplyBonus}`
                      : '고유 규칙 적용'
                  : `복구 보급 +${battleResult.supplyReward} · 명성 없음`}
              </b>
            </section>
          </div>
        </details>

        <button className="result-continue result-continue-after-report" type="button" onClick={continueAfterBattle}>
          <span>{continueLabel}</span>
          <i aria-hidden="true">›</i>
        </button>
      </section>
    </div>
  )
}

type BuildDoctrineView = {
  id: ResonanceId | null
  state: string
  title: string
  description: string
}

type RelicChoiceInsightView = {
  relicId: RelicId
  label: string
  reason: string
}

type ResonancePreviewView = {
  id: ResonanceId
  partner: RelicId
  completes: boolean
}

type RelicDialogProps = {
  game: GameState
  currentBuildDoctrine: BuildDoctrineView
  relicChoices: readonly RelicId[]
  relicChoiceInsights: readonly RelicChoiceInsightView[]
  recommendedRelicId: RelicId | null
  activeResonances: readonly ResonanceId[]
  previewRelicChoice: (relicId: RelicId) => void
  chooseRelic: (relicId: RelicId) => void
  resonancePreviewFor: (relicId: RelicId, owned: readonly RelicId[]) => ResonancePreviewView | null
}

export function RelicDialog({
  game,
  currentBuildDoctrine,
  relicChoices,
  relicChoiceInsights,
  recommendedRelicId,
  activeResonances,
  previewRelicChoice,
  chooseRelic,
  resonancePreviewFor,
}: RelicDialogProps) {
  const [selectedRelicId, setSelectedRelicId] = useState<RelicId | null>(null)
  const selectedRelic = selectedRelicId ? RELICS[selectedRelicId] : null
  const selectedResonancePreview = selectedRelicId ? resonancePreviewFor(selectedRelicId, game.relics) : null
  const selectedResonance = selectedResonancePreview ? RESONANCES[selectedResonancePreview.id] : null
  const selectedTacticalFit = selectedRelicId
    ? (relicChoiceInsights.find((insight) => insight.relicId === selectedRelicId) ?? null)
    : null
  const selectedIsRecommended = selectedRelicId === recommendedRelicId

  function selectRelicForPreview(relicId: RelicId) {
    if (selectedRelicId === relicId) return
    setSelectedRelicId(relicId)
    previewRelicChoice(relicId)
  }

  function clearRelicPreview() {
    if (!selectedRelicId) return
    const relicId = selectedRelicId
    setSelectedRelicId(null)
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-relic-id="${relicId}"]`)?.focus({ preventScroll: true })
    })
  }

  return (
    <div
      className="modal-backdrop relic-backdrop"
      role="presentation"
      data-selection={selectedRelicId ? 'true' : 'false'}
    >
      <section
        className="relic-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="relic-title"
        data-focus-scope="relic"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key !== 'Escape' || !selectedRelicId) return
          event.preventDefault()
          event.stopPropagation()
          clearRelicPreview()
        }}
      >
        <header>
          <p className="eyebrow">NIGHT {String(game.day - 1).padStart(2, '0')} · RELIC RECOVERED</p>
          <h2 id="relic-title">얼음 아래에서 발견한 것</h2>
          <p>하나의 유물만 화로에 각인할 수 있습니다. 선택은 이번 원정이 끝날 때까지 이어집니다.</p>
        </header>
        <section className="relic-build-context" data-state={currentBuildDoctrine.state} aria-label="현재 원정 빌드">
          <span aria-hidden="true">{currentBuildDoctrine.id ? RESONANCES[currentBuildDoctrine.id].glyph : '∞'}</span>
          <div>
            <small>CURRENT EXPEDITION BUILD</small>
            <strong>{currentBuildDoctrine.title}</strong>
            <p>{currentBuildDoctrine.description}</p>
          </div>
          <div className="relic-owned-chain">
            {game.relics.length > 0 ? (
              game.relics.map((relicId) => (
                <span title={RELICS[relicId].name} key={relicId}>
                  <b aria-hidden="true">{RELICS[relicId].glyph}</b>
                  {RELICS[relicId].name}
                </span>
              ))
            ) : (
              <small>아직 각인된 유물이 없습니다.</small>
            )}
          </div>
        </section>
        <div className="relic-options">
          {relicChoices.map((relicId, index) => {
            const relic = RELICS[relicId]
            const resonancePreview = resonancePreviewFor(relicId, game.relics)
            const resonance = resonancePreview ? RESONANCES[resonancePreview.id] : null
            const tacticalFit = relicChoiceInsights.find((insight) => insight.relicId === relicId)
            const recommended = relicId === recommendedRelicId
            return (
              <button
                type="button"
                onClick={() => selectRelicForPreview(relicId)}
                aria-pressed={selectedRelicId === relicId}
                data-autofocus={recommended ? 'true' : undefined}
                data-recommended={recommended ? 'true' : 'false'}
                data-selected={selectedRelicId === relicId ? 'true' : 'false'}
                data-resonance={resonancePreview?.completes ? 'complete' : resonancePreview ? 'path' : 'none'}
                data-relic-id={relicId}
                key={relicId}
              >
                <span className="relic-option-number">0{index + 1}</span>
                {recommended ? <span className="relic-recommendation">CURRENT FIT · BEST</span> : null}
                <span className="relic-option-glyph" aria-hidden="true">
                  {relic.glyph}
                </span>
                <small>{relic.category}</small>
                <strong>{relic.name}</strong>
                <p>{relic.description}</p>
                <em>{relic.detail}</em>
                {tacticalFit ? (
                  <span className="relic-tactical-fit" data-recommended={recommended ? 'true' : 'false'}>
                    <span>TACTICAL FIT · 현재 원정</span>
                    <strong>{tacticalFit.label}</strong>
                    <small>{tacticalFit.reason}</small>
                  </span>
                ) : null}
                {resonancePreview && resonance ? (
                  <span
                    className="relic-resonance-preview"
                    data-state={resonancePreview.completes ? 'complete' : 'path'}
                  >
                    <span>{resonancePreview.completes ? 'RESONANCE COMPLETE' : 'RESONANCE PATH'}</span>
                    <strong>
                      <i aria-hidden="true">{resonance.glyph}</i>
                      {resonance.name}
                    </strong>
                    <small>
                      {resonancePreview.completes
                        ? resonance.description
                        : `${RELICS[resonancePreview.partner].name}과 함께 각인하면 공명이 열립니다.`}
                    </small>
                  </span>
                ) : null}
                <b>
                  {selectedRelicId === relicId
                    ? '선택됨 · 각인 확정 대기'
                    : resonancePreview?.completes
                      ? '공명 완성 미리 보기'
                      : '이 유물 선택'}{' '}
                  <i aria-hidden="true">›</i>
                </b>
              </button>
            )
          })}
        </div>
        <footer>
          <span>
            보유 유물 {game.relics.length} / 5 · 활성 공명 {activeResonances.length}
          </span>
          <span>공명을 완성할 수 있다면 관련 유물이 반드시 나타납니다</span>
        </footer>

        {selectedRelicId && selectedRelic ? (
          <aside
            className="relic-commit-dock"
            data-state={
              selectedResonancePreview?.completes ? 'complete' : selectedIsRecommended ? 'recommended' : 'ready'
            }
            aria-live="polite"
            aria-label={`${selectedRelic.name} 각인 미리보기`}
          >
            <span className="relic-commit-glyph" aria-hidden="true">
              {selectedRelic.glyph}
            </span>
            <div className="relic-commit-copy">
              <small>
                {selectedRelic.category} · ENGRAVING PREVIEW
                {selectedIsRecommended ? <b>현재 원정 추천</b> : null}
              </small>
              <strong>{selectedRelic.name}</strong>
              <p>{selectedTacticalFit?.reason ?? selectedRelic.description}</p>
            </div>

            <div
              className="relic-commit-equation"
              data-state={
                selectedResonancePreview?.completes ? 'complete' : selectedResonancePreview ? 'path' : 'effect'
              }
            >
              {selectedResonancePreview && selectedResonance ? (
                <>
                  <span data-owned={selectedResonancePreview.completes ? 'true' : 'false'}>
                    <i aria-hidden="true">{RELICS[selectedResonancePreview.partner].glyph}</i>
                    {RELICS[selectedResonancePreview.partner].name}
                  </span>
                  <b aria-hidden="true">+</b>
                  <span data-owned="selected">
                    <i aria-hidden="true">{selectedRelic.glyph}</i>
                    {selectedRelic.name}
                  </span>
                  <b aria-hidden="true">=</b>
                  <strong>
                    <i aria-hidden="true">{selectedResonance.glyph}</i>
                    {selectedResonance.name}
                  </strong>
                  <small>
                    {selectedResonancePreview.completes
                      ? `지금 각인하면 ${selectedResonance.description}`
                      : `${RELICS[selectedResonancePreview.partner].name}을 나중에 각인하면 ${selectedResonance.description}`}
                  </small>
                </>
              ) : (
                <>
                  <span data-owned="selected">
                    <i aria-hidden="true">{selectedRelic.glyph}</i>
                    {selectedRelic.name}
                  </span>
                  <b aria-hidden="true">→</b>
                  <strong>{selectedTacticalFit?.label ?? '유물 효과 적용'}</strong>
                  <small>{selectedRelic.description}</small>
                </>
              )}
            </div>

            <div className="relic-commit-actions">
              <button type="button" onClick={clearRelicPreview}>
                다른 유물 비교
              </button>
              <button type="button" onClick={() => chooseRelic(selectedRelicId)}>
                <span>
                  {selectedResonancePreview?.completes && selectedResonance
                    ? `${selectedResonance.name} 공명 완성`
                    : `${selectedRelic.name} 각인 확정`}
                </span>
                <i aria-hidden="true">›</i>
              </button>
            </div>
          </aside>
        ) : null}
      </section>
    </div>
  )
}
