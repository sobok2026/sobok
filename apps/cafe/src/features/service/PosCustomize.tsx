import { useState } from 'react'
import {
  type Customizations,
  canOmit,
  countAmount,
  customizableQuantity,
  extraSyrups,
  milkChoices,
  noCustomizations,
} from '../../content/customizations'
import type { PlannedStep } from '../../content/recipe-plan'
import { recipeFor } from '../../content/recipes'
import type { OrderLine } from '../../simulation/state'
import { NumericPad, PosButton, PosDialog } from './PosControls'

type Input = { id: string; label: string; value: number; unit: 'shot' | 'pump'; extra?: keyof typeof extraSyrups }
const groups = { all: '전체', coffee: '커피', syrup: '시럽', milk: '우유', topping: '얼음 · 토핑' } as const
type Group = keyof typeof groups
const levelNames = { less: '적게', extra: '많이' } as const

function syrupLabel(custom: Customizations, id: keyof typeof extraSyrups) {
  const pumps = custom.syrups[id]
  if (pumps) return `${pumps}펌프`
  return custom.milk === '두유' && id === '바닐라-시럽' ? '무료' : '+800원'
}

function toppingLabel(custom: Customizations, stepId: string) {
  if (custom.omitted.includes(stepId)) return '없이'
  const level = custom.levels[stepId]
  return level ? levelNames[level] : '기본'
}

