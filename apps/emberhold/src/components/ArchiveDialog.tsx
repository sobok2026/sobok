import './deferred.css'

import { EndingAtlas } from './EndingAtlas'
import type {
  AchievementId,
  ArchiveTab,
  Difficulty,
  EndingDiscoveryEntry,
  EndingId,
  ExpeditionRank,
  ExpeditionRecord,
  GameState,
  LegacyId,
  MetaState,
  RelicId,
  ResonanceId,
} from './game-model'
import {
  ACHIEVEMENT_IDS,
  ACHIEVEMENTS,
  ACTS,
  CAMPAIGN_EVENTS,
  campaignEventFor,
  DIFFICULTIES,
  ELITE_ENCOUNTERS,
  EMBER_CROWN_SCORE,
  ENDINGS,
  ENEMY_DOCTRINE_IDS,
  ENEMY_DOCTRINES,
  EXPEDITION_RANKS,
  expeditionComparisonKey,
  FINAL_CROWN_SEALS,
  FINAL_VOWS,
  KIND_META,
  LEGACY_IDS,
  LEGACY_UPGRADES,
  legacyMasteryFor,
  MASTERY_CONTRACT_IDS,
  MASTERY_CONTRACTS,
  MAX_HISTORY,
  NIGHT_STORIES,
  OATH_CHRONICLE_ACHIEVEMENTS,
  OATH_CHRONICLES,
  OATH_IDS,
  OATHS,
  PROTOCOL_MASTERIES,
  RELIC_IDS,
  RELICS,
  RESONANCE_IDS,
  RESONANCES,
  SPECIALIZATION_IDS,
  SPECIALIZATIONS,
} from './game-model'

type ArchiveDialogProps = {
  archiveTab: ArchiveTab
  bestScore: number
  completedEndingId: EndingId | null
  endingDiscoveryEntries: EndingDiscoveryEntry[]
  game: GameState
  masteredProtocolCount: number
  meta: MetaState
  nextChallengeDifficulty: Difficulty
  pendingLegacyPurchase: LegacyId | null
  recommendedLegacyId: LegacyId | null
  unlockedAchievementIds: ReadonlySet<AchievementId>
  closeArchive: () => void
  prepareNextChallenge: () => void
  setArchiveTab: (tab: ArchiveTab) => void
  setPendingLegacyPurchase: (legacyId: LegacyId | null) => void
  requestLegacyPurchase: (legacyId: LegacyId) => void
  cancelLegacyPurchase: () => void
  confirmLegacyPurchase: () => void
  activeResonancesFor: (relics: readonly RelicId[]) => ResonanceId[]
  expeditionRank: (score: number, won: boolean) => ExpeditionRank
  runCodeFor: (seed: number) => string
}

