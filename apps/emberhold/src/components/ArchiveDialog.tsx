import './deferred.css'

import { EndingAtlas } from './EndingAtlas'
import type {
  AchievementId,
  ArchiveTab,
  Difficulty,
  EndingDiscoveryEntry,
  ExpeditionRank,
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
  DIFFICULTIES,
  ELITE_ENCOUNTERS,
  EMBER_CROWN_SCORE,
  ENDINGS,
  ENEMY_DOCTRINE_IDS,
  ENEMY_DOCTRINES,
  EXPEDITION_RANKS,
  FINAL_CROWN_SEALS,
  FINAL_VOWS,
  KIND_META,
  LEGACY_IDS,
  LEGACY_UPGRADES,
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
  endingDiscoveryEntries: EndingDiscoveryEntry[]
  game: GameState
  masteredProtocolCount: number
  meta: MetaState
  pendingLegacyPurchase: LegacyId | null
  unlockedAchievementIds: ReadonlySet<AchievementId>
  closeArchive: () => void
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
  endingDiscoveryEntries,
  game,
  masteredProtocolCount,
  meta,
  pendingLegacyPurchase,
  unlockedAchievementIds,
  closeArchive,
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
              ['legacy', `유산 · ${meta.embers}`],
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
                        return (
                          <article
                            data-state={completed ? 'completed' : current ? 'current' : 'locked'}
                            data-boss={NIGHT_STORIES[night - 1].boss ? 'true' : 'false'}
                            data-elite={ELITE_ENCOUNTERS[night] ? 'true' : 'false'}
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
                  <p>승리와 실패를 모두 남깁니다. 같은 코드의 오늘의 균열로 기록을 비교할 수 있습니다.</p>
                </div>
                <strong>
                  <span>개인 최고</span>
                  {bestScore.toLocaleString('ko-KR')}
                </strong>
              </header>
              <EndingAtlas entries={endingDiscoveryEntries} titleId="chronicle-ending-atlas-title" compact />
              {meta.history.length > 0 ? (
                <div className="chronicle-list">
                  {meta.history.map((record, index) => (
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
                          <span className="chronicle-relics" role="img" aria-label={`유물 ${record.relics.length}개`}>
                            {record.relics.map((relicId) => (
                              <i aria-hidden="true" title={RELICS[relicId].name} key={relicId}>
                                {RELICS[relicId].glyph}
                              </i>
                            ))}
                          </span>
                          {activeResonancesFor(record.relics).length > 0 ? (
                            <span className="chronicle-resonances">
                              {activeResonancesFor(record.relics).map((resonanceId) => (
                                <b title={RESONANCES[resonanceId].description} key={resonanceId}>
                                  {RESONANCES[resonanceId].glyph} {RESONANCES[resonanceId].name}
                                </b>
                              ))}
                            </span>
                          ) : (
                            <small>완성된 공명 없음</small>
                          )}
                        </div>
                      </div>
                      <dl>
                        <div>
                          <dt>명성</dt>
                          <dd>{record.score.toLocaleString('ko-KR')}</dd>
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
                  ))}
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
                  <h3>불씨는 다음 원정을 기억합니다</h3>
                  <p>완주와 도전으로 얻은 유산 불씨를 영구 계승에 사용하세요. 효과는 다음 원정부터 적용됩니다.</p>
                </div>
                <strong>
                  <span>보유 불씨</span>
                  {meta.embers}
                </strong>
              </header>
              {pendingLegacyPurchase && pendingLegacyUpgrade ? (
                <section className="legacy-purchase-confirmation" aria-labelledby="legacy-purchase-title">
                  <span aria-hidden="true">{pendingLegacyUpgrade.glyph}</span>
                  <div>
                    <small>PERMANENT LEGACY CONFIRMATION</small>
                    <strong id="legacy-purchase-title">{pendingLegacyUpgrade.name}</strong>
                    <p>{pendingLegacyUpgrade.description}</p>
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
                  return (
                    <button
                      type="button"
                      data-owned={owned ? 'true' : 'false'}
                      data-selected={pendingLegacyPurchase === legacyId ? 'true' : 'false'}
                      data-affordable={meta.embers >= upgrade.cost ? 'true' : 'false'}
                      disabled={owned}
                      aria-pressed={pendingLegacyPurchase === legacyId}
                      onClick={() => requestLegacyPurchase(legacyId)}
                      key={legacyId}
                    >
                      <span aria-hidden="true">{upgrade.glyph}</span>
                      <div>
                        <strong>{upgrade.name}</strong>
                        <p>{upgrade.description}</p>
                      </div>
                      <b>
                        {owned ? '계승 완료' : pendingLegacyPurchase === legacyId ? '확인 중' : `✦ ${upgrade.cost}`}
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
