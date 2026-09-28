import clsx from 'clsx'
import { INGREDIENTS } from '../../content/ingredients'
import type { StationId } from '../../content/stations'
import type { Action } from '../../simulation/actions'
import type { Batch } from '../../simulation/state'

export default function BatchStorage({
  batch,
  station,
  act,
}: {
  batch: Batch
  station: StationId
  act: (action: Action) => void
}) {
  const lifetimes = INGREDIENTS[batch.ingredient].storageLifetimes
  if (!lifetimes) return null

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm text-muted">보관 방식</legend>
      <div className="flex gap-2">
        {(['room', 'fridge'] as const).map(
          (storage) =>
            lifetimes[storage] && (
              <button
                key={storage}
                type="button"
                aria-pressed={batch.storage === storage}
                className={clsx(
                  'rounded-lg border border-control-line bg-control px-3 py-2',
                  'aria-pressed:bg-brand aria-pressed:text-on-brand',
                )}
                onClick={() => act({ type: 'set-batch-storage', id: batch.id, station, storage })}
              >
                {storage === 'fridge' ? '냉장' : '실온'}
              </button>
            ),
        )}
      </div>
      <p className="text-sm text-muted">
        처음 제조한 시각을 기준으로 라벨을 다시 써요. 냉장 기한은 냉장고에 보관한 뒤에 적용돼요.
      </p>
    </fieldset>
  )
}
