import type { CampUndo, MasteryContractId, UnitKind } from './game-model'
import { KIND_META, LEGACY_UPGRADES, MASTERY_CONTRACTS } from './game-model'

type RecruitCostView = {
  cost: number
  afterNext: number
  nightPressure: number
  scalePressure: number
  difficultyDelta: number
  discount: number
  recoveryDiscount: number
}

type QuartermasterBriefingView = {
  state: string
  title: string
  description: string
  label: string
}

type ReturnForecastView = {
  victory: boolean
  supplyReward: number
  supplies: number
  heat: number
}

type CampaignPaceView = {
  growthGap: number
  lineupTierTotal: number
  target: number
  crownGrowth: string
  progress: number
  heatGap: number
}

type QuartermasterLedgerProps = {
  day: number
  supplies: number
  recoverySupplies: number
  spendable: number
  reserve: number
  briefing: QuartermasterBriefingView
  recruit: RecruitCostView
  returnForecast: ReturnForecastView | null
  pace: CampaignPaceView
}

export function QuartermasterLedger({
  day,
  supplies,
  recoverySupplies,
  spendable,
  reserve,
  briefing,
  recruit,
  returnForecast,
  pace,
}: QuartermasterLedgerProps) {
  return (
    <aside className="quartermaster-ledger" data-state={briefing.state} aria-label="보급관의 전투 귀환 예산">
      <header>
        <span aria-hidden="true">▣</span>
        <div>
          <small>QUARTERMASTER FORECAST · NIGHT {String(day).padStart(2, '0')}</small>
          <strong>{briefing.title}</strong>
          <p>{briefing.description}</p>
        </div>
        <b>{briefing.label}</b>
      </header>
      <dl>
        <div>
          <dt>운용 가능 보급</dt>
          <dd>◈ {spendable}</dd>
          <small>
            보유 {supplies} · 전술 예비 {reserve}
            {recoverySupplies > 0 ? ` · 복구분 ◈ ${recoverySupplies} 사용 가능` : ''}
          </small>
        </div>
        <div>
          <dt>다음 신호탄</dt>
          <dd>◈ {recruit.cost}</dd>
          <small>
            후속 ◈ {recruit.afterNext} · 구조 규모 +{recruit.scalePressure}
            {recruit.recoveryDiscount > 0 ? ` · 복구 −${recruit.recoveryDiscount}` : ''}
          </small>
        </div>
        <div>
          <dt>현재 계획 귀환</dt>
          <dd>{returnForecast ? `◈ ${returnForecast.supplies}` : '계산 대기'}</dd>
          <small>
            {returnForecast
              ? `${returnForecast.victory ? '승리' : '후퇴'} 보급 +${returnForecast.supplyReward} · 온기 ${returnForecast.heat}%`
              : '세 전선 배치 필요'}
          </small>
        </div>
        <div data-ready={pace.growthGap === 0 ? 'true' : 'false'}>
          <dt>현재 성장 페이스</dt>
          <dd>
            등급합 {pace.lineupTierTotal} / {pace.target}
          </dd>
          <small>
            왕관 목표 · {pace.crownGrowth} · {pace.progress}% ·{' '}
            {pace.heatGap > 0 ? `온기선 −${pace.heatGap}` : '온기선 확보'}
          </small>
          <span
            className="campaign-pace-meter"
            role="progressbar"
            aria-label={`오늘 성장선 ${pace.lineupTierTotal} / ${pace.target}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pace.progress}
          >
            <i style={{ width: `${pace.progress}%` }} />
          </span>
        </div>
      </dl>
      <footer>
        신호탄 비용 · 기본 18 + 밤 {recruit.nightPressure} + 구조 규모 {recruit.scalePressure}
        {recruit.difficultyDelta !== 0
          ? ` · 위험도 ${recruit.difficultyDelta > 0 ? '+' : ''}${recruit.difficultyDelta}`
          : ''}
        {recruit.discount > 0 ? ` · 보급 효과 −${recruit.discount}` : ''}
        {recruit.recoveryDiscount > 0 ? ` · 후퇴 복구 −${recruit.recoveryDiscount}` : ''} · 성장선은 출전 3명의 등급
        합계로 계산
      </footer>
    </aside>
  )
}

type RecruitActionView = RecruitCostView & {
  kind: UnitKind
  pairReady: boolean
  reserveRisk: boolean
  reserve: number
  disabled: boolean
}

type StokeActionView = {
  heat: number
  heatGain: number
  baseCost: number
  cost: number
  disabled: boolean
}

type MarchSealActionView = {
  unlocked: boolean
  supplies: number
  reserve: number
  recoveryReserve: number
  scoreRate: number
  score: number
  legacy: {
    baseScoreRate: number
    scoreBonus: number
  } | null
  contract: {
    id: MasteryContractId
    inheritedScoreRate: number
    scoreBonus: number
  } | null
  veteranLines: number
  disabled: boolean
}

type CampActionsProps = {
  recruit: RecruitActionView
  stoke: StokeActionView
  marchSeal: MarchSealActionView | null
  onRecruit: () => void
  onStoke: () => void
  onSealMarchSupplies: () => void
}

export function CampActions({ recruit, stoke, marchSeal, onRecruit, onStoke, onSealMarchSupplies }: CampActionsProps) {
  const recruitTitle = `기본 18 · 밤 +${recruit.nightPressure} · 구조 규모 +${recruit.scalePressure}${recruit.difficultyDelta !== 0 ? ` · 위험도 ${recruit.difficultyDelta > 0 ? '+' : ''}${recruit.difficultyDelta}` : ''}${recruit.discount > 0 ? ` · 보급 효과 -${recruit.discount}` : ''}${recruit.recoveryDiscount > 0 ? ` · 후퇴 복구 -${recruit.recoveryDiscount}` : ''}`

  return (
    <div className="camp-actions">
      <button
        className="recruit-button"
        type="button"
        onClick={onRecruit}
        data-pair-ready={recruit.pairReady ? 'true' : 'false'}
        data-reserve-risk={recruit.reserveRisk ? 'true' : 'false'}
        title={recruitTitle}
        disabled={recruit.disabled}
      >
        <span className="action-symbol" aria-hidden="true">
          +
        </span>
        <span>
          <strong>신호탄 쏘기</strong>
          <small>
            다음 · {KIND_META[recruit.kind].name} I · {recruit.pairReady ? '합성 짝 준비됨' : '구조 신호 확인'} ·{' '}
            {recruit.reserveRisk ? `예비 ${recruit.reserve} 소진` : `후속 ◈ ${recruit.afterNext}`}
            {recruit.recoveryDiscount > 0 ? ` · 복구 −${recruit.recoveryDiscount}` : ''}
          </small>
        </span>
        <b>◈ {recruit.cost}</b>
      </button>
      <button className="stoke-button" type="button" onClick={onStoke} disabled={stoke.disabled}>
        <span className="mini-flame" aria-hidden="true" />
        <span>
          <strong>화로 채우기</strong>
          <small>
            온기 +{stoke.heatGain} · 가득 채울 때 ◈ {stoke.baseCost}
          </small>
        </span>
        <b>{stoke.heat >= 100 ? '가득 참' : `◈ ${stoke.cost}`}</b>
      </button>
      {marchSeal ? (
        <button
          className="march-seal-button"
          type="button"
          onClick={onSealMarchSupplies}
          data-ready={marchSeal.unlocked && marchSeal.supplies >= 10 ? 'true' : 'false'}
          disabled={marchSeal.disabled}
          title="앞으로 필요한 화로 1~2회와 미완성 성장 1회의 보급, 아직 사용하지 않은 후퇴 복구 보급 중 가장 큰 보호선을 남기고 10보급 단위의 진짜 잉여만 명성으로 봉인합니다."
        >
          <span className="march-seal-symbol" aria-hidden="true">
            ♜
          </span>
          <span>
            <strong>행군 보급 봉인</strong>
            <small>
              {!marchSeal.unlocked
                ? `출전 대열 III+ ${marchSeal.veteranLines} / 3 필요`
                : marchSeal.supplies >= 10
                  ? `보급 ${marchSeal.supplies} 인계 · 보호선 ${marchSeal.reserve} 유지${marchSeal.recoveryReserve > 0 ? ` · 복구분 ${marchSeal.recoveryReserve} 보호` : ''} · 1보급당 명성 ${marchSeal.scoreRate}`
                  : `보호선 ${marchSeal.reserve} 유지${marchSeal.recoveryReserve > 0 ? ` · 복구분 ${marchSeal.recoveryReserve} 보호` : ''} · 잉여 보급 10 이상 필요`}
            </small>
            {marchSeal.legacy ? (
              <em className="march-seal-legacy-attribution" data-applied={marchSeal.score > 0 ? 'true' : 'false'}>
                <b aria-hidden="true">{LEGACY_UPGRADES['chroniclers-ink'].glyph}</b>
                <span>
                  <small>INHERITED RENOWN · {LEGACY_UPGRADES['chroniclers-ink'].name}</small>
                  <strong>
                    {marchSeal.score > 0
                      ? `기본 +${(
                          marchSeal.score - marchSeal.legacy.scoreBonus - (marchSeal.contract?.scoreBonus ?? 0)
                        ).toLocaleString(
                          'ko-KR',
                        )} → 유산 적용 +${(marchSeal.score - (marchSeal.contract?.scoreBonus ?? 0)).toLocaleString('ko-KR')}`
                      : `기본 환산 ${marchSeal.legacy.baseScoreRate} → 유산 적용 ${marchSeal.contract?.inheritedScoreRate ?? marchSeal.scoreRate} · 봉인 대기`}
                  </strong>
                </span>
                <b>
                  {marchSeal.legacy.scoreBonus > 0
                    ? `+${marchSeal.legacy.scoreBonus.toLocaleString('ko-KR')} 기여`
                    : '×1.08 적재'}
                </b>
              </em>
            ) : null}
            {marchSeal.contract ? (
              <em
                className="march-seal-legacy-attribution is-contract"
                data-applied={marchSeal.score > 0 ? 'true' : 'false'}
              >
                <b aria-hidden="true">{MASTERY_CONTRACTS[marchSeal.contract.id].glyph}</b>
                <span>
                  <small>ETERNAL COVENANT · {MASTERY_CONTRACTS[marchSeal.contract.id].name}</small>
                  <strong>
                    {marchSeal.score > 0
                      ? `계승 후 +${(marchSeal.score - marchSeal.contract.scoreBonus).toLocaleString('ko-KR')} → 실제 +${marchSeal.score.toLocaleString('ko-KR')}`
                      : `계승 환산 ${marchSeal.contract.inheritedScoreRate} → 계약 적용 ${marchSeal.scoreRate} · 봉인 대기`}
                  </strong>
                </span>
                <b>
                  {marchSeal.contract.scoreBonus > 0
                    ? `+${marchSeal.contract.scoreBonus.toLocaleString('ko-KR')} 기여`
                    : `×${MASTERY_CONTRACTS[marchSeal.contract.id].scoreScale.toFixed(2)} 적재`}
                </b>
              </em>
            ) : null}
          </span>
          <b>
            {marchSeal.unlocked
              ? marchSeal.score > 0
                ? `+${marchSeal.score.toLocaleString('ko-KR')}`
                : `예비 ◈ ${marchSeal.reserve}`
              : `${marchSeal.veteranLines} / 3`}
          </b>
        </button>
      ) : null}
    </div>
  )
}

type CampUndoNoticeProps = {
  undo: CampUndo | null
  onUndo: () => void
}

export function CampUndoNotice({ undo, onUndo }: CampUndoNoticeProps) {
  if (!undo) return null

  return (
    <aside className="camp-undo" data-kind={undo.kind} aria-label="마지막 캠프 투자 되돌리기">
      <span aria-hidden="true">↶</span>
      <div>
        <small>LAST CAMP INVESTMENT</small>
        <strong>{undo.label}</strong>
        <p>{undo.detail}</p>
      </div>
      <button type="button" onClick={onUndo}>
        <span>되돌리기</span>
        <kbd>Z</kbd>
      </button>
    </aside>
  )
}
