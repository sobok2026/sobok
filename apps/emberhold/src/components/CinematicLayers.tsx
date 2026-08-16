import './deferred.css'

import Image from 'next/image'
import type { CSSProperties } from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import battleCinemaArt from '@/app/battle-cinema.webp'
import campaignArt from '@/app/campaign-panorama.webp'
import type {
  BattleResult,
  BossMechanic,
  FinalCrownSeal,
  GameSettings,
  GameState,
  LaneResult,
  Unit,
} from './game-model'
import {
  ACTS,
  BOSS_MECHANICS,
  ENEMY_DOCTRINES,
  FINAL_CROWN_REQUIRED_SEALS,
  FINAL_CROWN_SEALS,
  INTENT_META,
  KIND_META,
  MAX_NIGHTS,
  ORDER_META,
  REQUIRED_LANE_WINS,
  RESONANCES,
  SPECIALIZATIONS,
  TIER_LABELS,
} from './game-model'

type Snowflake = {
  left: string
  delay: string
  duration: string
  size: string
  drift: string
}

type BattleCinemaProps = {
  battleResult: BattleResult
  battleStep: number
  game: GameState
  currentActNumber: number
  storyTitle: string
  storyWeather: string
  storyLocation: string
  currentBossMechanic: BossMechanic | undefined
  currentEliteEncounter: { name: string; epithet: string } | undefined
  currentEliteDoctrine: { glyph: string; name: string } | null
  activeDecisionEcho: { glyph: string; name: string } | null
  activeFinalVow: { id: string; glyph: string; name: string } | null
  battleOpeningNarration: string
  snow: readonly Snowflake[]
  skipBattleCinema: () => void
  finalCrownSealFor: (lane: number) => FinalCrownSeal | null
  finalCrownSealBroken: (
    lane: number,
    focusLane: number,
    countered: boolean,
    relation: LaneResult['relation'],
  ) => boolean
  survivorName: (unit: Unit) => string
}

type BattleTimelineTask = {
  timer: number | null
  dueAt: number
  remaining: number
  run: () => void
}

type BattleCinemaDirectorProps = Omit<BattleCinemaProps, 'battleStep' | 'skipBattleCinema'> & {
  motion: GameSettings['motion']
  battlePace: GameSettings['battlePace']
  onLaneImpact: (lane: LaneResult, result: BattleResult) => void
  onClimax: (result: BattleResult) => void
  onComplete: (result: BattleResult) => void
  onSkip: () => void
}

