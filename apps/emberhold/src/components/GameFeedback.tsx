import type { RefObject } from 'react'
import type { GrowthCeremony, MarchSealCeremony, MilestoneNotice, SessionAccess } from './game-model'
import { KIND_META, LEGACY_UPGRADES, MASTERY_CONTRACTS, SPECIALIZATIONS, TIER_LABELS } from './game-model'

type RuntimeNoticeState = 'offline' | 'storage-error' | 'update' | 'applying-update' | 'waiting-update' | 'update-error'

export type EventDecisionNotice = {
  id: string
  day: number
  kind: 'standard' | 'oath' | 'echo' | 'imprint' | 'vow'
  glyph: string
  title: string
  outcome: string
  signal: string
  suppliesBefore: number
  suppliesAfter: number
  recoverySuppliesSpent: number
  heatBefore: number
  heatAfter: number
  moraleBefore: number
  moraleAfter: number
  scoreGain: number
  nextAction: string
}

type DragGhostPreviewProps = {
  active: boolean
  glyph: string
  ghostRef: RefObject<HTMLDivElement | null>
}

type GameFeedbackProps = {
  sessionAccess: SessionAccess
  toast: string
  eventDecision: EventDecisionNotice | null
  growthCeremony: GrowthCeremony | null
  marchSealCeremony: MarchSealCeremony | null
  milestone: MilestoneNotice | null
  milestoneQueueSize: number
  runtimeNotice: RuntimeNoticeState | null
  onRetrySession: () => void
  onApplyUpdate: () => void
  onDismissOffline: () => void
  onOpenSettings: () => void
  onDismissMilestone: () => void
}

export function DragGhostPreview({ active, glyph, ghostRef }: DragGhostPreviewProps) {
  return (
    <div className="drag-ghost" data-active={active ? 'true' : 'false'} ref={ghostRef} aria-hidden="true">
      {glyph}
    </div>
  )
}

function ToastNotice({ message }: { message: string }) {
  return (
    <div className={`toast ${message ? 'is-visible' : ''}`} aria-live="polite" aria-atomic="true" role="status">
      <span aria-hidden="true">✦</span>
      {message}
    </div>
  )
}

function EventDecisionNoticeView({ notice }: { notice: EventDecisionNotice }) {
  return (
    <aside
      className="event-decision-notice"
      data-kind={notice.kind}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="settings-visually-hidden">
        {notice.day}일차 결정, {notice.title} 확정. {notice.outcome}. 보급 {notice.suppliesBefore}에서{' '}
        {notice.suppliesAfter}, 온기 {notice.heatBefore}%에서 {notice.heatAfter}%, 사기 {notice.moraleBefore}에서{' '}
        {notice.moraleAfter}, 명성 {notice.scoreGain > 0 ? `+${notice.scoreGain}` : '변화 없음'}. {notice.signal}.{' '}
        {notice.nextAction}.
      </span>
      <section aria-hidden="true">
        <span className="event-decision-notice-glyph">{notice.glyph}</span>
        <header>
          <small>DECISION SEALED · NIGHT {String(notice.day).padStart(2, '0')}</small>
          <strong>{notice.title}</strong>
          <p>{notice.signal}</p>
        </header>
        <dl>
          <div>
            <dt>보급</dt>
            <dd>
              {notice.suppliesBefore} <i>→</i> <strong>{notice.suppliesAfter}</strong>
            </dd>
          </div>
          <div>
            <dt>온기</dt>
            <dd>
              {notice.heatBefore}% <i>→</i> <strong>{notice.heatAfter}%</strong>
            </dd>
          </div>
          <div>
            <dt>사기</dt>
            <dd>
              {notice.moraleBefore} <i>→</i> <strong>{notice.moraleAfter}</strong>
            </dd>
          </div>
          <div>
            <dt>명성</dt>
            <dd>
              <strong>{notice.scoreGain > 0 ? `+${notice.scoreGain.toLocaleString('ko-KR')}` : '—'}</strong>
            </dd>
          </div>
        </dl>
        <footer>
          <span>
            {notice.outcome}
            {notice.recoverySuppliesSpent > 0 ? ` · 복구 보급 −${notice.recoverySuppliesSpent}` : ''}
          </span>
          <b>{notice.nextAction}</b>
        </footer>
      </section>
    </aside>
  )
}