export function PosCustomize({
  onBack,
  line,
  disabled,
  onChange,
}: {
  onBack: () => void
  line: OrderLine | null
  disabled: boolean
  onChange: (custom: Customizations) => void
}) {
  const [group, setGroup] = useState<Group>('all')
  const [input, setInput] = useState<Input | null>(null)
  const [levelStep, setLevelStep] = useState<PlannedStep | null>(null)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const plan = line ? recipeFor(line.recipe, line.size, line.service).steps : []
  const custom = line?.customizations ?? noCustomizations()

  const change = (next: Customizations) => {
    if (!line) return
    try {
      recipeFor(line.recipe, line.size, line.service, next)
      onChange(next)
      setError('')
      setInput(null)
      setLevelStep(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : '선택을 확인해주세요.')
    }
  }

  const shown = (kind: Group) => group === 'all' || group === kind

  const open = (input: Input) => {
    setInput(input)
    setValue(String(input.value))
    setError('')
  }

  const confirm = () => {
    if (!input || !value || !Number.isFinite(Number(value))) return
    const amount = Number(value)

    if (
      amount > 9 ||
      amount < (input.unit === 'shot' ? 0.5 : 0) ||
      (input.unit === 'pump' && !Number.isInteger(amount))
    ) {
      setError(input.unit === 'shot' ? '0.5~9샷으로 입력해주세요.' : '0~9펌프로 입력해주세요.')
      return
    }

    if (input.extra) {
      const syrups = { ...custom.syrups }
      if (!amount) delete syrups[input.extra]
      else syrups[input.extra] = amount
      change({ ...custom, syrups })
    } else {
      const quantities = { ...custom.quantities }
      const base = countAmount(plan.find((step) => step.id === input.id)!)!.value
      if (amount === base) delete quantities[input.id]
      else quantities[input.id] = amount
      change({ ...custom, quantities })
    }
  }

  return (
    <div className="flex min-h-0 flex-1 gap-1.5">
      <nav className="flex w-25 shrink-0 flex-col gap-1" aria-label="커스텀 분류">
        <PosButton tone="active" className="min-h-14" onClick={onBack}>
          주문으로
          <br />
          돌아가기
        </PosButton>
        {(Object.entries(groups) as Array<[Group, string]>).map(([id, label]) => (
          <PosButton
            key={id}
            tone="soft"
            aria-pressed={group === id}
            onClick={() => setGroup(id)}
            className="min-h-16 flex-1"
          >
            {label}
          </PosButton>
        ))}
      </nav>
      <section
        className="flex min-h-0 min-w-0 flex-1 flex-col rounded-md bg-white p-3 text-pos-ink"
        aria-label="음료 커스텀"
      >
        <div className="mb-3 border-b border-pos-soft pb-3">
          <h2 className="font-semibold">{line ? '커스텀 선택' : '주문 항목을 먼저 선택하세요'}</h2>
        </div>
        <div className="grid content-start grid-cols-3 gap-2 overflow-y-auto xl:grid-cols-4">
          {shown('coffee') &&
          plan.some((step) => step.operation.action === 'espresso' && step.operation.method === 'regular')
            ? (['regular', 'decaf', 'half-decaf'] as const).map((coffee) => (
                <PosButton
                  key={coffee}
                  disabled={disabled}
                  aria-pressed={(custom.coffee ?? 'regular') === coffee}
                  className="min-h-22"
                  onClick={() => change({ ...custom, coffee: coffee === 'regular' ? null : coffee })}
                >
                  {{ regular: '일반 원두', decaf: '디카페인', 'half-decaf': '1/2 디카페인' }[coffee]}
                  <span className="mt-3 block text-xs">{coffee === 'regular' ? '기본' : '+300원'}</span>
                </PosButton>
              ))
            : null}
          {plan
            .filter(customizableQuantity)
            .filter((step) => shown(step.operation.action === 'espresso' ? 'coffee' : 'syrup'))
            .map((step) => {
              const amount = countAmount(step)!
              const selected = custom.quantities[step.id] ?? amount.value

              return (
                <PosButton
                  key={step.id}
                  disabled={disabled}
                  aria-pressed={custom.quantities[step.id] !== undefined}
                  className="min-h-22 text-left"
                  onClick={() =>
                    open({ id: step.id, label: step.label, value: selected, unit: amount.unit as 'shot' | 'pump' })
                  }
                >
                  {step.label}
                  <span className="mt-3 block text-right text-xs">
                    {selected}
                    {amount.unit === 'shot' ? '샷' : '펌프'} · 수량 변경
                  </span>
                </PosButton>
              )
            })}
          {shown('syrup') && plan.some((step) => 'into' in step.operation && step.operation.into === 'serving-cup')
            ? (Object.entries(extraSyrups) as Array<[keyof typeof extraSyrups, string]>)
                .filter(
                  ([id]) => !plan.some((step) => step.operation.action === 'add' && step.operation.materialId === id),
                )
                .map(([id, label]) => (
                  <PosButton
                    key={id}
                    disabled={disabled}
                    aria-pressed={!!custom.syrups[id]}
                    className="min-h-22 text-left"
                    onClick={() => open({ id, label, extra: id, value: custom.syrups[id] ?? 0, unit: 'pump' })}
                  >
                    {label}
                    <span className="mt-3 block text-right text-xs">{syrupLabel(custom, id)}</span>
                  </PosButton>
                ))
            : null}
          {shown('milk') && plan.some((step) => step.operation.action === 'add' && step.operation.materialId === 'milk')
            ? (Object.entries(milkChoices) as Array<[keyof typeof milkChoices, string]>).map(([id, label]) => (
                <PosButton
                  key={id}
                  disabled={disabled}
                  aria-pressed={(custom.milk ?? 'milk') === id}
                  className="min-h-22"
                  onClick={() => change({ ...custom, milk: id === 'milk' ? null : id })}
                >
                  {label}
                  <span className="mt-3 block text-xs">{id === '오트앤유' ? '+800원' : '무료'}</span>
                </PosButton>
              ))
            : null}
          {shown('topping')
            ? plan.filter(canOmit).map((step) => (
                <PosButton
                  key={step.id}
                  disabled={disabled}
                  aria-pressed={custom.omitted.includes(step.id) || !!custom.levels[step.id]}
                  className="min-h-22 text-left"
                  onClick={() => setLevelStep(step)}
                >
                  {step.label}
                  <span className="mt-3 block text-right text-xs">{toppingLabel(custom, step.id)}</span>
                </PosButton>
              ))
            : null}
        </div>
        {error && !input ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="mt-auto pt-4">
          <PosButton tone="dark" disabled={disabled || !line} onClick={() => change(noCustomizations())}>
            커스텀 초기화
          </PosButton>
        </div>
      </section>
      {levelStep ? (
        <PosDialog title={`${levelStep.label} 선택`} onClose={() => setLevelStep(null)}>
          <div className="grid grid-cols-4 gap-2">
            {(['none', 'less', 'normal', 'extra'] as const).map((level) => (
              <PosButton
                key={level}
                className="min-h-24 px-1"
                onClick={() => {
                  const levels = { ...custom.levels }
                  if (level === 'less' || level === 'extra') levels[levelStep.id] = level
                  else delete levels[levelStep.id]
                  const omitted = custom.omitted.filter((id) => id !== levelStep.id)
                  if (level === 'none') omitted.push(levelStep.id)
                  change({ ...custom, levels, omitted })
                }}
              >
                {{ none: '없음', less: '적게', normal: '보통', extra: '많이' }[level]}
                <span className="mt-3 block text-xs">0원</span>
              </PosButton>
            ))}
          </div>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </PosDialog>
      ) : null}
      {input ? (
        <PosDialog title={input.label} onClose={() => setInput(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              confirm()
            }}
          >
            <input
              aria-label="커스텀 수량"
              inputMode="decimal"
              autoFocus
              value={value}
              onChange={(event) => {
                if (/^\d{0,2}(\.5?)?$/.test(event.target.value)) setValue(event.target.value)
              }}
              className="mb-3 min-h-14 w-full rounded border-2 border-pos-active bg-[#fff2cb] px-4 text-xl tabular-nums"
            />
            <NumericPad value={value} onChange={setValue} onConfirm={confirm} decimal={input.unit === 'shot'} />
            {error ? (
              <p role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            ) : null}
          </form>
        </PosDialog>
      ) : null}
    </div>
  )
}
