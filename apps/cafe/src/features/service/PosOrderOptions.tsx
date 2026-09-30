import { useState } from 'react'
import { noCustomizations } from '../../content/customizations'
import { DRINK_SIZES, type DrinkSize, drinkSizeIds } from '../../content/drink-sizes'
import { RECIPES, recipeFor, recipeSizes } from '../../content/recipes'
import type { Action } from '../../simulation/actions'
import type { GameState, OrderLine } from '../../simulation/state'
import { FOODS } from '../food/catalog'
import type { FoodLine } from '../food/model'
import { type OrderOptions, packagingNames } from './checkout-model'
import { saleTotal } from './orders'
import { PosButton } from './PosControls'
import { temperatureVariant } from './PosMenu'

export function PosOrderOptions({
  line,
  act,
  onDone,
}: {
  line: OrderLine | FoodLine
  act: (action: Action) => void
  onDone: () => void
}) {
  const [options, setOptions] = useState<OrderOptions>({ ...line.options })
  const [deposit, setDeposit] = useState(String(line.options.cupDeposit))
  const [lid, setLid] = useState<'with' | 'without' | null>('recipe' in line ? line.customizations.lid : null)
  const [warmed, setWarmed] = useState('warmed' in line && line.warmed)
  const [error, setError] = useState('')
  const drink = 'recipe' in line
  const supportsPersonal = drink && recipeFor(line.recipe, line.size, line.service).vesselId === 'serving-cup'

  const save = () => {
    const cupDeposit = options.personalCup ? 0 : Number(deposit || 0)

    if (!Number.isInteger(cupDeposit) || cupDeposit < 0 || cupDeposit > 10000) {
      setError('컵보증금은 0~10,000원으로 입력해주세요.')
      return
    }

    const next = { ...options, cupDeposit }

    if ('recipe' in line) {
      if (line.service === 'dine-in' && !next.personalCup && lid === 'with') {
        setError('매장컵에는 리드를 덮을 수 없어요.')
        return
      }

      act({
        type: 'pos-update',
        id: line.id,
        quantity: line.quantity,
        item: { ...line, options: next, customizations: { ...line.customizations, lid } },
      })
    } else act({ type: 'pos-food-update', id: line.id, item: { ...line, warmed, options: next } })

    onDone()
  }

  return (
    <div className="grid gap-4">
      {drink && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <PosButton
              aria-pressed={!options.personalCup}
              onClick={() => setOptions({ ...options, personalCup: false })}
            >
              매장·일회용컵
            </PosButton>
            <PosButton
              disabled={!supportsPersonal}
              aria-pressed={options.personalCup}
              onClick={() => {
                setOptions({ ...options, personalCup: true, cupDeposit: 0 })
                setDeposit('0')
                setLid('without')
              }}
            >
              개인컵
            </PosButton>
          </div>
          <fieldset className="grid grid-cols-3 gap-2">
            <legend className="mb-2 text-sm">리드</legend>
            <PosButton aria-pressed={lid === null} onClick={() => setLid(null)}>
              기본
            </PosButton>
            <PosButton
              aria-pressed={lid === 'with'}
              disabled={line.service === 'dine-in' && !options.personalCup}
              onClick={() => setLid('with')}
            >
              있음
            </PosButton>
            <PosButton aria-pressed={lid === 'without'} onClick={() => setLid('without')}>
              없이
            </PosButton>
          </fieldset>
          <label className="grid gap-2 text-sm">
            컵보증금
            <input
              aria-label="컵보증금"
              inputMode="numeric"
              value={deposit}
              disabled={options.personalCup}
              onChange={(event) => {
                if (/^\d{0,5}$/.test(event.target.value)) setDeposit(event.target.value)
              }}
              className="min-h-12 rounded border border-pos-soft px-3 text-lg tabular-nums"
            />
          </label>
        </>
      )}
      {'productId' in line && (
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="mb-2 text-sm">푸드 제공</legend>
          <PosButton aria-pressed={!warmed} onClick={() => setWarmed(false)}>
            그대로
          </PosButton>
          <PosButton
            disabled={!FOODS[line.productId].heatingSeconds}
            aria-pressed={warmed}
            onClick={() => setWarmed(true)}
          >
            데워서
          </PosButton>
        </fieldset>
      )}
      <fieldset className="grid grid-cols-3 gap-2">
        <legend className="mb-2 text-sm">포장선택</legend>
        {(Object.entries(packagingNames) as Array<[OrderOptions['packaging'], string]>).map(([packaging, name]) => (
          <PosButton
            key={packaging}
            aria-pressed={options.packaging === packaging}
            onClick={() => setOptions({ ...options, packaging })}
          >
            {name}
          </PosButton>
        ))}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <PosButton tone="active" onClick={save}>
        확정
      </PosButton>
    </div>
  )
}