export function BattleCinemaDirector({
  battleResult,
  game,
  motion,
  battlePace,
  onLaneImpact,
  onClimax,
  onComplete,
  onSkip,
  ...cinemaProps
}: BattleCinemaDirectorProps) {
  const [battleStep, setBattleStep] = useState(-1)
  const timeline = useRef<BattleTimelineTask[]>([])

  function clearTimeline() {
    for (const task of timeline.current) {
      if (task.timer !== null) window.clearTimeout(task.timer)
    }
    timeline.current = []
  }

  function armTask(task: BattleTimelineTask) {
    if (task.timer !== null) return
    const delay = Math.max(0, task.remaining)
    task.dueAt = performance.now() + delay
    task.timer = window.setTimeout(() => {
      task.timer = null
      timeline.current = timeline.current.filter((candidate) => candidate !== task)
      task.run()
    }, delay)
  }

  function schedule(delay: number, run: () => void) {
    const task: BattleTimelineTask = { timer: null, dueAt: 0, remaining: delay, run }
    timeline.current.push(task)
    if (document.visibilityState === 'visible' && document.hasFocus()) armTask(task)
  }

  function pauseTimeline() {
    const now = performance.now()
    for (const task of timeline.current) {
      if (task.timer === null) continue
      window.clearTimeout(task.timer)
      task.timer = null
      task.remaining = Math.max(0, task.dueAt - now)
    }
  }

  function resumeTimeline() {
    for (const task of timeline.current) armTask(task)
  }

  const revealLane = useEffectEvent((lane: LaneResult) => {
    setBattleStep(lane.lane)
    onLaneImpact(lane, battleResult)
  })
  const revealClimax = useEffectEvent(() => {
    setBattleStep(battleResult.lanes.length)
    onClimax(battleResult)
  })
  const completeCinema = useEffectEvent(() => onComplete(battleResult))

  useEffect(() => {
    const reducedMotion = motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const paceScale = battlePace === 'swift' ? 0.58 : 1
    const introDelay = reducedMotion ? 40 : Math.round((battleResult.boss ? 780 : 560) * paceScale)
    const laneDelay = reducedMotion ? 80 : Math.round((battleResult.boss ? 1080 : 920) * paceScale)
    const hasCrownClimax = battleResult.boss && (game.day === 4 || game.day === MAX_NIGHTS)

    for (const lane of battleResult.lanes) {
      schedule(introDelay + lane.lane * laneDelay, () => revealLane(lane))
    }
    const lanesCompleteAt = introDelay + battleResult.lanes.length * laneDelay
    if (hasCrownClimax) schedule(lanesCompleteAt, revealClimax)
    const climaxHold = hasCrownClimax
      ? reducedMotion
        ? game.day === MAX_NIGHTS
          ? 1700
          : 1500
        : Math.round((game.day === MAX_NIGHTS ? 1280 : 1180) * paceScale)
      : 0
    schedule(
      lanesCompleteAt +
        climaxHold +
        (reducedMotion ? 100 : Math.round((hasCrownClimax ? 260 : battleResult.boss ? 900 : 720) * paceScale)),
      completeCinema,
    )

    const syncActivity = () => {
      if (document.visibilityState === 'hidden' || !document.hasFocus()) pauseTimeline()
      else resumeTimeline()
    }
    const pauseForInterruption = () => pauseTimeline()
    document.addEventListener('visibilitychange', syncActivity)
    document.addEventListener('freeze', pauseForInterruption)
    document.addEventListener('resume', syncActivity)
    window.addEventListener('blur', pauseForInterruption)
    window.addEventListener('focus', syncActivity)
    window.addEventListener('pagehide', pauseForInterruption)
    window.addEventListener('pageshow', syncActivity)
    return () => {
      document.removeEventListener('visibilitychange', syncActivity)
      document.removeEventListener('freeze', pauseForInterruption)
      document.removeEventListener('resume', syncActivity)
      window.removeEventListener('blur', pauseForInterruption)
      window.removeEventListener('focus', syncActivity)
      window.removeEventListener('pagehide', pauseForInterruption)
      window.removeEventListener('pageshow', syncActivity)
      clearTimeline()
    }
  }, [battlePace, battleResult, game.day, motion])

  function skipCinema() {
    clearTimeline()
    onSkip()
  }

  return (
    <BattleCinema
      {...cinemaProps}
      battleResult={battleResult}
      battleStep={battleStep}
      game={game}
      skipBattleCinema={skipCinema}
    />
  )
}

