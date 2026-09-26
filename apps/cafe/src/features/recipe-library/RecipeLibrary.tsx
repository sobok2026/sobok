import clsx from 'clsx'
import { useId, useState } from 'react'
import { recipeCatalog } from '../../content/catalog'
import { amountLabel, conditionLabel } from '../../content/recipe-plan'
import type { CatalogSize, RecipeOperation, RecipeVariant } from '../../content/recipe-schema'
import { selectedAmount } from '../../content/recipe-schema'

const documents = [...recipeCatalog.recipes.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
const kindNames = { drink: '음료', preparation: '부재료', procedure: '작업 절차' }
const sizeNames = { short: 'Short', tall: 'Tall', grande: 'Grande', venti: 'Venti', trenta: 'Trenta' }
const searchText = (text: string) => text.normalize('NFKC').replace(/\s/g, '').toLocaleLowerCase('ko')

function secondsLabel(seconds: number) {
  if (seconds % 3600 === 0) return `${seconds / 3600}시간`
  if (seconds % 60 === 0) return `${seconds / 60}분`
  return `${seconds}초`
}

function details(operation: RecipeOperation, size?: CatalogSize) {
  const text: string[] = []
  if ('materialId' in operation && operation.materialId)
    text.push(recipeCatalog.materials.get(operation.materialId)!.name)

  if ('amount' in operation && operation.amount) {
    const amount =
      operation.amount.kind === 'by-size' ? size && selectedAmount(operation.amount, size) : operation.amount
    if (amount) text.push(amountLabel(amount))
  }

  if ('toolId' in operation && operation.toolId) text.push(recipeCatalog.equipment.get(operation.toolId)!.name)
  if ('toolIds' in operation && operation.toolIds)
    text.push(...operation.toolIds.map((id) => recipeCatalog.equipment.get(id)!.name))

  if (operation.action === 'run-machine') {
    text.push(recipeCatalog.equipment.get(operation.equipmentId)!.name)
    const program = typeof operation.program === 'string' ? operation.program : size && operation.program[size]
    if (program) text.push(`프로그램 ${program}`)
    text.push(
      (typeof operation.cycles === 'number' ? operation.cycles : `${operation.cycles.min}–${operation.cycles.max}`) +
        '회',
    )
  }

  if ('duration' in operation && operation.duration) {
    const duration = operation.duration
    if ('seconds' in duration) {
      const seconds = duration.seconds
      text.push((duration.approximate ? '약 ' : '') + secondsLabel(seconds) + (duration.atLeast ? ' 이상' : ''))
    } else text.push(`${duration.minSeconds}–${duration.maxSeconds}초`)
  }

  if (operation.when) text.unshift(conditionLabel(operation.when))
  return text.join(' · ')
}

function VariantDetail({ variant }: { variant: RecipeVariant }) {
  const [size, setSize] = useState<CatalogSize | undefined>(variant.sizes[0])
  const selectId = useId()

  return (
    <div className="mt-4">
      {variant.sizes.length ? (
        <div className="mb-4 flex items-center gap-3">
          <label htmlFor={selectId} className="text-xs text-muted">
            사이즈
          </label>
          <select
            id={selectId}
            value={size}
            onChange={(event) => setSize(event.target.value as CatalogSize)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-xs"
          >
            {variant.sizes.map((value) => (
              <option key={value} value={value}>
                {sizeNames[value]}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {variant.review.length ? (
        <div className="mb-4 rounded-lg border border-line p-3 text-xs text-danger">
          <p className="font-medium">제조표 확인 필요</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {variant.review.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <ol className="space-y-5">
        {variant.steps.map((step, index) => (
          <li key={step.id}>
            <p className="font-medium">
              {index + 1}. {step.label}
            </p>
            {step.when ? <p className="mt-1 text-xs text-brand">{conditionLabel(step.when)}</p> : null}
            {step.instructions.map((text) => (
              <p key={text} className="mt-1 text-xs leading-relaxed">
                {text}
              </p>
            ))}
            {step.operations.map((operation, operationIndex) => {
              const label = details(operation, size)

              return label ? (
                <p key={operationIndex} className="mt-1 text-xs text-brand">
                  {label}
                </p>
              ) : null
            })}
            {step.notes.map((text) => (
              <p key={text} className="mt-1 text-xs text-muted">
                {text}
              </p>
            ))}
            {step.alternatives?.map((alternative) => (
              <details key={alternative.label} className="mt-2 text-xs">
                <summary>{alternative.label}</summary>
                {alternative.operations.map((operation, operationIndex) => (
                  <p key={operationIndex} className="mt-1 text-muted">
                    {details(operation, size)}
                  </p>
                ))}
              </details>
            ))}
          </li>
        ))}
      </ol>
      {variant.output ? (
        <p className="mt-5 text-xs text-brand">
          완성: {recipeCatalog.materials.get(variant.output.materialId)!.name} ·{' '}
          {variant.output.amount ? amountLabel(variant.output.amount) : variant.output.description}
        </p>
      ) : null}
      {variant.notes.map((text) => (
        <p key={text} className="mt-3 text-xs text-muted">
          {text}
        </p>
      ))}
    </div>
  )
}

export default function RecipeLibrary() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const searchId = useId()
  const categoryId = useId()

  const matches = documents.filter(
    (recipe) => (category === 'all' || category === recipe.kind) && searchText(recipe.name).includes(searchText(query)),
  )
  const selected = selectedId && matches.find((recipe) => recipe.id === selectedId)

  return (
    <details className="border-t border-line py-4">
      <summary className="font-medium">전체 제조법 · {documents.length}개</summary>
      <p className="mt-3 text-xs text-muted">
        음료와 부재료 제조법을 찾아보세요. 현재 매장에서 제공하지 않는 메뉴도 포함되어 있어요.
      </p>
      <div className="mt-4 grid gap-3">
        <label htmlFor={searchId} className="text-xs text-muted">
          제조법 이름 검색
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="예: 말차, 콜드 브루"
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-3">
          <label htmlFor={categoryId} className="text-xs text-muted">
            분류
          </label>
          <select
            id={categoryId}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-xs"
          >
            <option value="all">전체</option>
            {Object.entries(kindNames).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted" role="status">
            {matches.length}개
          </p>
        </div>
      </div>
      {matches.length ? (
        <div className="mt-3 max-h-52 overflow-y-auto rounded-lg border border-line">
          {matches.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              aria-pressed={selectedId === recipe.id}
              onClick={() => setSelectedId(recipe.id)}
              className={clsx(
                'block w-full border-b border-line px-3 py-2 text-left text-xs',
                'last:border-0 hover:bg-control aria-pressed:bg-control',
              )}
            >
              {recipe.name} <span className="ml-2 text-muted">{kindNames[recipe.kind]}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted">검색 결과가 없어요.</p>
      )}
      {selected ? (
        <section key={selected.id} className="mt-5" aria-label={selected.name}>
          <h3 className="font-semibold">{selected.name}</h3>
          {selected.variants.map((variant) => (
            <details key={variant.id} className="mt-3 border-t border-line pt-3" open={selected.variants.length === 1}>
              <summary className="text-sm font-medium">{variant.name}</summary>
              <VariantDetail variant={variant} />
            </details>
          ))}
        </section>
      ) : null}
    </details>
  )
}
