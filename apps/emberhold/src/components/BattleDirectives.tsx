import Image from 'next/image'
import battleCinemaArt from '@/app/battle-cinema.webp'
import type { BossMechanic, FinalCrownSeal } from './game-model'
import { FINAL_CROWN_REQUIRED_SEALS, FINAL_CROWN_SEALS, MAX_NIGHTS, REQUIRED_LANE_WINS } from './game-model'

type DecisionEchoView = {
  glyph: string
  name: string
  story: string
  effect: string
  sourceDay: number
  sourceEvent: string
  heatShield?: number
}

type FinalMarchImprintView = {
  id: string
  glyph: string
  name: string
  effect: string
  sourceDay: number
  sourceChoice: string
}

type FinalMarchImprintForecastView = {
  imprint: FinalMarchImprintView
  activeLanes: number
}

type FinalVowView = {
  id: string
  glyph: string
  label: string
  name: string
  story: string
  effect: string
}

type EliteEncounterView = {
  name: string
  phase: string
  epithet: string
}

type EliteDoctrineView = {
  glyph: string
  name: string
  description: string
  counterplay: string
}

type BattleDirectivesProps = {
  day: number
  actNumber: number
  currentBossMechanic: BossMechanic | undefined
  activeDecisionEcho: DecisionEchoView | null
  lineupReady: boolean
  decisionEchoForecastCount: number
  finalMarchImprintCount: number
  finalMarchImprintForecasts: readonly FinalMarchImprintForecastView[]
  finalMarchImprintForecastCount: number
  activeFinalVow: FinalVowView | null
  finalVowForecastCount: number
  projectedBattleVictory: boolean
  finalCrownForecast: readonly (FinalCrownSeal & { broken: boolean })[]
  finalCrownForecastCount: number
  projectedWins: number
  commandSpent: number
  commandLimit: number
  projectedCrownMasteryScore: number
  currentEliteEncounter: EliteEncounterView | null | undefined
  currentEliteDoctrine: EliteDoctrineView | null | undefined
  doctrineCommandRelief: number
  doctrineCommandFloor: number
}

