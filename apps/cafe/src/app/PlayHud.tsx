import clsx from 'clsx'
import { INGREDIENTS } from '../content/ingredients'
import type { StationId } from '../content/stations'
import { STATIONS } from '../content/stations'
import CleaningHud from '../features/cleaning/CleaningHud'
import ColdBrewHud from '../features/cold-brew/ColdBrewHud'
import CraftingHud from '../features/crafting/CraftingHud'
import { craftStations } from '../features/crafting/rules'
import { batchDestination, batchOrigin, carriedBatch } from '../features/inventory/batches'
import { CUP_NAMES, cleanCupCount, cupCount, cupKindFor } from '../features/inventory/cups'
import { SUPPLIES } from '../features/inventory/supplies'
import PreparationHud from '../features/preparation/PreparationHud'
import { currentTicket } from '../features/service/orders'
import { WASH_NAMES, washDestination } from '../features/washing/rules'
import WashingHud from '../features/washing/WashingHud'
import type { Action } from '../simulation/actions'
import { objective } from '../simulation/guidance'
import type { Batch, GameState } from '../simulation/state'
import type { GuideSide } from '../world/scene'
import OrderRail from './OrderRail'

export default function PlayHud({
  state,
  panel,
  target,
  needsStaffAccess,
  guideSide,
  dismissedMessageId,
  setDismissedMessageId,
  saveError,
  openPanel,
  act,
  use,
  stopUse,
  tool,
  confirm,
  moveCup,
  pause,
}: {
  state: GameState
  panel: StationId | null
  target: StationId | null
  needsStaffAccess: boolean
  guideSide: GuideSide
  dismissedMessageId: string | undefined
  setDismissedMessageId: (id: string | undefined) => void
  saveError: boolean
  openPanel: (station: StationId) => void
  act: (action: Action) => void
  use: (station: StationId) => void
  stopUse: () => void
  tool: (station: StationId) => void
  confirm: (station: StationId) => void
  moveCup: (station: StationId) => void
  pause: (mode?: 'pause' | 'overview') => void
}) {
  const goal = objective(state)
  const heldBatch = carriedBatch(state)
  const lastMessage = state.messages.at(-1)

  const showPreparation = !heldBatch && !!state.preparation && target === 'prep'
  const showColdBrew = !heldBatch && !!state.coldBrew && target === 'cold-prep'
  const showWashing =
    !heldBatch &&
    !cupCount(state.cleaning?.heldCups) &&
    !!state.washing &&
    (target === 'wash' || (target === washDestination(state.washing.item) && state.washing.stage === 'carrying'))
  const showCrafting =
    !heldBatch && !!state.cup && state.cup.craft.location !== 'hand' && target === state.cup.craft.location
  const showCleaning =
    !heldBatch &&
    !!state.cleaning &&
    (target === state.cleaning.station || (target === 'wash' && cupCount(state.cleaning.heldCups) > 0))
  const focusedWork = !panel && (showPreparation || showColdBrew || showWashing || showCrafting || showCleaning)

  return (
    <>
      {!panel && <OrderRail state={state} goal={goal} now={focusedWork && target === goal.station} />}
      {!panel && !focusedWork && (
        <>
          <div
            className={clsx(
              'pointer-events-none absolute top-1/2 left-1/2 size-1.25 -translate-1/2',
              'rounded-full border border-[#36472c55] bg-white/60',
              'data-[focused=true]:border-1.5 data-[focused=true]:size-2.5 data-[focused=true]:border-amber-100',
              'data-[focused=true]:bg-transparent data-[focused=true]:shadow-[0_0_0_5px_#d0bc7730]',
            )}
            data-focused={!!target}
          />
          <ReticlePrompt
            state={state}
            target={target}
            heldBatch={heldBatch}
            needsStaffAccess={needsStaffAccess}
            openPanel={openPanel}
          />
        </>
      )}
      {!panel && !focusedWork && guideSide && <EdgeGuide side={guideSide} station={goal.station} />}
      {!panel && showCleaning && <CleaningHud state={state} target={target} act={act} stop={stopUse} />}
      {!panel && showWashing && !showCleaning && <WashingHud state={state} target={target} act={act} stop={stopUse} />}
      {!panel && showPreparation && !showWashing && !showCleaning && (
        <PreparationHud state={state} target={target} act={act} stop={stopUse} />
      )}
      {!panel && showColdBrew && <ColdBrewHud state={state} act={act} stop={stopUse} />}
      {!panel && showCrafting && !showPreparation && !showWashing && !showCleaning && (
        <CraftingHud
          state={state}
          target={target}
          onUse={use}
          onStop={stopUse}
          onTool={tool}
          onConfirm={(station, observation) =>
            observation ? act({ type: 'confirm-craft', station, observation }) : confirm(station)
          }
          onMoveCup={moveCup}
          onDiscard={() => act({ type: 'discard-cup' })}
        />
      )}
      {lastMessage?.tone === 'error' && lastMessage.id !== dismissedMessageId && (
        <div
          className={clsx(
            'absolute top-1/2 left-1/2 z-15 -translate-x-1/2 translate-y-22',
            'flex w-max max-w-[min(30rem,calc(100%-3rem))] items-center gap-2.5',
            'rounded-xl border border-danger/30 bg-orange-100 py-2.5 pr-3 pl-4 shadow-toast',
            'animate-appear text-body leading-relaxed text-danger',
            'data-[pos=true]:top-6 data-[pos=true]:translate-y-0',
            'motion-reduce:animate-none max-tablet:max-w-[85vw]',
          )}
          data-pos={panel === 'pos'}
          role="status"
          aria-live="polite"
          key={lastMessage.id}
        >
          <span aria-hidden="true">!</span>
          {lastMessage.text}
          <button
            className="grid size-7 shrink-0 place-items-center border-0 bg-transparent text-xl text-inherit"
            type="button"
            aria-label="알림 닫기"
            onClick={() => setDismissedMessageId(lastMessage.id)}
          >
            ×
          </button>
        </div>
      )}
      {saveError && (
        <div role="status">
          <button
            type="button"
            onClick={() => pause()}
            className={clsx(
              'absolute right-6 bottom-6 z-10 max-w-64',
              'rounded-xl border border-danger/30 bg-surface px-4 py-3 text-sm text-danger',
            )}
          >
            저장 실패 · 메뉴에서 백업
          </button>
        </div>
      )}
    </>
  )
}

