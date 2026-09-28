import GameDialog from '../../shared/ui/GameDialog'
import type { GameState } from '../../simulation/state'
import OrderSticker from './OrderSticker'
import { orderSticker } from './order-sticker'
import { currentTicket } from './orders'

export default function OrderLabelDialog({ state, onClose }: { state: GameState; onClose: () => void }) {
  const line = currentTicket(state)
  if (!line) return null

  return (
    <GameDialog title="주문 라벨" onClose={onClose} wide scrollBody>
      <OrderSticker sticker={orderSticker(state, line)} />
    </GameDialog>
  )
}
