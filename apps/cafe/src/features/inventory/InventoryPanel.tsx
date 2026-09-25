import { COLD_BREW_HOURS } from '../../content/references'
import { formatAmount, money } from '../../shared/format'
import { InventoryButton } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import BatchLabel from './BatchLabel'
import CupInventory from './CupInventory'
import SupplyPanel from './SupplyPanel'
import { inventorySummary } from './summary'

export default function InventoryPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const inventory = inventorySummary(state)
  const shortages = inventory.filter((item) => item.shortage > 0.0001)
  return (
    <>
      {shortages.length ? (
        <p className="mb-4 text-xs text-danger" role="status">
          현재 작업에 부족한 재료 {shortages.length}종
        </p>
      ) : null}
      <div className="flex justify-between border-b border-line pb-2 text-xs text-muted">
        <span>재료</span>
        <span>사용 가능</span>
      </div>
      <div className="grid">
        {inventory.map(
          ({ id, definition, batches, sealed, amount, pending, expired, unopened, needed, shortage, priority }) => (
            <details className="group/inventory border-b border-line" key={id}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 after:text-lg after:text-muted after:content-['+'] group-open/inventory:after:content-['−'] [&::-webkit-details-marker]:hidden">
                <span className="flex-1 text-sm font-medium">
                  {definition.name}
                  {priority < 3 || amount === 0 ? (
                    <small
                      className="mt-1.25 block text-xs font-normal text-muted data-[attention=true]:text-danger"
                      data-attention={priority < 3}
                    >
                      {shortage > 0.0001
                        ? '현재 작업에 부족'
                        : expired
                          ? '만료 재료 있음'
                          : pending
                            ? '라벨·보관 필요'
                            : amount > 0
                              ? ''
                              : '재고 없음'}
                    </small>
                  ) : null}
                </span>
                <strong className="text-base font-medium tabular-nums">
                  {formatAmount(amount)}
                  <small className="ml-1 text-xs font-normal">{definition.unit}</small>
                </strong>
              </summary>
              <div className="pb-4">
                {unopened > 0 || pending > 0 || expired > 0 ? (
                  <dl className="mb-3 space-y-2 text-xs text-muted">
                    {unopened > 0 ? (
                      <div className="flex justify-between">
                        <dt>미개봉 · {sealed.length}팩</dt>
                        <dd>
                          {formatAmount(unopened)}
                          {definition.unit}
                        </dd>
                      </div>
                    ) : null}
                    {pending > 0 ? (
                      <div className="flex justify-between">
                        <dt>라벨·보관 대기</dt>
                        <dd>
                          {formatAmount(pending)}
                          {definition.unit}
                        </dd>
                      </div>
                    ) : null}
                    {expired > 0 ? (
                      <div className="flex justify-between text-danger">
                        <dt>만료</dt>
                        <dd>
                          {formatAmount(expired)}
                          {definition.unit}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}
                {needed > 0 ? (
                  <p
                    className="mb-4 rounded-md bg-[#e9eee1] px-3 py-2.5 text-label leading-[1.6] text-brand data-[shortage=true]:bg-[#f4e6d4] data-[shortage=true]:text-[#805430]"
                    data-shortage={shortage > 0.0001}
                  >
                    남은 작업에 {formatAmount(needed)}
                    {definition.unit} 필요
                    {shortage > 0.0001 ? ` · ${formatAmount(shortage)}${definition.unit} 부족` : ''}
                  </p>
                ) : null}
                {shortage > 0.0001 && definition.prepared && pending < shortage ? (
                  <p className="mb-3 text-xs text-muted">
                    {id === 'coldBrew' ? `추출대에서 준비 · ${COLD_BREW_HOURS}시간` : '준비대에서 배합 필요'}
                  </p>
                ) : null}
                {batches
                  .filter((batch) => batch.openedAt !== null)
                  .map((batch) => (
                    <BatchLabel key={batch.id} batch={batch} time={state.time} act={act} station="stock" />
                  ))}
                <div className="mt-3 grid gap-2">
                  {sealed.length ? (
                    <InventoryButton onClick={() => act({ type: 'open-batch', id: sealed[0].id })}>
                      원팩 개봉
                    </InventoryButton>
                  ) : null}
                  {!definition.prepared ? (
                    <InventoryButton
                      disabled={
                        state.cash < definition.price ||
                        batches.filter((batch) => batch.location === 'stock').length >= 3
                      }
                      onClick={() => act({ type: 'buy', ingredient: id })}
                    >
                      원팩 입고 · {money(definition.price)}
                    </InventoryButton>
                  ) : null}
                </div>
              </div>
            </details>
          ),
        )}
      </div>
      <details className="mt-5 border-t border-line pt-4 text-sm">
        <summary>컵·소모품</summary>
        <div className="mt-4">
          <CupInventory state={state} act={act} purchasing />
          <SupplyPanel state={state} act={act} location="stock" />
        </div>
      </details>
    </>
  )
}
