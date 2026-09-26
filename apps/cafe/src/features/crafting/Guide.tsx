import { DRINK_SIZES } from '../../content/drink-sizes'
import { RECIPES, recipeFor } from '../../content/recipes'
import { STATIONS } from '../../content/stations'
import type { GameState } from '../../simulation/state'
import { cupService, cupSize } from '../inventory/cups'
import { operationDetails } from '../production/presentation'
import { currentTicket } from '../service/orders'

export function RecipeGuide({ state }: { state: GameState }) {
  const ticket = currentTicket(state)
  const recipe = state.cup?.recipe ?? ticket?.recipe
  const size = state.cup ? cupSize(state.cup.craft.kind) : ticket?.size
  const service = state.cup ? cupService(state.cup.craft.kind) : ticket?.service
  if (!recipe || !size || !service) return null
  const definition = recipeFor(recipe, size, service, state.cup?.craft.customizations ?? ticket?.customizations)
  return (
    <details className="border-t border-line py-4">
      <summary className="font-medium">
        {RECIPES[recipe].shortName} · {RECIPES[recipe].variant} · {DRINK_SIZES[size].name} ·{' '}
        {service === 'dine-in' ? '매장' : '포장'}
      </summary>
      <ol className="mt-4 space-y-4">
        {definition.steps.map((step, index) => {
          const details = operationDetails(step)
          return (
            <li
              key={step.id}
              className="flex gap-3"
              aria-current={state.cup?.craft.cursor === index ? 'step' : undefined}
            >
              <span className="text-xs tabular-nums text-muted">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong className="font-medium">
                  {step.label}
                  {step.measurement ? ` · ${step.measurement}` : ''}
                </strong>
                <p className="mt-1 text-xs text-muted">
                  {STATIONS[step.station].name}
                  {details.length ? ` · ${details.join(' · ')}` : ''}
                </p>
                <p className="mt-1 text-xs text-muted">{step.instruction}</p>
                {step.note ? <p className="mt-1 text-xs text-muted">{step.note}</p> : null}
              </div>
            </li>
          )
        })}
      </ol>
    </details>
  )
}
export function CraftingGuide() {
  return (
    <details className="border-t border-line py-4">
      <summary className="font-medium">주문과 제조</summary>
      <p className="mt-3 text-muted">
        POS에서 메뉴·사이즈·이용 방식을 입력하고 컵 보관대에서 컵을 집으세요. 각 작업대에 컵을 놓고 계량한 뒤 픽업대에서
        전달합니다.
      </p>
      <p className="mt-2 text-muted">
        화면의 원문 계량 목표에 맞춰 진행하고 도구를 놓은 뒤 F로 확인하세요. 분수와 범위는 표시된 기준을 따릅니다.
        초과한 음료는 정리하고 다시 만듭니다.
      </p>
      <p className="mt-2 text-muted">
        장비는 한 번씩 작동합니다. 작동 횟수를 맞춘 뒤 F로 완료를 확인하세요. 제조 시간이 정해져 있지 않은 장비는 작동
        확인 버튼을 사용합니다. 다회용 컵은 세척 후 재사용합니다.
      </p>
    </details>
  )
}
