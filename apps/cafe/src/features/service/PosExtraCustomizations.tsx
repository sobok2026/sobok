import { useState } from 'react'
import {
  amountLevelNames,
  baseChipScoops,
  baseRoastPumps,
  blenderStep,
  chipModeNames,
  customizationRules,
  existingTopping,
  hasServingCup,
  toppingIds,
  toppingOptions,
} from '../../content/customization-options'
import type { Customizations } from '../../content/customizations'
import type { PlannedStep } from '../../content/recipe-plan'
import type { OrderLine } from '../../simulation/state'
import { NumericPad, PosButton, PosDialog } from './PosControls'

type Panel = 'roast' | 'chips' | 'milkAmount' | 'milkFoam' | 'milkTemperature' | (typeof toppingIds)[number]
type ChipMode = NonNullable<Customizations['javaChips']>['mode']
const milkOptions = {
  milkAmount: { label: '우유 양', choices: { default: '기본', less: '적게', extra: '많이' } },
  milkFoam: { label: '우유 거품', choices: { default: '기본', none: '없이', less: '적게', extra: '많이' } },
  milkTemperature: { label: '우유 온도', choices: { default: '레시피 기본', standard: '기본 온도', 'x-hot': 'X-Hot' } },
} as const
type MilkOption = keyof typeof milkOptions
const milkOptionIds = Object.keys(milkOptions) as MilkOption[]

function milkOptionLabel(id: MilkOption, custom: Customizations) {
  const labels: Record<string, string> = milkOptions[id].choices
  return labels[custom[id] ?? 'default']
}

function panelTitle(panel: Panel) {
  if (panel === 'roast') return '프라푸치노 로스트 수량'
  if (panel === 'chips') return '자바칩 선택'
  if (milkOptionIds.includes(panel as MilkOption)) return milkOptions[panel as MilkOption].label
  return `${toppingOptions[panel as (typeof toppingIds)[number]].name} 추가`
}

