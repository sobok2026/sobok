import clsx from 'clsx'
import type { StationId } from '../content/stations'
import { isCupSurface, STATIONS } from '../content/stations'
import CleaningPanel from '../features/cleaning/CleaningPanel'
import ColdBrewPanel from '../features/cold-brew/ColdBrewPanel'
import CraftingPanel, { CupManagement } from '../features/crafting/CraftingPanel'
import CupRack from '../features/inventory/CupRack'
import InventoryPanel from '../features/inventory/InventoryPanel'
import ShelfPanel from '../features/inventory/ShelfPanel'
import SupplyPanel from '../features/inventory/SupplyPanel'
import PreparationPanel from '../features/preparation/PreparationPanel'
import PosPanel, { PickupPanel } from '../features/service/PosPanel'
import WashingPanel, { ToolRack } from '../features/washing/WashingPanel'
import type { Action } from '../simulation/actions'
import type { GameState } from '../simulation/state'

export default function StationPanel({
  state,
  panel,
  act,
  closePanel,
}: {
  state: GameState
  panel: StationId | null
  act: (action: Action) => void
  closePanel: (lock?: boolean) => void
}) {
  if (!panel) {
    return null
  }
  if (panel === 'pos') {
    return (
      <PosPanel
        key={state.customer?.id ?? 'empty-pos'}
        state={state}
        act={act}
        onClose={() => closePanel()}
        onEscape={() => closePanel(false)}
      />
    )
  }
  const actionJob = state.jobs.find((job) => job.station === panel)

  return (
    <div className="pointer-events-none absolute inset-0 z-8 bg-[linear-gradient(90deg,#263c281f,transparent_70%)]">
      <section
        className={clsx(
          'pointer-events-auto absolute top-6 bottom-6 left-6',
          'w-90 [scrollbar-width:thin] [scrollbar-color:#c6cdb9_transparent] overflow-auto',
          'rounded-2xl border border-white/60 bg-surface p-6 shadow-panel',
          'compact:top-4 compact:p-5 max-wide:left-5',
          'max-tablet:top-4 max-tablet:bottom-4 max-tablet:left-3 max-tablet:max-w-[calc(100vw-1.5rem)]',
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="m-0 text-2xl font-medium tracking-tighter">{STATIONS[panel].name}</h2>
          </div>
          <button
            type="button"
            className={clsx(
              'pointer-events-auto grid size-10 shrink-0 place-items-center',
              'rounded-full border-0 border-line bg-transparent text-2xl text-muted',
            )}
            onClick={() => closePanel()}
            aria-label="작업대 닫기"
          >
            ×
          </button>
        </div>
        <div className="h-5" />
        {actionJob && (
          <div className="mb-5 flex flex-col gap-1.75 rounded-sm bg-control p-4.25 text-xs">
            <span>{actionJob.label}</span>
            <strong className="text-stat font-medium">{Math.ceil(actionJob.endsAt - state.time)}초 남음</strong>
          </div>
        )}
        {panel === 'cups' && <CupRack state={state} act={act} />}
        {['espresso', 'steam', 'brew', 'water', 'ice', 'sauce', 'mix', 'topping'].includes(panel) && (
          <CraftingPanel state={state} />
        )}
        {panel === 'pickup' && <PickupPanel state={state} act={act} />}
        {panel === 'prep' && <PreparationPanel state={state} act={act} />}
        {panel === 'cold-prep' && <ColdBrewPanel state={state} act={act} />}
        {panel === 'shelf' && <ShelfPanel state={state} act={act} />}
        {panel === 'wash' && <WashingPanel state={state} act={act} />}
        {panel === 'rack' && <ToolRack state={state} />}
        {(isCupSurface(panel) || panel === 'mix' || panel === 'trash') && (
          <CleaningPanel state={state} station={panel} act={act} />
        )}
        {panel === 'condiment' && <SupplyPanel state={state} act={act} location="bar" />}

        {panel === 'stock' && <InventoryPanel state={state} act={act} />}
        <CupManagement state={state} act={act} />
      </section>
    </div>
  )
}
