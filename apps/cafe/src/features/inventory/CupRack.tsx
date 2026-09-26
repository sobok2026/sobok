import clsx from 'clsx'
import { DRINK_SIZES, type DrinkSize, drinkSizeIds } from '../../content/drink-sizes'
import { Button } from '../../shared/ui/Button'
import { PanelNow, PanelRow, PanelSection, RowButton } from '../../shared/ui/PanelControls'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { currentTicket } from '../service/orders'
import {
  CUP_NAMES,
  CUP_STYLE_NAMES,
  type CupKind,
  cleanCupCount,
  cupKindFor,
  cupKinds,
  disposableCupKinds,
  isReusableCup,
} from './cups'
import { cupRestockAction } from './help'

const sizeLabel = (size: DrinkSize) => (size === 'single' ? '단일' : DRINK_SIZES[size].label)
const STYLE_ORDER = ['hot-mug', 'iced-glass', 'hot-paper', 'iced-plastic'] as const

/** The rack opens only when E cannot simply hand over the needed cup, so it leads with why and how to restock. */
export default function CupRack({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const ticket = currentTicket(state)
  const needed = ticket ? cupKindFor(ticket.recipe, ticket.service, ticket.size) : null
  const empty = disposableCupKinds.filter(
    (kind) => kind !== needed && !state.disposableCups[kind].bar && state.disposableCups[kind].reserve > 0,
  )

  return (
    <>
      {needed && !cleanCupCount(state, needed) && <NeededCup state={state} act={act} kind={needed} />}
      {empty.length > 0 && (
        <PanelSection title="비어 있는 일회용 컵">
          {empty.map((kind) => (
            <PanelRow key={kind} title={CUP_NAMES[kind]} note={`후방 ${state.disposableCups[kind].reserve}개`}>
              <RowButton onClick={() => act({ type: 'cups', kind })}>보충</RowButton>
            </PanelRow>
          ))}
        </PanelSection>
      )}
      <CupMatrix state={state} highlight={needed} />
    </>
  )
}

function NeededCup({ state, act, kind }: { state: GameState; act: (action: Action) => void; kind: CupKind }) {
  if (isReusableCup(kind)) {
    return <PanelNow blocked title={`${CUP_NAMES[kind]} 없음`} detail={cupRestockAction(state, kind)} />
  }
  const reserve = state.disposableCups[kind].reserve

  return (
    <PanelNow
      blocked
      title={`${CUP_NAMES[kind]} 없음`}
      detail={reserve ? `후방 재고 ${reserve}개` : '후방 재고가 없어 창고에서 입고해야 해요'}
    >
      {reserve > 0 && <Button onClick={() => act({ type: 'cups', kind })}>보관대 보충</Button>}
    </PanelNow>
  )
}

/** Four cup types by six sizes, so one glance shows what the rack holds without a twenty-row list. */
function CupMatrix({ state, highlight }: { state: GameState; highlight: CupKind | null }) {
  return (
    <table className="mt-1 w-full table-fixed text-center text-body tabular-nums" aria-label="보관대 컵 재고">
      <thead>
        <tr className="text-sm text-muted">
          <th className="w-28 py-1.5 text-left font-medium">보관대</th>
          {drinkSizeIds.map((size) => (
            <th key={size} className="py-1.5 font-medium">
              {sizeLabel(size)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {STYLE_ORDER.map((style) => (
          <tr key={style} className="border-t border-line">
            <th className="py-2.5 text-left font-medium">{CUP_STYLE_NAMES[style]}</th>
            {drinkSizeIds.map((size) => {
              const kind = `${style}-${size}` as CupKind
              if (!cupKinds.includes(kind)) {
                return (
                  <td key={size} className="text-control-line">
                    –
                  </td>
                )
              }

              return (
                <td
                  key={size}
                  className={clsx(
                    'rounded-md py-2.5',
                    'data-[highlight=true]:bg-brand/10 data-[highlight=true]:font-semibold',
                    'data-[empty=true]:text-danger',
                  )}
                  data-highlight={kind === highlight}
                  data-empty={!cleanCupCount(state, kind)}
                >
                  {cleanCupCount(state, kind)}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
