import type { CSSProperties } from 'react'
import type { ArchiveTab, ExpeditionRank, GameState } from './game-model'
import { MAX_NIGHTS, NIGHT_STORIES } from './game-model'
import { preloadArchiveDialog, preloadExpeditionMenu, preloadHelpDialogs, preloadSettingsDialog } from './game-preloads'

type RankEntryView = {
  rank: ExpeditionRank
  minimum: number
}

type CampaignHudProps = {
  game: GameState
  actNumber: number
  actTitle: string
  bossBattle: boolean
  currentBossName: string | null
  nextCrownNight: number
  nextCrownName: string | null
  marchSealActive: boolean
  nextRankEntry: RankEntryView | null
  liveRank: ExpeditionRank
  liveRankProgress: number
  soundOn: boolean
  emberPulseActive: boolean
  toggleSound: () => void
  openSettings: () => void
  openArchive: (tab: ArchiveTab) => void
  openGuide: () => void
  openExpeditionMenu: () => void
}

function heatTone(heat: number): 'warm' | 'cool' | 'critical' {
  if (heat <= 25) return 'critical'
  if (heat <= 55) return 'cool'
  return 'warm'
}

export function CampaignHud({
  game,
  actNumber,
  actTitle,
  bossBattle,
  currentBossName,
  nextCrownNight,
  nextCrownName,
  marchSealActive,
  nextRankEntry,
  liveRank,
  liveRankProgress,
  soundOn,
  emberPulseActive,
  toggleSound,
  openSettings,
  openArchive,
  openGuide,
  openExpeditionMenu,
}: CampaignHudProps) {
  const heatStyle = { '--heat-level': `${game.heat}%` } as CSSProperties

  return (
    <>
      <header className="topbar">
        <div className="brand-lockup">
          <span aria-hidden="true" className="brand-rune">
            <b>E</b>
          </span>
          <div>
            <p className="eyebrow">EMBERHOLD</p>
            <h1>마지막 불씨</h1>
          </div>
        </div>

        <section className="top-stats" aria-label="원정 상태">
          <div className="day-stat">
            <span>ACT {actNumber}</span>
            <strong>
              {game.day}
              <small>/ {MAX_NIGHTS}일</small>
            </strong>
          </div>
          <div className="resource-stat">
            <span aria-hidden="true" className="supply-mark">
              ◈
            </span>
            <div>
              <span>보급품</span>
              <strong>{game.supplies}</strong>
            </div>
          </div>
          <div className="morale-stat" data-low={game.morale <= 30 ? 'true' : 'false'}>
            <span>사기</span>
            <strong>{game.morale}</strong>
          </div>
          <div className="score-stat" data-seal-active={marchSealActive ? 'true' : 'false'}>
            <span>명성</span>
            <strong>{game.score.toLocaleString('ko-KR')}</strong>
            <small>
              {nextRankEntry
                ? `${nextRankEntry.rank}까지 ${(nextRankEntry.minimum - game.score).toLocaleString('ko-KR')}`
                : 'S 기준 달성'}
            </small>
          </div>
          <button
            className="icon-button sound-button"
            type="button"
            onClick={toggleSound}
            aria-label={soundOn ? '사운드 끄기' : '사운드 켜기'}
            aria-pressed={soundOn}
          >
            {soundOn ? '♪' : '∕'}
          </button>
          <button
            className="icon-button settings-button"
            type="button"
            onPointerEnter={preloadSettingsDialog}
            onFocus={preloadSettingsDialog}
            onClick={openSettings}
            aria-label="화면·사운드·조작 설정 보기"
          >
            ⚙
          </button>
          <button
            className="icon-button archive-button"
            type="button"
            onPointerEnter={preloadArchiveDialog}
            onFocus={preloadArchiveDialog}
            onClick={() => openArchive('map')}
            aria-label="원정 기록 보기"
          >
            ▤
          </button>
          <button
            className="icon-button"
            type="button"
            onPointerEnter={preloadHelpDialogs}
            onFocus={preloadHelpDialogs}
            onClick={openGuide}
            aria-label="게임 방법 보기"
          >
            ?
          </button>
          <button
            className="icon-button menu-button"
            type="button"
            onPointerEnter={preloadExpeditionMenu}
            onFocus={preloadExpeditionMenu}
            onClick={openExpeditionMenu}
            aria-label="원정 메뉴 열기"
          >
            ≡
          </button>
        </section>
      </header>

      <div className="heat-strip" data-tone={heatTone(game.heat)} style={heatStyle}>
        <div className="heat-copy">
          <span className="flame" aria-hidden="true" />
          <span>화로 온기</span>
          <strong>{game.heat}%</strong>
        </div>
        <div
          className="heat-track"
          aria-label={`화로 온기 ${game.heat}%`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={game.heat}
        >
          <span />
        </div>
        <p>
          {emberPulseActive && game.heat <= 50
            ? '불씨의 맥박이 깨어났어요'
            : game.heat <= 25
              ? '불씨가 꺼져가요'
              : game.heat <= 55
                ? '밤공기가 매서워요'
                : '정착지는 아직 따뜻해요'}
        </p>
      </div>

      <section className="campaign-march" aria-label={`12일 원정 진행 · 현재 ${game.day}일`}>
        <div className="march-copy">
          <span>ACT {actNumber} · MARCH STATUS</span>
          <strong>{actTitle}</strong>
          <small>
            {bossBattle
              ? `${currentBossName ?? '왕관'} 교전 진행 중`
              : `${nextCrownNight - game.day}밤 뒤 · ${nextCrownName ?? '다음 왕관'}`}
          </small>
        </div>
        <ol className="march-nights">
          {Array.from({ length: MAX_NIGHTS }, (_, index) => index + 1).map((night) => {
            const state = night < game.day ? 'cleared' : night === game.day ? 'current' : 'ahead'
            const boss = NIGHT_STORIES[night - 1].boss
            return (
              <li
                data-state={state}
                data-boss={boss ? 'true' : 'false'}
                aria-current={state === 'current' ? 'step' : undefined}
                aria-label={`${night}일${boss ? ' 왕관 전투' : ''} · ${state === 'cleared' ? '완료' : state === 'current' ? '현재' : '대기'}`}
                key={`march-night-${night}`}
              >
                <span>{String(night).padStart(2, '0')}</span>
                <i aria-hidden="true" />
              </li>
            )
          })}
        </ol>
        <div className="march-rank">
          <span>RENOWN PACE</span>
          <b>{liveRank}</b>
          <i
            role="progressbar"
            aria-label={nextRankEntry ? `${nextRankEntry.rank} 등급 진행도` : 'S 등급 달성'}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(liveRankProgress)}
          >
            <span style={{ width: `${liveRankProgress}%` }} />
          </i>
          <small>
            {nextRankEntry
              ? `${nextRankEntry.rank}까지 ${(nextRankEntry.minimum - game.score).toLocaleString('ko-KR')}`
              : '최고 기준 도달'}
          </small>
        </div>
      </section>
    </>
  )
}
