import type { BossMechanic, RelicId, ResonanceId } from './game-model'
import { ENEMY_DOCTRINES, FINAL_MARCH_GATES, FIRST_CROWN_MARCH, NIGHT_STORIES, RELICS, RESONANCES } from './game-model'

type BriefingView = {
  state: string
  kicker: string
  title: string
  description: string
}

type ReadinessSignalView = {
  id: string
  glyph: string
  label: string
  value: string
  ready: boolean
}

type BuildDoctrineView = {
  state: string
  id: ResonanceId | null
  kicker: string
  title: string
  description: string
}

type ResonanceStatusView = {
  id: ResonanceId
  active: boolean
}

type FinalMarchGateView = (typeof FINAL_MARCH_GATES)[number]

type BattleReadinessProps = {
  day: number
  storyBoss: boolean
  nextCrownMechanic: BossMechanic | undefined
  firstCrownBriefing: BriefingView
  firstCrownReadyCount: number
  firstCrownSignals: readonly ReadinessSignalView[]
  currentBuildDoctrine: BuildDoctrineView
  activeResonanceCount: number
  ownedRelics: readonly RelicId[]
  startedResonanceStatuses: readonly ResonanceStatusView[]
  nextRelicNight: number | null
  finalMarchGate: FinalMarchGateView | null
  finalMarchBriefing: BriefingView | null
  currentDoctrineBroken: boolean
  finalMarchForecastAvailable: boolean
  projectedReturnHeat: number
  tierThreeLineCount: number
  formationKindCount: number
}

