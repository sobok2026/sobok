import type { CSSProperties } from 'react'
import type { ArchiveTab, ExpeditionRank, GameState } from './game-model'
import {
  BOSS_MECHANICS,
  ELITE_ENCOUNTERS,
  ENEMY_DOCTRINES,
  ENEMY_TIERS,
  inheritedPowerEnabledFor,
  MASTERY_CONTRACTS,
  MAX_NIGHTS,
  NIGHT_STORIES,
  nightConditionFor,
  TIER_LABELS,
} from './game-model'
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

function enemyTierProfileFor(day: number): string {
  const counts = new Map<number, number>()
  for (const tier of ENEMY_TIERS[day - 1]) counts.set(tier, (counts.get(tier) ?? 0) + 1)
  return [...counts.entries()]
    .sort(([left], [right]) => left - right)
    .map(([tier, count]) => `${TIER_LABELS[tier]}${count > 1 ? `×${count}` : ''}`)
    .join(' · ')
}

function enemyTierTotalFor(day: number): number {
  return ENEMY_TIERS[day - 1].reduce((total, tier) => total + tier, 0)
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
  const riftForecast = Array.from({ length: Math.min(3, MAX_NIGHTS - game.day + 1) }, (_, offset) => {
    const day = game.day + offset
    const story = NIGHT_STORIES[day - 1]
    const condition = nightConditionFor(game.runSeed, day)
    const elite = ELITE_ENCOUNTERS[day]
    const doctrine = elite ? ENEMY_DOCTRINES[elite.doctrine] : null
    const boss = BOSS_MECHANICS[day]
    const tierGain = day > 1 ? enemyTierTotalFor(day) - enemyTierTotalFor(day - 1) : 0
    const pressure = boss ? boss.name : elite && doctrine ? `${elite.name} · ${doctrine.name}` : '정규 적 전열'
    const signal = boss ? 'CROWN' : tierGain > 0 ? 'TIER UP' : elite ? 'ELITE' : offset === 0 ? 'NOW' : 'SCOUTED'
    const tone = boss ? 'crown' : tierGain > 0 ? 'rising' : elite ? 'elite' : 'steady'

    return {
      day,
      title: story.title,
      condition,
      formation: enemyTierProfileFor(day),
      pressure,
      signal,
      tone,
      current: offset === 0,
    }
  })

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

      {!inheritedPowerEnabledFor(game.mode) ? (
        <aside className="active-mastery-contract" data-comparison="true" aria-label="동일 코드 비교용 계승 전력 봉인">
          <span aria-hidden="true">◇</span>
          <div>
            <small>CODE COMPARISON · META-FREE</small>
            <strong>{game.mode === 'daily' ? '오늘의 균열' : '공유 균열'} · 공정 적재</strong>
          </div>
          <p>보유한 계승 유산과 영원 계약을 전력·보상에서 제외합니다.</p>
          <b>계승 전력 0</b>
        </aside>
      ) : game.masteryContract ? (
        <aside className="active-mastery-contract" aria-label="현재 원정의 영원 계약">
          <span aria-hidden="true">{MASTERY_CONTRACTS[game.masteryContract].glyph}</span>
          <div>
            <small>{MASTERY_CONTRACTS[game.masteryContract].label}</small>
            <strong>{MASTERY_CONTRACTS[game.masteryContract].name}</strong>
          </div>
          <p>{MASTERY_CONTRACTS[game.masteryContract].burden}</p>
          <b>{MASTERY_CONTRACTS[game.masteryContract].reward}</b>
        </aside>
      ) : null}

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
        <div className="march-forecast">
          <header>
            <span>RIFT FORECAST · CODE-BOUND</span>
            <strong>{game.day === MAX_NIGHTS ? '왕좌 앞 마지막 밤' : '앞으로 3밤 작전 예보'}</strong>
            <small>적 등급·밤의 변칙·정예 교리는 이 원정 코드에 고정됩니다.</small>
          </header>
          <ol aria-label={`현재 ${game.day}일부터 ${riftForecast.at(-1)?.day ?? game.day}일까지 균열 예보`}>
            {riftForecast.map((entry) => (
              <li
                data-tone={entry.tone}
                data-current={entry.current ? 'true' : 'false'}
                aria-current={entry.current ? 'step' : undefined}
                key={`rift-forecast-${entry.day}`}
              >
                <div>
                  <span>DAY {String(entry.day).padStart(2, '0')}</span>
                  <b>{entry.signal}</b>
                </div>
                <strong>{entry.title}</strong>
                <p>
                  <span aria-hidden="true">{entry.condition.glyph}</span>
                  {entry.condition.name} · {entry.condition.description}
                </p>
                <small>
                  적 {entry.formation} · {entry.pressure}
                </small>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}
