import clsx from 'clsx'
import { lazy, Suspense } from 'react'
import type { StationId } from '../content/stations'
import { STATIONS } from '../content/stations'
import ColdBrewPanel from '../features/cold-brew/ColdBrewPanel'
import FoodPanel from '../features/food/FoodPanel'
import IcePanel from '../features/ice/IcePanel'
import CupRack from '../features/inventory/CupRack'
import ShelfPanel from '../features/inventory/ShelfPanel'
import StoragePanel from '../features/inventory/StoragePanel'
import PreparationPanel from '../features/preparation/PreparationPanel'
import DishwasherPanel from '../features/washing/DishwasherPanel'
import WashingPanel from '../features/washing/WashingPanel'
import type { Action } from '../simulation/actions'
import { objective } from '../simulation/guidance'
import type { GameState } from '../simulation/state'
import type { ActiveInput } from '../simulation/work-context'

const PosPanel = lazy(() => import('../features/service/PosPanel'))
const DripPanel = lazy(() => import('../features/drip-coffee/DripPanel'))
const GrinderPanel = lazy(() => import('../features/grinder/GrinderPanel'))

export default function StationPanel({
  state,
  activeInput,
  panel,
  act,
  closePanel,
}: {
  state: GameState
  activeInput: ActiveInput
  panel: StationId | null
  act: (action: Action) => void
  closePanel: (lock?: boolean) => void
}) {
  if (!panel) {
    return null
  }
  if (panel === 'pos') {
    return (
      <Suspense
        fallback={
          <p className="absolute top-6 left-6 rounded-xl bg-surface p-5" role="status">
            POS를 불러오고 있어요.
          </p>
        }
      >
        <PosPanel
          key={state.customer?.id ?? 'empty-pos'}
          state={state}
          act={act}
          onClose={() => closePanel()}
          onEscape={() => closePanel(false)}
        />
      </Suspense>
    )
  }
  const goal = objective(state)

  return (
    <div className="pointer-events-none absolute inset-0 z-8 bg-[linear-gradient(90deg,#263c281f,transparent_60%)]">
      <section
        className={clsx(
          'pointer-events-auto absolute top-6 left-6 flex max-h-[calc(100%-3rem)] w-100 flex-col',
          'data-[wide=true]:w-144',
          'overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#c6cdb9_transparent]',
          'rounded-2xl border border-white/60 bg-surface p-6 shadow-panel',
          'compact:top-4 compact:max-h-[calc(100%-2rem)] compact:p-5',
          'max-tablet:left-3 max-tablet:max-w-[calc(100%-1.5rem)]',
          'touch:top-3 touch:left-3 touch:max-h-[calc(100%-1.5rem)] touch:max-w-[calc(100%-1.5rem)]',
        )}
        aria-label={STATIONS[panel].name}
        data-wide={panel === 'cups'}
      >
        <header className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">{STATIONS[panel].name}</h2>
          <button
            type="button"
            className="-mr-2 grid size-10 shrink-0 place-items-center rounded-full text-2xl text-muted touch:size-11"
            onClick={() => closePanel()}
            aria-label={`${STATIONS[panel].name} 닫기`}
          >
            ×
          </button>
        </header>
        {panel === 'cups' && <CupRack state={state} act={act} />}
        {panel === 'fridge' && (
          <>
            <details className="mb-5 border-b border-line pb-4">
              <summary className="mb-4 cursor-pointer font-semibold">푸드 냉장 재고 · 입고</summary>
              <FoodPanel state={state} act={act} place="stock" />
            </details>
            <StoragePanel key="fridge" state={state} act={act} goal={goal} place="fridge" />
          </>
        )}
        {panel === 'food-case' && <FoodPanel state={state} act={act} place="showcase" />}
        {(panel === 'food-oven' || panel === 'pickup') && <FoodPanel state={state} act={act} place={panel} />}
        {panel === 'stock' && <StoragePanel key="stock" state={state} act={act} goal={goal} place="stock" />}
        {panel === 'prep' && <PreparationPanel state={state} act={act} goal={goal} />}
        {panel === 'cold-prep' && <ColdBrewPanel state={state} act={act} />}
        {panel === 'grinder' && (
          <Suspense fallback={<p role="status">그라인더 작업을 불러오고 있어요.</p>}>
            <GrinderPanel state={state} activeInput={activeInput} act={act} />
          </Suspense>
        )}
        {panel === 'urn' && (
          <Suspense fallback={<p role="status">URN 작업을 불러오고 있어요.</p>}>
            <DripPanel state={state} activeInput={activeInput} act={act} />
          </Suspense>
        )}
        {panel === 'wash' && <WashingPanel state={state} act={act} />}
        {panel === 'drying' && <WashingPanel state={state} act={act} drying />}
        {panel === 'dishwasher' && <DishwasherPanel state={state} act={act} />}
        {(panel === 'ice-machine' || panel === 'ice') && <IcePanel state={state} act={act} bar={panel === 'ice'} />}
        {(panel === 'shelf' || panel === 'bar-fridge') && <ShelfPanel state={state} act={act} place={panel} />}
      </section>
    </div>
  )
}