export function BattleReadiness({
  day,
  storyBoss,
  nextCrownMechanic,
  firstCrownBriefing,
  firstCrownReadyCount,
  firstCrownSignals,
  currentBuildDoctrine,
  activeResonanceCount,
  ownedRelics,
  startedResonanceStatuses,
  nextRelicNight,
  finalMarchGate,
  finalMarchBriefing,
  currentDoctrineBroken,
  finalMarchForecastAvailable,
  projectedReturnHeat,
  tierThreeLineCount,
  formationKindCount,
}: BattleReadinessProps) {
  return (
    <>
      {day <= 4 && nextCrownMechanic ? (
        <section
          className="first-crown-briefing"
          data-state={firstCrownBriefing.state}
          aria-labelledby="first-crown-briefing-title"
        >
          <header>
            <span className="first-crown-sigil" aria-hidden="true">
              {nextCrownMechanic.glyph}
            </span>
            <div>
              <small>FIRST CROWN READINESS · NIGHT 04</small>
              <strong id="first-crown-briefing-title">
                {storyBoss ? '왕관 교전 지휘' : '빈 갑옷의 메아리에 대비하세요'}
              </strong>
            </div>
            <b data-complete={firstCrownReadyCount === firstCrownSignals.length ? 'true' : 'false'}>
              준비 {firstCrownReadyCount} / {firstCrownSignals.length}
            </b>
          </header>
          {day >= 2 ? (
            <ol className="first-crown-march" aria-label="첫 왕관까지의 네 단계 행군">
              {FIRST_CROWN_MARCH.map((stage) => {
                const state = stage.night < day ? 'cleared' : stage.night === day ? 'current' : 'ahead'
                const story = NIGHT_STORIES[stage.night - 1]
                return (
                  <li data-state={state} aria-current={state === 'current' ? 'step' : undefined} key={stage.night}>
                    <span aria-hidden="true">{state === 'cleared' ? '✓' : stage.glyph}</span>
                    <div>
                      <small>
                        NIGHT 0{stage.night} · {stage.label}
                      </small>
                      <strong>{story.title}</strong>
                      <b>{state === 'cleared' ? '완료' : `보상 · ${stage.reward}`}</b>
                    </div>
                  </li>
                )
              })}
            </ol>
          ) : null}
          <div className="first-crown-briefing-body">
            <div className="first-crown-next-command">
              <small>{firstCrownBriefing.kicker}</small>
              <strong>{firstCrownBriefing.title}</strong>
              <p>{firstCrownBriefing.description}</p>
            </div>
            <ol className="first-crown-signals" aria-label="첫 왕관 준비 항목">
              {firstCrownSignals.map((signal) => (
                <li data-ready={signal.ready ? 'true' : 'false'} key={signal.id}>
                  <span aria-hidden="true">{signal.ready ? '✓' : signal.glyph}</span>
                  <div>
                    <small>{signal.label}</small>
                    <strong>{signal.value}</strong>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <footer>
            <span>
              <b>왕관 기믹</b> {nextCrownMechanic.pressureCopy}
            </span>
            <i
              role="progressbar"
              aria-label="첫 왕관 준비도"
              aria-valuemin={0}
              aria-valuemax={firstCrownSignals.length}
              aria-valuenow={firstCrownReadyCount}
            >
              <b style={{ width: `${(firstCrownReadyCount / firstCrownSignals.length) * 100}%` }} />
            </i>
          </footer>
        </section>
      ) : null}

      {day >= 5 && day <= 8 ? (
        <section
          className="act-two-build-compass"
          data-state={currentBuildDoctrine.state}
          aria-labelledby="act-two-build-title"
        >
          <header>
            <span aria-hidden="true">{currentBuildDoctrine.id ? RESONANCES[currentBuildDoctrine.id].glyph : '∞'}</span>
            <div>
              <small>ACT II · EXPEDITION BUILD DOCTRINE</small>
              <strong id="act-two-build-title">
                {currentBuildDoctrine.id ? RESONANCES[currentBuildDoctrine.id].name : '아직 묶이지 않은 유물 경로'}
              </strong>
            </div>
            <b data-active={activeResonanceCount > 0 ? 'true' : 'false'}>
              공명 {activeResonanceCount} · 유물 {ownedRelics.length} / 5
            </b>
          </header>
          <div className="act-two-build-body">
            <div className="act-two-build-directive">
              <small>{currentBuildDoctrine.kicker}</small>
              <strong>{currentBuildDoctrine.title}</strong>
              <p>{currentBuildDoctrine.description}</p>
            </div>
            <div className="act-two-build-paths">
              {startedResonanceStatuses.length > 0 ? (
                startedResonanceStatuses.map((status) => {
                  const resonance = RESONANCES[status.id]
                  const missingRelic = resonance.requirements.find((relicId) => !ownedRelics.includes(relicId))
                  return (
                    <span data-active={status.active ? 'true' : 'false'} key={status.id}>
                      <b aria-hidden="true">{resonance.glyph}</b>
                      <span>
                        <small>{status.active ? 'ACTIVE · 2 / 2' : 'PATH · 1 / 2'}</small>
                        <strong>{resonance.name}</strong>
                        <em>
                          {status.active
                            ? '공명 연결됨'
                            : `${missingRelic ? RELICS[missingRelic].name : '짝 유물'} 필요`}
                        </em>
                      </span>
                    </span>
                  )
                })
              ) : (
                <p>다음 유물 각인에서 첫 공명 경로가 열립니다.</p>
              )}
            </div>
          </div>
          <footer>
            <span>
              <b>NEXT RELIC</b>{' '}
              {nextRelicNight
                ? nextRelicNight === day
                  ? '이번 방어 후 유물 회수'
                  : `${nextRelicNight - day}밤 뒤 유물 회수`
                : '이번 원정의 유물 회수 완료'}
            </span>
            <span>
              <b>SECOND CROWN</b> {day === 8 ? '이번 밤 · 중앙 화로 집중' : `${8 - day}밤 뒤 · 빙하 심장`}
            </span>
          </footer>
        </section>
      ) : null}

      {finalMarchGate && finalMarchBriefing ? (
        <section
          className="final-march-gauntlet"
          data-state={finalMarchBriefing.state}
          aria-labelledby="final-march-title"
        >
          <header>
            <span aria-hidden="true">{finalMarchGate.glyph}</span>
            <div>
              <small>ACT III · THE FINAL MARCH</small>
              <strong id="final-march-title">{finalMarchGate.name}</strong>
            </div>
            <b data-secured={currentDoctrineBroken ? 'true' : 'false'}>
              {currentDoctrineBroken ? '교리 파훼 예상' : '관문 압박 활성'}
            </b>
          </header>
          <div className="final-march-body">
            <div className="final-march-directive">
              <small>{finalMarchBriefing.kicker}</small>
              <strong>{finalMarchBriefing.title}</strong>
              <p>{finalMarchBriefing.description}</p>
              <span>
                <b>왕관 준비</b> {finalMarchGate.crownPreparation}
              </span>
            </div>
            <ol className="final-march-gates" aria-label="왕좌 앞 세 관문">
              {FINAL_MARCH_GATES.map((gate) => {
                const state =
                  gate.night < day
                    ? 'cleared'
                    : gate.night === day
                      ? currentDoctrineBroken
                        ? 'secured'
                        : 'current'
                      : 'ahead'
                return (
                  <li data-state={state} aria-current={gate.night === day ? 'step' : undefined} key={gate.night}>
                    <span aria-hidden="true">{gate.glyph}</span>
                    <div>
                      <small>{gate.label}</small>
                      <strong>{gate.name}</strong>
                      <p>
                        {state === 'cleared'
                          ? '돌파 기록 완료'
                          : state === 'secured'
                            ? `${ENEMY_DOCTRINES[gate.doctrine].name} 파훼 예상`
                            : state === 'current'
                              ? ENEMY_DOCTRINES[gate.doctrine].counterplay
                              : `NIGHT ${String(gate.night).padStart(2, '0')} 개방`}
                      </p>
                    </div>
                    <b>{state === 'cleared' ? '✓' : state === 'secured' ? 'READY' : `0${gate.night - 8}`}</b>
                  </li>
                )
              })}
            </ol>
          </div>
          <footer>
            <dl>
              <div data-danger={finalMarchForecastAvailable && projectedReturnHeat <= 20 ? 'true' : 'false'}>
                <dt>귀환 온기</dt>
                <dd>{finalMarchForecastAvailable ? `${projectedReturnHeat}%` : '—'}</dd>
              </div>
              <div data-ready={tierThreeLineCount >= 2 ? 'true' : 'false'}>
                <dt>III+ 전선</dt>
                <dd>{tierThreeLineCount} / 3</dd>
              </div>
              <div data-ready={formationKindCount === 3 ? 'true' : 'false'}>
                <dt>집결 병과</dt>
                <dd>{formationKindCount} / 3</dd>
              </div>
              <div data-ready={activeResonanceCount > 0 ? 'true' : 'false'}>
                <dt>활성 공명</dt>
                <dd>{activeResonanceCount}</dd>
              </div>
            </dl>
            <p>
              <b>WHITE KING</b> {12 - day}밤 뒤 · 세 왕관 칙령
            </p>
          </footer>
        </section>
      ) : null}
    </>
  )
}
