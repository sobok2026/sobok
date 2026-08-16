import Image from 'next/image'
import titleArt from '@/app/emberhold-title.webp'
import type {
  AchievementId,
  ArchiveTab,
  Difficulty,
  EndingId,
  GameState,
  MasteryContractId,
  MetaState,
  OathId,
  RunMode,
} from './game-model'
import {
  DIFFICULTIES,
  type ENDING_ROUTES,
  ENDINGS,
  inheritedPowerEnabledFor,
  legacyMasteryFor,
  MASTERY_CONTRACT_IDS,
  MASTERY_CONTRACTS,
  OATH_CHRONICLE_ACHIEVEMENTS,
  OATH_CHRONICLES,
  OATH_IDS,
  OATHS,
  PROTOCOL_MASTERIES,
  runCodeFromText,
} from './game-model'
import {
  preloadArchiveDialog,
  preloadCampaignEventDialog,
  preloadExpeditionMenu,
  preloadHelpDialogs,
  preloadSettingsDialog,
} from './game-preloads'
import { LegacySetupLoadout } from './LegacyLoadout'

type RuntimeState = 'offline' | 'installed' | 'ready' | 'online'

type TitleScreenProps = {
  blocked: boolean
  showDifficulty: boolean
  selectedDifficulty: Difficulty | null
  setupMode: RunMode
  selectedMasteryContract: MasteryContractId | null
  sharedCode: string
  sharedSeed: number | null
  incomingRiftCode: string | null
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
  installPending: boolean
  bestScore: number
  runtimeState: RuntimeState
  runtimeStateCopy: string
  soundOn: boolean
  setShowDifficulty: (show: boolean) => void
  setSelectedDifficulty: (difficulty: Difficulty | null) => void
  setSetupMode: (mode: RunMode) => void
  setSelectedMasteryContract: (contract: MasteryContractId | null) => void
  setSharedCode: (code: string) => void
  setShowInstallHelp: (show: boolean) => void
  openArchive: (tab: ArchiveTab) => void
  openSettings: () => void
  toggleSound: () => void
  enterGame: () => void
  preloadEnterGame: () => void
  prepareIncomingRift: () => void
  dismissIncomingRift: () => void
  askToDiscardCurrentCampaign: () => void
  installGame: () => Promise<void>
  startCampaign: (
    difficulty: Difficulty,
    oath: OathId,
    mode: RunMode,
    requestedSeed?: number | null,
    masteryContract?: MasteryContractId | null,
  ) => void
}

