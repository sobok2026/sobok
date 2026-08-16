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
  tierThreeLineCount: number
  tierFourLineCount: number
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
  tierThreeLineCount,
  tierFourLineCount,
  projectedCrownMasteryScore,
  currentEliteEncounter,
  currentEliteDoctrine,
  doctrineCommandRelief,
  doctrineCommandFloor,
}: BattleDirectivesProps) {
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

      {day === MAX_NIGHTS ? (
        <section className="final-crown-directive" aria-label="백색 왕의 세 왕관 칙령">
          <header>
            <div>
              <span>TRIPLE CROWN BREAK</span>
              <strong>세 칙령 중 둘 이상을 해제하고 두 전선을 지키세요</strong>
            </div>
            <b data-complete={projectedBattleVictory ? 'true' : 'false'}>
              {projectedBattleVictory ? '최종 승리 예상' : '승리 조건 점검'}
            </b>
          </header>
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
          <footer className="final-crown-readiness">
            <p>
              승리 조건은 칙령 {FINAL_CROWN_REQUIRED_SEALS}개 해제와 전선 {REQUIRED_LANE_WINS}곳 방어입니다. 세 칙령을
              모두 해제하면 완전 파쇄 명성이 추가됩니다.
            </p>
            <dl aria-label="최종 왕관 승리 준비도">
              <div data-ready={finalCrownForecastCount >= FINAL_CROWN_REQUIRED_SEALS ? 'true' : 'false'}>
                <dt>칙령 해제</dt>
                <dd>
                  {finalCrownForecastCount} / {FINAL_CROWN_REQUIRED_SEALS}
                </dd>
              </div>
              <div data-ready={projectedWins >= REQUIRED_LANE_WINS ? 'true' : 'false'}>
                <dt>방어 예상</dt>
                <dd>
                  {projectedWins} / {REQUIRED_LANE_WINS}
                </dd>
              </div>
              <div data-ready={tierThreeLineCount >= REQUIRED_LANE_WINS ? 'true' : 'false'}>
                <dt>성장 전선</dt>
                <dd>
                  III+ {tierThreeLineCount} · IV {tierFourLineCount}
                </dd>
              </div>
              <div
                data-ready={
                  projectedBattleVictory && finalCrownForecastCount === FINAL_CROWN_SEALS.length ? 'true' : 'false'
                }
              >
                <dt>완전 파쇄</dt>
                <dd>+{projectedCrownMasteryScore.toLocaleString('ko-KR')}</dd>
              </div>
            </dl>
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
