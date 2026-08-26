import type { DeploymentForecast, Enemy, LaneResult, Unit } from './game-model'
import {
  ENEMY_DOCTRINES,
  FINAL_MARCH_IMPRINTS,
  INTENT_META,
  KIND_META,
  RESONANCES,
  SPECIALIZATIONS,
  TIER_LABELS,
} from './game-model'

type EnemyFormationEntry = {
  enemy: Enemy
  lane: number
  doctrineBroken: boolean
  estimatedThreat: number
}

type EnemyFormationProps = {
  entries: readonly EnemyFormationEntry[]
}

type DecisionEchoView = {
  glyph: string
  effect: string
}

type FinalVowView = {
  id: string
  glyph: string
  effect: string
}

type PlayerFormationProps = {
  lineupUnits: readonly (Unit | null)[]
  forecasts: readonly (LaneResult | null)[]
  selectedUnit: Unit | null
  deploymentForecasts: readonly DeploymentForecast[]
  recommendedDeploymentLane: number | null
  selectedUnitId: string | null
  focusLane: number
  tutorialDeploy: boolean
  activeDecisionEcho: DecisionEchoView | null
  activeFinalVow: FinalVowView | null
  getSurvivorName: (unit: Unit) => string
  onClearSelection: () => void
  onDeploy: (lane: number) => void
}

const DEPLOYMENT_ACTION_LABELS: Record<DeploymentForecast['action'], string> = {
  current: '현재 배치',
  deploy: '빈 전선 배치',
  replace: '교체 배치',
  move: '전선 이동',
  swap: '자리 교환',
}

function deploymentOutcomeLabel(forecast: DeploymentForecast): string {
  if (forecast.action === 'current') return forecast.won ? '현재 방어' : '현재 붕괴 위험'
  if (forecast.securesVictory) return '원정 승리선 확보'
  if (forecast.losesVictory) return '원정 승리선 상실'
  if (!forecast.lineupReadyBefore && forecast.lineupReadyAfter) return '3인 대열 완성'
  if (forecast.currentWon === null) return forecast.won ? '빈 전선 → 방어' : '빈 전선 → 붕괴 위험'
  if (forecast.securesLane) return '붕괴 → 방어'
  if (forecast.losesLane) return '방어 → 붕괴'
  if (forecast.winsAfter > forecast.winsBefore) {
    return `방어 전선 ${forecast.winsBefore} → ${forecast.winsAfter}`
  }
  if (forecast.winsAfter < forecast.winsBefore) {
    return `방어 전선 ${forecast.winsBefore} → ${forecast.winsAfter}`
  }
  return forecast.won ? '방어 유지' : '붕괴 위험'
}

export function EnemyFormation({ entries }: EnemyFormationProps) {
  return (
    <section className="enemy-line" aria-label="적 진형">
      {entries.map(({ enemy, lane, doctrineBroken, estimatedThreat }) => {
        const kindMeta = KIND_META[enemy.kind]
        return (
          <article
            className={`enemy-card kind-${enemy.kind} ${enemy.elite ? 'is-elite' : ''} ${enemy.doctrine ? 'has-doctrine' : ''}`}
            data-doctrine-state={enemy.doctrine ? (doctrineBroken ? 'broken' : 'active') : undefined}
            key={enemy.id}
          >
            <div className="lane-number">0{lane + 1}</div>
            <div className="enemy-sigil" aria-hidden="true">
              {kindMeta.glyph}
            </div>
            <div className="enemy-info">
              <span>
                {enemy.elite ? '정예 · ' : ''}
                {kindMeta.role}
              </span>
              <strong>{enemy.name}</strong>
              <small>위협 약 {estimatedThreat}</small>
              {enemy.doctrine ? (
                <span className="enemy-doctrine-chip" title={ENEMY_DOCTRINES[enemy.doctrine].counterplay}>
                  <b aria-hidden="true">{ENEMY_DOCTRINES[enemy.doctrine].glyph}</b>
                  {ENEMY_DOCTRINES[enemy.doctrine].name}
                  <i>{doctrineBroken ? '파훼' : '압박'}</i>
                </span>
              ) : null}
            </div>
            <div className="tier-badge">{TIER_LABELS[enemy.tier]}</div>
            <span className="intent-chip" title={INTENT_META[enemy.intent].description}>
              <b aria-hidden="true">{INTENT_META[enemy.intent].glyph}</b>
              {INTENT_META[enemy.intent].name}
            </span>
          </article>
        )
      })}
    </section>
  )
}