function GrowthNotice({ ceremony }: { ceremony: GrowthCeremony }) {
  const specialization = ceremony.specialization ? SPECIALIZATIONS[ceremony.specialization] : null

  return (
    <aside className={`growth-ceremony kind-${ceremony.kind}`} key={ceremony.id} aria-hidden="true">
      <section className="growth-ceremony-card">
        <header>
          <small>SURVIVOR ASCENDED · TIER FORGED</small>
          <strong>{ceremony.name}, 한계를 넘다</strong>
          <p>
            {KIND_META[ceremony.kind].name} {TIER_LABELS[ceremony.fromTier]} 두 생존자의 경험이 하나의 더 강한 전력으로
            이어졌습니다.
          </p>
        </header>
        <div className="growth-ceremony-forge">
          <span>
            <i>{KIND_META[ceremony.kind].glyph}</i>
            <b>{TIER_LABELS[ceremony.fromTier]}</b>
          </span>
          <em>+</em>
          <span>
            <i>{KIND_META[ceremony.kind].glyph}</i>
            <b>{TIER_LABELS[ceremony.fromTier]}</b>
          </span>
          <em>→</em>
          <span className="is-ascended">
            <i>{KIND_META[ceremony.kind].glyph}</i>
            <b>{TIER_LABELS[ceremony.toTier]}</b>
          </span>
        </div>
        <dl className="growth-ceremony-ledger">
          <div>
            <dt>기본 전투력</dt>
            <dd>
              {ceremony.powerBefore} <i>→</i> <strong>{ceremony.powerAfter}</strong>
            </dd>
            <small>+{ceremony.powerAfter - ceremony.powerBefore}</small>
          </div>
          <div>
            <dt>화로 온기</dt>
            <dd>
              {ceremony.heatBefore}% <i>→</i> <strong>{ceremony.heatAfter}%</strong>
            </dd>
            <small>+{ceremony.warmth}</small>
          </div>
        </dl>
        <footer>
          <span>
            {specialization ? `${specialization.glyph} ${specialization.name} 유지` : '새 등급 전력 배치 가능'}
          </span>
          <b>{ceremony.opensPromotion ? '베테랑의 길이 열렸습니다' : `TIER ${TIER_LABELS[ceremony.toTier]} 완성`}</b>
        </footer>
      </section>
    </aside>
  )
}