function ReticlePrompt({
  state,
  target,
  heldBatch,
  needsStaffAccess,
  openPanel,
}: {
  state: GameState
  target: StationId | null
  heldBatch: Batch | undefined
  needsStaffAccess: boolean
  openPanel: (station: StationId) => void
}) {
  const pill = clsx(
    'absolute top-1/2 left-1/2 z-6 -translate-x-1/2 translate-y-7',
    'flex items-center gap-3 rounded-full border border-white/60 bg-surface/95 shadow-hud',
  )

  if (needsStaffAccess) {
    return (
      <p className={clsx(pill, 'px-4 py-2.5 text-body')}>
        직원 통로에서만 이용 <span className="text-muted">POS 옆 출입구</span>
      </p>
    )
  }

  if (
    !target ||
    (heldBatch && target !== batchOrigin(heldBatch) && target !== batchDestination(heldBatch) && target !== 'pos')
  ) {
    return null
  }
  const { verb, object } = targetAction(state, target, heldBatch)

  return (
    <button type="button" className={clsx(pill, 'py-2 pr-5 pl-2 text-left')} onClick={() => openPanel(target)}>
      <kbd className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-on-brand">
        E
      </kbd>
      <span className="text-lg font-semibold whitespace-nowrap">{verb}</span>
      <span className="text-body whitespace-nowrap text-muted">{object}</span>
    </button>
  )
}

function EdgeGuide({ side, station }: { side: 'left' | 'right'; station: StationId }) {
  return (
    <div
      className={clsx(
        'pointer-events-none absolute top-1/2 z-6 flex -translate-y-1/2 items-center gap-2.5',
        'data-[side=left]:left-6 data-[side=right]:right-6 data-[side=right]:flex-row-reverse',
      )}
      data-side={side}
    >
      <span className="grid size-11 place-items-center rounded-full bg-focus text-ink shadow-hud">
        <svg className="size-5 data-[side=right]:rotate-180" data-side={side} viewBox="0 0 20 20" aria-hidden="true">
          <path d="m12.5 4-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
      <span className="rounded-full bg-surface/95 px-3.5 py-2 text-body font-semibold shadow-hud">
        {STATIONS[station].name}
      </span>
    </div>
  )
}

function targetAction(
  state: GameState,
  target: StationId,
  heldBatch: Batch | undefined,
): { verb: string; object: string } {
  const station = STATIONS[target].name
  const heldCups = cupCount(state.cleaning?.heldCups)
  if (heldCups && target === 'wash') {
    return { verb: '컵 내려놓기', object: `사용한 컵 ${heldCups}개` }
  }
  if (state.washing?.stage === 'carrying' && target === washDestination(state.washing.item)) {
    return { verb: '제자리에 놓기', object: `씻은 ${WASH_NAMES[state.washing.item]}` }
  }

  if (target === 'pos') {
    return { verb: posAction(state), object: station }
  }

  if (heldBatch) {
    return {
      verb: target === batchOrigin(heldBatch) ? '용기 내려놓기' : '용기 보관',
      object: INGREDIENTS[heldBatch.ingredient].name,
    }
  }
  if (state.supplyDelivery && target === 'condiment') {
    return { verb: '채우기', object: SUPPLIES[state.supplyDelivery.supply].name }
  }
  if (state.supplyDelivery && target === 'stock') {
    return { verb: '보충품 내려놓기', object: SUPPLIES[state.supplyDelivery.supply].name }
  }

  const ticket = currentTicket(state)

  if (target === 'cups' && ticket && !state.cup) {
    const kind = cupKindFor(ticket.recipe, ticket.service, ticket.size)
    return cleanCupCount(state, kind) > 0
      ? { verb: '컵 집기', object: CUP_NAMES[kind] }
      : { verb: '재고 확인', object: CUP_NAMES[kind] }
  }

  if (state.cup?.craft.location === 'hand' && craftStations.includes(target)) {
    return { verb: '컵 내려놓기', object: station }
  }
  return { verb: target === 'stock' ? '재고 확인' : '열기', object: station }
}

function posAction(state: GameState) {
  if (state.phase === 'closing') {
    return '마감 관리'
  }
  return state.customer?.stage === 'ordering' && !state.customer.visit ? '주문 입력' : '주문 확인'
}
