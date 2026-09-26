import { useState } from 'react'
import { formatAmount, money } from '../../shared/format'
import { InventoryButton, TextButton } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { COLD_BREW_HOURS } from '../cold-brew/rules'
import BatchLabel from './BatchLabel'
import CupInventory from './CupInventory'
import SupplyPanel from './SupplyPanel'
import { inventorySummary } from './summary'

type InventoryFilter = 'focus' | 'work' | 'all'
const searchName = (value: string) => value.toLocaleLowerCase('ko-KR').replace(/\s+/g, '')
function inventoryPriority(item: ReturnType<typeof inventorySummary>[number]) {
  if (item.needed > 0.0001) return item.shortage > 0.0001 ? 0 : 1
  if (item.expired > 0) return 2
  if (item.pending > 0) return 3
  return item.batches.length ? 4 : 5
}

export default function InventoryPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<InventoryFilter>('focus')
  const inventory = inventorySummary(state)
  const shortages = inventory.filter((item) => item.shortage > 0.0001)
  const needed = inventory.filter((item) => item.needed > 0.0001)
  const focused = inventory.filter((item) => item.needed > 0.0001 || item.batches.length > 0)
  const choices: { id: InventoryFilter; label: string; count: number }[] = [
    { id: 'focus', label: '필요·보유 재고', count: focused.length },
    { id: 'work', label: '현재 작업', count: needed.length },
    { id: 'all', label: '전체 품목', count: inventory.length },
  ]
  const needle = searchName(query)
  const filtered = (filter === 'focus' ? focused : filter === 'work' ? needed : inventory)
    .filter((item) => searchName(item.definition.name).includes(needle))
    .sort(
      (a, b) =>
        inventoryPriority(a) - inventoryPriority(b) || a.definition.name.localeCompare(b.definition.name, 'ko-KR'),
    )
  return (
    <>
      {shortages.length ? (
        <p className="mb-4 text-xs text-danger" role="status">
          현재 작업에 부족한 재료 {shortages.length}종
        </p>
      ) : null}
      <label className="mb-2 block text-xs text-muted" htmlFor="inventory-search">
        재료명 검색
      </label>
      <input
        id="inventory-search"
        type="search"
        className="mb-3 w-full rounded-xl border border-control-line bg-control px-3 py-2.5 text-sm text-ink"
        value={query}
        placeholder="재료 이름 검색"
        onChange={(event) => setQuery(event.target.value)}
      />
      <fieldset className="mb-3 flex flex-wrap gap-2" aria-label="재고 표시 범위">
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            aria-pressed={filter === choice.id}
            className={[
              'min-h-10 rounded-xl border border-control-line bg-control px-3 py-2 text-xs text-ink',
              'aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-on-brand',
            ].join(' ')}
            onClick={() => setFilter(choice.id)}
          >
            {choice.label} · {choice.count}
          </button>
        ))}
      </fieldset>
      <p className="mb-3 text-xs text-muted" role="status">
        {filtered.length}종 표시 · 현재 작업 재료와 보유 재고 우선
      </p>
      <div className="flex justify-between border-b border-line pb-2 text-xs text-muted">
        <span>재료</span>
        <span>사용 가능</span>
      </div>
      <div className="grid">
        {filtered.map(
          ({ id, definition, batches, sealed, amount, pending, expired, unopened, needed, shortage, priority }) => (
            <details className="group/inventory border-b border-line" key={id}>
              <summary
                className={[
                  'flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 after:text-lg',
                  "after:text-muted after:content-['+'] group-open/inventory:after:content-['−']",
                  '[&::-webkit-details-marker]:hidden',
                ].join(' ')}
              >
                <span className="flex-1 text-sm font-medium">
                  {definition.name}
                  {needed > 0.0001 || priority < 3 || amount === 0 ? (
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
                            : needed > 0.0001
                              ? '현재 작업에 필요'
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
                    className={[
                      'mb-4 rounded-md bg-[#e9eee1] px-3 py-2.5 text-label leading-[1.6] text-brand',
                      'data-[shortage=true]:bg-[#f4e6d4] data-[shortage=true]:text-[#805430]',
                    ].join(' ')}
                    data-shortage={shortage > 0.0001}
                  >
                    남은 작업에 예상 {formatAmount(needed)}
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
      {!filtered.length ? (
        <div className="py-5 text-sm text-muted">
          <p>
            {needle
              ? '검색한 이름의 재료가 이 범위에 없어요.'
              : filter === 'work'
                ? '현재 작업에 필요한 재료가 없어요.'
                : '필요하거나 보유 중인 재료가 없어요.'}
          </p>
          {query ? <TextButton onClick={() => setQuery('')}>검색어 지우기</TextButton> : null}
          {filter !== 'all' ? (
            <TextButton className="ml-3" onClick={() => setFilter('all')}>
              전체 품목 보기
            </TextButton>
          ) : null}
        </div>
      ) : null}
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
