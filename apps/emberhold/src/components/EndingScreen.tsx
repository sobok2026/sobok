import './deferred.css'

import Image from 'next/image'
import campaignArt from '@/app/campaign-panorama.webp'
import { EndingAtlas } from './EndingAtlas'
import type {
  ArchiveTab,
  Difficulty,
  EndingDiscoveryEntry,
  EndingId,
  EventChoice,
  GameState,
  LegacyId,
  LegacyRewardBreakdown,
  MetaState,
  ProtocolMasteryProgress,
  ResonanceId,
  TrialId,
} from './game-model'
import {
  ACTS,
  BOSS_MECHANICS,
  DIFFICULTIES,
  ENDINGS,
  inheritedPowerEnabledFor,
  LEGACY_IDS,
  LEGACY_UPGRADES,
  legacyMasteryFor,
  MASTERY_CONTRACTS,
  MAX_NIGHTS,
  OATHS,
  RESONANCES,
  TRIALS,
} from './game-model'

type EndingOutcome = 'won' | 'lost'

type FinalVowView = {
  id: string
  glyph: string
  label: string
  legacyTitle: string
  legacyDescription: string
  witness: string
}

type OathChronicleView = {
  label: string
  title: string
  description: string
  witness: string
}

type OathInterventionPathView = {
  stage: {
    day: number
    name: string
    promise: string
  }
  choice: EventChoice | null | undefined
  state: string
}

type DossierSealView = {
  id: string
  glyph: string
  label: string
  title: string
  description: string
}

type MasteryDirectiveView = {
  state: string
  glyph: string
  kicker: string
  title: string
  description: string
  progress: number
  progressLabel: string
  target: string
}

type TrialStatusView = {
  id: TrialId
  current: number
  target: number
  completed: boolean
}

const RENOWN_LEDGER_SOURCES = [
  {
    id: 'battle',
    glyph: '⚔',
    label: 'BATTLE VERDICTS',
    title: '교전과 왕관 파쇄',
    description: '승리, 완벽 방어, 의도 파훼와 왕관전 보정을 모두 반영한 실제 귀환 명성',
  },
  {
    id: 'event',
    glyph: '◇',
    label: 'ROUTE DECISIONS',
    title: '경로 선택과 결단',
    description: '밤의 사건과 서약 경로에서 선택 직후 확정된 실제 명성',
  },
  {
    id: 'marchSeal',
    glyph: '≋',
    label: 'MARCH SEALS',
    title: '행군 보급 봉인',
    description: '화로·성장·후퇴 예비를 남기고 진짜 잉여 보급만 봉인해 얻은 실제 명성',
  },
] as const

const LEGACY_REWARD_SOURCES: Array<{
  id: Exclude<keyof LegacyRewardBreakdown, 'total'>
  label: string
  detail: string
}> = [
  { id: 'renown', label: '명성 기록', detail: '명성 4,500당 1' },
  { id: 'crowns', label: '왕관 파쇄', detail: '격파한 보스당 2' },
  { id: 'trials', label: '개인 과업', detail: '완수한 과업 보상' },
  { id: 'protocol', label: '위험도 완주', detail: '완주할 때만 확정' },
  { id: 'dawn', label: '마지막 새벽', detail: '12일 완주 보상' },
  { id: 'recovery', label: '복구 기록', detail: '첫 승리 뒤 무보상 종료 보호' },
]

type EndingScreenProps = {
  outcome: EndingOutcome
  blocked: boolean
  game: GameState
  meta: MetaState
  currentActNumber: number
  currentEnding: (typeof ENDINGS)[EndingId]
  expeditionRankLabel: string
  endingFinalVow: FinalVowView | null
  bestScore: number
  protocolMasteryProgress: ProtocolMasteryProgress
  protocolMasteryRecognized: boolean
  protocolMasteryUnlocked: boolean
  oathChronicle: OathChronicleView
  oathInterventionCount: number
  oathInterventionPath: readonly OathInterventionPathView[]
  endingCommanderTitle: string
  endingIsComparisonBest: boolean
  endingComparisonCount: number
  endingComparisonPosition: number
  endingComparisonBestScore: number
  endingDossierSeals: readonly DossierSealView[]
  completedTrialCount: number
  activeResonances: readonly ResonanceId[]
  trialStatuses: readonly TrialStatusView[]
  endingDiscoveryEntries: EndingDiscoveryEntry[]
  endingMasteryDirective: MasteryDirectiveView
  legacyRewardBreakdown: LegacyRewardBreakdown
  unownedLegacyIds: readonly LegacyId[]
  affordableLegacyIds: readonly LegacyId[]
  recommendedLegacyId: LegacyId | null
  runCode: string
  nextWinningEndingId: EndingId | null
  nextChallengeDifficulty: Difficulty
  replayExpedition: () => void
  prepareNextChallenge: () => void
  shareExpedition: () => Promise<void>
  openArchive: (tab: ArchiveTab) => void
}