export function BattleDirectives({
  day,
  actNumber,
  currentBossMechanic,
  activeDecisionEcho,
  lineupReady,
  decisionEchoForecastCount,
  finalMarchImprintCount,
  finalMarchImprintForecasts,
  finalMarchImprintForecastCount,
  activeFinalVow,
  finalVowForecastCount,
  projectedBattleVictory,
  finalCrownForecast,
  finalCrownForecastCount,
  projectedWins,
  commandSpent,
  commandLimit,
  projectedCrownMasteryScore,
  currentEliteEncounter,
  currentEliteDoctrine,
  doctrineCommandRelief,
  doctrineCommandFloor,
}: BattleDirectivesProps) {
  const nextFinalCrownSeal = finalCrownForecast.find((seal) => !seal.broken) ?? null
  const finalCrownCommand =
    day === MAX_NIGHTS
      ? !lineupReady
        ? {
            state: 'blocked',
            glyph: '◇',
            kicker: 'THRONE COMMAND · FORMATION REQUIRED',
            title: '세 전선을 먼저 완성하세요',
            description: '왕좌 판정은 세 생존자의 명령·집중·상성을 동시에 읽은 뒤에만 열립니다.',
            badge: '배치 필요',
          }
        : commandSpent > commandLimit
          ? {
              state: 'blocked',
              glyph: '⌘',
              kicker: 'THRONE COMMAND · COMMAND OVERLOAD',
              title: `지휘 부담을 ${commandSpent - commandLimit} 낮추세요`,
              description: '비용 0인 방벽 명령으로 바꾸면 현재 대열을 유지한 채 왕좌 판정을 다시 열 수 있습니다.',
              badge: `-${commandSpent - commandLimit} 지휘`,
            }
          : projectedWins < REQUIRED_LANE_WINS
            ? {
                state: 'danger',
                glyph: '!',
                kicker: 'THRONE COMMAND · FRONT LINE FIRST',
                title: `붕괴 전선 ${REQUIRED_LANE_WINS - projectedWins}곳을 먼저 되찾으세요`,
                description:
                  '칙령을 해제해도 두 전선을 지키지 못하면 왕관은 무너지지 않습니다. 아래 참모 모의의 첫 수부터 적용하세요.',
                badge: `전선 ${projectedWins} / ${REQUIRED_LANE_WINS}`,
              }
            : finalCrownForecastCount < FINAL_CROWN_REQUIRED_SEALS && nextFinalCrownSeal
              ? {
                  state: 'danger',
                  glyph: nextFinalCrownSeal.glyph,
                  kicker: `THRONE COMMAND · ${nextFinalCrownSeal.label}`,
                  title: `${nextFinalCrownSeal.name}부터 해제하세요`,
                  description: nextFinalCrownSeal.requirement,
                  badge: `칙령 ${finalCrownForecastCount} / ${FINAL_CROWN_REQUIRED_SEALS}`,
                }
              : projectedBattleVictory && finalCrownForecastCount === FINAL_CROWN_SEALS.length
                ? {
                    state: 'mastered',
                    glyph: '✦',
                    kicker: 'THRONE COMMAND · PERFECT SHATTER',
                    title: '세 칙령 완전 파쇄 준비가 끝났습니다',
                    description: `승리 조건을 넘어 왕의 이름까지 지우는 추가 명성 +${projectedCrownMasteryScore.toLocaleString('ko-KR')} 경로입니다.`,
                    badge: 'S+ ROUTE',
                  }
                : {
                    state: 'ready',
                    glyph: '♜',
                    kicker: 'THRONE COMMAND · VICTORY LINE SEALED',
                    title: '왕좌 파쇄 승리선이 봉인됐습니다',
                    description: nextFinalCrownSeal
                      ? `${nextFinalCrownSeal.name}까지 해제하면 완전 파쇄 명성 +${projectedCrownMasteryScore.toLocaleString('ko-KR')}을 확보합니다.`
                      : '현재 명령과 대열을 유지하면 백색 왕의 지배를 끝낼 수 있습니다.',
                    badge: `${FINAL_CROWN_REQUIRED_SEALS} + ${REQUIRED_LANE_WINS} READY`,
                  }
      : null

  return (
    <>
      {currentBossMechanic ? (
        <section className="boss-horizon" data-boss-night={day} aria-label={`${currentBossMechanic.name} 기믹`}>
          <div className="boss-horizon-art" aria-hidden="true">
            <Image src={battleCinemaArt} alt="" fill sizes="900px" />
          </div>
          <div className="boss-horizon-copy">
            <span aria-hidden="true">{currentBossMechanic.glyph}</span>
            <div>
              <small>
                {currentBossMechanic.phase} · {currentBossMechanic.epithet}
              </small>
              <strong>{currentBossMechanic.name}</strong>
              <p>{currentBossMechanic.description}</p>
            </div>
            <em>{currentBossMechanic.pressureCopy}</em>
          </div>
        </section>
      ) : null}

      {activeDecisionEcho ? (
        <section
          className="decision-echo-directive"
          data-kind={activeDecisionEcho.heatShield ? 'hearth' : 'tactical'}
          aria-label={`${activeDecisionEcho.name} 이전 결정 후속 결과`}
        >
          <span className="decision-echo-glyph" aria-hidden="true">
            {activeDecisionEcho.glyph}
          </span>
          <div>
            <small>
              PAST DECISION RETURNS · DAY {String(activeDecisionEcho.sourceDay).padStart(2, '0')} ·{' '}
              {activeDecisionEcho.sourceEvent}
            </small>
            <strong>{activeDecisionEcho.name}</strong>
            <p>{activeDecisionEcho.story}</p>
          </div>
          <em>
            <b>{activeDecisionEcho.heatShield ? '귀환 화로' : '발동 규칙'}</b>
            {activeDecisionEcho.effect}
            <small>
              {activeDecisionEcho.heatShield
                ? '승리와 후퇴 모두 자동 적용'
                : lineupReady
                  ? `현재 ${decisionEchoForecastCount} / 3 전선 발동 예상`
                  : '세 전선을 배치하면 발동 예상 표시'}
            </small>
          </em>
        </section>
      ) : null}

      {finalMarchImprintCount > 0 ? (
        <section className="final-march-imprint-directive" aria-label="활성 마지막 행군 각인">
          <header>
            <span aria-hidden="true">⚑</span>
            <div>
              <small>LAST MARCH · CHOICES MADE TACTICAL</small>
              <strong>왕좌까지 이어지는 행군 각인</strong>
            </div>
            <b>{finalMarchImprintCount} / 3 SEALED</b>
          </header>
          <ol>
            {finalMarchImprintForecasts.map(({ imprint, activeLanes }) => (
              <li data-active={activeLanes > 0 ? 'true' : 'false'} key={imprint.id}>
                <span aria-hidden="true">{imprint.glyph}</span>
                <div>
                  <small>
                    DAY {String(imprint.sourceDay).padStart(2, '0')} · {imprint.sourceChoice}
                  </small>
                  <strong>{imprint.name}</strong>
                  <p>{imprint.effect}</p>
                </div>
                <b>{lineupReady ? `${activeLanes} / 3 발동` : '대열 대기'}</b>
              </li>
            ))}
          </ol>
          <footer>
            <span>각인은 조건을 충족하면 서로 중첩되며 전선당 최대 +22%까지 적용됩니다.</span>
            <b>
              {lineupReady
                ? `현재 계획 · ${finalMarchImprintForecastCount} / 3 전선 강화`
                : '세 전선을 배치하면 발동 예상 표시'}
            </b>
          </footer>
        </section>
      ) : null}

      {activeFinalVow ? (
        <section
          className="final-vow-directive"
          data-vow={activeFinalVow.id}
          aria-label={`${activeFinalVow.name} 최후의 맹세 전투 효과`}
        >
          <span className="final-vow-glyph" aria-hidden="true">
            {activeFinalVow.glyph}
          </span>
          <div>
            <small>{activeFinalVow.label} · DAY 12 DECISION SEALED</small>
            <strong>{activeFinalVow.name}</strong>
            <p>{activeFinalVow.story}</p>
          </div>
          <em>
            <b>최종전 고유 효과</b>
            {activeFinalVow.effect}
            <small>
              {lineupReady
                ? `현재 ${finalVowForecastCount} / 3 전선 발동 예상`
                : '세 전선을 배치하면 발동 전선이 표시됩니다'}
            </small>
          </em>
        </section>
      ) : null}

      {day === MAX_NIGHTS && finalCrownCommand ? (
        <section
          className="final-crown-directive"
          data-state={finalCrownCommand.state}
          aria-label="백색 왕의 최종 결전 지휘"
        >
          <header>
            <div>
              <span>TRIPLE CROWN BREAK</span>
              <strong>세 칙령 중 둘 이상을 해제하고 두 전선을 지키세요</strong>
            </div>
            <b data-complete={projectedBattleVictory ? 'true' : 'false'}>
              {projectedBattleVictory ? '최종 승리 예상' : '승리 조건 점검'}
            </b>
          </header>
          <ol className="final-crown-equation" aria-label="최종 왕관 승리 방정식">
            <li data-state="complete">
              <span>01</span>
              <div>
                <small>LAST MARCH</small>
                <strong>관문 3 / 3</strong>
              </div>
            </li>
            <li data-state={finalCrownForecastCount >= FINAL_CROWN_REQUIRED_SEALS ? 'complete' : 'missing'}>
              <span>02</span>
              <div>
                <small>CROWN EDICTS</small>
                <strong>
                  칙령 {finalCrownForecastCount} / {FINAL_CROWN_REQUIRED_SEALS}
                </strong>
              </div>
            </li>
            <li data-state={projectedWins >= REQUIRED_LANE_WINS ? 'complete' : 'missing'}>
              <span>03</span>
              <div>
                <small>HELD FRONTS</small>
                <strong>
                  전선 {projectedWins} / {REQUIRED_LANE_WINS}
                </strong>
              </div>
            </li>
            <li data-state={projectedBattleVictory ? 'victory' : 'missing'}>
              <span>♜</span>
              <div>
                <small>FINAL VERDICT</small>
                <strong>{projectedBattleVictory ? '왕좌 파쇄' : '왕관 유지'}</strong>
              </div>
            </li>
          </ol>
          <aside className="final-crown-command" data-state={finalCrownCommand.state}>
            <span aria-hidden="true">{finalCrownCommand.glyph}</span>
            <div>
              <small>{finalCrownCommand.kicker}</small>
              <strong>{finalCrownCommand.title}</strong>
              <p>{finalCrownCommand.description}</p>
            </div>
            <b>{finalCrownCommand.badge}</b>
          </aside>
          <details className="final-crown-edicts" open={!projectedBattleVictory}>
            <summary>
              <span>
                <small>EDICT LEDGER · 세부 판정</small>
                <strong>세 왕관 칙령 확인</strong>
              </span>
              <b>{finalCrownForecastCount} / 3 해제 예상</b>
              <i aria-hidden="true">⌄</i>
            </summary>
            <div>
              {finalCrownForecast.map((seal) => (
                <article data-state={seal.broken ? 'broken' : 'active'} key={seal.name}>
                  <span aria-hidden="true">{seal.glyph}</span>
                  <div>
                    <small>
                      {seal.label} · 전선 0{seal.lane + 1}
                    </small>
                    <strong>{seal.name}</strong>
                    <p>{seal.requirement}</p>
                    <em>{seal.pressure}</em>
                  </div>
                  <b>{seal.broken ? '해제 예상' : '압박 활성'}</b>
                </article>
              ))}
            </div>
          </details>
          <footer className="final-crown-reward">
            <span>
              <small>MASTERY BOUNTY</small>
              <strong>세 칙령 완전 파쇄</strong>
            </span>
            <p>승리 조건을 넘겨 모든 칙령을 해제하면 왕관 숙련 명성을 추가로 획득합니다.</p>
            <b data-ready={finalCrownForecastCount === FINAL_CROWN_SEALS.length ? 'true' : 'false'}>
              +{projectedCrownMasteryScore.toLocaleString('ko-KR')}
            </b>
          </footer>
        </section>
      ) : null}

      {currentEliteEncounter && currentEliteDoctrine ? (
        <section
          className="elite-directive"
          data-act={actNumber}
          aria-label={`${currentEliteEncounter.name} 정예 교리`}
        >
          <span className="elite-directive-glyph" aria-hidden="true">
            {currentEliteDoctrine.glyph}
          </span>
          <div>
            <small>
              {currentEliteEncounter.phase} · {currentEliteEncounter.epithet}
            </small>
            <strong>
              {currentEliteEncounter.name} <i>·</i> {currentEliteDoctrine.name}
            </strong>
            <p>{currentEliteDoctrine.description}</p>
          </div>
          <em>
            <b>파훼법</b>
            {currentEliteDoctrine.counterplay}
            {doctrineCommandRelief > 0 ? (
              <small>
                교리 대응 지휘 +{doctrineCommandRelief} · 명령 점수 최소 {doctrineCommandFloor} 보장
              </small>
            ) : null}
          </em>
        </section>
      ) : null}
    </>
  )
}
