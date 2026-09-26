import clsx from 'clsx'
import type { StationId } from '../content/stations'
import { STATIONS } from '../content/stations'
import CleaningHud from '../features/cleaning/CleaningHud'
import ColdBrewHud from '../features/cold-brew/ColdBrewHud'
import CraftingHud from '../features/crafting/CraftingHud'
import { carriedBatch } from '../features/inventory/batches'
import { cupCount } from '../features/inventory/cups'
import PreparationHud from '../features/preparation/PreparationHud'
import { washDestination } from '../features/washing/rules'
import WashingHud from '../features/washing/WashingHud'
import type { Action } from '../simulation/actions'
import { objective } from '../simulation/guidance'
import type { GameState } from '../simulation/state'
import type { GuideSide } from '../world/scene'
import OrderRail from './OrderRail'
import { stationPrompt } from './session/station-prompt'

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
          <ReticlePrompt state={state} target={target} needsStaffAccess={needsStaffAccess} openPanel={openPanel} />
        </>
      )}
      {!panel && !focusedWork && guideSide && goal.station && <EdgeGuide side={guideSide} station={goal.station} />}
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
  needsStaffAccess,
  openPanel,
}: {
  state: GameState
  target: StationId | null
  needsStaffAccess: boolean
  openPanel: (station: StationId) => void
}) {
  const pill = clsx(
    'absolute top-1/2 left-1/2 z-6 -translate-x-1/2 translate-y-7',
    'flex items-center gap-3 rounded-full border border-white/60 bg-surface/95 shadow-hud whitespace-nowrap',
  )

  if (needsStaffAccess) {
    return (
      <p className={clsx(pill, 'px-4 py-2.5 text-body')}>
        직원 통로에서만 이용 <span className="text-muted">POS 옆 출입구</span>
      </p>
    )
  }

  if (!target) {
    return null
  }
  const prompt = stationPrompt(state, target)

  if ('status' in prompt) {
    return (
      <p className={clsx(pill, 'px-5 py-2.5 text-body')}>
        <span className="font-semibold">{STATIONS[target].name}</span>
        <span className="text-muted">{prompt.status}</span>
      </p>
    )
  }

  return (
    <button type="button" className={clsx(pill, 'py-2 pr-5 pl-2 text-left')} onClick={() => openPanel(target)}>
      <kbd className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-on-brand">
        E
      </kbd>
      <span className="text-lg font-semibold">{prompt.verb}</span>
      <span className="text-body text-muted">{prompt.object}</span>
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
