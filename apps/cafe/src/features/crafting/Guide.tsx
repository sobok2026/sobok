import { DRINK_SIZES } from '../../content/drink-sizes'
import { RECIPES, recipeFor } from '../../content/recipes'
import type { GameState } from '../../simulation/state'
import { cupSize } from '../inventory/cups'
export function RecipeGuide({ state }: { state: GameState }) {
  const recipe = state.cup?.recipe ?? state.ticket?.recipe
  const size = state.cup ? cupSize(state.cup.craft.kind) : state.ticket?.size
  return recipe && size ? (
    <details className="border-t border-line py-4">
      <summary className="font-medium">
        {RECIPES[recipe].shortName} · {RECIPES[recipe].variant} · {DRINK_SIZES[size].name}
      </summary>
      <ol className="mt-4 space-y-4">
        {recipeFor(recipe, size).steps.map((step, index) => (
          <li key={step.label} className="flex gap-3">
            <span className="text-xs tabular-nums text-muted">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <strong className="font-medium">
                {step.label}
                {step.measurement ? ` · ${step.measurement}` : ''}
              </strong>
              <p className="mt-1 text-xs text-muted">
                {step.label === '제공'
                  ? state.ticket?.service === 'dine-in'
                    ? '머그·유리잔은 리드 없이 픽업대에서 제공해요.'
                    : '일회용 컵은 리드를 덮어 픽업대에서 제공해요.'
                  : step.instruction}
              </p>
              {step.note ? <p className="mt-1 text-xs text-muted">{step.note}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </details>
  ) : null
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
        계량 게이지의 목표 구간에서 멈추고 도구를 놓은 뒤 F로 확인하세요. 초과한 음료는 정리하고 다시 만듭니다. 다회용
        컵은 세척 후 재사용합니다.
      </p>
    </details>
  )
}
