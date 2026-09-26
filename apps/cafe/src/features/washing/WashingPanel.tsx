import { PanelRow, PanelSection, RowButton } from '../../shared/ui/PanelControls'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { cupKindFor } from '../inventory/cups'
import { currentTicket } from '../service/orders'
import { washQueue } from './rules'

/** Opens only when there is more than one thing to wash or collect; a single choice starts with E instead. */
export default function WashingPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const ticket = currentTicket(state)
  const queue = washQueue(state, ticket ? cupKindFor(ticket.recipe, ticket.service, ticket.size) : null)

  return (
    <PanelSection title="씻거나 가져갈 용기">
      {queue.map(({ group, name, dirty, washed, dirtyItem, washedItem }) => (
        <PanelRow
          key={group}
          title={name}
          note={[dirty ? `세척 대기 ${dirty}개` : '', washed ? `씻은 것 ${washed}개` : ''].filter(Boolean).join(' · ')}
        >
          {washedItem && <RowButton onClick={() => act({ type: 'take-washed', item: washedItem })}>집기</RowButton>}
          {dirtyItem && (
            <RowButton primary onClick={() => act({ type: 'wash', item: dirtyItem })}>
              세척
            </RowButton>
          )}
        </PanelRow>
      ))}
    </PanelSection>
  )
}
