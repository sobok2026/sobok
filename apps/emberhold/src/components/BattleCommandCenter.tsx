import type { BattleOrder, EnemyIntent, LaneResult, MasteryContractId } from './game-model'
import { INTENT_META, LEGACY_UPGRADES, MASTERY_CONTRACTS, ORDER_META } from './game-model'

const BATTLE_LANES = [0, 1, 2] as const
const BATTLE_ORDERS = Object.keys(ORDER_META) as BattleOrder[]

type TacticalRehearsalView = {
  state: string
  glyph: string
  kicker: string
  title: string
  description: string
  status: string
  actionLabel: string
  routeSteps: string[]
}

type LegacyCommandContribution = {
  limit: number
  limitBeforeLegacy: number
  appliedBonus: number
}

type LegacyRewardContribution = {
  triggered: boolean
  bonus: number
  total: number
}

type LegacyRewardForecast = {
  available: boolean
  supply: LegacyRewardContribution | null
  renown: LegacyRewardContribution | null
}

type MasteryContractForecast = {
  id: MasteryContractId
  available: boolean
  triggered: boolean
  bonus: number
  total: number
}

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

type LegacyForecastEntry = {
  id: string
  glyph: string
  name: string
  value: string
  detail: string
  state: 'applied' | 'waiting' | 'absorbed'
}

type BattleCommandControlsProps = {
  focusLane: number
  focusBonusPercent: number
  focusResonanceActive: boolean
  tutorialFocus: boolean
  tutorialOrders: boolean
  tutorialRecommendedFocusLane: number
  orders: readonly BattleOrder[]
  enemyIntents: readonly EnemyIntent[]
  commandSpent: number
  commandLimit: number
  commandLimitBeforeContract: number
  doctrineCommandRelief: number
  legacyCommand: LegacyCommandContribution | null
  masteryContract: MasteryContractId | null
  tacticalRehearsal: TacticalRehearsalView | null
  tacticalAdjustmentAvailable: boolean
  onChooseFocusLane: (lane: number) => void
  onChooseOrder: (lane: number, order: BattleOrder) => void
  onApplyTacticalAdjustment: () => void
}

type BattleLaunchProps = {
  forecastReady: boolean
  forecastTitle: string
  forecastDetail: string
  laneForecasts: readonly (LaneResult | null)[]
  recommendedLane: number | null
  legacyCommand: LegacyCommandContribution | null
  legacyRewardForecast: LegacyRewardForecast
  masteryContractForecast: MasteryContractForecast | null
  riskDepartureForecast: RiskDepartureForecast | null
  actionLabel: string
  actionDisabled: boolean
  tutorialBattle: boolean
  onCancelRiskDeparture: () => void
  onStartBattle: () => void
}

