import { DRINK_SIZES } from '../content/drink-sizes'
import { INGREDIENTS } from '../content/ingredients'
import { RECIPES } from '../content/recipes'
import type { StationId } from '../content/stations'
import { STATIONS } from '../content/stations'
import CleaningHud from '../features/cleaning/CleaningHud'
import ColdBrewHud from '../features/cold-brew/ColdBrewHud'
import CraftingHud from '../features/crafting/CraftingHud'
import { craftStations, nextStep } from '../features/crafting/rules'
import { batchDestination, batchOrigin, carriedBatch } from '../features/inventory/batches'
import { CUP_NAMES, cleanCupCount, cupCount, cupKindFor, SERVICE_NAMES } from '../features/inventory/cups'
import { SUPPLIES } from '../features/inventory/supplies'
import PreparationHud from '../features/preparation/PreparationHud'
import { currentTicket, itemCustomizations } from '../features/service/orders'
import { WASH_NAMES, washDestination } from '../features/washing/rules'
import WashingHud from '../features/washing/WashingHud'
import type { Action } from '../simulation/actions'
import type { GameState } from '../simulation/state'

export default function PlayHud({
  state,
  panel,
  target,
  needsStaffAccess,
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
  const ticket = currentTicket(state)
  const step = nextStep(state)
  const canTakeOrder =
    !!state.customer &&
    !state.customer.visit &&
    state.customer.stage !== 'leaving' &&
    state.customer.stage === 'ordering'
  const heldBatch = carriedBatch(state)
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
  const carried = heldBatch
    ? {
        name: `${INGREDIENTS[heldBatch.ingredient].name} 용기`,
        destination:
          heldBatch.expiresAt !== null && heldBatch.expiresAt <= state.time
            ? batchOrigin(heldBatch)
            : batchDestination(heldBatch),
      }
    : state.supplyDelivery
      ? { name: SUPPLIES[state.supplyDelivery.supply].name, destination: 'condiment' as const }
      : cupCount(state.cleaning?.heldCups)
        ? { name: `사용한 컵 ${cupCount(state.cleaning?.heldCups)}개`, destination: 'wash' as const }
        : state.washing?.stage === 'carrying'
          ? { name: `씻은 ${WASH_NAMES[state.washing.item]}`, destination: washDestination(state.washing.item) }
          : state.cup?.craft.location === 'hand'
            ? { name: CUP_NAMES[state.cup.craft.kind], destination: step?.station ?? ('pickup' as const) }
            : null
  const selectedCupKind = ticket ? cupKindFor(ticket.recipe, ticket.service, ticket.size) : null
  const targetAction =
    cupCount(state.cleaning?.heldCups) && target === 'wash'
      ? '사용한 컵 내려놓기'
      : state.washing?.stage === 'carrying' && target === washDestination(state.washing.item)
        ? '씻은 용기 정리'
        : target === 'pos'
          ? state.phase === 'closing'
            ? '마감 관리'
            : canTakeOrder
              ? '주문 입력'
              : '주문 확인'
          : heldBatch
            ? target === batchOrigin(heldBatch)
              ? '용기 내려놓기'
              : '용기 보관'
            : state.supplyDelivery && target === 'condiment'
              ? '소모품 채우기'
              : state.supplyDelivery && target === 'stock'
                ? '보충품 내려놓기'
                : target === 'cups' && selectedCupKind && !state.cup
                  ? cleanCupCount(state, selectedCupKind) > 0
                    ? `${CUP_NAMES[selectedCupKind]} 집기`
                    : '컵 재고 확인'
                  : target && state.cup && craftStations.includes(target) && state.cup.craft.location === 'hand'
                    ? '컵 내려놓기'
                    : target === 'stock'
                      ? '재고 확인'
                      : '열기'

  const lastMessage = state.messages.at(-1)

  return (
    <>
      {!panel && ticket ? (
        <aside
          className={[
            'pointer-events-none absolute top-21 left-6 z-6 w-64 rounded-xl border border-white/60',
            'bg-surface/95 p-4 shadow-hud max-tablet:left-4 max-tablet:w-56',
          ].join(' ')}
          aria-label="현재 주문"
        >
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs text-muted">
            <span>주문 {String(state.orderNumber).padStart(3, '0')}</span>
            <span className="font-medium">
              {SERVICE_NAMES[ticket.service]} · {RECIPES[ticket.recipe].variant}
            </span>
          </div>
          <h2 className="text-base leading-snug font-semibold tracking-tight">
            {RECIPES[ticket.recipe].shortName}
            <span className="mt-1 block text-sm font-medium text-muted">{DRINK_SIZES[ticket.size].name}</span>
          </h2>
          <p className="mt-2 text-xs text-muted">
            전달 {state.sale?.lines.reduce((sum, line) => sum + line.served, 0)} /{' '}
            {state.sale?.lines.reduce((sum, line) => sum + line.quantity, 0)}잔
          </p>
          {ticket ? <p className="mt-1 text-xs text-muted">{itemCustomizations(ticket).join(' · ')}</p> : null}
        </aside>
      ) : null}
      {!panel && !focusedWork && (target || carried || needsStaffAccess) ? (
        <section
          className={[
            'absolute bottom-6 left-1/2 z-6 w-max max-w-[calc(100%-2rem)] -translate-x-1/2',
            'rounded-2xl border border-white/60 bg-surface/97 px-5 py-3.5 shadow-hud',
            'compact:bottom-4',
          ].join(' ')}
          aria-label="현재 행동"
        >
          {needsStaffAccess ? (
            <p className="text-sm">
              직원 통로에서 이용 가능 <span className="ml-3 text-xs text-muted">POS 옆 출입구</span>
            </p>
          ) : target &&
            (!heldBatch ||
              target === batchOrigin(heldBatch) ||
              target === batchDestination(heldBatch) ||
              target === 'pos') ? (
            <button type="button" className="flex items-center gap-4 text-left" onClick={() => openPanel(target)}>
              <div>
                <span className="mb-1 block text-xs text-muted">{STATIONS[target].name}</span>
                <span className="text-sm font-medium">{targetAction}</span>
              </div>
              <kbd className="ml-4 grid size-9 shrink-0 place-items-center rounded-lg bg-brand text-sm text-on-brand">
                E
              </kbd>
            </button>
          ) : carried ? (
            <p className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-muted">{carried.name}</span>
              <span aria-hidden="true">→</span>
              <span className="font-medium">{STATIONS[carried.destination].name}</span>
            </p>
          ) : null}
        </section>
      ) : null}
      {!panel ? (
        <div
          className={[
            'data-[focused=true]:border-1.5 pointer-events-none absolute top-1/2 left-1/2 size-1.25',
            '-translate-1/2 rounded-full border border-[#36472c55] bg-white/60',
            'data-[focused=true]:size-2.5 data-[focused=true]:border-[#fff7d9]',
            'data-[focused=true]:bg-transparent data-[focused=true]:shadow-[0_0_0_5px_#d0bc7730]',
          ].join(' ')}
          data-focused={!!target}
        />
      ) : null}
      {!panel && showCleaning ? <CleaningHud state={state} target={target} act={act} stop={stopUse} /> : null}
      {!panel && showWashing && !showCleaning ? (
        <WashingHud state={state} target={target} act={act} stop={stopUse} />
      ) : null}
      {!panel && showPreparation && !showWashing && !showCleaning ? (
        <PreparationHud state={state} target={target} act={act} stop={stopUse} />
      ) : null}
      {!panel && showColdBrew ? <ColdBrewHud state={state} act={act} stop={stopUse} /> : null}
      {!panel && showCrafting && !showPreparation && !showWashing && !showCleaning ? (
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
      ) : null}
      {lastMessage?.tone === 'error' && lastMessage.id !== dismissedMessageId ? (
        <div
          className={[
            'absolute top-21 left-1/2 z-15 flex w-max max-w-[min(28.75rem,calc(100%-3rem))]',
            '-translate-x-1/2 animate-appear items-center gap-2.5 rounded-lg border',
            'border-[#d1d8c8] bg-surface py-2.5 pr-3 pl-4 text-sm leading-[1.6] text-ink',
            'shadow-toast data-[tone=error]:border-[#d9b398] data-[tone=error]:bg-[#fff0e6]',
            'data-[tone=error]:text-[#88472e] motion-reduce:animate-none',
            'max-wide:max-w-[min(28.75rem,54vw)] max-tablet:max-w-[85vw]',
          ].join(' ')}
          data-tone={lastMessage.tone}
          role="status"
          aria-live="polite"
          key={lastMessage.id}
        >
          <span className="text-danger" aria-hidden="true">
            !
          </span>
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
      ) : null}
      {saveError ? (
        <div role="status">
          <button
            type="button"
            onClick={() => pause()}
            className={[
              'absolute right-6 bottom-6 z-10 max-w-64 rounded-xl border border-danger/30 bg-surface',
              'px-4 py-3 text-xs text-danger',
            ].join(' ')}
          >
            저장 실패 · 메뉴에서 백업
          </button>
        </div>
      ) : null}
    </>
  )
}
