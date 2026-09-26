import clsx from 'clsx'
import { INGREDIENTS } from '../../content/ingredients'
import { expiryAt } from '../../content/lifetime'
import { STATIONS, type StationId } from '../../content/stations'
import { batchDate, formatAmount } from '../../shared/format'
import { Button, TextButton } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import type { Batch } from '../../simulation/state'
import { batchDestination, batchOrigin } from './batches'

const STORAGES = [
  { storage: 'fridge', label: '냉장고에 보관' },
  { storage: 'room', label: '실온 선반에 보관' },
] as const

export default function BatchLabel({
  batch,
  time,
  act,
  station,
}: {
  batch: Batch
  time: number
  act: (action: Action) => void
  station: StationId
}) {
  const definition = INGREDIENTS[batch.ingredient]
  const expired = batch.expiresAt !== null && batch.expiresAt <= time
  const pending = batch.location !== 'bar'
  const atOrigin =
    batch.location === 'stock'
      ? station === 'stock'
      : batch.location === batchOrigin(batch) && station === batchOrigin(batch)
  const canDiscard = atOrigin || (batch.location === 'bar' && (station === 'stock' || station === 'shelf'))
  const usualExpiry = batch.openedAt === null ? null : expiryAt(batch.openedAt, definition.lifetime)
  const limitedByIngredient =
    !!definition.prepared && batch.expiresAt !== null && usualExpiry !== null && batch.expiresAt < usualExpiry

  return (
    <details className="group/label my-1 text-xs" data-expired={expired} open={pending || expired}>
      <summary className="cursor-pointer py-1.5 text-[#56734f] group-data-[expired=true]/label:text-[#aa593c]">
        <span>
          {formatAmount(batch.amount)}
          {definition.unit}
        </span>
        <b className="ml-2.5 text-xs font-medium">{batchStatus(batch, expired, pending)}</b>
      </summary>
      <div className="border border-l-3 border-[#cdd4c0] border-l-[#648361] bg-[#fffdf6] p-2.5">
        <strong className="block text-label font-semibold text-[#35533e]">{definition.name}</strong>
        <dl className="mt-2 mb-0 grid gap-1 tabular-nums">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{definition.prepared ? '제조' : '개봉'}</dt>
            <dd className="text-[#45613f]">{batchDate(batch.openedAt)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">만료 시각</dt>
            <dd className="text-[#45613f]">{batchDate(batch.expiresAt, true)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">보관</dt>
            <dd className="text-[#45613f]">{definition.storage === 'fridge' ? '냉장' : '실온'}</dd>
          </div>
        </dl>
        {limitedByIngredient && <p className="mt-2 text-xs text-muted">원재료 기한 적용</p>}
      </div>
      {!expired && !batch.labelled && atOrigin && (
        <Button size="compact" className="mt-1" onClick={() => act({ type: 'label-batch', id: batch.id, station })}>
          라벨 붙이기
        </Button>
      )}
      {!expired && pending && batch.labelled && definition.prepared && atOrigin && (
        <Button size="compact" className="mt-1" onClick={() => act({ type: 'take-batch', id: batch.id, station })}>
          E · 용기 집기 → {STATIONS[batchDestination(batch)].name}
        </Button>
      )}
      {pending && definition.prepared && !atOrigin && (
        <p className="mt-2 text-xs text-muted">
          {batch.location === 'hand'
            ? '용기를 운반 중이에요.'
            : `${STATIONS[batchOrigin(batch)].name}에 있는 용기를 확인하세요.`}
        </p>
      )}
      {!expired && pending && batch.labelled && !definition.prepared && atOrigin && (
        <fieldset className="mt-2.5 grid min-w-0 grid-cols-2 gap-2 border-0 p-0" aria-label="보관 위치 선택">
          {STORAGES.map(({ storage, label }) => (
            <button
              key={storage}
              className={clsx(
                'rounded-[0.1875rem] border border-[#bbcbb0] bg-[#eaf0de] px-1.25 py-2.5 text-xs text-[#416039]',
                'enabled:hover:bg-[#d6e5c9]',
              )}
              type="button"
              onClick={() => act({ type: 'store-batch', id: batch.id, storage, station })}
            >
              {label}
            </button>
          ))}
        </fieldset>
      )}
      {(expired || pending) && canDiscard && (
        <TextButton danger className="mt-1.5" onClick={() => act({ type: 'discard-batch', id: batch.id, station })}>
          배치 폐기
        </TextButton>
      )}
    </details>
  )
}

function batchStatus(batch: Batch, expired: boolean, pending: boolean) {
  if (expired) {
    return '기한 경과'
  }
  if (!batch.labelled) {
    return '라벨 필요'
  }
  return pending ? '보관 대기' : '사용 가능'
}