export function PosBulkOptions({
  state,
  act,
  onDone,
}: {
  state: GameState
  act: (action: Action) => void
  onDone: () => void
}) {
  const [temperature, setTemperature] = useState<'keep' | 'hot' | 'iced'>('keep')
  const [size, setSize] = useState<DrinkSize | 'keep'>('keep')
  const [service, setService] = useState<'keep' | 'dine-in' | 'takeout'>('keep')
  const [error, setError] = useState('')

  const confirm = () => {
    const items: Array<{ id: string; item: OrderLine }> = []

    for (const line of state.sale?.lines ?? []) {
      const recipe = temperature === 'keep' ? line.recipe : temperatureVariant(line.recipe, temperature)
      const nextSize = size === 'keep' ? line.size : size
      const nextService = service === 'keep' ? line.service : service

      if (!recipe || !recipeSizes(recipe, nextService).includes(nextSize)) {
        setError(`${RECIPES[line.recipe].name}은 선택한 온도·사이즈·컵으로 변경할 수 없어요.`)
        return
      }

      items.push({
        id: line.id,
        item: {
          ...line,
          recipe,
          size: nextSize,
          service: nextService,
          customizations: recipe === line.recipe ? line.customizations : noCustomizations(),
        },
      })
    }

    act({ type: 'pos-bulk', items })
    onDone()
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm">담은 음료 전체의 선택한 규격을 함께 변경합니다.</p>
      <label className="grid gap-2 text-sm">
        온도
        <select
          value={temperature}
          onChange={(event) => setTemperature(event.target.value as typeof temperature)}
          className="min-h-12 rounded border border-pos-soft px-3"
        >
          <option value="keep">변경 없음</option>
          <option value="hot">HOT</option>
          <option value="iced">ICED</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm">
        사이즈
        <select
          value={size}
          onChange={(event) => setSize(event.target.value as typeof size)}
          className="min-h-12 rounded border border-pos-soft px-3"
        >
          <option value="keep">변경 없음</option>
          {drinkSizeIds
            .filter((id) => id !== 'single')
            .map((id) => (
              <option key={id} value={id}>
                {DRINK_SIZES[id].name}
              </option>
            ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm">
        컵
        <select
          value={service}
          onChange={(event) => setService(event.target.value as typeof service)}
          className="min-h-12 rounded border border-pos-soft px-3"
        >
          <option value="keep">변경 없음</option>
          <option value="dine-in">매장컵</option>
          <option value="takeout">일회용컵</option>
        </select>
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <PosButton tone="active" disabled={!state.sale?.lines.length} onClick={confirm}>
        모두 변경
      </PosButton>
    </div>
  )
}

export function HeldOrders({
  state,
  act,
  editable,
}: {
  state: GameState
  act: (action: Action) => void
  editable: boolean
}) {
  return (
    <div className="grid gap-3">
      <PosButton
        tone="active"
        disabled={!editable || !state.sale || state.waitingOrders.length >= 10}
        onClick={() => act({ type: 'pos-hold' })}
      >
        현재 주문 보류 · 다음 손님 응대
      </PosButton>
      {!state.waitingOrders.length && (
        <p className="py-5 text-center text-sm text-pos-panel">보류한 주문이 없습니다.</p>
      )}
      {state.waitingOrders.map((order) => (
        <PosButton
          key={order.customer.id}
          className="flex justify-between gap-4 text-left"
          onClick={() => act({ type: 'pos-resume', customerId: order.customer.id })}
        >
          <span>
            주문 {String(order.customer.orderNumber).padStart(3, '0')} ·{' '}
            {order.sale ? `${saleTotal(order.sale).toLocaleString('ko-KR')}원` : '입력 전'}
          </span>
          <span>재개 →</span>
        </PosButton>
      ))}
    </div>
  )
}
