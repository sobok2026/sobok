import Image from 'next/image'
import survivorTriadArt from '@/app/survivor-triad.webp'
import './deferred.css'

import type {
  BattleResult,
  CampUndo,
  FailureInsight,
  FinalCrownSeal,
  GameState,
  LaneResult,
  RelicId,
  ResonanceId,
  SpecializationId,
  Unit,
} from './game-model'
import {
  ENEMY_DOCTRINES,
  FINAL_CROWN_REQUIRED_SEALS,
  FINAL_CROWN_SEALS,
  FIRST_CROWN_MARCH,
  KIND_META,
  MAX_NIGHTS,
  MAX_TIER,
  NIGHT_STORIES,
  RELICS,
  RESONANCES,
  SPECIALIZATIONS,
  TIER_LABELS,
} from './game-model'

type PromotionDialogProps = {
  pendingPromotionUnit: Unit
  promotionChoices: readonly SpecializationId[]
  campUndo: CampUndo | null
  chooseSpecialization: (specializationId: SpecializationId) => void
  undoCampAction: () => void
  survivorName: (unit: Unit) => string
}

export function PromotionDialog({
  pendingPromotionUnit,
  promotionChoices,
  campUndo,
  chooseSpecialization,
  undoCampAction,
  survivorName,
}: PromotionDialogProps) {
  return (
    <div className="modal-backdrop promotion-backdrop" role="presentation">
      <section
        className={`promotion-card kind-${pendingPromotionUnit.kind}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-title"
        aria-describedby="promotion-lead"
        data-focus-scope="promotion"
        tabIndex={-1}
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
              같은 병과도 진급에 따라 전혀 다른 명령과 위기에서 강해집니다. 현재 원정의 진형과 유물에 맞는 길을
              선택하세요.
            </p>
          </header>
          <div className="promotion-options">
            {promotionChoices.map((specializationId, index) => {
              const specialization = SPECIALIZATIONS[specializationId]
              return (
                <button
                  type="button"
                  onClick={() => chooseSpecialization(specializationId)}
                  data-autofocus={index === 0 ? 'true' : undefined}
                  key={specializationId}
                >
                  <span className="promotion-option-number">0{index + 1}</span>
                  <span className="promotion-option-glyph" aria-hidden="true">
                    {specialization.glyph}
                  </span>
                  <small>{specialization.subtitle}</small>
                  <strong>{specialization.name}</strong>
                  <p>{specialization.description}</p>
                  <em>{specialization.detail}</em>
                  <b>
                    이 길 선택 <i aria-hidden="true">›</i>
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

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className={`result-card ${battleResult.victory ? 'is-victory' : 'is-defeat'}${firstVictoryPreview ? ' is-first-victory' : ''}${firstCrownMarchResult ? ' is-first-crown-march' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        data-focus-scope="result"
        tabIndex={-1}
      >
        <div className="result-emblem" aria-hidden="true">
          <span>{battleResult.victory ? '✦' : '❄'}</span>
        </div>
        <p className="eyebrow">NIGHT {String(game.day).padStart(2, '0')} REPORT</p>
        <h2 id="result-title">
          {battleResult.victory
            ? battleResult.boss
              ? '왕관 조각 파괴'
              : '방어선 유지'
            : finalCrownMechanicBlocked
              ? '왕관 칙령 유지'
              : '방어선 붕괴'}
        </h2>
        <p className="result-lead">
          {battleResult.victory
            ? battleResult.wins === 3
              ? '세 전선을 모두 지켰습니다. 불빛이 설원 너머까지 닿습니다.'
              : '두 전선을 지켜냈습니다. 아직 화로는 꺼지지 않았습니다.'
            : finalCrownMechanicBlocked
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
            <footer>
              {battleResult.victory
                ? nextFinalMarchGate
                  ? `다음 관문 · NIGHT ${String(nextFinalMarchGate.night).padStart(2, '0')} ${nextFinalMarchGate.name}`
                  : '세 관문 돌파 · 백색 왕의 왕좌가 열립니다.'
                : `귀환 온기 ${Math.max(0, game.heat + battleResult.heatDelta)}% · 전선을 재정비해 다시 돌파하세요.`}
            </footer>
          </section>
        ) : null}

        {!battleResult.victory && primaryFailureInsight ? (
          <section className="result-recovery-report" aria-label="패배 원인과 재도전 처방">
            <header>
              <span>RETRY BRIEFING</span>
              <strong>
                패배 원인 {defeatInsights.length}개 · 누적 후퇴 {priorDefeatCount + 1}회
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
                <dt>이번 복구 보급</dt>
                <dd>+{battleResult.supplyReward}</dd>
              </div>
              <div>
                <dt>다음 후퇴 예상</dt>
                <dd>+{nextRetreatSupply}</dd>
              </div>
              <div>
                <dt>다음 신호탄 복구</dt>
                <dd>−{nextRecoveryRecruitDiscount}</dd>
              </div>
              <div>
                <dt>명성 · 개인 과업</dt>
                <dd>승리 시 기록</dd>
              </div>
            </dl>
            <footer>
              적 진형·의도와 현재 명령·화로 집중은 유지됩니다. 복구 보급은 원정 전체에서 후퇴할수록 줄며, 파훼 기록과
              명성은 밤을 지켜낸 전투만 인정됩니다. 대신 신호탄 비용은 후퇴마다 2씩, 최대 6까지 낮아져 성장 정체를
              복구합니다.
            </footer>
          </section>
        ) : null}

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

        <div className="result-rewards">
          <div>
            <span>보급품</span>
            <strong>+{battleResult.supplyReward}</strong>
          </div>
          <div>
            <span>화로 온기</span>
            <strong>{battleResult.heatDelta}%</strong>
          </div>
          <div>
            <span>지킨 전선</span>
            <strong>{battleResult.wins} / 3</strong>
          </div>
          <div>
            <span>{battleResult.victory ? '원정 명성' : '명성 기록'}</span>
            <strong>{battleResult.victory ? `+${battleResult.scoreReward.toLocaleString('ko-KR')}` : '없음'}</strong>
          </div>
          <div>
            <span>원정대 사기</span>
            <strong>
              {battleResult.moraleDelta > 0 ? '+' : ''}
              {battleResult.moraleDelta}
            </strong>
          </div>
        </div>

        <button className="result-continue" type="button" onClick={continueAfterBattle} data-autofocus="true">
          <span>
            {battleResult.victory
              ? game.day === MAX_NIGHTS
                ? '마지막 새벽 맞이하기'
                : firstVictoryPreview
                  ? '첫 승리를 기록하고 2일차로'
                  : firstCrownMarchResult?.night === 2
                    ? '첫 유물 각인 선택하기'
                    : firstCrownMarchResult?.night === 3
                      ? '첫 왕관으로 진군하기'
                      : battleResult.boss
                        ? '왕관 조각 회수하기'
                        : '다음 경로 선택하기'
              : '재정비하고 같은 밤 재도전'}
          </span>
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
  chooseRelic,
  resonancePreviewFor,
}: RelicDialogProps) {
  return (
    <div className="modal-backdrop relic-backdrop" role="presentation">
      <section
        className="relic-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="relic-title"
        data-focus-scope="relic"
        tabIndex={-1}
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
                onClick={() => chooseRelic(relicId)}
                data-autofocus={recommended ? 'true' : undefined}
                data-recommended={recommended ? 'true' : 'false'}
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
                  각인하기 <i aria-hidden="true">›</i>
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
      </section>
    </div>
  )
}
