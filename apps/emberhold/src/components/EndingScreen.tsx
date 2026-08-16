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
  LEGACY_UPGRADES,
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
  endingIsPersonalBest: boolean
  recentEndingPosition: number
  endingDossierSeals: readonly DossierSealView[]
  completedTrialCount: number
  activeResonances: readonly ResonanceId[]
  trialStatuses: readonly TrialStatusView[]
  endingDiscoveryEntries: EndingDiscoveryEntry[]
  endingMasteryDirective: MasteryDirectiveView
  unownedLegacyIds: readonly LegacyId[]
  affordableLegacyIds: readonly LegacyId[]
  nextLegacyId: LegacyId | null
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
  endingIsPersonalBest,
  recentEndingPosition,
  endingDossierSeals,
  completedTrialCount,
  activeResonances,
  trialStatuses,
  endingDiscoveryEntries,
  endingMasteryDirective,
  unownedLegacyIds,
  affordableLegacyIds,
  nextLegacyId,
  runCode,
  nextWinningEndingId,
  nextChallengeDifficulty,
  replayExpedition,
  prepareNextChallenge,
  shareExpedition,
  openArchive,
}: EndingScreenProps) {
  const endingWon = outcome === 'won'

  return (
    <div
      className="ending-screen"
      data-ending={outcome}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ending-title"
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
        <h2 id="ending-title">{currentEnding.title}</h2>
        <p>{currentEnding.description}</p>
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
          <div>
            <span>{game.mode === 'daily' ? '오늘의 균열' : game.mode === 'shared' ? '공유 균열' : '원정 코드'}</span>
            <strong>{runCode}</strong>
          </div>
        </div>
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
            <span data-best={endingIsPersonalBest ? 'true' : 'false'}>
              <small>{endingIsPersonalBest ? 'PERSONAL BEST' : `RECENT ${Math.max(1, meta.history.length)}`}</small>
              <strong>{endingIsPersonalBest ? '개인 최고 기록' : `최근 원정 중 #${recentEndingPosition}`}</strong>
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
              <dt>최근 기록 순위</dt>
              <dd>#{recentEndingPosition}</dd>
            </div>
            <div>
              <dt>개인 최고 명성</dt>
              <dd>{bestScore.toLocaleString('ko-KR')}</dd>
            </div>
            <div>
              <dt>개인 과업</dt>
              <dd>{completedTrialCount} / 3</dd>
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
        <section
          className="ending-legacy-forecast"
          data-state={
            unownedLegacyIds.length === 0 ? 'complete' : affordableLegacyIds.length > 0 ? 'ready' : 'progress'
          }
          aria-label="다음 원정 유산 준비"
        >
          <span aria-hidden="true">
            {unownedLegacyIds.length === 0 ? '✦' : LEGACY_UPGRADES[(affordableLegacyIds[0] ?? nextLegacyId)!].glyph}
          </span>
          <div>
            <small>NEXT EXPEDITION LEGACY</small>
            <strong>
              {unownedLegacyIds.length === 0
                ? '모든 유산 계승 완료'
                : affordableLegacyIds.length > 0
                  ? `지금 계승 가능한 유산 ${affordableLegacyIds.length}개`
                  : nextLegacyId
                    ? `${LEGACY_UPGRADES[nextLegacyId].name}까지 불씨 ${LEGACY_UPGRADES[nextLegacyId].cost - meta.embers}개`
                    : '다음 유산 준비 중'}
            </strong>
            <p>
              {unownedLegacyIds.length === 0
                ? '완성한 여섯 유산 효과가 다음 원정의 시작부터 모두 적용됩니다.'
                : affordableLegacyIds.length > 0
                  ? `${affordableLegacyIds
                      .slice(0, 2)
                      .map((legacyId) => LEGACY_UPGRADES[legacyId].name)
                      .join(
                        ' · ',
                      )}${affordableLegacyIds.length > 2 ? ` 외 ${affordableLegacyIds.length - 2}개` : ''} 중 원하는 계승을 선택할 수 있습니다.`
                  : nextLegacyId
                    ? LEGACY_UPGRADES[nextLegacyId].description
                    : '다음 원정의 계승 준비가 완료됐습니다.'}
            </p>
          </div>
          <b>{meta.embers} 불씨</b>
        </section>
        <div className="ending-actions">
          <button className="ending-rematch-action" type="button" onClick={replayExpedition} data-autofocus="true">
            <span>
              <strong>같은 균열 재도전</strong>
              <small>{runCode} · 동일한 적과 유물 경로</small>
            </span>
            <i aria-hidden="true">↺</i>
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
          <button className="share-action" type="button" onClick={() => void shareExpedition()}>
            <span>
              <strong>기록 공유</strong>
              <small>결말·서약 연대기·다음 목표</small>
            </span>
            <i aria-hidden="true">↗</i>
          </button>
          <button type="button" onClick={() => openArchive('legacy')}>
            <span>
              <strong>{unownedLegacyIds.length === 0 ? '유산 기록' : `유산 계승 · ${meta.embers}`}</strong>
              <small>다음 원정 영구 강화</small>
            </span>
            <i aria-hidden="true">›</i>
          </button>
        </div>
      </section>
    </div>
  )
}