export function ArchiveDialog({
  archiveTab,
  bestScore,
  completedEndingId,
  endingDiscoveryEntries,
  game,
  masteredProtocolCount,
  meta,
  nextChallengeDifficulty,
  pendingLegacyPurchase,
  recommendedLegacyId,
  unlockedAchievementIds,
  closeArchive,
  prepareNextChallenge,
  setArchiveTab,
  setPendingLegacyPurchase,
  requestLegacyPurchase,
  cancelLegacyPurchase,
  confirmLegacyPurchase,
  activeResonancesFor,
  expeditionRank,
  runCodeFor,
}: ArchiveDialogProps) {
  const activeResonances = activeResonancesFor(game.relics)
  const pendingLegacyUpgrade = pendingLegacyPurchase ? LEGACY_UPGRADES[pendingLegacyPurchase] : null
  const recommendedLegacyUpgrade = recommendedLegacyId ? LEGACY_UPGRADES[recommendedLegacyId] : null
  const legacyMastery = legacyMasteryFor(meta)
  const completedEnding = completedEndingId ? ENDINGS[completedEndingId] : null
  const inheritedLegacyCost = meta.legacy.reduce((total, legacyId) => total + LEGACY_UPGRADES[legacyId].cost, 0)
  const totalLegacyCost = LEGACY_IDS.reduce((total, legacyId) => total + LEGACY_UPGRADES[legacyId].cost, 0)
  const legacyCollectionProgress = Math.round((inheritedLegacyCost / totalLegacyCost) * 100)
  const chronicleComparisonGroups = new Map<string, ExpeditionRecord[]>()
  for (const record of meta.history) {
    const comparisonKey = expeditionComparisonKey(record)
    const comparisonGroup = chronicleComparisonGroups.get(comparisonKey)
    if (comparisonGroup) comparisonGroup.push(record)
    else chronicleComparisonGroups.set(comparisonKey, [record])
  }

  return (
    <div className="modal-backdrop archive-backdrop" role="presentation">
      <section
        className="archive-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-title"
        data-focus-scope="archive"
        tabIndex={-1}
      >
        <header className="archive-heading">
          <div>
            <p className="eyebrow">EMBERHOLD ARCHIVE</p>
            <h2 id="archive-title">원정 기록실</h2>
          </div>
          <button
            className="modal-close"
            type="button"
            onClick={closeArchive}
            aria-label="기록실 닫기"
            data-autofocus="true"
          >
            ×
          </button>
        </header>
        <nav className="archive-tabs" aria-label="기록실 분류">
          {(
            [
              ['map', '원정 지도'],
              ['chronicle', `연대기 · ${meta.history.length}`],
              ['codex', '원정 도감'],
              ['legacy', legacyMastery ? `영원 인장 · ${legacyMastery.level}` : `유산 · ${meta.embers}`],
            ] as Array<[ArchiveTab, string]>
          ).map(([tab, label]) => (
            <button
              className={archiveTab === tab ? 'is-active' : ''}
              type="button"
              onClick={() => {
                setPendingLegacyPurchase(null)
                setArchiveTab(tab)
              }}
              aria-pressed={archiveTab === tab}
              key={tab}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="archive-content">
          {archiveTab === 'map' ? (
            <div className="campaign-map">
              {ACTS.map((act) => (
                <section key={act.number}>
                  <header>
                    <span>ACT {act.number}</span>
                    <div>
                      <strong>{act.title}</strong>
                      <small>{act.subtitle}</small>
                    </div>
                  </header>
                  <div className="map-nodes">
                    {Array.from({ length: act.range[1] - act.range[0] + 1 }, (_, offset) => act.range[0] + offset).map(
                      (night) => {
                        const completed = game.status === 'won' || night < game.day
                        const current = game.status === 'playing' && night === game.day
                        const waypointEvent = campaignEventFor(game.runSeed, night)
                        const routeVisible = (completed || current) && waypointEvent.routeVariant !== undefined
                        return (
                          <article
                            data-state={completed ? 'completed' : current ? 'current' : 'locked'}
                            data-boss={NIGHT_STORIES[night - 1].boss ? 'true' : 'false'}
                            data-elite={ELITE_ENCOUNTERS[night] ? 'true' : 'false'}
                            data-seeded-route={routeVisible ? 'true' : 'false'}
                            key={night}
                          >
                            <span>{String(night).padStart(2, '0')}</span>
                            <div>
                              <strong>{completed || current ? NIGHT_STORIES[night - 1].title : '기록 없음'}</strong>
                              <small>
                                {completed || current
                                  ? `${NIGHT_STORIES[night - 1].location}${ELITE_ENCOUNTERS[night] ? ' · 정예 교리' : ''}`
                                  : '아직 닿지 않은 밤'}
                              </small>
                              {routeVisible ? (
                                <em>
                                  ⌁ {waypointEvent.title} · 코드 경로 0{waypointEvent.routeVariant} / 02
                                </em>
                              ) : null}
                            </div>
                            <b>{completed ? '✓' : current ? '●' : '—'}</b>
                          </article>
                        )
                      },
                    )}
                  </div>
                </section>
              ))}
            </div>
          ) : null}

          {archiveTab === 'chronicle' ? (
            <div className="chronicle-panel">
              <header>
                <div>
                  <span className="eyebrow">LAST {MAX_HISTORY} EXPEDITIONS</span>
                  <h3>설원이 기억하는 원정</h3>
                  <p>당시 계승 전력까지 봉인하고, 코드·위험도·서약·계약이 모두 같은 원정끼리 비교합니다.</p>
                </div>
                <strong>
                  <span>전체 원정 최고</span>
                  {bestScore.toLocaleString('ko-KR')}
                </strong>
              </header>
              <EndingAtlas entries={endingDiscoveryEntries} titleId="chronicle-ending-atlas-title" compact />
              {meta.history.length > 0 ? (
                <div className="chronicle-list">
                  {meta.history.map((record, index) => {
                    const comparisonGroup = chronicleComparisonGroups.get(expeditionComparisonKey(record)) ?? [record]
                    const comparisonPosition = 1 + comparisonGroup.filter((entry) => entry.score > record.score).length
                    const legacyLoadoutTitle =
                      record.activeLegacy.length > 0
                        ? record.activeLegacy.map((legacyId) => LEGACY_UPGRADES[legacyId].name).join(' · ')
                        : '계승 전력 없이 시작한 원정'
                    const recordResonances = activeResonancesFor(record.relics)
                    const primaryFailureInsight = record.failureInsights[0] ?? null
                    return (
                      <article data-won={record.won ? 'true' : 'false'} key={record.runId}>
                        <span className="chronicle-rank">
                          <small>RANK</small>
                          <b>{expeditionRank(record.score, record.won)}</b>
                        </span>
                        <div className="chronicle-main">
                          <p>
                            <small>
                              {record.mode === 'daily'
                                ? '오늘의 균열'
                                : record.mode === 'shared'
                                  ? '공유 균열'
                                  : `원정 ${meta.history.length - index}`}
                            </small>
                            <b>{runCodeFor(record.seed)}</b>
                          </p>
                          <strong>{ENDINGS[record.ending].title}</strong>
                          <span>
                            {record.won ? '완주' : `${record.day}일차`} · {DIFFICULTIES[record.difficulty].name} ·{' '}
                            {OATHS[record.oath].name}
                          </span>
                          <div className="chronicle-build">
                            <span
                              className="chronicle-loadout"
                              data-comparison={record.mode === 'standard' ? 'false' : 'true'}
                              title={legacyLoadoutTitle}
                            >
                              <i aria-hidden="true">{record.activeLegacy.length > 0 ? '✦' : '◇'}</i>
                              {record.mode === 'standard'
                                ? `계승 유산 · ${record.activeLegacy.length}개`
                                : '공정 적재 · 계승 0개'}
                              <span className="settings-visually-hidden">출정 계승 적재: {legacyLoadoutTitle}</span>
                            </span>
                            {record.masteryContract ? (
                              <span
                                className="chronicle-contract"
                                title={`${MASTERY_CONTRACTS[record.masteryContract].burden} · ${MASTERY_CONTRACTS[record.masteryContract].reward}`}
                              >
                                <i aria-hidden="true">{MASTERY_CONTRACTS[record.masteryContract].glyph}</i>
                                영원 계약 · {MASTERY_CONTRACTS[record.masteryContract].name}
                              </span>
                            ) : null}
                            <span className="chronicle-relics" role="img" aria-label={`유물 ${record.relics.length}개`}>
                              {record.relics.map((relicId) => (
                                <i aria-hidden="true" title={RELICS[relicId].name} key={relicId}>
                                  {RELICS[relicId].glyph}
                                </i>
                              ))}
                            </span>
                            {recordResonances.length > 0 ? (
                              <span className="chronicle-resonances">
                                {recordResonances.map((resonanceId) => (
                                  <b title={RESONANCES[resonanceId].description} key={resonanceId}>
                                    {RESONANCES[resonanceId].glyph} {RESONANCES[resonanceId].name}
                                  </b>
                                ))}
                              </span>
                            ) : (
                              <small>완성된 공명 없음</small>
                            )}
                          </div>
                          {primaryFailureInsight ? (
                            <div className="chronicle-debrief">
                              <span aria-hidden="true">{primaryFailureInsight.glyph}</span>
                              <div>
                                <small>FINAL DEBRIEF · 전선 0{primaryFailureInsight.lane + 1}</small>
                                <strong>{primaryFailureInsight.label}</strong>
                                <p>{primaryFailureInsight.action}</p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                        <dl>
                          <div data-comparison="true">
                            <dt>동일 균열</dt>
                            <dd>
                              #{comparisonPosition} / {comparisonGroup.length}
                            </dd>
                          </div>
                          <div>
                            <dt>명성</dt>
                            <dd>{record.score.toLocaleString('ko-KR')}</dd>
                          </div>
                          <div data-reward={record.legacyReward > 0 ? 'true' : 'false'}>
                            <dt>유산 불씨</dt>
                            <dd>+{record.legacyReward}</dd>
                          </div>
                          <div>
                            <dt>완벽 방어</dt>
                            <dd>{record.perfectNights}</dd>
                          </div>
                          <div>
                            <dt>과업</dt>
                            <dd>{record.trialsCompleted} / 3</dd>
                          </div>
                        </dl>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="chronicle-empty">
                  <span aria-hidden="true">◇</span>
                  <strong>아직 완결된 원정이 없습니다</strong>
                  <p>불씨가 꺼지거나 열두 번째 새벽에 도달하면 첫 기록이 새겨집니다.</p>
                </div>
              )}
            </div>
          ) : null}

          {archiveTab === 'codex' ? (
            <div className="codex-layout">
              <section>
                <header>
                  <span>RELIC CODEX</span>
                  <strong>
                    발견한 유물 {new Set([...meta.discoveredRelics, ...game.relics]).size} / {RELIC_IDS.length}
                  </strong>
                </header>
                <div className="codex-grid relic-codex">
                  {RELIC_IDS.map((relicId) => {
                    const discovered = meta.discoveredRelics.includes(relicId) || game.relics.includes(relicId)
                    return (
                      <article data-locked={discovered ? 'false' : 'true'} key={relicId}>
                        <span aria-hidden="true">{discovered ? RELICS[relicId].glyph : '?'}</span>
                        <div>
                          <small>{discovered ? RELICS[relicId].category : '미발견 유물'}</small>
                          <strong>{discovered ? RELICS[relicId].name : '얼음 아래의 흔적'}</strong>
                          <p>{discovered ? RELICS[relicId].description : '원정을 계속해 이 기록을 해제하세요.'}</p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
              <section>
                <header>
                  <span>ACHIEVEMENTS</span>
                  <strong>
                    업적 {unlockedAchievementIds.size} / {ACHIEVEMENT_IDS.length}
                  </strong>
                </header>
                <div className="codex-grid achievement-codex">
                  {ACHIEVEMENT_IDS.map((achievementId) => {
                    const unlocked = unlockedAchievementIds.has(achievementId)
                    return (
                      <article data-locked={unlocked ? 'false' : 'true'} key={achievementId}>
                        <span aria-hidden="true">{unlocked ? ACHIEVEMENTS[achievementId].glyph : '·'}</span>
                        <div>
                          <strong>{ACHIEVEMENTS[achievementId].name}</strong>
                          <p>{ACHIEVEMENTS[achievementId].description}</p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
              <section className="resonance-codex-panel">
                <header>
                  <span>RELIC RESONANCE</span>
                  <strong>
                    활성 공명 {activeResonances.length} / {RESONANCE_IDS.length}
                  </strong>
                </header>
                <div className="codex-grid resonance-codex">
                  {RESONANCE_IDS.map((resonanceId) => {
                    const resonance = RESONANCES[resonanceId]
                    const active = activeResonances.includes(resonanceId)
                    return (
                      <article data-active={active ? 'true' : 'false'} key={resonanceId}>
                        <span aria-hidden="true">{resonance.glyph}</span>
                        <div>
                          <small>
                            {resonance.category} ·{' '}
                            {resonance.requirements.map((relicId) => RELICS[relicId].name).join(' + ')}
                          </small>
                          <strong>{resonance.name}</strong>
                          <p>{resonance.description}</p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
              <section className="veteran-codex-panel">
                <header>
                  <span>VETERAN PATHS</span>
                  <strong>3 병과 · 6 진급</strong>
                </header>
                <div className="codex-grid specialization-codex">
                  {SPECIALIZATION_IDS.map((specializationId) => {
                    const specialization = SPECIALIZATIONS[specializationId]
                    return (
                      <article className={`kind-${specialization.kind}`} key={specializationId}>
                        <span aria-hidden="true">{specialization.glyph}</span>
                        <div>
                          <small>
                            {KIND_META[specialization.kind].name} · {specialization.subtitle}
                          </small>
                          <strong>{specialization.name}</strong>
                          <p>{specialization.description}</p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
              <section className="enemy-doctrine-codex-panel">
                <header>
                  <span>ELITE DOCTRINES</span>
                  <strong>3막 · 8개 정예 교리</strong>
                </header>
                <div className="codex-grid enemy-doctrine-codex">
                  {ENEMY_DOCTRINE_IDS.map((doctrineId, index) => {
                    const doctrine = ENEMY_DOCTRINES[doctrineId]
                    const act = index < 2 ? 1 : index < 5 ? 2 : 3
                    return (
                      <article data-act={act} key={doctrineId}>
                        <span aria-hidden="true">{doctrine.glyph}</span>
                        <div>
                          <small>
                            ACT {act} · {doctrine.label}
                          </small>
                          <strong>{doctrine.name}</strong>
                          <p>{doctrine.description}</p>
                          <em>
                            <b>파훼법</b> {doctrine.counterplay}
                          </em>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
              <section className="final-crown-codex-panel">
                <header>
                  <span>FINAL ENCOUNTER · TRIPLE CROWN</span>
                  <strong>백색 왕의 세 칙령 · 12일차 전술 해법</strong>
                </header>
                <div className="codex-grid final-crown-codex">
                  {FINAL_CROWN_SEALS.map((seal) => (
                    <article key={seal.name}>
                      <span aria-hidden="true">{seal.glyph}</span>
                      <div>
                        <small>
                          {seal.label} · 전선 0{seal.lane + 1}
                        </small>
                        <strong>{seal.name}</strong>
                        <p>{seal.requirement}</p>
                        <em>
                          <b>미해제 압박</b> {seal.pressure}
                        </em>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
              <section className="oath-codex-panel">
                <header>
                  <span>OATH CROWN CHRONICLES</span>
                  <strong>3개 서약 · 왕관의 날 전용 결단 9개</strong>
                </header>
                <div className="codex-grid oath-codex">
                  {OATH_IDS.map((oathId) => {
                    const chronicle = OATH_CHRONICLES[oathId]
                    const mastered = unlockedAchievementIds.has(OATH_CHRONICLE_ACHIEVEMENTS[oathId])
                    return (
                      <article
                        data-oath={oathId}
                        data-active={game.oath === oathId ? 'true' : 'false'}
                        data-mastered={mastered ? 'true' : 'false'}
                        key={oathId}
                      >
                        <span aria-hidden="true">{OATHS[oathId].glyph}</span>
                        <div>
                          <small>{chronicle.label}</small>
                          <strong>{chronicle.title}</strong>
                          <p>{chronicle.description}</p>
                          <em className="oath-codex-mastery">
                            {mastered ? '✓ 연대기 인장 보유' : '세 전용 결단을 모두 새기고 완주하면 영구 해제'}
                          </em>
                          <ol>
                            {chronicle.stages.map((stage) => {
                              const intervention = CAMPAIGN_EVENTS[stage.day - 1]?.choices.find(
                                (choice) => choice.oathOnly === oathId,
                              )
                              const payoff = intervention?.echo
                                ? intervention.echo.effect
                                : intervention?.finalVow
                                  ? FINAL_VOWS[intervention.finalVow].effect
                                  : intervention?.outcome
                              return (
                                <li key={stage.day}>
                                  <b>DAY {String(stage.day).padStart(2, '0')}</b>
                                  <span>
                                    {stage.name}
                                    <em>{payoff}</em>
                                  </span>
                                </li>
                              )
                            })}
                          </ol>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
              <section className="difficulty-codex-panel">
                <header>
                  <span>EXPEDITION PROTOCOLS</span>
                  <strong>숙련 인장 {masteredProtocolCount} / 3 · 서로 다른 전투와 자원 곡선</strong>
                </header>
                <div className="codex-grid difficulty-codex">
                  {(Object.keys(DIFFICULTIES) as Difficulty[]).map((difficulty) => {
                    const protocol = DIFFICULTIES[difficulty]
                    const mastery = PROTOCOL_MASTERIES[difficulty]
                    const mastered = unlockedAchievementIds.has(mastery.achievement)
                    return (
                      <article
                        data-difficulty={difficulty}
                        data-mastered={mastered ? 'true' : 'false'}
                        key={difficulty}
                      >
                        <span aria-hidden="true">{protocol.glyph}</span>
                        <div>
                          <small>
                            {protocol.label} · 명성 ×{protocol.scoreScale.toFixed(2)}
                          </small>
                          <strong>
                            {protocol.name} · {protocol.ruleName}
                          </strong>
                          <p>{protocol.ruleDescription}</p>
                          <em>
                            <b>원정 자원</b> {protocol.economySummary}
                          </em>
                          <em className="protocol-codex-mastery">
                            <b>{mastered ? '✓ 숙련 완료' : '숙련 인장'}</b>{' '}
                            {mastered ? mastery.name : mastery.requirement}
                          </em>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
              <section className="rank-codex-panel">
                <header>
                  <span>RENOWN LADDER</span>
                  <strong>완주 등급 · 숨기지 않는 결말 기준</strong>
                </header>
                <div className="rank-ladder">
                  {EXPEDITION_RANKS.map((entry) => (
                    <article data-rank={entry.rank} key={entry.rank}>
                      <span aria-hidden="true">{entry.rank}</span>
                      <div>
                        <small>
                          {entry.rank === 'D'
                            ? '40,000 미만 · 중도 종료'
                            : `명성 ${entry.minimum.toLocaleString('ko-KR')} 이상`}
                        </small>
                        <strong>{entry.title}</strong>
                        <p>{entry.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="rank-ending-rule">
                  <span aria-hidden="true">♜</span>
                  <p>
                    <strong>불씨 왕관 결말</strong>
                    자비의 선택이 8회 미만인 완주에서 명성 {EMBER_CROWN_SCORE.toLocaleString('ko-KR')} 이상. 자비의 선택
                    8회 이상이면 점수와 관계없이 화로의 새벽이 우선됩니다.
                  </p>
                </div>
              </section>
            </div>
          ) : null}

          {archiveTab === 'legacy' ? (
            <div className="legacy-panel">
              <header>
                <div>
                  <span className="eyebrow">BETWEEN EXPEDITIONS</span>
                  <h3>{legacyMastery ? '완성된 유산은 영원 인장을 벼립니다' : '불씨는 다음 원정을 기억합니다'}</h3>
                  <p>
                    {legacyMastery
                      ? '여섯 유산 이후의 불씨는 소비되지 않고 30마다 새 명예 인장으로 남습니다. 전투력은 더 올리지 않아 높은 위험도의 균형을 지킵니다.'
                      : '완주와 도전으로 얻은 유산 불씨를 영구 계승에 사용하세요. 현재 원정에 고정된 효과와 다음 출정 대기를 구분해 표시합니다.'}
                  </p>
                </div>
                <strong>
                  <span>보유 불씨</span>
                  {meta.embers}
                </strong>
              </header>
              {completedEnding ? (
                <section
                  className="legacy-route-summary legacy-return-handoff"
                  data-outcome={game.status}
                  aria-labelledby="legacy-return-handoff-title"
                >
                  <span aria-hidden="true">{completedEnding.glyph}</span>
                  <div>
                    <small>LAST EXPEDITION REWARD · NEXT LEGACY HANDOFF</small>
                    <strong id="legacy-return-handoff-title">
                      {completedEnding.title}의 보상이 계승으로 이어집니다
                    </strong>
                    <p>
                      {game.legacyReward > 0
                        ? `이번 원정의 불씨 +${game.legacyReward}가 보관되었습니다.`
                        : '이번 원정은 추가 불씨 없이 전술 기록을 남겼습니다.'}{' '}
                      {recommendedLegacyUpgrade
                        ? `${DIFFICULTIES[nextChallengeDifficulty].name}에는 ${recommendedLegacyUpgrade.name} 계승을 추천합니다.`
                        : '모든 영구 유산이 준비되어 다음 도전 설계로 바로 이동할 수 있습니다.'}
                    </p>
                  </div>
                  <b>
                    귀환 +{game.legacyReward} · 보유 {meta.embers}
                  </b>
                  <footer>
                    <span>유산 선택은 건너뛰어도 되며, 보관된 불씨와 원정 기록은 그대로 유지됩니다.</span>
                    <button type="button" onClick={prepareNextChallenge}>
                      <strong>계승을 마치고 다음 원정 설계</strong>
                      <small>{DIFFICULTIES[nextChallengeDifficulty].name} · 서약 선택</small>
                      <i aria-hidden="true">›</i>
                    </button>
                  </footer>
                </section>
              ) : null}
              <section
                className="legacy-route-summary"
                data-state={
                  meta.legacy.length === LEGACY_IDS.length
                    ? 'complete'
                    : recommendedLegacyUpgrade && meta.embers >= recommendedLegacyUpgrade.cost
                      ? 'ready'
                      : 'progress'
                }
                aria-labelledby="legacy-route-summary-title"
              >
                <span aria-hidden="true">{recommendedLegacyUpgrade?.glyph ?? '✦'}</span>
                <div>
                  <small>
                    {recommendedLegacyUpgrade
                      ? `RECOMMENDED FOR ${DIFFICULTIES[nextChallengeDifficulty].name.toUpperCase()}`
                      : 'LEGACY COLLECTION COMPLETE'}
                  </small>
                  <strong id="legacy-route-summary-title">
                    {recommendedLegacyUpgrade?.name ?? '여섯 유산 계승 완료'}
                  </strong>
                  <p>
                    {recommendedLegacyUpgrade?.strategy ??
                      '모든 영구 강화가 다음 원정의 시작 자원·대열·지휘·귀환 보상에 함께 적용됩니다.'}
                  </p>
                </div>
                <b>
                  {recommendedLegacyUpgrade
                    ? meta.embers >= recommendedLegacyUpgrade.cost
                      ? `지금 계승 · ${recommendedLegacyUpgrade.cost}`
                      : `${recommendedLegacyUpgrade.cost - meta.embers} 불씨 남음`
                    : `${meta.legacy.length} / ${LEGACY_IDS.length}`}
                </b>
                <footer>
                  <div
                    role="progressbar"
                    aria-label="전체 유산 계승 비용 진행률"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={legacyCollectionProgress}
                  >
                    <i style={{ width: `${legacyCollectionProgress}%` }} />
                  </div>
                  <span>
                    계승 완료 비용 {inheritedLegacyCost} / {totalLegacyCost} · 보유 불씨 {meta.embers}
                  </span>
                </footer>
              </section>
              {legacyMastery ? (
                <>
                  <section
                    className="legacy-route-summary legacy-mastery-track"
                    data-state={legacyMastery.level > 0 ? 'earned' : 'progress'}
                    aria-labelledby="legacy-mastery-title"
                  >
                    <span aria-hidden="true">{legacyMastery.glyph}</span>
                    <div>
                      <small>EVERLASTING LEGACY · PRESTIGE WITHOUT POWER CREEP</small>
                      <strong id="legacy-mastery-title">{legacyMastery.title}</strong>
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
                        불씨 {legacyMastery.current} / {legacyMastery.target} · {legacyMastery.nextTitle}까지{' '}
                        {legacyMastery.remaining}
                      </span>
                    </footer>
                  </section>
                  <section className="legacy-contract-codex" aria-labelledby="legacy-contract-codex-title">
                    <header>
                      <div>
                        <small>ETERNAL COVENANTS · STANDARD EXPEDITION ONLY</small>
                        <strong id="legacy-contract-codex-title">완성 이후의 선택형 도전</strong>
                        <p>영구 전투력은 더하지 않습니다. 스스로 부담을 선택한 표준 원정에만 명성 배율을 남깁니다.</p>
                      </div>
                      <b>
                        개방{' '}
                        {
                          MASTERY_CONTRACT_IDS.filter(
                            (id) => legacyMastery.level >= MASTERY_CONTRACTS[id].requiredMasteryLevel,
                          ).length
                        }{' '}
                        / 3 · 정복 {meta.masteredContracts.length} / 3
                      </b>
                    </header>
                    <div>
                      {MASTERY_CONTRACT_IDS.map((contractId) => {
                        const contract = MASTERY_CONTRACTS[contractId]
                        const unlocked = legacyMastery.level >= contract.requiredMasteryLevel
                        const mastered = meta.masteredContracts.includes(contractId)
                        return (
                          <article
                            data-unlocked={unlocked ? 'true' : 'false'}
                            data-mastered={mastered ? 'true' : 'false'}
                            key={contractId}
                          >
                            <span aria-hidden="true">{contract.glyph}</span>
                            <div>
                              <small>{contract.label}</small>
                              <strong>{contract.name}</strong>
                              <p>{contract.description}</p>
                            </div>
                            <dl>
                              <div>
                                <dt>부담</dt>
                                <dd>{contract.burden}</dd>
                              </div>
                              <div>
                                <dt>보상</dt>
                                <dd>{contract.reward}</dd>
                              </div>
                            </dl>
                            <b>
                              {mastered
                                ? '✓ 새벽 도달 · 영구 정복 기록'
                                : unlocked
                                  ? '✓ 출정 설정에서 선택 가능'
                                  : `영원 인장 ${contract.requiredMasteryLevel} 필요`}
                            </b>
                          </article>
                        )
                      })}
                    </div>
                    <footer>
                      오늘의 균열과 공유 균열은 같은 코드 비교를 지키기 위해 계승 유산과 영원 계약 없이 진행됩니다.
                    </footer>
                  </section>
                </>
              ) : null}
              {pendingLegacyPurchase && pendingLegacyUpgrade ? (
                <section className="legacy-purchase-confirmation" aria-labelledby="legacy-purchase-title">
                  <span aria-hidden="true">{pendingLegacyUpgrade.glyph}</span>
                  <div>
                    <small>PERMANENT LEGACY CONFIRMATION</small>
                    <strong id="legacy-purchase-title">{pendingLegacyUpgrade.name}</strong>
                    <p>
                      {pendingLegacyUpgrade.description} · {pendingLegacyUpgrade.strategy}
                    </p>
                  </div>
                  <dl>
                    <div>
                      <dt>현재 불씨</dt>
                      <dd>{meta.embers}</dd>
                    </div>
                    <div>
                      <dt>계승 비용</dt>
                      <dd>-{pendingLegacyUpgrade.cost}</dd>
                    </div>
                    <div>
                      <dt>남는 불씨</dt>
                      <dd>{meta.embers - pendingLegacyUpgrade.cost}</dd>
                    </div>
                  </dl>
                  <footer>
                    <button type="button" onClick={cancelLegacyPurchase}>
                      취소
                    </button>
                    <button className="legacy-purchase-confirm" type="button" onClick={confirmLegacyPurchase}>
                      불씨 {pendingLegacyUpgrade.cost} 사용하고 계승
                    </button>
                  </footer>
                </section>
              ) : null}
              <div className="legacy-grid">
                {LEGACY_IDS.map((legacyId) => {
                  const upgrade = LEGACY_UPGRADES[legacyId]
                  const owned = meta.legacy.includes(legacyId)
                  const activeThisRun = game.campaignStarted && game.activeLegacy.includes(legacyId)
                  return (
                    <button
                      type="button"
                      data-owned={owned ? 'true' : 'false'}
                      data-run-state={activeThisRun ? 'active' : owned ? 'next' : 'locked'}
                      data-selected={pendingLegacyPurchase === legacyId ? 'true' : 'false'}
                      data-affordable={meta.embers >= upgrade.cost ? 'true' : 'false'}
                      data-recommended={recommendedLegacyId === legacyId ? 'true' : 'false'}
                      disabled={owned}
                      aria-pressed={pendingLegacyPurchase === legacyId}
                      onClick={() => requestLegacyPurchase(legacyId)}
                      key={legacyId}
                    >
                      <span aria-hidden="true">{upgrade.glyph}</span>
                      <div>
                        {recommendedLegacyId === legacyId ? <small>다음 원정 추천</small> : null}
                        <strong>{upgrade.name}</strong>
                        <p>{upgrade.description}</p>
                      </div>
                      <b>
                        {owned
                          ? activeThisRun
                            ? game.status === 'playing'
                              ? '현재 원정 적용'
                              : '완료 원정 적용'
                            : game.campaignStarted
                              ? '다음 원정 대기'
                              : '출정 준비 완료'
                          : pendingLegacyPurchase === legacyId
                            ? '확인 중'
                            : `✦ ${upgrade.cost}`}
                      </b>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
