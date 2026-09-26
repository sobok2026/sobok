import clsx from 'clsx'
import { useId, useState } from 'react'
import { INGREDIENTS } from '../../content/ingredients'
import { recipeFor } from '../../content/recipes'
import { formatAmount } from '../../shared/format'
import { Button } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import { cupHandsBusy } from '../../simulation/hands'
import type { GameState, OrderLine } from '../../simulation/state'
import { available } from '../inventory/inventory'
import { currentTicket } from '../service/orders'
import { PreparationInstructions } from './Guide'
import { PREPARATIONS, preparationForMaterial, preparationIds, unavailablePreparations } from './rules'

const choices = preparationIds.map((id) => PREPARATIONS[id]).sort((a, b) => a.name.localeCompare(b.name, 'ko'))

function orderPreparationMaterials(ticket: OrderLine | null) {
  const needed = new Set<string>()
  if (!ticket) return needed
  const visited = new Set<string>()

  const visit = (materialId: string) => {
    if (visited.has(materialId)) return
    visited.add(materialId)
    const definition = preparationForMaterial(materialId)
    if (!definition) return
    needed.add(materialId)
    for (const step of definition.steps) for (const input of Object.keys(step.costs)) visit(input)
  }

  for (const step of recipeFor(ticket.recipe, ticket.size, ticket.service, ticket.customizations).steps)
    for (const materialId of Object.keys(step.costs)) visit(materialId)

  return needed
}

export default function PreparationPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const searchId = useId()
  const [query, setQuery] = useState('')
  const [selection, setSelection] = useState<string | null>(null)

  const search = query.trim().toLocaleLowerCase('ko')
  const needed = orderPreparationMaterials(currentTicket(state))
  const options = choices
    .filter((item) =>
      `${item.name} ${INGREDIENTS[item.output.materialId].name}`.toLocaleLowerCase('ko').includes(search),
    )
    .sort((a, b) => Number(needed.has(b.output.materialId)) - Number(needed.has(a.output.materialId)))
  const selected = options.find((item) => item.id === selection) ?? options[0]
  const unavailable = unavailablePreparations.filter((item) => item.name.toLocaleLowerCase('ko').includes(search))
  const busy =
    !!state.preparation || state.cup?.craft.location === 'prep' || state.jobs.some((job) => job.station === 'prep')
  const handsFull = cupHandsBusy(state.cup)

  return (
    <div>
      <label htmlFor={searchId} className="mb-2 block text-xs font-medium text-muted">
        부재료·제조법 검색
      </label>
      <input
        id={searchId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="준비할 재료 이름"
        className="mb-3 min-h-11 w-full rounded-lg border border-control-line bg-control px-3 text-sm text-ink"
      />
      {currentTicket(state) ? <p className="mb-3 text-xs text-muted">현재 주문에 필요한 부재료부터 표시해요.</p> : null}
      <fieldset className="max-h-64 min-w-0 space-y-2 overflow-y-auto border-0 p-0 pr-1">
        <legend className="sr-only">준비할 제조법</legend>
        {options.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected?.id === item.id}
            onClick={() => setSelection(item.id)}
            className={clsx(
              'w-full rounded-lg border border-control-line bg-control px-3 py-2.5 text-left text-sm',
              'aria-pressed:border-brand aria-pressed:bg-brand/10',
            )}
          >
            <span className="block font-medium">{item.name}</span>
            <span className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-muted">
              <span>
                사용 가능 {formatAmount(available(state, item.output.materialId))}
                {INGREDIENTS[item.output.materialId].unit}
              </span>
              {needed.has(item.output.materialId) ? <span className="text-brand">현재 주문</span> : null}
            </span>
          </button>
        ))}
      </fieldset>
      {!options.length ? <p className="py-4 text-sm text-muted">검색한 이름의 준비 가능한 제조법이 없어요.</p> : null}
      {selected ? (
        <section className="mt-4 border-t border-line pt-4" aria-label="선택한 부재료 제조법">
          <h3 className="text-sm font-semibold">{selected.name}</h3>
          <p className="mt-1 text-xs text-muted">
            {INGREDIENTS[selected.output.materialId].name} · {selected.steps.length}단계
          </p>
          <Button
            variant="secondary"
            disabled={busy || handsFull}
            aria-label={`${selected.name} 준비 시작`}
            onClick={() => act({ type: 'start-preparation', recipe: selected.id })}
          >
            준비 시작
          </Button>
          {busy ? <p className="mt-2 text-xs text-muted">진행 중인 배합의 보관 또는 정리를 먼저 마쳐주세요.</p> : null}
          {!busy && handsFull ? <p className="mt-2 text-xs text-muted">음료 컵과 도구를 먼저 내려놓아주세요.</p> : null}
          <PreparationInstructions definition={selected} />
        </section>
      ) : null}
      {unavailable.length ? (
        <details className="mt-4 border-t border-line py-4 text-xs text-muted">
          <summary>확인이 필요한 제조법 {unavailable.length}개</summary>
          <ul className="mt-3 space-y-3">
            {unavailable.map((item) => (
              <li key={item.id}>
                <strong className="font-medium">{item.name}</strong>
                <p className="mt-1 leading-relaxed">{item.reason}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}
