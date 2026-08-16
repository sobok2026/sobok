import type { Enemy, LaneResult, Unit } from './game-model'
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
  selectedUnitId: string | null
  focusLane: number
  tutorialDeploy: boolean
  activeDecisionEcho: DecisionEchoView | null
  activeFinalVow: FinalVowView | null
  getSurvivorName: (unit: Unit) => string
  onDeploy: (lane: number) => void
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
  selectedUnitId,
  focusLane,
  tutorialDeploy,
  activeDecisionEcho,
  activeFinalVow,
  getSurvivorName,
  onDeploy,
}: PlayerFormationProps) {
  return (
    <section className="player-line" aria-label="우리 진형" data-tutorial-highlight={tutorialDeploy ? 'true' : 'false'}>
      {lineupUnits.map((unit, lane) => {
        const meta = unit ? KIND_META[unit.kind] : null
        const forecast = forecasts[lane]
        const relation = forecast?.relation ?? null
        return (
          <button
            className={`lineup-slot ${unit ? `kind-${unit.kind}` : 'is-empty'} ${selectedUnitId === unit?.id ? 'is-selected' : ''} ${focusLane === lane ? 'is-focused' : ''}`}
            data-lane-index={lane}
            key={`lane-${lane}`}
            type="button"
            onClick={() => onDeploy(lane)}
            aria-label={
              unit
                ? `${lane + 1}전선 ${getSurvivorName(unit)} ${meta?.name} ${TIER_LABELS[unit.tier]} 등급`
                : `${lane + 1}전선 비어 있음`
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
          </button>
        )
      })}
    </section>
  )
}
