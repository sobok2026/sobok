type MobileCommandDockProps = {
  rosterOpen: boolean
  projectedWins: number
  rosterCount: number
  day: number
  battleDisabled: boolean
  battleReady: boolean
  battleActionLabel: string
  battleForecastDetail: string
  onShowBattlefield: () => void
  onShowRoster: () => void
  onStartBattle: () => void
}

export function MobileCommandDock({
  rosterOpen,
  projectedWins,
  rosterCount,
  day,
  battleDisabled,
  battleReady,
  battleActionLabel,
  battleForecastDetail,
  onShowBattlefield,
  onShowRoster,
  onStartBattle,
}: MobileCommandDockProps) {
  return (
    <>
      {rosterOpen ? (
        <button
          className="mobile-sheet-scrim"
          type="button"
          onClick={onShowBattlefield}
          aria-label="불씨 대기소 닫기"
        />
      ) : null}
      <nav className="mobile-command-dock" aria-label="모바일 원정 명령">
        <button
          className={!rosterOpen ? 'is-active' : ''}
          type="button"
          onClick={onShowBattlefield}
          aria-pressed={!rosterOpen}
        >
          <span aria-hidden="true">⚔</span>
          <div>
            <small>TACTICS</small>
            <strong>전장</strong>
          </div>
          <b>{projectedWins}/3</b>
        </button>
        <button
          className={rosterOpen ? 'is-active' : ''}
          type="button"
          onClick={onShowRoster}
          aria-expanded={rosterOpen}
        >
          <span aria-hidden="true">◆</span>
          <div>
            <small>COMPANY</small>
            <strong>대기소</strong>
          </div>
          <b>{rosterCount}</b>
        </button>
        <button
          className="mobile-battle-action"
          type="button"
          onClick={onStartBattle}
          disabled={battleDisabled}
          data-ready={battleReady ? 'true' : 'false'}
          aria-label={`${day}일차 ${battleActionLabel} · 예상 방어 ${projectedWins} / 3 · ${battleForecastDetail}`}
          title={battleForecastDetail}
        >
          <span aria-hidden="true">›</span>
          <div>
            <small>NIGHT {String(day).padStart(2, '0')}</small>
            <strong>{battleActionLabel}</strong>
          </div>
        </button>
      </nav>
    </>
  )
}
