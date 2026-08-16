type RiskDepartureForecast = {
  armed: boolean
  reason: string
  supplyReward: number
  suppliesBefore: number
  suppliesAfter: number
  heatBefore: number
  heatAfter: number
  moraleBefore: number
  moraleAfter: number
  endsExpedition: boolean
}

type MobileCommandDockProps = {
  rosterOpen: boolean
  projectedWins: number
  rosterCount: number
  day: number
  battleDisabled: boolean
  battleReady: boolean
  battleActionLabel: string
  battleForecastTitle: string
  battleForecastDetail: string
  riskDepartureForecast: RiskDepartureForecast | null
  tacticalSuggestion: { title: string; status: string; actionLabel: string } | null
  onShowBattlefield: () => void
  onShowRoster: () => void
  onApplyTacticalSuggestion: () => void
  onCancelRiskDeparture: () => void
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
  battleForecastTitle,
  battleForecastDetail,
  riskDepartureForecast,
  tacticalSuggestion,
  onShowBattlefield,
  onShowRoster,
  onApplyTacticalSuggestion,
  onCancelRiskDeparture,
  onStartBattle,
}: MobileCommandDockProps) {
  const riskDetail = riskDepartureForecast
    ? `보급 ${riskDepartureForecast.suppliesBefore}→${riskDepartureForecast.suppliesAfter} · 온기 ${riskDepartureForecast.heatBefore}%→${riskDepartureForecast.heatAfter}% · 사기 ${riskDepartureForecast.moraleBefore}→${riskDepartureForecast.moraleAfter}`
    : null

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
        {!rosterOpen ? (
          <div
            className="mobile-battle-status"
            data-ready={battleReady ? 'true' : 'false'}
            data-risk={riskDepartureForecast ? 'true' : undefined}
            data-risk-armed={riskDepartureForecast?.armed ? 'true' : undefined}
            data-terminal={riskDepartureForecast?.endsExpedition ? 'true' : undefined}
          >
            <div role="status" aria-live="polite" aria-atomic="true">
              <span aria-hidden="true" />
              <p>
                <strong>
                  {riskDepartureForecast?.armed
                    ? riskDepartureForecast.endsExpedition
                      ? '온기 소진 · 원정 종료 확인'
                      : '위험 출전 · 최종 확인'
                    : battleForecastTitle}
                </strong>
                {riskDepartureForecast ? (
                  <small className="mobile-risk-ledger">
                    <span>
                      <i>보급</i>
                      <b>
                        {riskDepartureForecast.suppliesBefore} › {riskDepartureForecast.suppliesAfter}
                      </b>
                    </span>
                    <span>
                      <i>온기</i>
                      <b>
                        {riskDepartureForecast.heatBefore}% › {riskDepartureForecast.heatAfter}%
                      </b>
                    </span>
                    <span>
                      <i>사기</i>
                      <b>
                        {riskDepartureForecast.moraleBefore} › {riskDepartureForecast.moraleAfter}
                      </b>
                    </span>
                  </small>
                ) : (
                  <small>{tacticalSuggestion?.title ?? battleForecastDetail}</small>
                )}
              </p>
            </div>
            {riskDepartureForecast?.armed ? (
              <button
                className="mobile-risk-cancel"
                type="button"
                onClick={onCancelRiskDeparture}
                aria-label={`위험 출전 확인 취소, ${riskDepartureForecast.reason}`}
              >
                <span>{riskDepartureForecast.endsExpedition ? '원정 종료 대기' : '두 번째 입력 대기'}</span>
                <strong>계획 다시 보기</strong>
              </button>
            ) : tacticalSuggestion ? (
              <button
                type="button"
                onClick={onApplyTacticalSuggestion}
                aria-label={`참모 추천 적용, ${tacticalSuggestion.title}, ${tacticalSuggestion.status}`}
                title={tacticalSuggestion.title}
              >
                <span>{tacticalSuggestion.status}</span>
                <strong>{tacticalSuggestion.actionLabel}</strong>
              </button>
            ) : (
              <b>{projectedWins} / 3</b>
            )}
          </div>
        ) : null}
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
          data-risk={riskDepartureForecast ? 'true' : undefined}
          data-risk-armed={riskDepartureForecast?.armed ? 'true' : undefined}
          data-terminal={riskDepartureForecast?.endsExpedition ? 'true' : undefined}
          aria-label={`${day}일차 ${battleActionLabel} · 예상 방어 ${projectedWins} / 3 · ${riskDepartureForecast ? `${riskDepartureForecast.reason} · ${riskDetail}` : battleForecastDetail}`}
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
