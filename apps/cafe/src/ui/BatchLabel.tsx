import { formatAmount, INGREDIENTS } from '../game/catalog'
import { batchDate, PREPARATIONS } from '../game/preparation'
import type { Batch } from '../game/state'
import type { Action } from '../game/store'

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
    <details className={`quality-label ${expired ? 'expired' : ''}`} open={pending || expired}>
      <summary>
        <span>
          {formatAmount(batch.amount)}
          {definition.unit}
        </span>
        <b>{expired ? '기한 경과' : !batch.labelled ? '라벨 필요' : pending ? '보관 대기' : '사용 가능'}</b>
      </summary>
      <div className="label-paper">
        <span className="eyebrow">{marking}</span>
        <strong>{definition.name}</strong>
        <dl>
          <div>
            <dt>{definition.prepared ? '제조' : '개봉'}</dt>
            <dd>{batchDate(batch.openedAt)}</dd>
          </div>
          <div>
            <dt>품질 기한</dt>
            <dd>{batchDate(batch.expiresAt)}</dd>
          </div>
          <div>
            <dt>보관</dt>
            <dd>{definition.storage === 'fridge' ? '냉장' : '실온'}</dd>
          </div>
        </dl>
      </div>
      {!expired && !batch.labelled ? (
        <button type="button" className="secondary-button" onClick={() => act({ type: 'label-batch', id: batch.id })}>
          날짜 확인 · 라벨 붙이기
        </button>
      ) : null}
      {!expired && pending && batch.labelled ? (
        <fieldset className="storage-choices" aria-label="보관 위치 선택">
          <button type="button" onClick={() => act({ type: 'store-batch', id: batch.id, storage: 'fridge' })}>
            냉장고에 보관
          </button>
          <button type="button" onClick={() => act({ type: 'store-batch', id: batch.id, storage: 'room' })}>
            실온 선반에 보관
          </button>
        </fieldset>
      ) : null}
      {expired || pending ? (
        <button
          type="button"
          className="text-button danger"
          onClick={() => act({ type: 'discard-batch', id: batch.id })}
        >
          이 배치 폐기
        </button>
      ) : null}
    </details>
  )
}
