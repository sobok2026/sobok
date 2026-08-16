import Image from 'next/image'
import titleArt from '@/app/emberhold-title.webp'
import type {
  AchievementId,
  ArchiveTab,
  Difficulty,
  EndingId,
  GameState,
  MetaState,
  OathId,
  RunMode,
} from './game-model'
import {
  DIFFICULTIES,
  type ENDING_ROUTES,
  ENDINGS,
  OATH_CHRONICLE_ACHIEVEMENTS,
  OATH_CHRONICLES,
  OATH_IDS,
  OATHS,
  PROTOCOL_MASTERIES,
} from './game-model'
import {
  preloadArchiveDialog,
  preloadCampaignEventDialog,
  preloadExpeditionMenu,
  preloadHelpDialogs,
  preloadSettingsDialog,
} from './game-preloads'

type RuntimeState = 'offline' | 'installed' | 'ready' | 'online'

type TitleScreenProps = {
  blocked: boolean
  showDifficulty: boolean
  selectedDifficulty: Difficulty | null
  setupMode: RunMode
  sharedCode: string
  sharedSeed: number | null
  unlockedAchievementIds: ReadonlySet<AchievementId>
  showEndingRouteRecommendation: boolean
  nextWinningEndingId: EndingId | null
  nextWinningEndingRoute: (typeof ENDING_ROUTES)[EndingId] | null
  meta: MetaState
  masteredProtocolCount: number
  ready: boolean
  hasProgress: boolean
  game: GameState
  currentActNumber: number
  currentStoryTitle: string
  difficultyProtocolName: string
  rosterCount: number
  standalone: boolean
  installPrompt: boolean
  bestScore: number
  runtimeState: RuntimeState
  runtimeStateCopy: string
  soundOn: boolean
  setShowDifficulty: (show: boolean) => void
  setSelectedDifficulty: (difficulty: Difficulty | null) => void
  setSetupMode: (mode: RunMode) => void
  setSharedCode: (code: string) => void
  setShowInstallHelp: (show: boolean) => void
  openArchive: (tab: ArchiveTab) => void
  openSettings: () => void
  toggleSound: () => void
  enterGame: () => void
  preloadEnterGame: () => void
  askToDiscardCurrentCampaign: () => void
  installGame: () => Promise<void>
  startCampaign: (difficulty: Difficulty, oath: OathId, mode: RunMode, requestedSeed?: number | null) => void
}