export function BattleCinema({
  battleResult,
  battleStep,
  game,
  currentActNumber,
  storyTitle,
  storyWeather,
  storyLocation,
  currentBossMechanic,
  currentEliteEncounter,
  currentEliteDoctrine,
  activeDecisionEcho,
  activeFinalVow,
  battleOpeningNarration,
  snow,
  skipBattleCinema,
  finalCrownSealFor,
  finalCrownSealBroken,
  survivorName,
}: BattleCinemaProps) {
  const resultCrownStates =
    game.day === MAX_NIGHTS
      ? battleResult.lanes.map((lane) => ({
          seal: finalCrownSealFor(lane.lane),
          lane,
          broken: finalCrownSealBroken(lane.lane, battleResult.focusLane, lane.countered, lane.relation),
        }))
      : []
  const resultCrownBreakCount = battleResult.crownBreakCount
  const finalCrownMechanicBlocked =
    !battleResult.victory &&
    game.day === MAX_NIGHTS &&
    battleResult.wins >= REQUIRED_LANE_WINS &&
    resultCrownBreakCount < FINAL_CROWN_REQUIRED_SEALS
  const activeCinemaCrownState =
    battleStep >= 0 ? (resultCrownStates.find((state) => state.lane.lane === battleStep) ?? null) : null
  const firstCrownClimax = battleResult.boss && game.day === 4 && battleStep >= battleResult.lanes.length
  const finalCrownClimax = game.day === MAX_NIGHTS && battleStep >= battleResult.lanes.length
  const firstCrownCounterCount = battleResult.lanes.filter((lane) => lane.countered).length

  return (
    <div
      className="battle-cinema"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cinema-title"
      aria-describedby="cinema-narration"
      data-focus-scope="battle"
      data-impact={battleStep < 0 ? 'intro' : battleStep}
      data-boss={battleResult.boss ? 'true' : 'false'}
      data-boss-day={battleResult.boss ? game.day : undefined}
      data-final-crown={game.day === MAX_NIGHTS ? 'true' : 'false'}
      tabIndex={-1}
    >
      <section>
        <div className="cinema-art" aria-hidden="true">
          <Image
            src={battleResult.boss ? battleCinemaArt : campaignArt}
            alt=""
            fill
            sizes="1100px"
            style={{
              objectPosition: battleResult.boss
                ? game.day === 4
                  ? '18% center'
                  : game.day === 8
                    ? '50% 58%'
                    : '50% center'
                : `${currentActNumber === 1 ? 10 : currentActNumber === 2 ? 50 : 90}% center`,
            }}
          />
          <div className="cinema-art-grade" />
        </div>
        <div className="cinema-particles" aria-hidden="true">
          {snow.slice(0, 18).map((flake, index) => (
            <i
              key={`cinema-particle-${index}`}
              style={
                {
                  '--particle-left': flake.left,
                  '--particle-delay': flake.delay,
                  '--particle-duration': flake.duration,
                } as CSSProperties
              }
            />
          ))}
        </div>
        {firstCrownClimax ? (
          <div
            className="cinema-fragment-climax"
            data-outcome={battleResult.victory ? 'won' : 'lost'}
            aria-hidden="true"
          >
            <div className="cinema-fragment-climax-visual">
              <div className="cinema-fragment-wave">
                <i />
                <i />
                <b>{currentBossMechanic?.glyph ?? '◈'}</b>
              </div>
              <div className="cinema-fragment-lanes">
                {battleResult.lanes.map((lane) => (
                  <span
                    data-echo={lane.countered ? 'silenced' : 'resonant'}
                    data-outcome={lane.won ? 'won' : 'lost'}
                    key={lane.lane}
                  >
                    <b>0{lane.lane + 1}</b>
                    <div>
                      <small>{lane.enemy.name}</small>
                      <strong>{lane.countered ? '메아리 차단' : '메아리 증폭'}</strong>
                    </div>
                    <i>{lane.won ? 'HOLD' : 'BREAK'}</i>
                  </span>
                ))}
              </div>
              <div className="cinema-fragment-verdict-copy">
                <small>
                  FIRST CROWN VERDICT · INTENTS {firstCrownCounterCount} / 3 · FRONTS {battleResult.wins} / 3
                </small>
                <strong>
                  {battleResult.victory
                    ? firstCrownCounterCount === battleResult.lanes.length
                      ? '메아리 없는 완전 파쇄'
                      : '첫 왕관 조각 파쇄'
                    : '빈 갑옷이 다시 일어선다'}
                </strong>
                <p>
                  {battleResult.victory
                    ? firstCrownCounterCount === battleResult.lanes.length
                      ? '세 의도를 모두 끊자 빈 갑옷의 심장이 소리조차 내지 못한 채 갈라집니다.'
                      : `지켜 낸 전선 ${battleResult.wins}곳의 불씨가 남은 메아리를 밀어내고 첫 왕관 조각을 깨뜨립니다.`
                    : `지킨 전선 ${battleResult.wins}곳 · 메아리 차단 ${firstCrownCounterCount}곳. 끊지 못한 공명이 빈 갑옷을 다시 세웁니다.`}
                </p>
              </div>
            </div>
          </div>
        ) : null}
        {finalCrownClimax ? (
          <div className="cinema-crown-climax" data-outcome={battleResult.victory ? 'won' : 'lost'} aria-hidden="true">
            <div className="cinema-crown-climax-visual">
              <div className="cinema-crown-wave">
                <i />
                <i />
                <b>♜</b>
              </div>
              <div className="cinema-crown-seals">
                {resultCrownStates.map((state) =>
                  state.seal ? (
                    <span data-state={state.broken ? 'broken' : 'active'} key={state.seal.lane}>
                      <b>{state.seal.glyph}</b>
                      <small>{state.seal.name}</small>
                      <i>{state.broken ? '해제' : '잔존'}</i>
                    </span>
                  ) : null,
                )}
              </div>
              <div className="cinema-crown-verdict-copy">
                <small>
                  FINAL VERDICT · {resultCrownBreakCount} / 3 EDICTS · {battleResult.wins} / 3 FRONTS
                </small>
                <strong>
                  {battleResult.victory
                    ? resultCrownBreakCount === FINAL_CROWN_SEALS.length
                      ? '삼중 칙령 완전 파쇄'
                      : '왕관의 지배가 붕괴한다'
                    : finalCrownMechanicBlocked
                      ? '칙령이 승리선을 봉인한다'
                      : '왕관이 전선을 되감는다'}
                </strong>
                <p>
                  {battleResult.victory
                    ? `${battleResult.finalVow ? `${battleResult.finalVow.name}의 힘이 마지막 균열을 넓힙니다. ` : ''}지켜 낸 전선의 불씨가 하나로 이어지고, 백색 왕의 이름이 왕좌에서 떨어져 나갑니다.`
                    : finalCrownMechanicBlocked
                      ? `전선 ${battleResult.wins}곳은 버텼지만 칙령 해제가 ${resultCrownBreakCount} / ${FINAL_CROWN_REQUIRED_SEALS}에 그쳤습니다. 명령·집중·상성을 바꿔 왕관의 봉인을 끊어야 합니다.`
                      : '갈라진 칙령 사이로 왕의 눈보라가 다시 스며듭니다. 대열을 고쳐 마지막 밤을 되찾아야 합니다.'}
                </p>
              </div>
            </div>
          </div>
        ) : null}
        <header className="cinema-heading">
          <div>
            <p className="eyebrow">NIGHT {String(game.day).padStart(2, '0')} · ENGAGEMENT</p>
            <h2 id="cinema-title">{storyTitle}</h2>
            {currentBossMechanic ? (
              <span className="cinema-boss-tag">
                <b aria-hidden="true">{currentBossMechanic.glyph}</b>
                {currentBossMechanic.name} · {currentBossMechanic.phase}
              </span>
            ) : null}
            {currentEliteEncounter && currentEliteDoctrine ? (
              <span className="cinema-doctrine-tag">
                <b aria-hidden="true">{currentEliteDoctrine.glyph}</b>
                {currentEliteEncounter.name} · {currentEliteDoctrine.name}
              </span>
            ) : null}
            {activeDecisionEcho ? (
              <span className="cinema-echo-tag">
                <b aria-hidden="true">{activeDecisionEcho.glyph}</b>
                과거 결정 · {activeDecisionEcho.name}
              </span>
            ) : null}
            {activeFinalVow ? (
              <span className="cinema-vow-tag" data-vow={activeFinalVow.id}>
                <b aria-hidden="true">{activeFinalVow.glyph}</b>
                최후 맹세 · {activeFinalVow.name}
              </span>
            ) : null}
          </div>
          <div className="cinema-controls">
            <span>{storyWeather}</span>
            <button type="button" onClick={skipBattleCinema} data-autofocus="true">
              연출 건너뛰기 ›
            </button>
          </div>
        </header>

        <div className="cinema-narration">
          <span>
            {currentBossMechanic
              ? currentBossMechanic.epithet
              : currentEliteEncounter
                ? currentEliteEncounter.epithet
                : `${storyLocation} 전투 기록`}
          </span>
          <p id="cinema-narration" role="status" aria-live="assertive" aria-atomic="true">
            {battleStep < 0
              ? battleOpeningNarration
              : firstCrownClimax
                ? battleResult.victory
                  ? `세 전선의 판정이 왕관 조각에 닿습니다. 적 의도 ${firstCrownCounterCount}개를 끊고 전선 ${battleResult.wins}곳을 지켜 빈 갑옷의 심장을 갈랐습니다.`
                  : `적 의도 ${firstCrownCounterCount}개를 끊고 전선 ${battleResult.wins}곳을 지켰습니다. 남은 메아리가 왕관 조각을 다시 봉합합니다.`
                : finalCrownClimax
                  ? battleResult.victory
                    ? `세 전선의 판정이 하나로 겹칩니다. 지켜 낸 전선 ${battleResult.wins}곳이 왕관의 지배를 끊고 칙령 ${resultCrownBreakCount}개를 갈랐습니다.`
                    : `해제한 칙령은 ${resultCrownBreakCount}개. 남은 왕관의 압박이 전선을 되감습니다.`
                  : activeCinemaCrownState?.seal
                    ? `${activeCinemaCrownState.seal.name} ${activeCinemaCrownState.broken ? '해제. 왕관 조각이 갈라졌습니다.' : '유지. 왕의 압박이 증폭됩니다.'} ${survivorName(activeCinemaCrownState.lane.unit)}의 전선은 ${activeCinemaCrownState.lane.won ? '끝내 자리를 지켰습니다.' : '칙령 아래 밀려났습니다.'}`
                    : battleResult.lanes[battleStep].won
                      ? `${battleStep + 1}전선 · ${survivorName(battleResult.lanes[battleStep].unit)}의 대열이 ${battleResult.lanes[battleStep].enemy.doctrine && battleResult.lanes[battleStep].doctrineBroken ? `${ENEMY_DOCTRINES[battleResult.lanes[battleStep].enemy.doctrine].name} 교리를 무너뜨리고` : battleResult.lanes[battleStep].countered ? '적 의도를 끊고' : '정면 충돌을 버티며'} 방어선을 되찾았습니다.`
                      : `${battleStep + 1}전선 · ${battleResult.lanes[battleStep].enemy.name}의 ${battleResult.lanes[battleStep].enemy.doctrine && !battleResult.lanes[battleStep].doctrineBroken ? `${ENEMY_DOCTRINES[battleResult.lanes[battleStep].enemy.doctrine].name} 교리가` : '압력이'} 방어선을 밀어냈습니다.`}
          </p>
        </div>

        <div className="cinema-lanes">
          {battleResult.lanes.map((lane) => {
            const revealed = battleStep >= lane.lane
            const active = battleStep === lane.lane
            const maxPower = Math.max(lane.playerPower, lane.enemyPower)
            const powerDelta = Math.abs(lane.playerPower - lane.enemyPower)
            const crownSeal = game.day === MAX_NIGHTS ? finalCrownSealFor(lane.lane) : null
            const crownBroken = crownSeal
              ? finalCrownSealBroken(lane.lane, battleResult.focusLane, lane.countered, lane.relation)
              : false
            return (
              <article
                className={`${revealed ? 'is-revealed' : ''} ${active ? 'is-active' : ''}`}
                data-outcome={revealed ? (lane.won ? 'won' : 'lost') : 'pending'}
                key={`cinema-${lane.lane}`}
              >
                <div className="cinema-lane-label">
                  <span>전선 0{lane.lane + 1}</span>
                  <div>
                    {crownSeal ? (
                      <b className="cinema-crown-state" data-state={crownBroken ? 'broken' : 'active'}>
                        {crownSeal.glyph} {crownSeal.name} {crownBroken ? '해제' : '압박'}
                      </b>
                    ) : null}
                    {lane.enemy.doctrine ? (
                      <b className="cinema-doctrine-state" data-state={lane.doctrineBroken ? 'broken' : 'active'}>
                        {ENEMY_DOCTRINES[lane.enemy.doctrine].glyph} {ENEMY_DOCTRINES[lane.enemy.doctrine].name}{' '}
                        {lane.doctrineBroken ? '파훼' : '활성'}
                      </b>
                    ) : null}
                    <b>{ORDER_META[lane.order].name}</b>
                    <b>{INTENT_META[lane.intent].name}</b>
                    {lane.resonanceIds.length > 0 ? (
                      <b className="cinema-resonance-tag">공명 +{Math.round(lane.resonanceBonus * 100)}%</b>
                    ) : null}
                    {lane.decisionEchoActive ? (
                      <b className="cinema-decision-echo-tag">결정 +{Math.round(lane.decisionEchoBonus * 100)}%</b>
                    ) : null}
                    {lane.finalMarchImprintIds.length > 0 ? (
                      <b className="cinema-final-march-tag">
                        행군 {lane.finalMarchImprintIds.length}중 +{Math.round(lane.finalMarchImprintBonus * 100)}%
                      </b>
                    ) : null}
                    {lane.finalVowActive ? (
                      <b className="cinema-final-vow-tag">맹세 +{Math.round(lane.finalVowBonus * 100)}%</b>
                    ) : null}
                    {lane.unit.specialization ? <b>{SPECIALIZATIONS[lane.unit.specialization].name}</b> : null}
                    {battleResult.focusLane === lane.lane ? <b>화로 집중</b> : null}
                  </div>
                </div>

                <div
                  className="cinema-duel"
                  role="img"
                  aria-label={`${survivorName(lane.unit)} ${KIND_META[lane.unit.kind].name} ${lane.playerPower} 대 ${lane.enemy.name} ${lane.enemyPower}`}
                >
                  <div className={`cinema-combatant player-combatant kind-${lane.unit.kind}`}>
                    <span className="combatant-figure">
                      <i />
                      <b>{KIND_META[lane.unit.kind].glyph}</b>
                      <em>{TIER_LABELS[lane.unit.tier]}</em>
                    </span>
                    <small>{survivorName(lane.unit)}</small>
                  </div>
                  <div className="cinema-impact" data-outcome={lane.won ? 'won' : 'lost'}>
                    <i />
                    <span>{revealed ? powerDelta : '·'}</span>
                    <b>{revealed ? (lane.won ? '우위' : '열세') : '접근'}</b>
                  </div>
                  <div className={`cinema-combatant enemy-combatant kind-${lane.enemy.kind}`}>
                    <span className="combatant-figure">
                      <i />
                      <b>{KIND_META[lane.enemy.kind].glyph}</b>
                      <em>{TIER_LABELS[lane.enemy.tier]}</em>
                    </span>
                    <small>{lane.enemy.name}</small>
                  </div>
                </div>

                <div className="cinema-power-readout">
                  <div className={`kind-${lane.unit.kind}`}>
                    <span>EMBERHOLD</span>
                    <strong>{lane.playerPower}</strong>
                    <i style={{ '--power': `${Math.round((lane.playerPower / maxPower) * 100)}%` } as CSSProperties} />
                  </div>
                  <b>VS</b>
                  <div className={`kind-${lane.enemy.kind}`}>
                    <span>FROZEN HOST</span>
                    <strong>{lane.enemyPower}</strong>
                    <i style={{ '--power': `${Math.round((lane.enemyPower / maxPower) * 100)}%` } as CSSProperties} />
                  </div>
                </div>

                <div className="cinema-verdict">
                  <span>
                    {revealed
                      ? `${lane.enemy.doctrine ? `${ENEMY_DOCTRINES[lane.enemy.doctrine].name} ${lane.doctrineBroken ? '파훼' : '압박'} · ` : ''}${lane.resonanceIds.length > 0 ? `${lane.resonanceIds.map((resonanceId) => RESONANCES[resonanceId].name).join(' · ')} 발동 · ` : ''}${lane.finalMarchImprintIds.length > 0 ? `행군 각인 ${lane.finalMarchImprintIds.length}중 · ` : ''}${lane.specializationActive && lane.unit.specialization ? `${SPECIALIZATIONS[lane.unit.specialization].name} 발동 · ` : ''}${lane.countered ? '의도 파훼 · ' : ''}${lane.won ? '방어선 유지' : '방어선 붕괴'}`
                      : '교전 대기'}
                  </span>
                  <b>{revealed ? (lane.won ? 'HOLD' : 'BREAK') : '—'}</b>
                </div>
              </article>
            )
          })}
        </div>

        <footer className="cinema-progress">
          <span>
            {game.day === MAX_NIGHTS
              ? battleStep < 0
                ? '삼중 왕관 발현'
                : '왕관 칙령 판정'
              : battleResult.boss && game.day === 4
                ? battleStep < 0
                  ? '빈 갑옷 공명'
                  : firstCrownClimax
                    ? '첫 왕관 파쇄 판정'
                    : '메아리 차단 판정'
                : battleStep < 0
                  ? '교전 개시'
                  : '전선 충돌'}{' '}
            · {Math.max(0, Math.min(3, battleStep + 1))} / 3
          </span>
          <i>
            <b style={{ width: `${Math.max(0, Math.min(100, ((battleStep + 1) / 3) * 100))}%` }} />
          </i>
        </footer>
      </section>
    </div>
  )
}

