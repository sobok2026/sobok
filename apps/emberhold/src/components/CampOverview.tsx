import type { EventChoice, OathId, RelicId, ResonanceId, RunMode, TrialId } from './game-model'
import { OATHS, RELICS, RESONANCE_IDS, RESONANCES, ROSTER_SIZE, TRIALS } from './game-model'

type OathInterventionView = {
  stage: {
    day: number
    name: string
  }
  choice: EventChoice | null | undefined
  state: string
}

type TrialStatusView = {
  id: TrialId
  current: number
  target: number
  completed: boolean
  pending: boolean
}

type ResonanceStatusView = {
  id: ResonanceId
  owned: number
  active: boolean
}

type CampOverviewProps = {
  rosterCount: number
  oath: OathId
  mode: RunMode
  runCode: string
  heat: number
  oathChronicleTitle: string
  oathInterventionCount: number
  oathInterventionPath: readonly OathInterventionView[]
  trialStatuses: readonly TrialStatusView[]
  ownedRelics: readonly RelicId[]
  activeResonances: readonly ResonanceId[]
  resonanceStatuses: readonly ResonanceStatusView[]
  getResonanceForRelic: (relicId: RelicId) => ResonanceId | null
  onClose: () => void
}

export function CampOverview({
  rosterCount,
  oath,
  mode,
  runCode,
  heat,
  oathChronicleTitle,
  oathInterventionCount,
  oathInterventionPath,
  trialStatuses,
  ownedRelics,
  activeResonances,
  resonanceStatuses,
  getResonanceForRelic,
  onClose,
}: CampOverviewProps) {
  return (
    <>
      <div className="panel-heading camp-heading">
        <div>
          <p className="eyebrow">SURVIVORS</p>
          <h2 id="camp-title">불씨 대기소</h2>
        </div>
        <span className="capacity">
          {rosterCount} / {ROSTER_SIZE}
        </span>
        <button className="mobile-sheet-close" type="button" onClick={onClose} aria-label="불씨 대기소 닫기">
          ×
        </button>
      </div>

      <p className="camp-instruction" data-merge-locked={rosterCount <= 3 ? 'true' : 'false'}>
        {rosterCount <= 3 ? (
          <>
            세 전선을 지킬 마지막 인원입니다. <strong>신호탄 전까지 합성 잠김</strong>
          </>
        ) : (
          <>
            같은 병과·등급을 <strong>겹쳐서 합성</strong>하세요.
          </>
        )}
      </p>

      <section className="expedition-ledger" aria-labelledby="ledger-title">
        <header>
          <span aria-hidden="true">
            <i>{OATHS[oath].glyph}</i>
          </span>
          <div>
            <small>{mode === 'daily' ? 'DAILY RIFT' : mode === 'shared' ? 'SHARED RIFT' : 'EXPEDITION OATH'}</small>
            <strong id="ledger-title">{OATHS[oath].name}</strong>
          </div>
          <b>{runCode}</b>
        </header>
        <section className="oath-route-tracker" data-oath={oath} aria-label="왕관 서약 개입 경로">
          <header>
            <div>
              <small>OATH CROWN PATH</small>
              <strong>{oathChronicleTitle}</strong>
            </div>
            <b>{oathInterventionCount} / 3</b>
          </header>
          <ol>
            {oathInterventionPath.map(({ stage, choice, state }) => (
              <li data-state={state} aria-current={state === 'current' ? 'step' : undefined} key={stage.day}>
                <span aria-hidden="true">{state === 'sealed' ? '✓' : OATHS[oath].glyph}</span>
                <div>
                  <small>DAY {String(stage.day).padStart(2, '0')}</small>
                  <strong>{state === 'sealed' ? choice?.title : stage.name}</strong>
                </div>
                <b>
                  {state === 'sealed'
                    ? '새김'
                    : state === 'declined'
                      ? '다른 길'
                      : state === 'current'
                        ? '오늘'
                        : '앞으로'}
                </b>
              </li>
            ))}
          </ol>
        </section>
        <div className="trial-list">
          {trialStatuses.map(({ id, current, target, completed, pending }) => (
            <article data-completed={completed ? 'true' : 'false'} data-pending={pending ? 'true' : 'false'} key={id}>
              <span aria-hidden="true">{completed ? '✓' : TRIALS[id].glyph}</span>
              <div>
                <p>
                  <strong>{TRIALS[id].name}</strong>
                  <small>+{TRIALS[id].reward} 불씨</small>
                </p>
                <i
                  role="progressbar"
                  aria-label={`${TRIALS[id].name} ${current} / ${target}`}
                  aria-valuemin={0}
                  aria-valuemax={target}
                  aria-valuenow={current}
                >
                  <b style={{ width: `${Math.min(100, (current / target) * 100)}%` }} />
                </i>
                <small>
                  {pending
                    ? `귀환 시 판정 · 현재 온기 ${heat}%`
                    : `${TRIALS[id].description} · ${current.toLocaleString('ko-KR')} / ${target.toLocaleString('ko-KR')}`}
                </small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="relic-rack" aria-label="보유 유물">
        <div className="relic-rack-heading">
          <span>원정 유물</span>
          <small>
            유물 {ownedRelics.length} / 5 · 공명 {activeResonances.length} / {RESONANCE_IDS.length}
          </small>
        </div>
        <div className="relic-chips">
          {ownedRelics.length > 0 ? (
            ownedRelics.map((relicId) => {
              const resonanceId = getResonanceForRelic(relicId)
              const resonant = resonanceId ? activeResonances.includes(resonanceId) : false
              return (
                <span
                  className="relic-chip"
                  data-resonant={resonant ? 'true' : 'false'}
                  title={`${RELICS[relicId].description}${resonant && resonanceId ? ` · 공명: ${RESONANCES[resonanceId].name}` : ''}`}
                  key={relicId}
                >
                  <b aria-hidden="true">{RELICS[relicId].glyph}</b>
                  {RELICS[relicId].name}
                </span>
              )
            })
          ) : (
            <p>둘째 밤을 지키면 첫 유물을 발견합니다.</p>
          )}
        </div>
        {ownedRelics.length > 0 ? (
          <div className="resonance-rack">
            {resonanceStatuses
              .filter((status) => status.owned > 0)
              .map((status) => (
                <span
                  className="resonance-chip"
                  data-active={status.active ? 'true' : 'false'}
                  title={RESONANCES[status.id].description}
                  key={status.id}
                >
                  <b aria-hidden="true">{RESONANCES[status.id].glyph}</b>
                  <span>
                    <small>{status.active ? 'ACTIVE · 2 / 2' : 'DORMANT · 1 / 2'}</small>
                    <strong>{RESONANCES[status.id].name}</strong>
                    <em>
                      {status.active
                        ? RESONANCES[status.id].description
                        : `${RELICS[RESONANCES[status.id].requirements.find((relicId) => !ownedRelics.includes(relicId)) ?? RESONANCES[status.id].requirements[1]].name} 필요`}
                    </em>
                  </span>
                </span>
              ))}
          </div>
        ) : null}
      </section>
    </>
  )
}