export function TitleScreen({
  blocked,
  showDifficulty,
  selectedDifficulty,
  setupMode,
  sharedCode,
  sharedSeed,
  unlockedAchievementIds,
  showEndingRouteRecommendation,
  nextWinningEndingId,
  nextWinningEndingRoute,
  meta,
  masteredProtocolCount,
  ready,
  hasProgress,
  game,
  currentActNumber,
  currentStoryTitle,
  difficultyProtocolName,
  rosterCount,
  standalone,
  installPrompt,
  bestScore,
  runtimeState,
  runtimeStateCopy,
  soundOn,
  setShowDifficulty,
  setSelectedDifficulty,
  setSetupMode,
  setSharedCode,
  setShowInstallHelp,
  openArchive,
  openSettings,
  toggleSound,
  enterGame,
  preloadEnterGame,
  askToDiscardCurrentCampaign,
  installGame,
  startCampaign,
}: TitleScreenProps) {
  const firstExpedition = meta.completedRuns === 0 && meta.history.length === 0

  return (
    <div
      className="title-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="title-heading"
      data-focus-scope="title"
      inert={blocked ? true : undefined}
      tabIndex={-1}
    >
      <Image className="title-art" src={titleArt} alt="" fill priority sizes="100vw" placeholder="blur" />
      <div className="title-vignette" aria-hidden="true" />
      <header className="title-utility">
        <span>ORIGINAL PREMIUM CAMPAIGN · THREE ACTS</span>
        <div>
          <button
            type="button"
            onPointerEnter={preloadArchiveDialog}
            onFocus={preloadArchiveDialog}
            onClick={() => openArchive('map')}
          >
            ▤ ARCHIVE
          </button>
          <button
            type="button"
            onPointerEnter={preloadSettingsDialog}
            onFocus={preloadSettingsDialog}
            onClick={openSettings}
          >
            ⚙ SETTINGS
          </button>
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundOn ? '사운드 끄기' : '사운드 켜기'}
            aria-pressed={soundOn}
          >
            {soundOn ? '♪ SOUND ON' : '∕ SOUND OFF'}
          </button>
        </div>
      </header>
      <section className={`title-content ${showDifficulty ? 'is-difficulty' : ''}`} aria-labelledby="title-heading">
        {showDifficulty ? (
          <>
            <button
              className="difficulty-back"
              type="button"
              onClick={() => {
                if (selectedDifficulty) setSelectedDifficulty(null)
                else setShowDifficulty(false)
              }}
            >
              ‹ {selectedDifficulty ? '위험도 다시 선택' : '타이틀로'}
            </button>
            {selectedDifficulty ? (
              <>
                <p className="eyebrow">STEP 02 · CHOOSE AN EXPEDITION OATH</p>
                <h2 id="title-heading">이번 원정의 방식</h2>
                <p className="title-tagline">
                  서약은 강점과 대가를 함께 바꿉니다. 같은 밤도 전혀 다른 판단을 요구합니다.
                </p>
                <div className="setup-summary">
                  <span>{DIFFICULTIES[selectedDifficulty].subtitle}</span>
                  <strong>{DIFFICULTIES[selectedDifficulty].name}</strong>
                  <small>명성 배율 ×{DIFFICULTIES[selectedDifficulty].scoreScale.toFixed(2)}</small>
                </div>
                <div className="difficulty-protocol-preview" data-difficulty={selectedDifficulty}>
                  <span aria-hidden="true">{DIFFICULTIES[selectedDifficulty].glyph}</span>
                  <div>
                    <small>{DIFFICULTIES[selectedDifficulty].label}</small>
                    <strong>{DIFFICULTIES[selectedDifficulty].ruleName}</strong>
                    <p>{DIFFICULTIES[selectedDifficulty].ruleDescription}</p>
                  </div>
                  <em>
                    <span>{DIFFICULTIES[selectedDifficulty].economySummary}</span>
                    <b
                      data-mastered={
                        unlockedAchievementIds.has(PROTOCOL_MASTERIES[selectedDifficulty].achievement)
                          ? 'true'
                          : 'false'
                      }
                    >
                      {unlockedAchievementIds.has(PROTOCOL_MASTERIES[selectedDifficulty].achievement)
                        ? `✓ 숙련 완료 · ${PROTOCOL_MASTERIES[selectedDifficulty].name}`
                        : `숙련 인장 · ${PROTOCOL_MASTERIES[selectedDifficulty].requirement}`}
                    </b>
                  </em>
                </div>
                {firstExpedition && setupMode === 'standard' ? (
                  <section className="first-expedition-route" aria-label="첫 원정 추천 조합">
                    <span aria-hidden="true">✦</span>
                    <div>
                      <small>FIRST EXPEDITION ROUTE</small>
                      <strong>{DIFFICULTIES[selectedDifficulty].name} · 새 균열 · 화로지기의 서약</strong>
                      <p>합성으로 온기를 되찾는 안정적인 조합입니다. 현장 훈련이 첫 승리까지 이어집니다.</p>
                    </div>
                    <button
                      type="button"
                      onPointerEnter={preloadCampaignEventDialog}
                      onFocus={preloadCampaignEventDialog}
                      onClick={() => startCampaign(selectedDifficulty, 'hearthkeepers', 'standard')}
                    >
                      추천 조합으로 바로 출정 <i aria-hidden="true">›</i>
                    </button>
                  </section>
                ) : null}
                <fieldset className="run-mode-selector">
                  <legend>원정 경로 방식</legend>
                  <button
                    type="button"
                    data-active={setupMode === 'standard' ? 'true' : 'false'}
                    aria-pressed={setupMode === 'standard'}
                    onClick={() => setSetupMode('standard')}
                  >
                    <b>새 균열</b>
                    <span>매번 다른 전선·의도·유물</span>
                  </button>
                  <button
                    type="button"
                    data-active={setupMode === 'daily' ? 'true' : 'false'}
                    aria-pressed={setupMode === 'daily'}
                    onClick={() => setSetupMode('daily')}
                  >
                    <b>오늘의 균열</b>
                    <span>오늘은 모두 같은 원정 경로</span>
                  </button>
                  <button
                    type="button"
                    data-active={setupMode === 'shared' ? 'true' : 'false'}
                    aria-pressed={setupMode === 'shared'}
                    onClick={() => setSetupMode('shared')}
                  >
                    <b>공유 균열</b>
                    <span>원정 코드로 같은 길에 도전</span>
                  </button>
                  {setupMode === 'shared' ? (
                    <label className="shared-code-entry">
                      <span>원정 코드</span>
                      <input
                        value={sharedCode}
                        inputMode="text"
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck="false"
                        maxLength={6}
                        placeholder="예: 7X2F9K"
                        onChange={(event) =>
                          setSharedCode(
                            event.currentTarget.value
                              .toUpperCase()
                              .replace(/[^0-9A-Z]/g, '')
                              .slice(0, 6),
                          )
                        }
                      />
                      <small data-valid={sharedSeed ? 'true' : 'false'}>
                        {sharedSeed ? '동일한 적·균열·유물·과업을 불러옵니다.' : '영문과 숫자 1~6자'}
                      </small>
                    </label>
                  ) : null}
                </fieldset>
                {showEndingRouteRecommendation && nextWinningEndingId && nextWinningEndingRoute ? (
                  <aside className="setup-ending-route" aria-label="추천 미발견 결말 경로">
                    <span aria-hidden="true">{ENDINGS[nextWinningEndingId].glyph}</span>
                    <div>
                      <small>DAWN ATLAS RECOMMENDATION · {nextWinningEndingRoute.label}</small>
                      <strong>{ENDINGS[nextWinningEndingId].title}을 향한 원정</strong>
                      <p>{nextWinningEndingRoute.requirement}</p>
                    </div>
                    <b>
                      추천 서약 ·{' '}
                      {nextWinningEndingRoute.recommendedOath
                        ? OATHS[nextWinningEndingRoute.recommendedOath].name
                        : '자유 선택'}
                    </b>
                  </aside>
                ) : null}
                <div className="oath-grid">
                  {OATH_IDS.map((oathId) => {
                    const oath = OATHS[oathId]
                    const recommendedForEnding =
                      showEndingRouteRecommendation && nextWinningEndingRoute?.recommendedOath === oathId
                    const recommendedForFirstExpedition = firstExpedition && oathId === 'hearthkeepers'
                    return (
                      <button
                        type="button"
                        data-oath={oathId}
                        data-glyph={oath.glyph}
                        data-ending-recommended={recommendedForEnding ? 'true' : undefined}
                        data-first-recommended={recommendedForFirstExpedition ? 'true' : undefined}
                        disabled={setupMode === 'shared' && sharedSeed === null}
                        data-autofocus={
                          recommendedForEnding ||
                          ((!showEndingRouteRecommendation || !nextWinningEndingRoute) && oathId === 'hearthkeepers')
                            ? 'true'
                            : undefined
                        }
                        onPointerEnter={preloadCampaignEventDialog}
                        onFocus={preloadCampaignEventDialog}
                        onClick={() => startCampaign(selectedDifficulty, oathId, setupMode, sharedSeed)}
                        key={oathId}
                      >
                        <span aria-hidden="true">
                          <i>{oath.glyph}</i>
                        </span>
                        <small>{oath.subtitle}</small>
                        <strong>{oath.name}</strong>
                        {recommendedForFirstExpedition ? (
                          <em className="first-expedition-badge">첫 원정 추천 · 생존 여유</em>
                        ) : null}
                        {recommendedForEnding && nextWinningEndingId ? (
                          <em className="oath-ending-recommendation">
                            {ENDINGS[nextWinningEndingId].glyph} {ENDINGS[nextWinningEndingId].title} 추천
                          </em>
                        ) : null}
                        <p>{oath.description}</p>
                        <dl>
                          <div>
                            <dt>강점</dt>
                            <dd>{oath.benefit}</dd>
                          </div>
                          <div>
                            <dt>대가</dt>
                            <dd>{oath.burden}</dd>
                          </div>
                          <div className="oath-intervention-summary">
                            <dt>왕관 개입</dt>
                            <dd>
                              DAY 04 · 08 · 12 전용 결단
                              <br />
                              {OATH_CHRONICLES[oathId].title}
                              <br />
                              {unlockedAchievementIds.has(OATH_CHRONICLE_ACHIEVEMENTS[oathId])
                                ? '✓ 연대기 인장 보유'
                                : '3회 새김 + 완주 시 영구 인장'}
                            </dd>
                          </div>
                        </dl>
                        <b>{setupMode === 'shared' && sharedSeed === null ? '원정 코드 필요' : '서약하고 출정 ›'}</b>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="eyebrow">STEP 01 · SELECT EXPEDITION PROTOCOL</p>
                <h2 id="title-heading">원정 위험도 선택</h2>
                <p className="title-tagline">위험도와 서약은 원정이 끝날 때까지 바꿀 수 없습니다.</p>
                <div className="difficulty-grid">
                  {(Object.keys(DIFFICULTIES) as Difficulty[]).map((difficulty) => {
                    const option = DIFFICULTIES[difficulty]
                    const mastery = PROTOCOL_MASTERIES[difficulty]
                    const mastered = unlockedAchievementIds.has(mastery.achievement)
                    const locked = difficulty === 'whiteout' && meta.completedRuns === 0
                    const recommendedForFirstExpedition = firstExpedition && difficulty === 'expedition'
                    return (
                      <button
                        type="button"
                        disabled={locked}
                        data-difficulty={difficulty}
                        data-first-recommended={recommendedForFirstExpedition ? 'true' : undefined}
                        data-autofocus={difficulty === 'expedition' ? 'true' : undefined}
                        onClick={() => setSelectedDifficulty(difficulty)}
                        key={difficulty}
                      >
                        <span>
                          {option.subtitle}
                          {recommendedForFirstExpedition ? (
                            <em className="first-expedition-badge">첫 원정 추천</em>
                          ) : null}
                        </span>
                        <i className="difficulty-glyph" aria-hidden="true">
                          {option.glyph}
                        </i>
                        <strong>{option.name}</strong>
                        <p>{locked ? '캠페인을 한 번 완주하면 해제됩니다.' : option.description}</p>
                        <dl>
                          <div>
                            <dt>고유 규칙</dt>
                            <dd>{option.ruleName}</dd>
                          </div>
                          <div>
                            <dt>원정 자원</dt>
                            <dd>{option.economySummary}</dd>
                          </div>
                          <div data-mastered={mastered ? 'true' : 'false'}>
                            <dt>{mastered ? '숙련 완료' : '숙련 인장'}</dt>
                            <dd>{mastered ? `✓ ${mastery.name}` : mastery.requirement}</dd>
                          </div>
                        </dl>
                        <b>{locked ? '잠김' : `명성 ×${option.scoreScale.toFixed(2)} · 서약 선택 ›`}</b>
                      </button>
                    )
                  })}
                </div>
                <div className="difficulty-legacy">
                  <span>적용 유산 {meta.legacy.length}개</span>
                  <span>보유 불씨 {meta.embers}</span>
                  <span>숙련 인장 {masteredProtocolCount} / 3</span>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <p className="eyebrow">A TWELVE-NIGHT SURVIVAL EXPEDITION</p>
            <h2 id="title-heading">마지막 불씨</h2>
            <p className="title-tagline">합치고, 명령하고, 세 개의 왕관을 넘어 새벽을 되찾으세요.</p>
            <ul className="title-features" aria-label="게임 특징">
              <li>3막 12일 캠페인</li>
              <li>매 원정 달라지는 전선</li>
              <li>서약·진급·유물 공명</li>
            </ul>
            {ready && hasProgress ? (
              <section className="resume-checkpoint" aria-label="저장된 원정 체크포인트">
                <header>
                  <span>CHECKPOINT RECOVERED</span>
                  <b>
                    {game.status === 'playing' ? '원정 진행 중' : game.status === 'won' ? '새벽 도달' : '원정 종료'}
                  </b>
                </header>
                <div>
                  <strong>
                    ACT {currentActNumber} · {game.day}일차 · {currentStoryTitle}
                  </strong>
                  <p>
                    {difficultyProtocolName} · {OATHS[game.oath].name}
                  </p>
                </div>
                <dl>
                  <div>
                    <dt>온기</dt>
                    <dd>{game.heat}%</dd>
                  </div>
                  <div>
                    <dt>보급</dt>
                    <dd>{game.supplies}</dd>
                  </div>
                  <div>
                    <dt>생존자</dt>
                    <dd>{rosterCount}</dd>
                  </div>
                </dl>
              </section>
            ) : null}
            <div className="title-actions">
              <button
                className="title-primary"
                type="button"
                onPointerEnter={preloadEnterGame}
                onFocus={preloadEnterGame}
                onClick={enterGame}
                disabled={!ready}
                data-autofocus="true"
              >
                <span>{ready ? (hasProgress ? '원정 계속하기' : '원정 준비하기') : '기록 불러오는 중'}</span>
                <i aria-hidden="true">›</i>
              </button>
              {hasProgress ? (
                <button
                  className="title-secondary"
                  type="button"
                  onPointerEnter={preloadExpeditionMenu}
                  onFocus={preloadExpeditionMenu}
                  onClick={askToDiscardCurrentCampaign}
                >
                  새 원정
                </button>
              ) : null}
              {!standalone ? (
                <button
                  className="title-secondary title-install"
                  type="button"
                  onPointerEnter={() => {
                    if (!installPrompt) preloadHelpDialogs()
                  }}
                  onFocus={() => {
                    if (!installPrompt) preloadHelpDialogs()
                  }}
                  onClick={() => {
                    if (installPrompt) void installGame()
                    else {
                      preloadHelpDialogs()
                      setShowInstallHelp(true)
                    }
                  }}
                >
                  앱 설치
                </button>
              ) : null}
            </div>
            <div className="title-record">
              <span>개인 최고 {bestScore.toLocaleString('ko-KR')}</span>
              <span>유산 불씨 {meta.embers}</span>
              <span>완주 {meta.completedRuns}</span>
            </div>
          </>
        )}
      </section>
      <footer className="title-footer">
        <span>EMBERHOLD · THE LAST EMBER</span>
        <span className="runtime-state" data-state={runtimeState} role="status">
          <i aria-hidden="true">{runtimeState === 'offline' ? '●' : '◆'}</i>
          {runtimeStateCopy} · 헤드폰 권장
        </span>
      </footer>
    </div>
  )
}