export function PosExtraCustomizations({
  line,
  plan,
  group,
  disabled,
  onApply,
}: {
  line: OrderLine
  plan: PlannedStep[]
  group: string
  disabled: boolean
  onApply: (custom: Customizations) => string | null
}) {
  const [panel, setPanel] = useState<Panel | null>(null)
  const [count, setCount] = useState('')
  const [mode, setMode] = useState<ChipMode>('blended')
  const [error, setError] = useState('')
  const custom = line.customizations
  const roast = baseRoastPumps(plan)
  const chips = baseChipScoops(plan)
  const blended = !!blenderStep(plan)
  const milk = plan.some((step) => step.operation.action === 'add' && step.operation.materialId === 'milk')
  const steam = plan.some((step) => step.operation.action === 'steam')
  const servingCup = hasServingCup(plan)
  const shown = (kind: string) => group === 'all' || group === kind

  const open = (next: Panel) => {
    setPanel(next)
    setError('')

    if (next === 'roast') {
      setCount(String(custom.roast ?? (roast || customizationRules.roastPumps[line.size])))
    }

    if (next === 'chips') {
      setCount(String(custom.javaChips?.scoops ?? (chips || customizationRules.chipScoops[line.size])))
      setMode(custom.javaChips?.mode ?? 'blended')
    }
  }

  const apply = (next: Customizations) => {
    const error = onApply(next)
    setError(error ?? '')
    if (!error) setPanel(null)
  }

  const confirm = () => {
    const amount = Number(count)

    if (!count || !Number.isInteger(amount) || amount < 0 || amount > 9) {
      setError('0~9 사이의 정수로 입력해주세요.')
      return
    }

    if (panel === 'roast') {
      apply({ ...custom, roast: amount === roast ? null : amount })
    }

    if (panel === 'chips') {
      const unchanged = amount === chips && (mode === 'blended' || amount === 0)
      apply({ ...custom, javaChips: unchanged ? null : { scoops: amount, mode } })
    }
  }

  return (
    <>
      {shown('coffee') && blended && (
        <PosButton
          disabled={disabled}
          aria-pressed={custom.roast !== null}
          className="min-h-22"
          onClick={() => open('roast')}
        >
          프라푸치노 로스트
          <span className="mt-3 block text-xs">{custom.roast ?? roast}펌프 · 수량 변경</span>
        </PosButton>
      )}
      {shown('java') && blended && servingCup && (
        <PosButton
          disabled={disabled}
          aria-pressed={!!custom.javaChips}
          className="min-h-22"
          onClick={() => open('chips')}
        >
          자바칩
          <span className="mt-3 block text-xs">
            {custom.javaChips?.scoops ?? chips}스쿱 · {chipModeNames[custom.javaChips?.mode ?? 'blended']}
          </span>
        </PosButton>
      )}
      {shown('milk') &&
        milkOptionIds
          .filter((id) => (id === 'milkAmount' ? milk : steam))
          .map((id) => (
            <PosButton
              key={id}
              disabled={disabled}
              aria-pressed={custom[id] !== null}
              className="min-h-22"
              onClick={() => open(id)}
            >
              {milkOptions[id].label}
              <span className="mt-3 block text-xs">{milkOptionLabel(id, custom)}</span>
            </PosButton>
          ))}
      {shown('topping') &&
        servingCup &&
        toppingIds
          .filter((id) => !existingTopping(plan, id))
          .map((id) => (
            <PosButton
              key={id}
              disabled={disabled}
              aria-pressed={!!custom.toppings[id]}
              className="min-h-22"
              onClick={() => open(id)}
            >
              {toppingOptions[id].name} 추가
              <span className="mt-3 block text-xs">
                {custom.toppings[id] ? amountLevelNames[custom.toppings[id]] : '선택'}
              </span>
            </PosButton>
          ))}
      {panel && (
        <PosDialog title={panelTitle(panel)} onClose={() => setPanel(null)}>
          {(panel === 'roast' || panel === 'chips') && (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                confirm()
              }}
            >
              <p className="mb-3 text-sm">
                {panel === 'roast' && `기본 ${roast}펌프 · 기본보다 늘리면 음료당 800원`}
                {panel === 'chips' &&
                  `기본 ${chips}스쿱 · ${chips ? '기본 포함 재료로 무료' : '새로 추가 시 음료당 800원'}`}
              </p>
              {panel === 'chips' && (
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {(Object.entries(chipModeNames) as Array<[ChipMode, string]>).map(([id, label]) => (
                    <PosButton key={id} aria-pressed={mode === id} onClick={() => setMode(id)}>
                      {label}
                    </PosButton>
                  ))}
                </div>
              )}
              <input
                aria-label={panel === 'roast' ? '로스트 펌프 수' : '자바칩 스쿱 수'}
                inputMode="numeric"
                value={count}
                onChange={(event) => {
                  if (/^\d{0,1}$/.test(event.target.value)) setCount(event.target.value)
                }}
                className="mb-3 min-h-14 w-full rounded border-2 border-pos-active bg-amber-100 px-4 text-xl"
              />
              <NumericPad value={count} onChange={setCount} onConfirm={confirm} maxLength={1} />
            </form>
          )}
          {milkOptionIds.includes(panel as MilkOption) && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(milkOptions[panel as MilkOption].choices).map(([id, label]) => (
                <PosButton
                  key={id}
                  className="min-h-20"
                  onClick={() => apply({ ...custom, [panel]: id === 'default' ? null : id })}
                >
                  {label}
                  <span className="mt-2 block text-xs">0원</span>
                </PosButton>
              ))}
            </div>
          )}
          {toppingIds.includes(panel as (typeof toppingIds)[number]) && (
            <div className="grid grid-cols-2 gap-2">
              {(['none', 'less', 'normal', 'extra'] as const).map((level) => {
                const id = panel as (typeof toppingIds)[number]
                const included = plan.some(
                  (step) =>
                    step.operation.action === 'add' && step.operation.materialId === toppingOptions[id].materialId,
                )

                return (
                  <PosButton
                    key={level}
                    className="min-h-20"
                    onClick={() => {
                      const toppings = { ...custom.toppings }
                      if (level === 'none') delete toppings[id]
                      else toppings[id] = level
                      apply({ ...custom, toppings })
                    }}
                  >
                    {level === 'none' ? '추가 안 함' : amountLevelNames[level]}
                    <span className="mt-2 block text-xs">{level === 'none' || included ? '0원' : '+800원'}</span>
                  </PosButton>
                )
              })}
            </div>
          )}
          {error && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {error}
            </p>
          )}
        </PosDialog>
      )}
    </>
  )
}