function FocusControl({
  focusLane,
  focusBonusPercent,
  focusResonanceActive,
  tutorialFocus,
  tutorialRecommendedFocusLane,
  onChooseFocusLane,
}: Pick<
  BattleCommandControlsProps,
  | 'focusLane'
  | 'focusBonusPercent'
  | 'focusResonanceActive'
  | 'tutorialFocus'
  | 'tutorialRecommendedFocusLane'
  | 'onChooseFocusLane'
>) {
  return (
    <fieldset className="focus-control" data-tutorial-highlight={tutorialFocus ? 'true' : 'false'}>
      <legend>화로 집중 전선 선택</legend>
      <div>
        <span className="mini-flame" aria-hidden="true" />
        <p>
          <strong>화로의 힘 집중</strong>
          <small>
            선택 전선 전투력 +{focusBonusPercent}%{focusResonanceActive ? ' · 의도 파훼 시 공명 +12%' : ''}
          </small>
        </p>
      </div>
      <div className="focus-buttons">
        {BATTLE_LANES.map((lane) => {
          const tutorialRecommended = tutorialFocus && tutorialRecommendedFocusLane === lane
          return (
            <button
              className={focusLane === lane ? 'is-active' : ''}
              type="button"
              key={`focus-${lane}`}
              onClick={() => onChooseFocusLane(lane)}
              aria-pressed={focusLane === lane}
              aria-keyshortcuts={`${lane + 1}`}
              data-focus-lane={lane}
              aria-label={`0${lane + 1} 전선${tutorialRecommended ? ' · 현장 훈련 추천' : ''}`}
              data-tutorial-recommended={tutorialRecommended ? 'true' : undefined}
            >
              0{lane + 1}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function TacticalOrders({
  orders,
  enemyIntents,
  commandSpent,
  commandLimit,
  commandLimitBeforeContract,
  doctrineCommandRelief,
  legacyCommand,
  masteryContract,
  tutorialOrders,
  tacticalRehearsal,
  tacticalAdjustmentAvailable,
  onChooseOrder,
  onApplyTacticalAdjustment,
}: Pick<
  BattleCommandControlsProps,
  | 'orders'
  | 'enemyIntents'
  | 'commandSpent'
  | 'commandLimit'
  | 'commandLimitBeforeContract'
  | 'doctrineCommandRelief'
  | 'legacyCommand'
  | 'masteryContract'
  | 'tutorialOrders'
  | 'tacticalRehearsal'
  | 'tacticalAdjustmentAvailable'
  | 'onChooseOrder'
  | 'onApplyTacticalAdjustment'
>) {
  const commandOver = commandSpent > commandLimit

  return (
    <section
      className="orders-control"
      aria-labelledby="orders-title"
      data-tutorial-highlight={tutorialOrders ? 'true' : 'false'}
    >
      <header>
        <div>
          <span className="eyebrow">TACTICAL ORDERS</span>
          <strong id="orders-title">전선 명령</strong>
        </div>
        <p data-over={commandOver ? 'true' : 'false'}>
          {doctrineCommandRelief > 0 ? <i>교리 대응 +{doctrineCommandRelief}</i> : null}
          명령 점수 <b>{commandSpent}</b> / {commandLimit}
        </p>
      </header>
      {legacyCommand ? (
        <aside
          className="legacy-command-budget"
          data-state={legacyCommand.appliedBonus > 0 ? 'applied' : 'absorbed'}
          aria-label="계승 유산 지휘 한도 기여"
        >
          <span aria-hidden="true">{LEGACY_UPGRADES['command-seal'].glyph}</span>
          <div>
            <small>INHERITED COMMAND · 항상 적용</small>
            <strong>{LEGACY_UPGRADES['command-seal'].name}</strong>
            <p>
              규칙 +1 ·{' '}
              {legacyCommand.appliedBonus > 0
                ? `실제 지휘 한도 ${legacyCommand.limitBeforeLegacy} → ${legacyCommand.limit}`
                : `현재 ${legacyCommand.limit}점 교리 보장선에 포함`}
            </p>
          </div>
          <b>{legacyCommand.appliedBonus > 0 ? `+${legacyCommand.appliedBonus} 적용` : '규칙 적재'}</b>
        </aside>
      ) : null}
      {masteryContract && MASTERY_CONTRACTS[masteryContract].commandDelta < 0 ? (
        <aside className="contract-command-budget" aria-label="영원 계약 지휘 한도 부담">
          <span aria-hidden="true">{MASTERY_CONTRACTS[masteryContract].glyph}</span>
          <div>
            <small>ETERNAL COVENANT · COMMAND BURDEN</small>
            <strong>{MASTERY_CONTRACTS[masteryContract].name}</strong>
            <p>
              유산·사기·교리 계산 후 {commandLimitBeforeContract} → 실제 지휘 한도 {commandLimit}
            </p>
          </div>
          <b>{MASTERY_CONTRACTS[masteryContract].burden}</b>
        </aside>
      ) : null}
      <div className="order-lanes">
        {orders.map((selectedOrder, lane) => {
          const enemyIntent = enemyIntents[lane]
          const enemyIntentName = INTENT_META[enemyIntent].name
          return (
            <article data-order-lane={lane} key={`order-${lane}`}>
              <div className="order-lane-heading">
                <span>0{lane + 1} 전선</span>
                <small>적 의도 · {enemyIntentName}</small>
              </div>
              <div className="order-buttons">
                {BATTLE_ORDERS.map((order) => {
                  const orderMeta = ORDER_META[order]
                  const countersIntent = orderMeta.counters === enemyIntent
                  return (
                    <button
                      className={selectedOrder === order ? 'is-active' : ''}
                      data-counter={countersIntent ? 'true' : 'false'}
                      type="button"
                      onClick={() => onChooseOrder(lane, order)}
                      aria-pressed={selectedOrder === order}
                      aria-label={`0${lane + 1} 전선 · ${orderMeta.name} 명령 · 지휘 ${orderMeta.cost}점${countersIntent ? ` · ${enemyIntentName} 파훼` : ''}`}
                      data-order={order}
                      title={orderMeta.description}
                      key={order}
                    >
                      <b aria-hidden="true">{orderMeta.glyph}</b>
                      <span>{orderMeta.name}</span>
                      <small>{orderMeta.cost > 0 ? `-${orderMeta.cost}` : '0'}</small>
                    </button>
                  )
                })}
              </div>
            </article>
          )
        })}
      </div>
      {tacticalRehearsal ? (
        <aside
          className="tactical-rehearsal"
          data-state={tacticalRehearsal.state}
          data-route={tacticalRehearsal.routeSteps.length > 0 ? 'true' : undefined}
          aria-label="참모의 전체 전술 모의"
          aria-live="polite"
        >
          <span aria-hidden="true">{tacticalRehearsal.glyph}</span>
          <div>
            <small>{tacticalRehearsal.kicker}</small>
            <strong>{tacticalRehearsal.title}</strong>
            <p>{tacticalRehearsal.description}</p>
            {tacticalRehearsal.routeSteps.length > 0 ? (
              <ol className="tactical-route-steps" aria-label="추천 전술 적용 순서">
                {tacticalRehearsal.routeSteps.map((step, index) => (
                  <li data-next={index === 0 ? 'true' : undefined} key={`${step}-${index}`}>
                    <b>{index + 1}</b>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
          <div className="tactical-rehearsal-action">
            <b>{tacticalRehearsal.status}</b>
            {tacticalAdjustmentAvailable ? (
              <button
                type="button"
                onClick={onApplyTacticalAdjustment}
                aria-keyshortcuts="A"
                title="추천 전술 경로의 다음 단계만 적용"
              >
                <span>{tacticalRehearsal.actionLabel}</span>
                <kbd>A</kbd>
              </button>
            ) : null}
          </div>
        </aside>
      ) : null}
      <footer>
        <span>파훼</span>
        <p>방벽 › 공성 · 돌격 › 제압 · 지원 › 우회</p>
      </footer>
    </section>
  )
}

function AffinityLegend() {
  return (
    <aside className="affinity-legend" aria-label="병과 상성">
      <span className="legend-title">상성</span>
      <span className="kind-warden">◆ 방패</span>
      <i aria-hidden="true">›</i>
      <span className="kind-ranger">⌁ 활</span>
      <i aria-hidden="true">›</i>
      <span className="kind-raider">✦ 도끼</span>
      <i aria-hidden="true">›</i>
      <span className="kind-warden">◆ 방패</span>
    </aside>
  )
}

export function BattleCommandControls(props: BattleCommandControlsProps) {
  return (
    <>
      <FocusControl {...props} />
      <TacticalOrders {...props} />
      <AffinityLegend />
    </>
  )
}

export function BattleLaunch({
  forecastReady,
  forecastTitle,
  forecastDetail,
  laneForecasts,
  recommendedLane,
  legacyCommand,
  legacyRewardForecast,
  masteryContractForecast,
  riskDepartureForecast,
  actionLabel,
  actionDisabled,
  tutorialBattle,
  onCancelRiskDeparture,
  onStartBattle,
}: BattleLaunchProps) {
  const legacyForecastEntries: LegacyForecastEntry[] = []
  if (legacyCommand) {
    const applied = legacyCommand.appliedBonus > 0
    legacyForecastEntries.push({
      id: 'command-seal',
      glyph: LEGACY_UPGRADES['command-seal'].glyph,
      name: LEGACY_UPGRADES['command-seal'].name,
      value: applied ? `지휘 한도 +${legacyCommand.appliedBonus}` : `지휘 한도 ${legacyCommand.limit}`,
      detail: applied
        ? `${legacyCommand.limitBeforeLegacy} → ${legacyCommand.limit} 실제 반영`
        : '교리 보장선에 규칙 포함',
      state: applied ? 'applied' : 'absorbed',
    })
  }
  if (legacyRewardForecast.supply) {
    const supply = legacyRewardForecast.supply
    const triggered = legacyRewardForecast.available && supply.triggered
    legacyForecastEntries.push({
      id: 'salvagers-instinct',
      glyph: LEGACY_UPGRADES['salvagers-instinct'].glyph,
      name: LEGACY_UPGRADES['salvagers-instinct'].name,
      value: triggered
        ? `예상 보급 +${supply.bonus}`
        : legacyRewardForecast.available
          ? '승리 조건 대기'
          : '보상 계산 대기',
      detail: triggered
        ? `기본 +${supply.total - supply.bonus} → +${supply.total}`
        : legacyRewardForecast.available
          ? '현재 계획은 후퇴 예상'
          : '대열·명령 완성 후 계산',
      state: triggered ? 'applied' : 'waiting',
    })
  }
  if (legacyRewardForecast.renown) {
    const renown = legacyRewardForecast.renown
    const triggered = legacyRewardForecast.available && renown.triggered
    legacyForecastEntries.push({
      id: 'chroniclers-ink',
      glyph: LEGACY_UPGRADES['chroniclers-ink'].glyph,
      name: LEGACY_UPGRADES['chroniclers-ink'].name,
      value: triggered
        ? `예상 명성 +${renown.bonus.toLocaleString('ko-KR')}`
        : legacyRewardForecast.available
          ? '승리 조건 대기'
          : '보상 계산 대기',
      detail: triggered
        ? `기본 +${(renown.total - renown.bonus).toLocaleString('ko-KR')} → +${renown.total.toLocaleString('ko-KR')}`
        : legacyRewardForecast.available
          ? '현재 계획은 명성 없음'
          : '대열·명령 완성 후 계산',
      state: triggered ? 'applied' : 'waiting',
    })
  }

  return (
    <div
      className="battle-action"
      data-risk={riskDepartureForecast ? 'true' : undefined}
      data-risk-armed={riskDepartureForecast?.armed ? 'true' : undefined}
    >
      <div className="battle-action-copy">
        <div className="battle-forecast" aria-live="polite" aria-atomic="true">
          <span className={`forecast-light ${forecastReady ? 'is-ready' : ''}`} aria-hidden="true" />
          <div>
            <strong>{forecastTitle}</strong>
            <small id="battle-forecast-detail">{forecastDetail}</small>
          </div>
        </div>
        <ol className="battle-lane-verdicts" id="battle-lane-forecast" aria-label="출전 직전 세 전선 판정">
          {laneForecasts.map((laneForecast, lane) => {
            const margin = laneForecast ? laneForecast.playerPower - laneForecast.enemyPower : null
            const state = laneForecast ? (laneForecast.won ? 'hold' : 'break') : 'empty'
            const relation = laneForecast
              ? laneForecast.relation === 'advantage'
                ? '상성 우세'
                : laneForecast.relation === 'disadvantage'
                  ? '상성 열세'
                  : '상성 대등'
              : '생존자 필요'
            const intent = laneForecast
              ? laneForecast.countered
                ? `${INTENT_META[laneForecast.intent].name} 파훼`
                : `${INTENT_META[laneForecast.intent].name} 노출`
              : '미배치'
            return (
              <li
                data-state={state}
                data-recommended={recommendedLane === lane ? 'true' : undefined}
                aria-label={`${lane + 1}전선, ${laneForecast ? (laneForecast.won ? '방어 예상' : '붕괴 위험') : '미배치'}${laneForecast ? `, 전투력 ${laneForecast.playerPower} 대 ${laneForecast.enemyPower}, ${relation}, ${intent}${recommendedLane === lane ? ', 참모 추천 수정 전선' : ''}` : ''}`}
                key={`battle-lane-verdict-${lane}`}
              >
                <span className="battle-lane-verdict-heading">
                  <b>0{lane + 1}</b>
                  {recommendedLane === lane ? <em>추천 수정</em> : null}
                </span>
                <strong>{laneForecast ? (laneForecast.won ? '방어 예상' : '붕괴 위험') : '전선 미배치'}</strong>
                <span className="battle-lane-verdict-power">
                  {laneForecast ? (
                    <>
                      <b>{laneForecast.playerPower}</b>
                      <i>/</i>
                      <span>{laneForecast.enemyPower}</span>
                      <em data-positive={margin !== null && margin >= 0 ? 'true' : 'false'}>
                        {margin !== null && margin > 0 ? '+' : ''}
                        {margin}
                      </em>
                    </>
                  ) : (
                    <span>—</span>
                  )}
                </span>
                <small>
                  {relation} · {intent}
                </small>
              </li>
            )
          })}
        </ol>
        {riskDepartureForecast ? (
          <aside
            className="risk-departure-forecast"
            id="risk-departure-forecast"
            data-armed={riskDepartureForecast.armed ? 'true' : 'false'}
            data-terminal={riskDepartureForecast.endsExpedition ? 'true' : undefined}
            aria-label="후퇴 위험과 귀환 자원 예측"
            aria-live="polite"
            aria-atomic="true"
          >
            <header>
              <span aria-hidden="true">!</span>
              <div>
                <small>
                  {riskDepartureForecast.endsExpedition ? 'LAST EMBER' : 'RETREAT RISK'} ·{' '}
                  {riskDepartureForecast.armed ? 'FINAL CONFIRMATION' : 'LOSS LEDGER'}
                </small>
                <strong>
                  {riskDepartureForecast.endsExpedition
                    ? riskDepartureForecast.armed
                      ? '다음 입력은 마지막 불씨를 끄고 원정을 종료합니다'
                      : '이 패배는 귀환 온기를 모두 소진합니다'
                    : riskDepartureForecast.armed
                      ? '동일한 계획으로 한 번 더 누르면 출전합니다'
                      : '패배 예상 출전은 두 번 확인합니다'}
                </strong>
                <p>{riskDepartureForecast.reason}</p>
              </div>
              <b>
                {riskDepartureForecast.endsExpedition
                  ? '원정 종료'
                  : riskDepartureForecast.armed
                    ? '두 번째 입력 대기'
                    : '첫 입력은 확인만'}
              </b>
            </header>
            <dl>
              <div>
                <dt>후퇴 보급</dt>
                <dd>
                  <span>{riskDepartureForecast.suppliesBefore}</span>
                  <i aria-hidden="true">›</i>
                  <strong>{riskDepartureForecast.suppliesAfter}</strong>
                  <small>+{riskDepartureForecast.supplyReward}</small>
                </dd>
              </div>
              <div>
                <dt>귀환 온기</dt>
                <dd>
                  <span>{riskDepartureForecast.heatBefore}%</span>
                  <i aria-hidden="true">›</i>
                  <strong>{riskDepartureForecast.heatAfter}%</strong>
                  <small>실제 귀환값</small>
                </dd>
              </div>
              <div>
                <dt>귀환 사기</dt>
                <dd>
                  <span>{riskDepartureForecast.moraleBefore}</span>
                  <i aria-hidden="true">›</i>
                  <strong>{riskDepartureForecast.moraleAfter}</strong>
                  <small>명성 보상 없음</small>
                </dd>
              </div>
            </dl>
            <footer>
              <span>
                {riskDepartureForecast.armed
                  ? '대열·명령·집중·자원을 바꾸면 이 확인은 무효가 됩니다.'
                  : '출전 버튼의 첫 입력은 전투를 시작하지 않고 손실 수치만 확인합니다.'}
              </span>
              {riskDepartureForecast.armed ? (
                <button type="button" onClick={onCancelRiskDeparture}>
                  위험 확인 취소
                </button>
              ) : null}
            </footer>
          </aside>
        ) : null}
        {legacyForecastEntries.length > 0 ? (
          <aside
            className="battle-legacy-forecast"
            id="battle-legacy-forecast"
            aria-label="계승 유산 전투 예측"
            aria-live="polite"
            aria-atomic="true"
          >
            <header>
              <span>INHERITED EFFECTS</span>
              <b>{legacyForecastEntries.filter((entry) => entry.state === 'applied').length} 실효 보정</b>
            </header>
            <ul>
              {legacyForecastEntries.map((entry) => (
                <li data-state={entry.state} key={entry.id}>
                  <b aria-hidden="true">{entry.glyph}</b>
                  <span>
                    <small>{entry.name}</small>
                    <strong>{entry.value}</strong>
                    <em>{entry.detail}</em>
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
        {masteryContractForecast ? (
          <aside
            className="battle-contract-forecast"
            id="battle-contract-forecast"
            data-state={masteryContractForecast.triggered ? 'applied' : 'waiting'}
            aria-label="영원 계약 전투 예측"
            aria-live="polite"
            aria-atomic="true"
          >
            <span aria-hidden="true">{MASTERY_CONTRACTS[masteryContractForecast.id].glyph}</span>
            <div>
              <small>ETERNAL COVENANT · {MASTERY_CONTRACTS[masteryContractForecast.id].name}</small>
              <strong>
                {masteryContractForecast.triggered
                  ? `계승 후 +${(masteryContractForecast.total - masteryContractForecast.bonus).toLocaleString(
                      'ko-KR',
                    )} → 실제 +${masteryContractForecast.total.toLocaleString('ko-KR')}`
                  : masteryContractForecast.available
                    ? '현재 계획은 승리 명성 없음'
                    : '대열·명령 완성 후 명성 계산'}
              </strong>
            </div>
            <b>
              {masteryContractForecast.triggered
                ? `+${masteryContractForecast.bonus.toLocaleString('ko-KR')} 기여`
                : MASTERY_CONTRACTS[masteryContractForecast.id].reward}
            </b>
          </aside>
        ) : null}
      </div>
      <button
        className="primary-action"
        type="button"
        disabled={actionDisabled}
        onClick={onStartBattle}
        data-risk={riskDepartureForecast ? 'true' : undefined}
        data-risk-armed={riskDepartureForecast?.armed ? 'true' : undefined}
        data-terminal={riskDepartureForecast?.endsExpedition ? 'true' : undefined}
        data-tutorial-highlight={tutorialBattle ? 'true' : 'false'}
        aria-describedby={`battle-forecast-detail battle-lane-forecast${riskDepartureForecast ? ' risk-departure-forecast' : ''}${legacyForecastEntries.length > 0 ? ' battle-legacy-forecast' : ''}${masteryContractForecast ? ' battle-contract-forecast' : ''}`}
      >
        <span>{actionLabel}</span>
        <i aria-hidden="true">›</i>
      </button>
    </div>
  )
}
