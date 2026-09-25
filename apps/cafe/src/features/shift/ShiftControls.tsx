import { money } from '../../shared/format'
import { Button } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { closingTasks } from './rules'
export default function ShiftControls({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const closing = closingTasks(state)
  return (
    <details className="mt-6 border-t border-line pt-4 text-sm" open={state.phase !== 'open'}>
      <summary className="mb-3 cursor-pointer text-muted">영업 관리</summary>
      <div className="mb-4.25 flex justify-between text-xs text-muted">
        <span>오늘 판매</span>
        <strong className="text-sm text-[#50694a]">{money(state.totals.revenue)}</strong>
      </div>
      {state.phase === 'open' ? (
        <Button variant="secondary" onClick={() => act({ type: 'close' })}>
          주문 접수 마감
        </Button>
      ) : (
        <>
          <p className="mb-2.25 block text-xs text-muted">마감 체크</p>
          {closing.length ? (
            <ul className="my-4 list-disc pl-4.25 text-xs leading-[2.1] text-muted">
              {closing.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-xs text-[#638259]">마감 준비 완료</p>
          )}
          <Button disabled={closing.length > 0} onClick={() => act({ type: 'finish' })}>
            결산하기
          </Button>
        </>
      )}
    </details>
  )
}