export function PlayerFormation({
  lineupUnits,
  forecasts,
  selectedUnit,
  deploymentForecasts,
  recommendedDeploymentLane,
  selectedUnitId,
  focusLane,
  tutorialDeploy,
  activeDecisionEcho,
  activeFinalVow,
  getSurvivorName,
  onClearSelection,
  onDeploy,
}: PlayerFormationProps) {
  const selectedMeta = selectedUnit ? KIND_META[selectedUnit.kind] : null
  const recommendedForecast =
    recommendedDeploymentLane === null
      ? null
      : (deploymentForecasts.find((forecast) => forecast.lane === recommendedDeploymentLane) ?? null)

  return (
    <section
      className="player-line"
      aria-label="우리 진형"
      data-deployment-active={selectedUnit ? 'true' : undefined}
      data-tutorial-highlight={tutorialDeploy ? 'true' : 'false'}
    >
      {selectedUnit && selectedMeta ? (
        <section
          className={`deployment-planner kind-${selectedUnit.kind}`}
          data-outcome={recommendedForecast?.outcome ?? 'tie'}
          aria-label={`${getSurvivorName(selectedUnit)} 배치 모의. ${
            recommendedForecast
              ? `${recommendedForecast.lane + 1}전선 ${DEPLOYMENT_ACTION_LABELS[recommendedForecast.action]} 추천, ${deploymentOutcomeLabel(recommendedForecast)}`
              : '추천 동률, 아래 세 전선의 결과를 비교하세요'
          }`}
        >
          <span className="deployment-planner-glyph" aria-hidden="true">
            {selectedMeta.glyph}
          </span>
          <span className="deployment-planner-copy">
            <small>배치 모의 · 선택한 생존자</small>
            <strong>
              {getSurvivorName(selectedUnit)} · {selectedMeta.name} · {TIER_LABELS[selectedUnit.tier]}
            </strong>
            <span>
              {recommendedForecast
                ? `${deploymentOutcomeLabel(recommendedForecast)} · 방어 전선 ${recommendedForecast.winsBefore} → ${recommendedForecast.winsAfter}`
                : '예상 결과가 같은 전선은 집중·명령 계획에 맞춰 선택하세요.'}
            </span>
          </span>
          <span className="deployment-planner-verdict" data-current={recommendedForecast?.action === 'current'}>
            {recommendedForecast
              ? recommendedForecast.action === 'current'
                ? `0${recommendedForecast.lane + 1} 현재 최적`
                : `0${recommendedForecast.lane + 1} 추천`
              : '전선별 비교'}
            <small>전선을 눌러 적용</small>
          </span>
          <button
            className="deployment-planner-close"
            type="button"
            aria-label={`${getSurvivorName(selectedUnit)} 배치 모의 닫기`}
            title="배치 모의 닫기"
            onClick={onClearSelection}
          >
            ×
          </button>
        </section>
      ) : null}
      {lineupUnits.map((unit, lane) => {
        const meta = unit ? KIND_META[unit.kind] : null
        const forecast = forecasts[lane]
        const relation = forecast?.relation ?? null
        const deploymentForecast = deploymentForecasts.find((candidate) => candidate.lane === lane) ?? null
        const deploymentOutcome = deploymentForecast ? deploymentOutcomeLabel(deploymentForecast) : null
        const deploymentAction = deploymentForecast ? DEPLOYMENT_ACTION_LABELS[deploymentForecast.action] : null
        const recommended = recommendedDeploymentLane === lane
        const occupantLabel = unit
          ? `${lane + 1}전선 ${getSurvivorName(unit)} ${meta?.name} ${TIER_LABELS[unit.tier]} 등급`
          : `${lane + 1}전선 비어 있음`
        return (
          <button
            className={`lineup-slot ${unit ? `kind-${unit.kind}` : 'is-empty'} ${selectedUnitId === unit?.id ? 'is-selected' : ''} ${focusLane === lane ? 'is-focused' : ''}`}
            data-lane-index={lane}
            data-deploy-state={deploymentForecast?.action}
            data-deploy-outcome={deploymentForecast?.outcome}
            data-deploy-recommended={recommended ? 'true' : undefined}
            key={`lane-${lane}`}
            type="button"
            onClick={() => onDeploy(lane)}
            aria-label={
              deploymentForecast && deploymentOutcome && deploymentAction && selectedUnit
                ? `${occupantLabel}. ${getSurvivorName(selectedUnit)} ${deploymentAction} 시 예상 전투력 ${deploymentForecast.playerPower} 대 적 위협 ${deploymentForecast.enemyPower}, ${deploymentOutcome}, 전체 방어 전선 ${deploymentForecast.winsBefore}에서 ${deploymentForecast.winsAfter}${recommended ? ', 추천 전선' : ''}`
                : occupantLabel
            }
          >
            <span className="lane-number">0{lane + 1}</span>
            {unit && meta ? (
              <>
                <span className="unit-avatar" aria-hidden="true">
                  <i className="avatar-hood" />
                  <b>{meta.glyph}</b>
                </span>
                <span className="lineup-copy">
                  <small>
                    {meta.role} · {meta.name}
                  </small>
                  <strong>{getSurvivorName(unit)}</strong>
                  {unit.specialization ? (
                    <span
                      className="veteran-tag"
                      data-active={forecast?.specializationActive ? 'true' : 'false'}
                      title={SPECIALIZATIONS[unit.specialization].description}
                    >
                      <b aria-hidden="true">{SPECIALIZATIONS[unit.specialization].glyph}</b>
                      {SPECIALIZATIONS[unit.specialization].name}
                    </span>
                  ) : null}
                  {forecast && forecast.resonanceIds.length > 0 ? (
                    <span
                      className="resonance-trigger"
                      title={forecast.resonanceIds
                        .map((resonanceId) => RESONANCES[resonanceId].description)
                        .join(' · ')}
                    >
                      <b aria-hidden="true">
                        {forecast.resonanceIds.length > 1 ? '∞' : RESONANCES[forecast.resonanceIds[0]].glyph}
                      </b>
                      {forecast.resonanceIds.length > 1
                        ? `${forecast.resonanceIds.length}중 공명`
                        : RESONANCES[forecast.resonanceIds[0]].name}{' '}
                      · +{Math.round(forecast.resonanceBonus * 100)}%
                    </span>
                  ) : null}
                  {forecast?.decisionEchoActive && activeDecisionEcho ? (
                    <span className="decision-echo-trigger" title={activeDecisionEcho.effect}>
                      <b aria-hidden="true">{activeDecisionEcho.glyph}</b>
                      과거 결정 · +{Math.round(forecast.decisionEchoBonus * 100)}%
                    </span>
                  ) : null}
                  {forecast && forecast.finalMarchImprintIds.length > 0 ? (
                    <span
                      className="final-march-imprint-trigger"
                      title={forecast.finalMarchImprintIds
                        .map((imprintId) => FINAL_MARCH_IMPRINTS[imprintId].effect)
                        .join(' · ')}
                    >
                      <b aria-hidden="true">⚑</b>
                      행군 각인 {forecast.finalMarchImprintIds.length}중 · +
                      {Math.round(forecast.finalMarchImprintBonus * 100)}%
                    </span>
                  ) : null}
                  {forecast?.finalVowActive && activeFinalVow ? (
                    <span className="final-vow-trigger" data-vow={activeFinalVow.id} title={activeFinalVow.effect}>
                      <b aria-hidden="true">{activeFinalVow.glyph}</b>
                      최후 맹세 · +{Math.round(forecast.finalVowBonus * 100)}%
                    </span>
                  ) : null}
                  <em className={`relation relation-${relation}`}>
                    {relation === 'advantage' ? '우세' : relation === 'disadvantage' ? '열세' : '대등'}
                  </em>
                  {forecast ? (
                    <small className={`power-forecast ${forecast.won ? 'will-hold' : 'will-break'}`}>
                      {forecast.playerPower} / {forecast.enemyPower} · {forecast.won ? '방어 예상' : '붕괴 위험'}
                    </small>
                  ) : null}
                </span>
                <span className="tier-badge">{TIER_LABELS[unit.tier]}</span>
                {focusLane === lane ? <span className="focus-mark">집중</span> : null}
              </>
            ) : (
              <span className="empty-lineup-copy">
                <b>+</b>
                <small>생존자 배치</small>
              </span>
            )}
            {deploymentForecast && deploymentOutcome && deploymentAction ? (
              <span className="deployment-forecast" aria-hidden="true">
                <span className="deployment-forecast-heading">
                  <b>{deploymentAction}</b>
                  <i>
                    상성{' '}
                    {deploymentForecast.relation === 'advantage'
                      ? '우세'
                      : deploymentForecast.relation === 'disadvantage'
                        ? '열세'
                        : '대등'}
                  </i>
                  {recommended ? <em>{deploymentForecast.action === 'current' ? '현재 최적' : '추천'}</em> : null}
                </span>
                <span className="deployment-forecast-power">
                  <span>
                    <small>예상</small>
                    <strong>{deploymentForecast.playerPower}</strong>
                  </span>
                  <i>/</i>
                  <span>
                    <small>위협</small>
                    <strong>{deploymentForecast.enemyPower}</strong>
                  </span>
                  {deploymentForecast.powerDelta !== null && deploymentForecast.powerDelta !== 0 ? (
                    <b data-positive={deploymentForecast.powerDelta > 0 ? 'true' : 'false'}>
                      {deploymentForecast.powerDelta > 0 ? '+' : ''}
                      {deploymentForecast.powerDelta}
                    </b>
                  ) : null}
                </span>
                <span className="deployment-forecast-result">
                  <strong>{deploymentOutcome}</strong>
                  <small>
                    방어 {deploymentForecast.winsBefore} → {deploymentForecast.winsAfter} / 3
                  </small>
                </span>
              </span>
            ) : null}
          </button>
        )
      })}
    </section>
  )
}