function MarchSealNotice({ ceremony }: { ceremony: MarchSealCeremony }) {
  const rankRaised = ceremony.rankBefore !== ceremony.rankAfter

  return (
    <aside
      className="march-seal-ceremony"
      data-rank-up={rankRaised ? 'true' : 'false'}
      key={ceremony.id}
      role="status"
      aria-live="assertive"
      aria-atomic="true"
    >
      <span className="settings-visually-hidden">
        행군 보급 {ceremony.supplies}을 봉인해 명성 {ceremony.scoreGain.toLocaleString('ko-KR')}을 얻었습니다. 현재 명성{' '}
        {ceremony.scoreAfter.toLocaleString('ko-KR')}, {ceremony.rankAfter} 등급
        {rankRaised ? '으로 상승했습니다.' : '입니다.'}
        {ceremony.legacyScoreBonus > 0
          ? ` 기록관의 잉크가 기본 명성 ${(ceremony.scoreGain - ceremony.legacyScoreBonus - ceremony.contractScoreBonus).toLocaleString('ko-KR')}에 ${ceremony.legacyScoreBonus.toLocaleString('ko-KR')}을 더했습니다.`
          : ''}
        {ceremony.contractScoreBonus > 0 && ceremony.masteryContract
          ? ` ${MASTERY_CONTRACTS[ceremony.masteryContract].name} 계약이 계승 후 명성 ${(ceremony.scoreGain - ceremony.contractScoreBonus).toLocaleString('ko-KR')}에 ${ceremony.contractScoreBonus.toLocaleString('ko-KR')}을 더했습니다.`
          : ''}
        {ceremony.recoveryReserve > 0
          ? ` 아직 사용하지 않은 복구 보급 ${ceremony.recoveryReserve}은 보호했습니다.`
          : ''}
      </span>
      <section className="march-seal-ceremony-card" aria-hidden="true">
        <div className="march-seal-ceremony-crest">
          <span>
            <i />
            <i />
            <i />
          </span>
          <b>♜</b>
        </div>
        <header>
          <small>LAST MARCH LEDGER · SUPPLY SEALED</small>
          <strong>행군 보급이 전설로 남았다</strong>
          <p>살아남기 위한 예비는 지키고, 남은 길의 무게만 원정 기록에 각인했습니다.</p>
        </header>
        <div className="march-seal-exchange">
          <span>
            <small>보급 인계</small>
            <strong>◈ −{ceremony.supplies}</strong>
          </span>
          <i>→</i>
          <span>
            <small>명성 각인</small>
            <strong>+{ceremony.scoreGain.toLocaleString('ko-KR')}</strong>
          </span>
        </div>
        {ceremony.legacyScoreBonus > 0 ? (
          <div className="march-seal-legacy-verdict">
            <span aria-hidden="true">{LEGACY_UPGRADES['chroniclers-ink'].glyph}</span>
            <div>
              <small>INHERITED RENOWN · {LEGACY_UPGRADES['chroniclers-ink'].name}</small>
              <strong>
                기본 +
                {(ceremony.scoreGain - ceremony.legacyScoreBonus - ceremony.contractScoreBonus).toLocaleString('ko-KR')}{' '}
                → 유산 적용 +{(ceremony.scoreGain - ceremony.contractScoreBonus).toLocaleString('ko-KR')}
              </strong>
            </div>
            <b>+{ceremony.legacyScoreBonus.toLocaleString('ko-KR')} 기여</b>
          </div>
        ) : null}
        {ceremony.contractScoreBonus > 0 && ceremony.masteryContract ? (
          <div className="march-seal-legacy-verdict is-contract">
            <span aria-hidden="true">{MASTERY_CONTRACTS[ceremony.masteryContract].glyph}</span>
            <div>
              <small>ETERNAL COVENANT · {MASTERY_CONTRACTS[ceremony.masteryContract].name}</small>
              <strong>
                계승 후 +{(ceremony.scoreGain - ceremony.contractScoreBonus).toLocaleString('ko-KR')} → 실제 +
                {ceremony.scoreGain.toLocaleString('ko-KR')}
              </strong>
            </div>
            <b>+{ceremony.contractScoreBonus.toLocaleString('ko-KR')} 기여</b>
          </div>
        ) : null}
        <div className="march-seal-scoreline">
          <span>{ceremony.scoreBefore.toLocaleString('ko-KR')}</span>
          <i />
          <strong>{ceremony.scoreAfter.toLocaleString('ko-KR')}</strong>
        </div>
        <footer>
          <span>
            화로·성장·복구 보호선 ◈ {ceremony.reserve} 유지
            {ceremony.recoveryReserve > 0 ? ` · 남은 복구분 ◈ ${ceremony.recoveryReserve} 보호` : ''}
          </span>
          <b>
            {rankRaised
              ? `${ceremony.rankBefore} → ${ceremony.rankAfter} 등급 상승`
              : `${ceremony.rankAfter} 등급 기록`}
          </b>
        </footer>
      </section>
    </aside>
  )
}

