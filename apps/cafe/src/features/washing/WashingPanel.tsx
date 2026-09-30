import { recipeCup } from '../../content/recipes'
import { PanelRow, PanelSection, RowButton } from '../../shared/ui/PanelControls'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { currentTicket } from '../service/orders'
import { washQueue } from './rules'

export default function WashingPanel({
  state,
  act,
  drying = false,
}: {
  state: GameState
  act: (action: Action) => void
  drying?: boolean
}) {
  const ticket = currentTicket(state)
  const queue = washQueue(state, ticket ? recipeCup(ticket.recipe, ticket.size, ticket.service) : null)

  return (
    <PanelSection title={drying ? '바에 정리할 용기' : '씻거나 가져갈 용기'}>
      {queue
        .filter((row) => !drying || row.washed > 0)
        .map(({ group, name, dirty, washed, dirtyItem, washedItem }) => (
          <PanelRow
            key={group}
            title={name}
            note={[dirty ? `세척 대기 ${dirty}개` : '', washed ? `씻은 것 ${washed}개` : '']
              .filter(Boolean)
              .join(' · ')}
          >
            {washedItem && <RowButton onClick={() => act({ type: 'take-washed', item: washedItem })}>집기</RowButton>}
            {!drying && dirtyItem && (
              <RowButton primary onClick={() => act({ type: 'wash', item: dirtyItem })}>
                세척
              </RowButton>
            )}
          </PanelRow>
        ))}
    </PanelSection>
  )
}