export function TitleScreen({
  blocked,
  showDifficulty,
  selectedDifficulty,
  setupMode,
  selectedMasteryContract,
  sharedCode,
  sharedSeed,
  incomingRiftCode,
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
  installPending,
  bestScore,
  runtimeState,
  runtimeStateCopy,
  soundOn,
  setShowDifficulty,
  setSelectedDifficulty,
  setSetupMode,
  setSelectedMasteryContract,
  setSharedCode,
  setShowInstallHelp,
  openArchive,
  openSettings,
  toggleSound,
  enterGame,
  preloadEnterGame,
  prepareIncomingRift,
  dismissIncomingRift,
  askToDiscardCurrentCampaign,
  installGame,
  startCampaign,
}: TitleScreenProps) {
  const firstExpedition = meta.completedRuns === 0 && meta.history.length === 0
  const legacyMastery = legacyMasteryFor(meta)
  const masteryContractEligible = inheritedPowerEnabledFor(setupMode)

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
                <LegacySetupLoadout
                  legacyIds={meta.legacy}
                  mode={setupMode}
                  onOpenArchive={() => openArchive('legacy')}
                />
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
                      onClick={() => startCampaign(selectedDifficulty, 'hearthkeepers', 'standard', null, null)}
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
                    <span>매번 다른 사건·전선·유물</span>
                  </button>
                  <button
                    type="button"
                    data-active={setupMode === 'daily' ? 'true' : 'false'}
                    aria-pressed={setupMode === 'daily'}
                    onClick={() => {
                      setSetupMode('daily')
                      setSelectedMasteryContract(null)
                    }}
                  >
                    <b>오늘의 균열</b>
                    <span>같은 길 · 계승 전력 0개</span>
                  </button>
                  <button
                    type="button"
                    data-active={setupMode === 'shared' ? 'true' : 'false'}
                    aria-pressed={setupMode === 'shared'}
                    onClick={() => {
                      setSetupMode('shared')
                      setSelectedMasteryContract(null)
                    }}
                  >
                    <b>공유 균열</b>
                    <span>같은 코드 · 계승 전력 0개</span>
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
                        onPaste={(event) => {
                          const pastedCode = runCodeFromText(event.clipboardData.getData('text'))
                          if (!pastedCode) return
                          event.preventDefault()
                          setSharedCode(pastedCode)
                        }}
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
                        {sharedSeed
                          ? '동일한 사건·적·균열·유물·과업을 불러옵니다.'
                          : '여섯 자리 코드·공유문·초대 링크 붙여넣기 지원'}
                      </small>
                    </label>
                  ) : null}
                </fieldset>
                {legacyMastery ? (
                  <section
                    className="mastery-contract-setup"
                    data-eligible={masteryContractEligible ? 'true' : 'false'}
                    aria-labelledby="mastery-contract-title"
                  >
                    <header>
                      <span aria-hidden="true">{legacyMastery.glyph}</span>
                      <div>
                        <small>ETERNAL SEAL · OPTIONAL ENDGAME COVENANT</small>
                        <h3 id="mastery-contract-title">영원 계약</h3>
                        <p>완성한 유산의 힘을 스스로 제한하고, 표준 원정의 모든 명성에 도전 배율을 새깁니다.</p>
                      </div>
                      <b>
                        {masteryContractEligible
                          ? selectedMasteryContract
                            ? `${MASTERY_CONTRACTS[selectedMasteryContract].name} 선택`
                            : '계약 없음 · 표준 기록'
                          : '비교 규칙 보호'}
                      </b>
                    </header>
                    <fieldset className="mastery-contract-grid">
                      <legend className="settings-visually-hidden">영원 계약 선택</legend>
                      <button
                        type="button"
                        data-active={selectedMasteryContract === null ? 'true' : 'false'}
                        disabled={!masteryContractEligible}
                        aria-pressed={selectedMasteryContract === null}
                        onClick={() => setSelectedMasteryContract(null)}
                      >
                        <span aria-hidden="true">◇</span>
                        <small>STANDARD RECORD</small>
                        <strong>계약 없이 출정</strong>
                        <p>
                          {masteryContractEligible
                            ? '계승 유산은 그대로 적용하고 추가 부담이나 도전 배율 없이 기록합니다.'
                            : '계승 유산과 영원 계약을 모두 봉인하고 현재 코드의 선택과 전술만 기록합니다.'}
                        </p>
                        <dl>
                          <div>
                            <dt>부담</dt>
                            <dd>없음</dd>
                          </div>
                          <div>
                            <dt>명성</dt>
                            <dd>×1.00</dd>
                          </div>
                        </dl>
                        <b>{selectedMasteryContract === null ? '✓ 선택됨' : '표준 기록 선택'}</b>
                      </button>
                      {MASTERY_CONTRACT_IDS.map((contractId) => {
                        const contract = MASTERY_CONTRACTS[contractId]
                        const unlocked = legacyMastery.level >= contract.requiredMasteryLevel
                        const mastered = meta.masteredContracts.includes(contractId)
                        const active = selectedMasteryContract === contractId
                        return (
                          <button
                            type="button"
                            data-active={active ? 'true' : 'false'}
                            data-locked={!unlocked ? 'true' : 'false'}
                            data-mastered={mastered ? 'true' : 'false'}
                            disabled={!masteryContractEligible || !unlocked}
                            aria-pressed={active}
                            onClick={() => setSelectedMasteryContract(contractId)}
                            key={contractId}
                          >
                            <span aria-hidden="true">{contract.glyph}</span>
                            <small>{contract.label}</small>
                            <strong>{contract.name}</strong>
                            <p>{contract.description}</p>
                            <dl>
                              <div>
                                <dt>부담</dt>
                                <dd>{contract.burden}</dd>
                              </div>
                              <div>
                                <dt>명성</dt>
                                <dd>×{contract.scoreScale.toFixed(2)}</dd>
                              </div>
                            </dl>
                            <b>
                              {!unlocked
                                ? `영원 인장 ${contract.requiredMasteryLevel} 필요`
                                : active
                                  ? `✓ 계약 선택됨${mastered ? ' · 정복 기록' : ''}`
                                  : mastered
                                    ? '✓ 정복 완료 · 다시 선택'
                                    : `${contract.reward} · 선택`}
                            </b>
                          </button>
                        )
                      })}
                    </fieldset>
                    <footer>
                      {masteryContractEligible
                        ? `선택한 계약은 이번 원정이 끝날 때까지 유지되며, 결산에서 기본·유산·계약 명성을 각각 분리합니다. 영구 정복 기록 ${meta.masteredContracts.length} / ${MASTERY_CONTRACT_IDS.length}.`
                        : `${setupMode === 'daily' ? '오늘의 균열' : '공유 균열'}은 같은 코드의 공정한 기록 비교를 위해 계승 유산과 영원 계약을 모두 적용하지 않습니다.`}
                    </footer>
                  </section>
                ) : null}
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
                        onClick={() =>
                          startCampaign(selectedDifficulty, oathId, setupMode, sharedSeed, selectedMasteryContract)
                        }
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
                  <span>
                    {inheritedPowerEnabledFor(setupMode) ? `적용 유산 ${meta.legacy.length}개` : '계승 전력 0개'}
                  </span>
                  <span>
                    {legacyMastery ? `${legacyMastery.sealLabel} · 불씨 ${meta.embers}` : `보유 불씨 ${meta.embers}`}
                  </span>
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
            {incomingRiftCode ? (
              <section className="incoming-rift-invitation" aria-labelledby="incoming-rift-title">
                <span aria-hidden="true">⌁</span>
                <div>
                  <small>SHARED RIFT INVITATION · META-FREE</small>
                  <strong id="incoming-rift-title">공유 균열 {incomingRiftCode}</strong>
                  <p>
                    같은 사건·적·균열·유물·과업을 계승 전력 0으로 불러옵니다.
                    {hasProgress
                      ? ' 현재 체크포인트는 확인 없이 덮어쓰지 않습니다.'
                      : ' 위험도와 서약은 직접 선택합니다.'}
                  </p>
                </div>
                <footer>
                  <button
                    type="button"
                    onClick={prepareIncomingRift}
                    data-autofocus={!hasProgress ? 'true' : undefined}
                  >
                    {hasProgress ? '현재 원정 확인 후 준비' : '이 균열 준비'}
                  </button>
                  <button type="button" onClick={dismissIncomingRift}>
                    초대 닫기
                  </button>
                </footer>
              </section>
            ) : null}
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
                    {game.masteryContract ? ` · ${MASTERY_CONTRACTS[game.masteryContract].name}` : ''}
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
                onPointerDown={preloadEnterGame}
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
                  disabled={installPending}
                  aria-busy={installPending}
                >
                  {installPending ? '설치 요청 확인 중' : '앱 설치'}
                </button>
              ) : null}
            </div>
            <div className="title-record">
              <span>전체 원정 최고 {bestScore.toLocaleString('ko-KR')}</span>
              <span>
                {legacyMastery ? `${legacyMastery.sealLabel} · 불씨 ${meta.embers}` : `유산 불씨 ${meta.embers}`}
              </span>
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
