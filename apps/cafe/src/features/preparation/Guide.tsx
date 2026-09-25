import { batchDate } from '../../shared/format'
import type { GameState } from '../../simulation/state'
import { COLD_BREW_HOURS } from '../cold-brew/rules'
import { PREPARATIONS } from './rules'
export function PreparationRecipeGuide({ state }: { state: GameState }) {
  const preparation = state.preparation
  return preparation ? (
    <details className="border-t border-line py-4">
      <summary className="font-medium">{PREPARATIONS[preparation.recipe].name} 배합</summary>
      {preparation.ingredientExpiresAt != null ? (
        <p className="mt-3 text-xs text-muted">원재료 기한 · {batchDate(preparation.ingredientExpiresAt, true)}</p>
      ) : null}
      <ol className="mt-4 list-decimal space-y-3 pl-5 text-xs text-muted">
        {PREPARATIONS[preparation.recipe].steps.map((step) => (
          <li key={step.label}>{step.instruction}</li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-muted">{PREPARATIONS[preparation.recipe].storageNote}</p>
    </details>
  ) : null
}
export function PreparationGuide() {
  return (
    <details className="border-t border-line py-4">
      <summary className="font-medium">재료 준비와 보관</summary>
      <p className="mt-3 text-muted">
        준비대에서 폼·바모카·호지차 샷을 배합합니다. 라벨을 붙인 뒤 E로 용기를 집어 폼·호지차 샷은 냉장고, 바모카는 실온
        선반에 보관하세요.
      </p>
      <p className="mt-2 text-muted">
        콜드 브루는 추출대에서 원두·물을 계량하고 {COLD_BREW_HOURS}시간 추출합니다. 마감하고 다음 날로 넘어가도 추출이
        진행됩니다. 완료 후 회수·라벨·냉장 보관까지 마쳐야 사용할 수 있습니다.
      </p>
    </details>
  )
}
