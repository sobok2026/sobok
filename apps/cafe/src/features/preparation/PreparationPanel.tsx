import { formatAmount } from '../../shared/format'
import { Button } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { available } from '../inventory/inventory'
import { PREPARATIONS, preparationIds } from './rules'
export default function PreparationPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const actionJob = state.jobs.find((job) => job.station === 'prep')
  return (
    <div className="divide-y divide-line">
      {preparationIds.map((id) => (
        <div key={id} className="py-4 first:pt-0">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold">{PREPARATIONS[id].name}</h3>
            <span className="text-xs text-muted tabular-nums">{formatAmount(available(state, id))}ml</span>
          </div>
          <Button
            variant="secondary"
            disabled={!!actionJob}
            aria-label={`${PREPARATIONS[id].name} 준비 시작`}
            onClick={() => act({ type: 'start-preparation', recipe: id })}
          >
            준비 시작
          </Button>
        </div>
      ))}
    </div>
  )
}
