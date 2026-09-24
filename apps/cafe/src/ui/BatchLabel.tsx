import { formatAmount, INGREDIENTS } from '../game/catalog'
import { batchDate, PREPARATIONS } from '../game/preparation'
import type { Batch } from '../game/state'
import type { Action } from '../game/store'
import { Button, TextButton } from './Button'

export default function BatchLabel({
  batch,
  time,
  act,
}: {
  batch: Batch
  time: number
  act: (action: Action) => void
}) {
  const definition = INGREDIENTS[batch.ingredient]
  const expired = batch.expiresAt !== null && batch.expiresAt <= time
  const pending = batch.location !== 'bar'
  const marking =
    batch.ingredient === 'foam' || batch.ingredient === 'mocha'
      ? PREPARATIONS[batch.ingredient].marking
      : '개봉일 · 품질 기한'
  return (
    <details className="group/label my-2.5 text-xs" data-expired={expired} open={pending || expired}>
      <summary className="cursor-pointer py-2 text-[#56734f] group-data-[expired=true]/label:text-[#aa593c]">
        <span>
          {formatAmount(batch.amount)}
          {definition.unit}
        </span>
        <b className="ml-2.5 text-xs font-medium">
          {expired ? '기한 경과' : !batch.labelled ? '라벨 필요' : pending ? '보관 대기' : '사용 가능'}
        </b>
      </summary>
      <div className="border border-l-3 border-[#cdd4c0] border-l-[#648361] bg-[#fffdf6] p-3">
        <span className="mb-1.5 block text-xs font-semibold tracking-[0.19em] text-muted">{marking}</span>
        <strong className="block text-label font-semibold text-[#35533e]">{definition.name}</strong>
        <dl className="mt-3 mb-0 grid gap-1.5 tabular-nums">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{definition.prepared ? '제조' : '개봉'}</dt>
            <dd className="text-[#45613f]">{batchDate(batch.openedAt)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">품질 기한</dt>
            <dd className="text-[#45613f]">{batchDate(batch.expiresAt)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">보관</dt>
            <dd className="text-[#45613f]">{definition.storage === 'fridge' ? '냉장' : '실온'}</dd>
          </div>
        </dl>
      </div>
      {!expired && !batch.labelled ? (
        <Button size="compact" className="mt-2" onClick={() => act({ type: 'label-batch', id: batch.id })}>
          날짜 확인 · 라벨 붙이기
        </Button>
      ) : null}
      {!expired && pending && batch.labelled ? (
        <fieldset className="mt-2.5 grid min-w-0 grid-cols-2 gap-2 border-0 p-0" aria-label="보관 위치 선택">
          <button
            className="rounded-[0.1875rem] border border-[#bbcbb0] bg-[#eaf0de] px-1.25 py-2.5 text-xs text-[#416039] enabled:hover:bg-[#d6e5c9]"
            type="button"
            onClick={() => act({ type: 'store-batch', id: batch.id, storage: 'fridge' })}
          >
            냉장고에 보관
          </button>
          <button
            className="rounded-[0.1875rem] border border-[#bbcbb0] bg-[#eaf0de] px-1.25 py-2.5 text-xs text-[#416039] enabled:hover:bg-[#d6e5c9]"
            type="button"
            onClick={() => act({ type: 'store-batch', id: batch.id, storage: 'room' })}
          >
            실온 선반에 보관
          </button>
        </fieldset>
      ) : null}
      {expired || pending ? (
        <TextButton danger className="mt-1.5" onClick={() => act({ type: 'discard-batch', id: batch.id })}>
          이 배치 폐기
        </TextButton>
      ) : null}
    </details>
  )
}
