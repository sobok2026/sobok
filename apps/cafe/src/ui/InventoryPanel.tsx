import {
  type Costs,
  formatAmount,
  INGREDIENTS,
  type IngredientId,
  ingredientIds,
  money,
  RECIPES,
  recipeLabel,
} from '../game/catalog'
import { operationFor } from '../game/crafting'
import { PREPARATIONS, type PreparationId } from '../game/preparation'
import type { GameState } from '../game/state'
import { type Action, available } from '../game/store'
import BatchLabel from './BatchLabel'
import { Button } from './Button'
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
    state.ticket ??
    (state.phase === 'open' && state.customer && !state.customer.visit && state.customer.stage !== 'leaving'
      ? state.request
      : null)
  if (recipe) {
    const cup = state.cup?.craft.fault ? null : state.cup
    const stepIndex = cup?.step ?? 0
    for (let index = stepIndex; index < RECIPES[recipe].steps.length; index++) {
      if (cup && index === stepIndex && state.jobs.some((job) => job.cupId === cup.id)) continue
      const operation = cup && index === stepIndex ? operationFor(cup.recipe, cup.step, cup.craft) : null
      const remaining = operation ? Math.max(0, 1 - cup!.craft.progress / operation.target) : 1
      for (const [id, amount] of Object.entries(RECIPES[recipe].steps[index].costs))
        add(id as IngredientId, amount * remaining)
    }
  }
  for (const id of ['foam', 'mocha'] as PreparationId[]) {
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
      {recipe || state.preparation ? (
        <div className="mt-3 mb-4.5 rounded-lg border border-control-line bg-control p-4">
          <strong className="text-body">{recipe ? recipeLabel(recipe) : '진행 중인 부재료 준비'}</strong>
          <p className="my-2 text-sm">
            {shortages.length
              ? `사용 가능한 재료가 부족해요 · ${shortages.length}개 품목`
              : '남은 작업에 필요한 재료가 준비됐어요.'}
          </p>
          {state.cup?.craft.fault ? (
            <small className="text-xs leading-[1.7] text-muted">현재 컵을 폐기하고 다시 만들 때 필요한 양이에요.</small>
          ) : (
            <small className="text-xs leading-[1.7] text-muted">
              남은 제조 단계와 필요한 부재료 한 배치 기준이에요.
            </small>
          )}
        </div>
      ) : null}
      <div className="grid">
        {inventory.map(
          ({ id, definition, batches, sealed, amount, pending, expired, unopened, needed, shortage, priority }) => (
            <details className="group/inventory border-b border-line" key={id} open={priority < 3}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 after:text-lg after:text-muted after:content-['+'] group-open/inventory:after:content-['−'] [&::-webkit-details-marker]:hidden">
                <span className="flex-1 text-sm font-medium">
                  {definition.name}
                  <small
                    className="mt-1.25 block text-xs font-normal text-muted data-[attention=true]:text-danger"
                    data-attention={priority < 3}
                  >
                    {definition.storage === 'fridge' ? '냉장' : '실온'} ·{' '}
                    {shortage > 0.0001
                      ? '현재 작업에 부족'
                      : expired
                        ? '만료 재료 있음'
                        : pending
                          ? '라벨·보관 필요'
                          : amount > 0
                            ? '사용 가능'
                            : definition.prepared
                              ? '준비 필요'
                              : '보충 필요'}
                  </small>
                </span>
                <strong className="text-base font-medium tabular-nums">
                  {formatAmount(amount)}
                  <small className="ml-1 text-xs font-normal">{definition.unit}</small>
                </strong>
              </summary>
              <div className="pb-4">
                <dl className="my-3.5 grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs text-muted">사용 가능</dt>
                    <dd className="mt-1.25 text-base tabular-nums">
                      {formatAmount(amount)}
                      {definition.unit}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">미개봉 · {sealed.length}팩</dt>
                    <dd className="mt-1.25 text-base tabular-nums">
                      {formatAmount(unopened)}
                      {definition.unit}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">라벨·보관 대기</dt>
                    <dd className="mt-1.25 text-base tabular-nums">
                      {formatAmount(pending)}
                      {definition.unit}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">만료</dt>
                    <dd className="mt-1.25 text-base tabular-nums">
                      {formatAmount(expired)}
                      {definition.unit}
                    </dd>
                  </div>
                </dl>
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
                {shortage > 0.0001 ? (
                  <p className="mb-4 text-xs leading-[1.7] text-muted">
                    {pending >= shortage
                      ? '대기 중인 배치의 라벨과 보관을 마치면 사용할 수 있어요.'
                      : sealed.length
                        ? '미개봉 원팩을 열고 라벨을 붙여 보관하세요.'
                        : id === 'coldBrew'
                          ? state.jobs.some((job) => job.kind === 'cold-brew')
                            ? '콜드 브루를 추출 중이에요. 추출이 끝나면 사용할 수 있어요.'
                            : '창고에서 추출 준비를 시작하세요. 20시간 뒤 사용할 수 있어요.'
                          : state.preparation?.recipe === id
                            ? state.preparation.fault
                              ? '현재 배합을 폐기한 뒤 준비대에서 다시 제조해주세요.'
                              : '준비 중인 배합을 마무리하고 라벨을 붙여 보관하세요.'
                            : definition.prepared
                              ? `준비대에서 제조해주세요 · ${definition.name}`
                              : '원팩을 입고한 뒤 개봉·라벨·보관을 진행하세요.'}
                  </p>
                ) : null}
                {batches
                  .filter((batch) => batch.openedAt !== null)
                  .map((batch) => (
                    <BatchLabel key={batch.id} batch={batch} time={state.time} act={act} />
                  ))}
                <div className="mt-3 grid gap-2">
                  {sealed.length ? (
                    <button
                      className="w-full rounded-[0.3125rem] border border-control-line bg-control px-3 py-2.5 text-sm text-brand"
                      type="button"
                      onClick={() => act({ type: 'open-batch', id: sealed[0].id })}
                    >
                      원팩 개봉 · {sealed.length}팩 대기
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
                      입고 · {money(definition.price)}
                    </button>
                  ) : (
                    <small className="text-xs text-muted">
                      {id === 'coldBrew' ? '창고에서 20시간 추출' : '준비대에서 제조'}
                    </small>
                  )}
                </div>
              </div>
            </details>
          ),
        )}
      </div>
      <Button variant="secondary" onClick={() => act({ type: 'cups' })}>
        컵 보충 · 후방 {state.reserveCups}개
      </Button>
      <Button
        variant="secondary"
        disabled={state.cash < 2000 || state.reserveCups >= 48}
        onClick={() => act({ type: 'buy-cups' })}
      >
        컵 24개 입고 · 2,000원
      </Button>
      <Button
        variant="secondary"
        disabled={state.cash < 9000 || state.jobs.some((job) => job.kind === 'cold-brew')}
        onClick={() => act({ type: 'cold-brew' })}
      >
        다음 날 콜드 브루 추출 · 20시간 · 9,000원
      </Button>
      <SupplyPanel state={state} act={act} location="stock" />
    </>
  )
}