export function EndingScreen({
  outcome,
  blocked,
  game,
  meta,
  currentActNumber,
  currentEnding,
  expeditionRankLabel,
  endingFinalVow,
  bestScore,
  protocolMasteryProgress,
  protocolMasteryRecognized,
  protocolMasteryUnlocked,
  oathChronicle,
  oathInterventionCount,
  oathInterventionPath,
  endingCommanderTitle,
  endingIsComparisonBest,
  endingComparisonCount,
  endingComparisonPosition,
  endingComparisonBestScore,
  endingDossierSeals,
  completedTrialCount,
  activeResonances,
  trialStatuses,
  endingDiscoveryEntries,
  endingMasteryDirective,
  legacyRewardBreakdown,
  unownedLegacyIds,
  affordableLegacyIds,
  recommendedLegacyId,
  runCode,
  nextWinningEndingId,
  nextChallengeDifficulty,
  replayExpedition,
  prepareNextChallenge,
  shareExpedition,
  openArchive,
}: EndingScreenProps) {
  const endingWon = outcome === 'won'
  const comparisonRun = !inheritedPowerEnabledFor(game.mode)
  const primaryFailureInsight = game.failureInsights[0] ?? null
  const legacyComplete = unownedLegacyIds.length === 0
  const legacyMastery = legacyMasteryFor(meta)
  const legacyReady = affordableLegacyIds.length > 0
  const featuredLegacyId = recommendedLegacyId
  const featuredLegacy = featuredLegacyId ? LEGACY_UPGRADES[featuredLegacyId] : null
  const legacyRouteState = legacyComplete ? 'complete' : legacyReady ? 'ready' : 'progress'
  const chroniclersInkActive = game.activeLegacy.includes('chroniclers-ink')
  const masteryContractMastered = game.masteryContract ? meta.masteredContracts.includes(game.masteryContract) : false
  const legacyRenownBonus =
    game.renownLedger.battle.legacyBonus + game.renownLedger.event.legacyBonus + game.renownLedger.marchSeal.legacyBonus
  const contractRenownBonus =
    game.renownLedger.battle.contractBonus +
    game.renownLedger.event.contractBonus +
    game.renownLedger.marchSeal.contractBonus
  const inheritedRenown = game.score - contractRenownBonus
  const baseRenown = inheritedRenown - legacyRenownBonus
  const leadingRenownSource = RENOWN_LEDGER_SOURCES.reduce((leader, source) =>
    game.renownLedger[source.id].total > game.renownLedger[leader.id].total ? source : leader,
  )
  const leadingRenownShare =
    game.score > 0 ? Math.round((game.renownLedger[leadingRenownSource.id].total / game.score) * 100) : 0

  return (
    <div
      className="ending-screen"
      data-ending={outcome}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ending-title"
      aria-describedby="ending-description"
      data-focus-scope="ending"
      inert={blocked ? true : undefined}
      tabIndex={-1}
    >
      <div className="ending-sky" aria-hidden="true" />
      <div className="ending-art" aria-hidden="true">
        <Image
          src={campaignArt}
          alt=""
          fill
          sizes="100vw"
          style={{
            objectPosition: `${outcome === 'won' ? 90 : currentActNumber === 1 ? 10 : currentActNumber === 2 ? 50 : 90}% center`,
          }}
        />
        <span />
      </div>
      <section>
        <p className="eyebrow">{currentEnding.label}</p>
        <span className="ending-mark" aria-hidden="true">
          <b>{currentEnding.glyph}</b>
        </span>
        <span className="ending-rank">
          원정 등급 <b>{expeditionRankLabel}</b>
        </span>
        <h2 id="ending-title" data-autofocus="true" tabIndex={-1}>
          {currentEnding.title}
        </h2>
        <p id="ending-description">{currentEnding.description}</p>
        <blockquote className="ending-epilogue">
          <p>“{currentEnding.epilogue}”</p>
          <cite>— {currentEnding.witness}</cite>
        </blockquote>
        <section className="ending-journey" aria-label="세 막 원정 경로">
          {ACTS.map((act) => {
            const mechanic = BOSS_MECHANICS[act.range[1]]
            if (!mechanic) return null
            const state =
              game.bossesDefeated >= act.number ? 'cleared' : game.day >= act.range[0] ? 'fallen' : 'unreached'
            return (
              <article data-state={state} key={act.number}>
                <span aria-hidden="true">{mechanic.glyph}</span>
                <div>
                  <small>ACT {act.number}</small>
                  <strong>{act.title}</strong>
                  <p>{mechanic.name}</p>
                </div>
                <b>{state === 'cleared' ? '왕관 파괴' : state === 'fallen' ? '원정 종료' : '미도달'}</b>
              </article>
            )
          })}
        </section>
        {endingFinalVow ? (
          <section
            className="ending-final-vow"
            data-vow={endingFinalVow.id}
            data-outcome={outcome}
            aria-labelledby="ending-final-vow-title"
          >
            <span aria-hidden="true">{endingFinalVow.glyph}</span>
            <div>
              <small>{endingFinalVow.label} · DAY 12 LEGACY</small>
              <h3 id="ending-final-vow-title">{endingFinalVow.legacyTitle}</h3>
              <p>{endingFinalVow.legacyDescription}</p>
              <cite>— {endingFinalVow.witness}</cite>
            </div>
            <b>{outcome === 'won' ? '맹세 완수 · 새벽에 계승' : '맹세 미완 · 다음 원정에 기록'}</b>
          </section>
        ) : null}
        <div className="ending-stats">
          <div>
            <span>도달한 날</span>
            <strong>{game.day}일</strong>
          </div>
          <div>
            <span>최종 명성</span>
            <strong>{game.score.toLocaleString('ko-KR')}</strong>
          </div>
          <div>
            <span>완벽 방어</span>
            <strong>{game.perfectNights}회</strong>
          </div>
          <div>
            <span>격파한 보스</span>
            <strong>{game.bossesDefeated} / 3</strong>
          </div>
          <div>
            <span>획득 유산 불씨</span>
            <strong>+{game.legacyReward}</strong>
          </div>
          <div>
            <span>위험도</span>
            <strong>{DIFFICULTIES[game.difficulty].name}</strong>
          </div>
          <div>
            <span>원정 서약</span>
            <strong>{OATHS[game.oath].name}</strong>
          </div>
          {game.masteryContract ? (
            <div className="ending-contract-stat">
              <span>영원 계약</span>
              <strong>
                {MASTERY_CONTRACTS[game.masteryContract].name}
                {masteryContractMastered ? ' · 정복' : ''}
              </strong>
            </div>
          ) : null}
          {comparisonRun ? (
            <div>
              <span>비교 적재</span>
              <strong>계승 전력 0개</strong>
            </div>
          ) : null}
          <div>
            <span>{game.mode === 'daily' ? '오늘의 균열' : game.mode === 'shared' ? '공유 균열' : '원정 코드'}</span>
            <strong>{runCode}</strong>
          </div>
        </div>
        <section
          className="ending-renown-ledger"
          data-legacy={chroniclersInkActive ? 'active' : 'none'}
          data-contract={game.masteryContract ? 'active' : 'none'}
          aria-labelledby="ending-renown-ledger-title"
        >
          <header>
            <div>
              <small>FINAL RENOWN AUDIT · EXACT ATTRIBUTION</small>
              <h3 id="ending-renown-ledger-title">명성 기여 장부</h3>
              <p>
                {game.score > 0
                  ? `${leadingRenownSource.title}이 전체 명성의 ${leadingRenownShare}%로 가장 큰 경로였습니다. 세 경로의 합계가 최종 기록과 정확히 일치합니다.`
                  : '명성을 얻기 전에 원정이 끝났습니다. 세 획득 경로는 모두 0으로 봉인되었습니다.'}
              </p>
            </div>
            <strong>
              <span>FINAL RENOWN</span>
              <b>{game.score.toLocaleString('ko-KR')}</b>
              <small>원장 합계 일치</small>
            </strong>
          </header>
          <div className="ending-renown-sources">
            {RENOWN_LEDGER_SOURCES.map((source) => {
              const entry = game.renownLedger[source.id]
              const share = game.score > 0 ? Math.round((entry.total / game.score) * 100) : 0
              return (
                <article data-empty={entry.total === 0 ? 'true' : 'false'} key={source.id}>
                  <header>
                    <span aria-hidden="true">{source.glyph}</span>
                    <div>
                      <small>{source.label}</small>
                      <strong>{source.title}</strong>
                    </div>
                    <b>+{entry.total.toLocaleString('ko-KR')}</b>
                  </header>
                  <p>{source.description}</p>
                  <div
                    className="ending-renown-share"
                    role="progressbar"
                    aria-label={`${source.title}의 최종 명성 기여율`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={share}
                  >
                    <i style={{ width: `${share}%` }} />
                  </div>
                  <footer>
                    <span>전체 기여 {share}%</span>
                    <strong>
                      {entry.legacyBonus > 0 || entry.contractBonus > 0
                        ? `${entry.legacyBonus > 0 ? `잉크 +${entry.legacyBonus.toLocaleString('ko-KR')}` : ''}${entry.legacyBonus > 0 && entry.contractBonus > 0 ? ' · ' : ''}${entry.contractBonus > 0 ? `계약 +${entry.contractBonus.toLocaleString('ko-KR')}` : ''}`
                        : `기본 +${entry.total.toLocaleString('ko-KR')}`}
                    </strong>
                  </footer>
                </article>
              )
            })}
          </div>
          <footer className="ending-renown-legacy">
            <span aria-hidden="true">{chroniclersInkActive ? LEGACY_UPGRADES['chroniclers-ink'].glyph : '◇'}</span>
            <div>
              <small>
                {chroniclersInkActive
                  ? 'ACTIVE LEGACY · RENOWN CONTRIBUTION'
                  : comparisonRun
                    ? 'CODE COMPARISON · META-FREE RENOWN'
                    : 'LEGACY RENOWN MODIFIER'}
              </small>
              <strong>
                {chroniclersInkActive
                  ? `${LEGACY_UPGRADES['chroniclers-ink'].name} · 실제 +${legacyRenownBonus.toLocaleString('ko-KR')}`
                  : comparisonRun
                    ? '계승 유산·영원 계약 없이 완주'
                    : '명성 계승 효과 없이 완주'}
              </strong>
              <p>
                {chroniclersInkActive
                  ? legacyRenownBonus > 0
                    ? '각 보상에서 ×1.08과 반올림을 적용한 뒤 생긴 추가분만 합산했습니다.'
                    : '유산은 장착됐지만 이번 원정에서는 명성 보상이 확정되기 전에 기록이 끝났습니다.'
                  : comparisonRun
                    ? '보유한 영구 전력은 기록에 남겨 두고, 동일 코드의 위험도·서약·선택·전술만으로 최종 명성을 계산했습니다.'
                    : '전투·사건·행군 봉인의 원래 규칙만으로 최종 명성을 계산했습니다.'}
              </p>
            </div>
            <dl>
              <div>
                <dt>기본 명성</dt>
                <dd>{baseRenown.toLocaleString('ko-KR')}</dd>
              </div>
              <div data-highlight={legacyRenownBonus > 0 ? 'true' : 'false'}>
                <dt>잉크 기여</dt>
                <dd>+{legacyRenownBonus.toLocaleString('ko-KR')}</dd>
              </div>
              <div>
                <dt>{game.masteryContract ? '계승 소계' : '최종 명성'}</dt>
                <dd>{inheritedRenown.toLocaleString('ko-KR')}</dd>
              </div>
            </dl>
          </footer>
          {game.masteryContract ? (
            <footer className="ending-renown-contract">
              <span aria-hidden="true">{MASTERY_CONTRACTS[game.masteryContract].glyph}</span>
              <div>
                <small>{MASTERY_CONTRACTS[game.masteryContract].label} · EXACT CONTRIBUTION</small>
                <strong>
                  {MASTERY_CONTRACTS[game.masteryContract].name} · 실제 +{contractRenownBonus.toLocaleString('ko-KR')}
                  {masteryContractMastered ? ' · 영구 정복 기록' : ''}
                </strong>
                <p>
                  각 명성 보상에서 유산 적용을 마친 뒤 ×{MASTERY_CONTRACTS[game.masteryContract].scoreScale.toFixed(2)}
                  와 반올림으로 생긴 추가분만 합산했습니다. {MASTERY_CONTRACTS[game.masteryContract].burden}도 원정
                  전체에 유지됐습니다.
                </p>
              </div>
              <dl>
                <div>
                  <dt>계승 후 명성</dt>
                  <dd>{inheritedRenown.toLocaleString('ko-KR')}</dd>
                </div>
                <div data-highlight={contractRenownBonus > 0 ? 'true' : 'false'}>
                  <dt>계약 기여</dt>
                  <dd>+{contractRenownBonus.toLocaleString('ko-KR')}</dd>
                </div>
                <div>
                  <dt>최종 명성</dt>
                  <dd>{game.score.toLocaleString('ko-KR')}</dd>
                </div>
              </dl>
            </footer>
          ) : null}
        </section>
        {!endingWon && primaryFailureInsight ? (
          <section className="ending-final-debrief" aria-labelledby="ending-final-debrief-title">
            <header>
              <div>
                <small>FINAL DEBRIEF · PERSISTED TACTICAL RECORD</small>
                <h3 id="ending-final-debrief-title">마지막 전투의 패인과 다음 처방</h3>
                <p>
                  결과 화면에서 확인한 전선별 분석을 원정 기록에 봉인했습니다. 앱을 닫아도 같은 균열 재도전 때 다시
                  확인할 수 있습니다.
                </p>
              </div>
              <strong>
                <span>원정 종료</span>
                DAY {String(game.day).padStart(2, '0')}
                <small>{runCode}</small>
              </strong>
            </header>
            <div className="ending-debrief-primary">
              <span aria-hidden="true">{primaryFailureInsight.glyph}</span>
              <div>
                <small>가장 먼저 수정 · 전선 0{primaryFailureInsight.lane + 1}</small>
                <strong>{primaryFailureInsight.label}</strong>
                <p>{primaryFailureInsight.action}</p>
              </div>
              <b>격차 {primaryFailureInsight.gap}</b>
            </div>
            <ol aria-label="마지막 전투 전선별 패배 원인">
              {game.failureInsights.map((insight) => (
                <li data-cause={insight.cause} key={insight.lane}>
                  <span>0{insight.lane + 1}</span>
                  <div>
                    <strong>{insight.label}</strong>
                    <p>{insight.detail}</p>
                    <em>{insight.action}</em>
                  </div>
                  <b>{insight.gap > 0 ? `−${insight.gap}` : '근소 열세'}</b>
                </li>
              ))}
            </ol>
            <footer>
              <p>
                재도전은 실패 지점에서 이어지는 방식이 아닙니다. 같은 적·사건·유물 경로를 유지한 채 첫날부터 다시 시작해
                처방의 효과를 정확히 비교합니다.
              </p>
              <button type="button" onClick={replayExpedition}>
                <span>
                  <strong>처방대로 동일 균열 재도전</strong>
                  <small>{runCode} · 처음부터 다시 출정</small>
                </span>
                <i aria-hidden="true">↺</i>
              </button>
            </footer>
          </section>
        ) : null}
        <section
          className="ending-next-runway"
          data-state={legacyRouteState}
          aria-labelledby="ending-next-runway-title"
        >
          <header>
            <div>
              <small>
                {game.legacyReward > 0
                  ? 'EXPEDITION REWARD SECURED · AUTO-BANKED'
                  : 'EXPEDITION RECORD CLOSED · NO SHORT-RUN BONUS'}
              </small>
              <h3 id="ending-next-runway-title">
                {game.legacyReward > 0
                  ? `유산 불씨 +${game.legacyReward}가 보관되었습니다`
                  : '이번 원정은 유산 불씨를 남기지 못했습니다'}
              </h3>
              <p>
                {game.legacyReward > 0
                  ? comparisonRun
                    ? '별도 수령 없이 현재 보유 불씨에 합산됐습니다. 새로 계승한 효과는 표준 원정에서 적용되며 코드 비교 모드에서는 계속 봉인됩니다.'
                    : '별도 수령 없이 현재 보유 불씨에 합산됐습니다. 계승을 먼저 고르면 다음 원정의 첫날부터 효과가 적용됩니다.'
                  : '위험도 보너스는 완주할 때만 열립니다. 명성·왕관·과업을 남기거나 첫 밤을 돌파한 뒤 원정이 끝나면 복구 불씨를 확보합니다.'}
              </p>
            </div>
            <strong>
              <span>현재 보유</span>
              <b>{meta.embers}</b>
              <small>LEGACY EMBERS</small>
            </strong>
          </header>
          <dl className="ending-ember-ledger" aria-label={`이번 원정 유산 불씨 합계 ${game.legacyReward}`}>
            {LEGACY_REWARD_SOURCES.map((source) => (
              <div data-earned={legacyRewardBreakdown[source.id] > 0 ? 'true' : 'false'} key={source.id}>
                <dt>{source.label}</dt>
                <dd>+{legacyRewardBreakdown[source.id]}</dd>
                <small>{source.detail}</small>
              </div>
            ))}
          </dl>
          <ol aria-label="다음 원정 준비 단계">
            <li data-state="complete">
              <span>01</span>
              <div>
                <small>REWARD</small>
                <strong>보상 자동 보관</strong>
              </div>
              <b>완료</b>
            </li>
            <li data-state={legacyRouteState}>
              <span>02</span>
              <div>
                <small>LEGACY</small>
                <strong>
                  {legacyMastery ? legacyMastery.sealLabel : legacyReady ? '영구 강화 선택' : '불씨 축적'}
                </strong>
              </div>
              <b>
                {legacyMastery
                  ? `${legacyMastery.current} / ${legacyMastery.target}`
                  : legacyReady
                    ? '선택 가능'
                    : `${meta.embers} 불씨`}
              </b>
            </li>
            <li data-state="ready">
              <span>03</span>
              <div>
                <small>NEXT RUN</small>
                <strong>{nextWinningEndingId ? '미발견 결말 설계' : '다음 도전 설계'}</strong>
              </div>
              <b>{DIFFICULTIES[nextChallengeDifficulty].name}</b>
            </li>
          </ol>
          <article className="ending-featured-legacy" data-state={legacyRouteState}>
            <span aria-hidden="true">{legacyComplete ? '✦' : (featuredLegacy?.glyph ?? '◇')}</span>
            <div>
              <small>
                {legacyComplete
                  ? 'LEGACY COLLECTION COMPLETE'
                  : legacyReady
                    ? `RECOMMENDED LEGACY · ${DIFFICULTIES[nextChallengeDifficulty].name}`
                    : 'NEXT LEGACY TARGET'}
              </small>
              <strong>{legacyComplete ? '여섯 유산 계승 완료' : (featuredLegacy?.name ?? '다음 유산 준비 중')}</strong>
              <p>
                {legacyComplete
                  ? comparisonRun
                    ? '완성한 영구 강화는 표준 원정에서 적용되며 오늘의·공유 균열에서는 공정 비교를 위해 봉인됩니다.'
                    : '완성한 모든 영구 강화가 다음 원정의 시작부터 적용됩니다.'
                  : `${featuredLegacy?.strategy ?? '다음 원정의 계승 준비가 완료됐습니다.'}${comparisonRun ? ' 표준 원정에서 적용됩니다.' : ''}`}
              </p>
            </div>
            <b>
              {legacyComplete
                ? `${meta.legacy.length} / ${LEGACY_IDS.length}`
                : legacyReady && featuredLegacy
                  ? `지금 계승 · ${featuredLegacy.cost}`
                  : featuredLegacy
                    ? `${featuredLegacy.cost - meta.embers} 불씨 남음`
                    : 'READY'}
            </b>
          </article>
          {legacyMastery ? (
            <article className="ending-legacy-mastery" data-level={legacyMastery.level}>
              <span aria-hidden="true">{legacyMastery.glyph}</span>
              <div>
                <small>EVERLASTING LEGACY · PRESTIGE TRACK</small>
                <strong>{legacyMastery.title}</strong>
                <p>{legacyMastery.description}</p>
              </div>
              <b>{legacyMastery.sealLabel}</b>
              <footer>
                <div
                  role="progressbar"
                  aria-label={`${legacyMastery.nextTitle}까지 불씨 진행률`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={legacyMastery.progress}
                >
                  <i style={{ width: `${legacyMastery.progress}%` }} />
                </div>
                <span>
                  {legacyMastery.nextTitle}까지 불씨 {legacyMastery.remaining}
                </span>
              </footer>
            </article>
          ) : null}
          <footer>
            <button
              className="ending-runway-primary"
              data-action={!endingWon ? 'rematch' : legacyReady ? 'legacy' : 'challenge'}
              type="button"
              onClick={!endingWon ? replayExpedition : legacyReady ? () => openArchive('legacy') : prepareNextChallenge}
            >
              <span>
                <strong>
                  {!endingWon ? '동일 균열 즉시 재도전' : legacyReady ? '유산 계승부터 선택하기' : '다음 도전 설계하기'}
                </strong>
                <small>
                  {!endingWon
                    ? `${runCode} · 전술 처방을 적용해 처음부터 출정`
                    : legacyReady
                      ? `${affordableLegacyIds.length}개 영구 강화 구매 가능`
                      : legacyComplete
                        ? '모든 유산을 적용해 새 경로 선택'
                        : `${DIFFICULTIES[nextChallengeDifficulty].name} · 서약 선택`}
                </small>
              </span>
              <i aria-hidden="true">›</i>
            </button>
            <button
              className="ending-runway-secondary"
              type="button"
              onClick={
                !endingWon
                  ? prepareNextChallenge
                  : legacyReady
                    ? prepareNextChallenge
                    : legacyComplete
                      ? replayExpedition
                      : () => openArchive('legacy')
              }
            >
              <span>
                <strong>
                  {!endingWon
                    ? '다른 규칙으로 재설계'
                    : legacyReady
                      ? '계승 없이 다음 도전'
                      : legacyComplete
                        ? '같은 균열 재도전'
                        : '유산 목표 확인'}
                </strong>
                <small>
                  {!endingWon
                    ? `${DIFFICULTIES[nextChallengeDifficulty].name} · 서약과 모드 다시 선택`
                    : legacyReady
                      ? `${DIFFICULTIES[nextChallengeDifficulty].name} · 나중에 계승 가능`
                      : legacyComplete
                        ? `${runCode} · 동일한 경로`
                        : `${featuredLegacy?.name ?? '다음 유산'}까지 진행 확인`}
                </small>
              </span>
              <i aria-hidden="true">{endingWon && legacyComplete && !legacyReady ? '↺' : '›'}</i>
            </button>
          </footer>
        </section>
        <section
          className="ending-protocol-mastery"
          data-difficulty={game.difficulty}
          data-state={
            protocolMasteryRecognized ? 'mastered' : protocolMasteryProgress.metricReady ? 'ready' : 'progress'
          }
          aria-labelledby="ending-protocol-mastery-title"
        >
          <header>
            <span aria-hidden="true">{protocolMasteryProgress.glyph}</span>
            <div>
              <small>{protocolMasteryProgress.label}</small>
              <h3 id="ending-protocol-mastery-title">{protocolMasteryProgress.name}</h3>
              <p>{protocolMasteryProgress.requirement}</p>
            </div>
            <b>
              {protocolMasteryRecognized
                ? '숙련 인장 보유'
                : protocolMasteryProgress.metricReady
                  ? '수치 충족 · 완주 필요'
                  : '숙련 진행 중'}
            </b>
          </header>
          <div className="ending-protocol-progress">
            <div
              role="progressbar"
              aria-label={`${protocolMasteryProgress.name} 이번 원정 숙련도`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={protocolMasteryProgress.progress}
            >
              <i style={{ width: `${protocolMasteryProgress.progress}%` }} />
            </div>
            <span>
              밤 {protocolMasteryProgress.clearedNights} / {MAX_NIGHTS}
            </span>
            <span>
              {protocolMasteryProgress.metricLabel} {protocolMasteryProgress.currentLabel}
            </span>
          </div>
          <footer>
            {protocolMasteryProgress.completed
              ? '이번 원정에서 교범의 수치와 완주 조건을 모두 증명했습니다.'
              : protocolMasteryUnlocked
                ? '숙련 인장은 이미 영구 보존되어 있습니다. 이번 원정의 수행도도 별도로 남깁니다.'
                : protocolMasteryProgress.metricReady
                  ? '숙련 수치는 충족했습니다. 열두 번째 새벽까지 지켜 내면 인장이 영구 보존됩니다.'
                  : `다음 원정에서는 ${protocolMasteryProgress.requirement} 조건을 함께 노리세요.`}
          </footer>
        </section>
        <section
          className="ending-oath-chronicle"
          data-oath={game.oath}
          data-complete={endingWon && oathInterventionCount === 3 ? 'true' : 'false'}
          aria-labelledby="ending-oath-chronicle-title"
        >
          <header>
            <span aria-hidden="true">{OATHS[game.oath].glyph}</span>
            <div>
              <small>{oathChronicle.label} · EXPEDITION CHRONICLE</small>
              <h3 id="ending-oath-chronicle-title">{oathChronicle.title}</h3>
              <p>{oathChronicle.description}</p>
            </div>
            <b>{oathInterventionCount} / 3 새김</b>
          </header>
          <ol>
            {oathInterventionPath.map(({ stage, choice, state }) => (
              <li data-state={state} key={stage.day}>
                <span aria-hidden="true">{state === 'sealed' ? '✓' : OATHS[game.oath].glyph}</span>
                <div>
                  <small>
                    왕관 {stage.day / 4} · DAY {String(stage.day).padStart(2, '0')}
                  </small>
                  <strong>{stage.name}</strong>
                  <p>{state === 'sealed' ? `${choice?.title} · ${choice?.outcome}` : stage.promise}</p>
                </div>
                <b>{state === 'sealed' ? '서약 새김' : state === 'declined' ? '다른 길 선택' : '미도달'}</b>
              </li>
            ))}
          </ol>
          <footer>
            {endingWon && oathInterventionCount === 3
              ? `세 결단이 하나의 서약으로 완성되어 연대기 인장이 영구 보존됐습니다. — ${oathChronicle.witness}`
              : oathInterventionCount === 3
                ? `세 결단은 모두 새겼지만 새벽에 닿지 못해 연대기 인장은 미완으로 남았습니다. — ${oathChronicle.witness}`
                : oathInterventionCount > 0
                  ? `${oathInterventionCount}개의 결단이 이번 원정만의 서약 기록으로 남았습니다. — ${oathChronicle.witness}`
                  : `서약의 기본 효과는 지켰지만 왕관 앞 전용 결단은 새기지 않았습니다. — ${oathChronicle.witness}`}
          </footer>
        </section>
        <section className="ending-commander-dossier" data-ending={outcome} aria-labelledby="ending-dossier-title">
          <header>
            <div>
              <small>COMMANDER DOSSIER · EXPEDITION SIGNATURE</small>
              <h3 id="ending-dossier-title">{endingCommanderTitle}</h3>
              <p>
                {endingWon
                  ? `${game.decisions.length}번의 선택, ${game.battles}번의 교전과 ${game.relics.length}개의 유물 각인이 이 지휘 기록을 만들었습니다.`
                  : `${game.day}일차까지 내린 선택과 교전은 실패 기록이 아니라 같은 균열을 돌파할 정확한 출발점으로 남습니다.`}
              </p>
            </div>
            <span data-best={endingIsComparisonBest ? 'true' : 'false'}>
              <small>{endingIsComparisonBest ? 'RIFT BEST' : `SAME RIFT · ${endingComparisonCount}`}</small>
              <strong>
                {endingIsComparisonBest ? '동일 균열 최고 기록' : `동일 균열 중 #${endingComparisonPosition}`}
              </strong>
            </span>
          </header>
          <div className="ending-dossier-seals">
            {endingDossierSeals.map((seal) => (
              <article key={seal.id}>
                <span aria-hidden="true">{seal.glyph}</span>
                <div>
                  <small>{seal.label}</small>
                  <strong>{seal.title}</strong>
                  <p>{seal.description}</p>
                </div>
              </article>
            ))}
          </div>
          <dl>
            <div>
              <dt>동일 균열 순위</dt>
              <dd>
                #{endingComparisonPosition} / {endingComparisonCount}
              </dd>
            </div>
            <div>
              <dt>동일 균열 최고</dt>
              <dd>{endingComparisonBestScore.toLocaleString('ko-KR')}</dd>
            </div>
            <div>
              <dt>전체 원정 최고</dt>
              <dd>{bestScore.toLocaleString('ko-KR')}</dd>
            </div>
          </dl>
        </section>
        {activeResonances.length > 0 ? (
          <section className="ending-resonances" aria-label="완성한 유물 공명">
            <header>
              <span>COMPLETED RELIC RESONANCE</span>
              <strong>이번 원정의 공명 {activeResonances.length}개</strong>
            </header>
            <div>
              {activeResonances.map((resonanceId) => (
                <article key={resonanceId}>
                  <span aria-hidden="true">{RESONANCES[resonanceId].glyph}</span>
                  <div>
                    <small>{RESONANCES[resonanceId].category}</small>
                    <strong>{RESONANCES[resonanceId].name}</strong>
                    <p>{RESONANCES[resonanceId].description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        <div className="ending-trials">
          <header>
            <span>PERSONAL TRIALS</span>
            <strong>개인 과업 {completedTrialCount} / 3 완수</strong>
          </header>
          <div>
            {trialStatuses.map(({ id, current, target, completed }) => (
              <article data-completed={completed ? 'true' : 'false'} key={id}>
                <span aria-hidden="true">{completed ? '✓' : TRIALS[id].glyph}</span>
                <div>
                  <strong>{TRIALS[id].name}</strong>
                  <small>
                    {current.toLocaleString('ko-KR')} / {target.toLocaleString('ko-KR')}
                  </small>
                </div>
                <b>{completed ? `+${TRIALS[id].reward} 불씨` : '미완수'}</b>
              </article>
            ))}
          </div>
        </div>
        <EndingAtlas entries={endingDiscoveryEntries} titleId="ending-atlas-title" />
        <section
          className="ending-mastery-directive"
          data-state={endingMasteryDirective.state}
          aria-labelledby="ending-mastery-title"
        >
          <header>
            <span>{endingMasteryDirective.kicker}</span>
            <b>{endingMasteryDirective.target}</b>
          </header>
          <div>
            <span aria-hidden="true">{endingMasteryDirective.glyph}</span>
            <div>
              <h3 id="ending-mastery-title">{endingMasteryDirective.title}</h3>
              <p>{endingMasteryDirective.description}</p>
            </div>
          </div>
          <footer>
            <div
              role="progressbar"
              aria-label={endingMasteryDirective.progressLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(endingMasteryDirective.progress)}
            >
              <i style={{ width: `${endingMasteryDirective.progress}%` }} />
            </div>
            <span>{endingMasteryDirective.progressLabel}</span>
          </footer>
        </section>
        <div className="ending-actions" data-ending={outcome}>
          <button
            className="ending-legacy-action"
            data-ready={legacyReady ? 'true' : 'false'}
            type="button"
            onClick={() => openArchive('legacy')}
          >
            <span>
              <strong>{legacyMastery ? legacyMastery.sealLabel : `유산 계승 · ${meta.embers}`}</strong>
              <small>
                {legacyMastery
                  ? `${legacyMastery.nextTitle}까지 불씨 ${legacyMastery.remaining}`
                  : legacyReady
                    ? `${affordableLegacyIds.length}개 영구 강화 선택 가능`
                    : '다음 원정 영구 강화'}
              </small>
            </span>
            <i aria-hidden="true">›</i>
          </button>
          <button className="ending-next-action" type="button" onClick={prepareNextChallenge}>
            <span>
              <strong>{nextWinningEndingId ? '미발견 결말 설계' : '다음 도전 설계'}</strong>
              <small>
                {nextWinningEndingId
                  ? `${ENDINGS[nextWinningEndingId].title} · ${DIFFICULTIES[nextChallengeDifficulty].name}`
                  : `${DIFFICULTIES[nextChallengeDifficulty].name} · 서약 선택`}
              </small>
            </span>
            <i aria-hidden="true">›</i>
          </button>
          <button className="ending-rematch-action" type="button" onClick={replayExpedition}>
            <span>
              <strong>같은 균열 재도전</strong>
              <small>{runCode} · 동일한 적과 유물 경로</small>
            </span>
            <i aria-hidden="true">↺</i>
          </button>
          <button className="share-action" type="button" onClick={() => void shareExpedition()}>
            <span>
              <strong>기록 공유</strong>
              <small>결말·서약 연대기·다음 목표</small>
            </span>
            <i aria-hidden="true">↗</i>
          </button>
        </div>
      </section>
    </div>
  )
}
