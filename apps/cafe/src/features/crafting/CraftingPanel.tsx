import { STATIONS } from '../../content/stations'
import { TextButton } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { isReusableCup } from '../inventory/cups'
export default function CraftingPanel({ state }: { state: GameState }) {
  return (
    <p className="py-4 text-sm text-muted">
      {state.cup
        ? `컵 위치 · ${state.cup.craft.location === 'hand' ? '손' : STATIONS[state.cup.craft.location].name}`
        : state.ticket
          ? '컵 보관대에서 컵 준비'
          : 'POS에서 주문 접수'}
    </p>
  )
}
export function CupManagement({ state, act }: { state: GameState; act: (action: Action) => void }) {
  return state.cup ? (
    <details className="mt-6 border-t border-line pt-4 text-sm">
      <summary className="mb-3 cursor-pointer text-muted">현재 컵 관리</summary>
      <TextButton danger onClick={() => act({ type: 'discard-cup' })}>
        {isReusableCup(state.cup.craft.kind) ? '내용물 비우고 컵을 세척 대기로' : '현재 컵 폐기하기'}
      </TextButton>
    </details>
  ) : null
}