function MilestoneNoticeView({
  milestone,
  queueSize,
  shifted,
  onDismiss,
}: {
  milestone: MilestoneNotice
  queueSize: number
  shifted: boolean
  onDismiss: () => void
}) {
  const remainingCount = Math.max(0, queueSize - 1)
  const actionLabel = remainingCount > 0 ? '다음 기록' : '확인'

  return (
    <aside
      className={`milestone-notice ${shifted ? 'is-shifted' : ''}`}
      data-kind={milestone.kind}
      key={milestone.id}
      aria-label={`${milestone.kicker}: ${milestone.title}`}
    >
      <span className="settings-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {milestone.title}. {milestone.description}. {milestone.detail}
      </span>
      <span className="milestone-sigil" aria-hidden="true">
        <b>{milestone.glyph}</b>
      </span>
      <div className="milestone-copy">
        <small>{milestone.kicker}</small>
        <strong>{milestone.title}</strong>
        <p>{milestone.description}</p>
        <em>{milestone.detail}</em>
      </div>
      <div className="milestone-actions">
        {remainingCount > 0 ? (
          <span className="milestone-queue">
            <span aria-hidden="true">+{remainingCount}</span>
            <span className="settings-visually-hidden">뒤이어 표시할 기록 {remainingCount}개</span>
          </span>
        ) : null}
        <button
          className="milestone-dismiss"
          type="button"
          onClick={onDismiss}
          aria-label={`${milestone.title} ${actionLabel}${remainingCount > 0 ? `, 남은 기록 ${remainingCount}개` : ''}`}
        >
          {actionLabel}
        </button>
      </div>
      <i className="milestone-timer" aria-hidden="true" />
    </aside>
  )
}

function RuntimeNotice({
  state,
  onApplyUpdate,
  onDismissOffline,
  onOpenSettings,
}: {
  state: RuntimeNoticeState
  onApplyUpdate: () => void
  onDismissOffline: () => void
  onOpenSettings: () => void
}) {
  const offline = state === 'offline'
  const storageError = state === 'storage-error'
  const delayed = state === 'waiting-update'
  const applying = state === 'applying-update' || delayed
  const failed = state === 'update-error'
  const title = storageError
    ? '기록 저장이 멈췄습니다'
    : offline
      ? '오프라인 원정'
      : delayed
        ? '새 불씨를 깨우는 중'
        : applying
          ? '새 불씨로 전환 중'
          : failed
            ? '전환이 지연되고 있습니다'
            : '새 불씨가 준비됐습니다'
  const description = storageError
    ? '새 선택과 교전 결과는 저장이 확인될 때까지 확정하지 않습니다.'
    : offline
      ? '연결 없이 플레이 중입니다. 진행은 이 기기에 계속 저장됩니다.'
      : delayed
        ? '브라우저가 새 캐시를 활성화하고 있습니다. 완료되는 즉시 저장한 체크포인트로 다시 엽니다.'
        : applying
          ? '체크포인트 저장을 마쳤습니다. 캐시를 교대하고 원정 화면을 다시 엽니다.'
          : failed
            ? '현재 플레이와 체크포인트는 그대로입니다. 준비된 빌드를 다시 요청할 수 있습니다.'
            : '현재 체크포인트를 보존한 채 최신 빌드로 전환할 수 있습니다.'
  const detail = storageError
    ? '설정에서 저장소를 다시 확인하거나 현재 상태를 백업 파일로 보관하세요.'
    : offline
      ? '알림을 닫아도 오프라인 상태는 계속 유지됩니다.'
      : delayed
        ? '전환 중에는 원정 입력을 안전하게 잠급니다.'
        : applying
          ? '이 과정은 보통 몇 초 안에 끝납니다.'
          : failed
            ? '재시도해도 현재 기록은 먼저 보존됩니다.'
            : '업데이트는 제목 화면 또는 안전한 야영지에서만 시작됩니다.'

  const content = (
    <>
      <span className="runtime-notice-icon" aria-hidden="true">
        {offline ? '❄' : applying ? '↻' : failed || storageError ? '!' : '✦'}
      </span>
      <div>
        {!applying || delayed ? (
          <span className="settings-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
            {title}. {description}
          </span>
        ) : null}
        <strong id="runtime-notice-title">{title}</strong>
        <p id="runtime-notice-description">{description}</p>
        <small>{detail}</small>
      </div>
      {storageError ? (
        <button type="button" onClick={onOpenSettings}>
          기록 보호 확인
        </button>
      ) : offline ? (
        <button type="button" onClick={onDismissOffline}>
          알림 닫기
        </button>
      ) : state === 'update' || failed ? (
        <button type="button" onClick={onApplyUpdate}>
          {failed ? '다시 시도' : '업데이트 적용'}
        </button>
      ) : null}
    </>
  )

  if (applying) {
    return (
      <aside
        className="runtime-notice"
        data-state={state}
        role="dialog"
        aria-modal="true"
        aria-labelledby="runtime-notice-title"
        aria-describedby="runtime-notice-description"
        data-focus-scope="update"
        tabIndex={-1}
      >
        {content}
      </aside>
    )
  }

  return (
    <aside className="runtime-notice" data-state={state}>
      {content}
    </aside>
  )
}

