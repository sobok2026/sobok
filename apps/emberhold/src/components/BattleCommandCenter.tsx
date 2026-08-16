import type { BattleOrder, EnemyIntent } from './game-model'
import { INTENT_META, ORDER_META } from './game-model'

const BATTLE_LANES = [0, 1, 2] as const
const BATTLE_ORDERS = Object.keys(ORDER_META) as BattleOrder[]

type TacticalRehearsalView = {
  state: string
  glyph: string
  kicker: string
  title: string
  description: string
  status: string
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
  doctrineCommandRelief: number
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
  actionLabel: string
  actionDisabled: boolean
  tutorialBattle: boolean
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
  doctrineCommandRelief,
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
  | 'doctrineCommandRelief'
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
          aria-label="참모의 단일 전술 모의"
          aria-live="polite"
        >
          <span aria-hidden="true">{tacticalRehearsal.glyph}</span>
          <div>
            <small>{tacticalRehearsal.kicker}</small>
            <strong>{tacticalRehearsal.title}</strong>
            <p>{tacticalRehearsal.description}</p>
          </div>
          <div className="tactical-rehearsal-action">
            <b>{tacticalRehearsal.status}</b>
            {tacticalAdjustmentAvailable ? (
              <button
                type="button"
                onClick={onApplyTacticalAdjustment}
                aria-keyshortcuts="A"
                title="추천된 명령 또는 집중 변경 한 가지만 적용"
              >
                <span>한 단계 적용</span>
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
  actionLabel,
  actionDisabled,
  tutorialBattle,
  onStartBattle,
}: BattleLaunchProps) {
  return (
    <div className="battle-action">
      <div className="battle-forecast" aria-live="polite" aria-atomic="true">
        <span className={`forecast-light ${forecastReady ? 'is-ready' : ''}`} aria-hidden="true" />
        <div>
          <strong>{forecastTitle}</strong>
          <small id="battle-forecast-detail">{forecastDetail}</small>
        </div>
      </div>
      <button
        className="primary-action"
        type="button"
        disabled={actionDisabled}
        onClick={onStartBattle}
        data-tutorial-highlight={tutorialBattle ? 'true' : 'false'}
        aria-describedby="battle-forecast-detail"
      >
        <span>{actionLabel}</span>
        <i aria-hidden="true">›</i>
      </button>
    </div>
  )
}
