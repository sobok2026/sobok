import {
  COLD_BREW_HOURS,
  type Costs,
  formatAmount,
  INGREDIENTS,
  type IngredientId,
  ingredientIds,
  money,
  RECIPES,
} from '../game/catalog'
import { operationFor } from '../game/crafting'
import { PREPARATIONS, preparationIds } from '../game/preparation'
import type { GameState } from '../game/state'
import { type Action, available } from '../game/store'
import BatchLabel from './BatchLabel'
import CupInventory from './CupInventory'
import SupplyPanel from './SupplyPanel'

export default function InventoryPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const items = ingredientIds.map((id) => {
    const batches = state.batches.filter((batch) => batch.ingredient === id && batch.amount > 0)
    const expired = batches.filter((batch) => batch.expiresAt !== null && batch.expiresAt <= state.time)
    const sealed = batches.filter((batch) => batch.openedAt === null && !expired.includes(batch))
    const pending = batches.filter(
      (batch) => !expired.includes(batch) && !sealed.includes(batch) && (!batch.labelled || batch.location !== 'bar'),
    )
    const sum = (values: typeof batches) => values.reduce((amount, batch) => amount + batch.amount, 0)
    return {
      id,
      definition: INGREDIENTS[id],
      batches,
      sealed,
      amount: available(state, id),
      pending: sum(pending),
      expired: sum(expired),
      unopened: sum(sealed),
    }
  })
  const required: Costs = {}
  const add = (id: IngredientId, amount: number) => {
    required[id] = (required[id] ?? 0) + Math.max(0, amount)
  }
  const recipe =
    state.cup?.recipe ??
    state.ticket?.recipe ??
    (state.phase === 'open' && state.customer && !state.customer.visit && state.customer.stage !== 'leaving'
      ? state.request
      : null)
  if (recipe) {
    const cup = state.cup?.craft.fault ? null : state.cup
    const stepIndex = cup?.step ?? 0
    for (let index = stepIndex; index < RECIPES[recipe].steps.length; index++) {
      if (cup && index === stepIndex && state.jobs.some((job) => job.cupId === cup.id)) continue
      const operation = cup && index === stepIndex ? operationFor(cup.recipe, cup.step, cup.craft) : null
      const remaining =
        operation && operation.kind !== 'shake' ? Math.max(0, 1 - cup!.craft.progress / operation.target) : 1
      for (const [id, amount] of Object.entries(RECIPES[recipe].steps[index].costs))
        add(id as IngredientId, amount * remaining)
    }
  }
  for (const id of preparationIds) {
    const stock = items.find((item) => item.id === id)!
    const prep = state.preparation?.recipe === id ? state.preparation : null
    const needsBatch = (required[id] ?? 0) > stock.amount + stock.pending + 0.0001
    if (prep?.stage === 'ready' || (prep && !prep.fault && prep.stage === 'processing')) continue
    if (!prep && !needsBatch) continue
    const steps = PREPARATIONS[id].steps
    for (let index = prep && !prep.fault ? prep.step : 0; index < steps.length; index++) {
      const step = steps[index]
      if (!step.ingredient) continue
      const remaining = step.target - (prep && !prep.fault && index === prep.step ? prep.progress : 0)
      add(step.ingredient, remaining * (step.perUnit ?? 1))
    }
  }
  const inventory = items
    .map((item) => {
      const needed = required[item.id] ?? 0
      const shortage = Math.max(0, needed - item.amount)
      return { ...item, needed, shortage, priority: shortage > 0.0001 ? 0 : item.expired ? 1 : item.pending ? 2 : 3 }
    })
    .sort((a, b) => a.priority - b.priority)
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
                    <button
                      className="w-full rounded-[0.3125rem] border border-control-line bg-control px-3 py-2.5 text-sm text-brand"
                      type="button"
                      onClick={() => act({ type: 'open-batch', id: sealed[0].id })}
                    >
                      원팩 개봉
                    </button>
                  ) : null}
                  {!definition.prepared ? (
                    <button
                      className="w-full rounded-[0.3125rem] border border-control-line bg-control px-3 py-2.5 text-sm text-brand"
                      type="button"
                      disabled={
                        state.cash < definition.price ||
                        batches.filter((batch) => batch.location === 'stock').length >= 3
                      }
                      onClick={() => act({ type: 'buy', ingredient: id })}
                    >
                      원팩 입고 · {money(definition.price)}
                    </button>
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