function SessionGuard({ state, onRetry }: { state: Exclude<SessionAccess, 'active'>; onRetry: () => void }) {
  const checking = state === 'checking'
  const failed = state === 'error'
  const title = checking
    ? '원정 기록을 확인하는 중'
    : failed
      ? '기록 권한을 확인할 수 없습니다'
      : '다른 창에서 원정을 지휘 중입니다'
  const description = checking
    ? '이 기기의 최신 체크포인트와 안전한 기록 권한을 확인하고 있습니다.'
    : failed
      ? '기록 충돌을 막기 위해 플레이를 시작하지 않았습니다. 창을 새로 열어 다시 확인해 주세요.'
      : '오래된 진행이 최신 기록을 덮어쓰지 않도록 이 창은 안전하게 대기합니다.'

  return (
    <div className="session-guard" role="presentation">
      <section
        className="session-guard-card"
        data-state={state}
        data-focus-scope="session"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-guard-title"
        aria-describedby="session-guard-description"
        tabIndex={-1}
      >
        <div className="session-guard-sigil" aria-hidden="true">
          <i />
          <span>♜</span>
        </div>
        <small>EXCLUSIVE COMMAND AUTHORITY</small>
        <h2 id="session-guard-title">{title}</h2>
        <p id="session-guard-description">{description}</p>
        <div className="session-guard-status" role="status" aria-live="polite" aria-atomic="true">
          <span aria-hidden="true">{checking ? '⌛' : failed ? '!' : 'Ⅱ'}</span>
          <strong>
            {checking
              ? '기록 보호 확인 중'
              : failed
                ? '현재 기록은 변경되지 않았습니다'
                : '기존 창을 닫으면 최신 기록으로 자동 인계됩니다'}
          </strong>
        </div>
        {!checking ? (
          <button type="button" onClick={onRetry} data-autofocus>
            상태 다시 확인
          </button>
        ) : null}
        <em>
          {failed ? '재시도 전에도 기존 기록은 그대로 보존됩니다.' : '대기 중인 이 창에서는 기록을 수정하지 않습니다.'}
        </em>
      </section>
    </div>
  )
}

export function GameFeedback({
  sessionAccess,
  toast,
  eventDecision,
  growthCeremony,
  marchSealCeremony,
  milestone,
  milestoneQueueSize,
  runtimeNotice,
  onRetrySession,
  onApplyUpdate,
  onDismissOffline,
  onOpenSettings,
  onDismissMilestone,
}: GameFeedbackProps) {
  return (
    <>
      {sessionAccess !== 'active' ? <SessionGuard state={sessionAccess} onRetry={onRetrySession} /> : null}
      <ToastNotice message={toast} />
      {eventDecision ? <EventDecisionNoticeView notice={eventDecision} key={eventDecision.id} /> : null}
      {growthCeremony ? <GrowthNotice ceremony={growthCeremony} /> : null}
      {marchSealCeremony ? <MarchSealNotice ceremony={marchSealCeremony} /> : null}
      {milestone ? (
        <MilestoneNoticeView
          milestone={milestone}
          queueSize={milestoneQueueSize}
          shifted={runtimeNotice !== null}
          onDismiss={onDismissMilestone}
        />
      ) : null}
      {runtimeNotice ? (
        <RuntimeNotice
          state={runtimeNotice}
          onApplyUpdate={onApplyUpdate}
          onDismissOffline={onDismissOffline}
          onOpenSettings={onOpenSettings}
        />
      ) : null}
    </>
  )
}