type ActTransitionView = {
  fromAct: number
  toAct: number
  label: string
  glyph: string
  title: string
  route: string
  description: string
  warning: string
  directive: string
  artPosition: string
}

type ActInterludeProps = {
  currentActTransition: ActTransitionView
  game: GameState
  veteranCount: number
  snow: readonly Snowflake[]
  continueActInterlude: () => void
}

export function ActInterlude({
  currentActTransition,
  game,
  veteranCount,
  snow,
  continueActInterlude,
}: ActInterludeProps) {
  return (
    <div
      className="act-interlude"
      data-act={currentActTransition.toAct}
      role="dialog"
      aria-modal="true"
      aria-labelledby="interlude-title"
      data-focus-scope="interlude"
      tabIndex={-1}
    >
      <div className="transition-art" aria-hidden="true">
        <Image
          src={campaignArt}
          alt=""
          fill
          sizes="100vw"
          style={{ objectPosition: currentActTransition.artPosition }}
        />
        <span />
      </div>
      <div className="transition-snow" aria-hidden="true">
        {snow.slice(0, 16).map((flake, index) => (
          <i
            key={`interlude-flake-${index}`}
            style={
              {
                '--flake-left': flake.left,
                '--flake-delay': flake.delay,
                '--flake-duration': flake.duration,
                '--flake-drift': flake.drift,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <section>
        <header className="interlude-heading">
          <div>
            <p className="eyebrow">{currentActTransition.label}</p>
            <span>{currentActTransition.route}</span>
          </div>
          <strong>
            ACT {currentActTransition.fromAct} <i>›</i> ACT {currentActTransition.toAct}
          </strong>
        </header>

        <section className="crown-progress" aria-label={`왕관 조각 ${game.bossesDefeated}개 파괴`}>
          {[1, 2, 3].map((actNumber) => {
            const mechanic = BOSS_MECHANICS[actNumber * 4]
            if (!mechanic) return null
            const state =
              actNumber <= game.bossesDefeated ? 'broken' : actNumber === game.bossesDefeated + 1 ? 'ahead' : 'distant'
            return (
              <article data-state={state} key={actNumber}>
                <span aria-hidden="true">{mechanic.glyph}</span>
                <div>
                  <small>왕관 조각 0{actNumber}</small>
                  <strong>{mechanic.name}</strong>
                </div>
                <b>{state === 'broken' ? '파괴됨' : state === 'ahead' ? '다음 목표' : '미도달'}</b>
              </article>
            )
          })}
        </section>

        <div className="interlude-story">
          <div>
            <span className="interlude-glyph" aria-hidden="true">
              {currentActTransition.glyph}
            </span>
            <p className="eyebrow">THE ROAD OPENS</p>
            <h2 id="interlude-title">{currentActTransition.title}</h2>
            <p>{currentActTransition.description}</p>
          </div>
          <aside>
            <small>NEXT ACT THREAT</small>
            <strong>{ACTS[currentActTransition.toAct - 1].title}</strong>
            <p>{currentActTransition.warning}</p>
            <em>{currentActTransition.directive}</em>
          </aside>
        </div>

        <dl className="interlude-ledger">
          <div>
            <dt>지켜낸 밤</dt>
            <dd>{game.victories}회</dd>
          </div>
          <div>
            <dt>화로 온기</dt>
            <dd>{game.heat}%</dd>
          </div>
          <div>
            <dt>베테랑</dt>
            <dd>{veteranCount}명</dd>
          </div>
          <div>
            <dt>각인 유물</dt>
            <dd>{game.relics.length}개</dd>
          </div>
        </dl>

        <footer>
          <p>왕관 조각 {game.bossesDefeated} / 3 파괴 · 다음 지역 진입 전 유물 1개를 각인할 수 있습니다.</p>
          <button type="button" onClick={continueActInterlude} data-autofocus="true">
            <span>전리품 확인하고 제{currentActTransition.toAct}막 진입</span>
            <i aria-hidden="true">›</i>
          </button>
        </footer>
      </section>
    </div>
  )
}

type FinaleVowView = {
  id: string
  glyph: string
  label: string
  legacyTitle: string
  legacyDescription: string
  effect: string
}

type FinaleSequenceProps = {
  game: GameState
  finalCrownForecastCount: number
  endingFinalVow: FinaleVowView | null
  revealFinalEnding: () => void
}

export function FinaleSequence({
  game,
  finalCrownForecastCount,
  endingFinalVow,
  revealFinalEnding,
}: FinaleSequenceProps) {
  return (
    <div
      className="finale-sequence"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finale-title"
      data-focus-scope="finale"
      tabIndex={-1}
    >
      <div className="finale-art" aria-hidden="true">
        <Image src={campaignArt} alt="" fill sizes="100vw" style={{ objectPosition: '90% center' }} />
        <span />
      </div>
      <div className="dawn-ring" aria-hidden="true">
        <i />
        <b>✦</b>
        <i />
      </div>
      <section>
        <p className="eyebrow">FINAL INTERLUDE · THE THAW</p>
        <section className="finale-crowns" aria-label="세 왕관 조각 파괴 완료">
          {[4, 8, 12].map((day) => {
            const mechanic = BOSS_MECHANICS[day]
            return mechanic ? (
              <span key={day}>
                <b aria-hidden="true">{mechanic.glyph}</b>
                <small>{mechanic.name}</small>
                <i>파괴됨</i>
              </span>
            ) : null
          })}
        </section>
        <h2 id="finale-title">왕의 눈보라가 멎었다</h2>
        <p>
          {finalCrownForecastCount === FINAL_CROWN_SEALS.length
            ? '세 칙령이 모두 갈라진 순간, 백색 왕의 이름까지 눈보라 속에서 지워졌습니다.'
            : `${finalCrownForecastCount}개의 칙령을 꺾고 방어선을 지켜 내자, 남은 왕관도 주인을 잃고 무너졌습니다.`}{' '}
          하늘과 땅의 경계가 돌아오고, 원정대가 지켜 온 불씨가 수백 년 만의 첫 수평선을 밝힙니다.
        </p>
        {endingFinalVow ? (
          <aside className="finale-vow" data-vow={endingFinalVow.id} aria-label="새벽에 남은 최후의 맹세">
            <span aria-hidden="true">{endingFinalVow.glyph}</span>
            <div>
              <small>{endingFinalVow.label} · VOW FULFILLED</small>
              <strong>{endingFinalVow.legacyTitle}</strong>
              <p>{endingFinalVow.legacyDescription}</p>
            </div>
            <b>{endingFinalVow.effect}</b>
          </aside>
        ) : null}
        <div className="finale-ledger">
          <span>
            <small>견딘 밤</small>
            <strong>12 / 12</strong>
          </span>
          <span>
            <small>해제한 최종 칙령</small>
            <strong>{finalCrownForecastCount} / 3</strong>
          </span>
          <span>
            <small>남은 온기</small>
            <strong>{game.heat}%</strong>
          </span>
          <span>
            <small>최종 명성</small>
            <strong>{game.score.toLocaleString('ko-KR')}</strong>
          </span>
        </div>
        <blockquote>
          <p>“새벽은 승리한 순간이 아니라, 그 불을 어디에 둘지 선택한 순간 완성된다.”</p>
          <cite>— 마지막 화로의 기록</cite>
        </blockquote>
        <button type="button" onClick={revealFinalEnding} data-autofocus="true">
          <span>새벽의 이름 기록하기</span>
          <i aria-hidden="true">›</i>
        </button>
      </section>
    </div>
  )
}
