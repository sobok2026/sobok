import { recipeCatalog } from '../../content/catalog'
import { batchDate } from '../../shared/format'
import type { GameState } from '../../simulation/state'
import { COLD_BREW_HOURS } from '../cold-brew/rules'
import { operationDetails } from '../production/presentation'
import { PREPARATIONS, type PreparationDefinition } from './rules'

export function PreparationInstructions({
  definition,
  cursor,
}: {
  definition: PreparationDefinition
  cursor?: number
}) {
  const variant = recipeCatalog.recipes
    .get(definition.recipeId)!
    .variants.find((item) => item.id === definition.variantId)!

  return (
    <>
      <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-muted" aria-label="부재료 제조 순서">
        {definition.steps.map((step, index) => {
          const details = operationDetails(step)

          return (
            <li
              key={step.id}
              aria-current={index === cursor ? 'step' : undefined}
              className="leading-relaxed aria-[current=step]:text-ink"
            >
              <strong className="font-medium">{step.label}</strong>
              <p>{step.instruction}</p>
              {step.measurement && <p className="mt-1 font-medium text-ink">계량 · {step.measurement}</p>}
              {details.length > 0 && <p className="mt-1">{details.join(' · ')}</p>}
              {step.note && <p className="mt-1">{step.note}</p>}
            </li>
          )
        })}
      </ol>
      {variant.output?.description && (
        <p className="mt-4 text-sm leading-relaxed text-muted">{variant.output.description}</p>
      )}
      {variant.notes.length > 0 && <p className="mt-3 text-sm leading-relaxed text-muted">{variant.notes.join(' ')}</p>}
      <p className="mt-3 text-sm leading-relaxed text-muted">{definition.storageNote}</p>
    </>
  )
}

export function PreparationRecipeGuide({ state }: { state: GameState }) {
  const prep = state.preparation
  if (!prep) {
    return null
  }
  const definition = PREPARATIONS[prep.recipe]

  return (
    <section className="border-t border-line py-4 first:border-0 first:pt-0">
      <h3 className="font-semibold">{definition.name} 배합</h3>
      {prep.ingredientExpiresAt !== null && (
        <p className="mt-3 text-sm text-muted">투입 원재료 기한 · {batchDate(prep.ingredientExpiresAt, true)}</p>
      )}
      <PreparationInstructions definition={definition} cursor={prep.cursor} />
    </section>
  )
}

export function PreparationGuide() {
  return (
    <section className="border-t border-line py-4 first:border-0 first:pt-0">
      <h3 className="font-semibold">재료 준비와 보관</h3>
      <p className="mt-3 text-muted">
        준비대에서 부재료 이름을 검색하고 제조 구분을 선택하세요. 현재 주문에 필요한 부재료가 먼저 표시됩니다. 원문의
        계량값과 제조 순서에 따라 준비하고 단계마다 도구를 내려놓은 뒤 F로 확인하세요.
      </p>
      <p className="mt-2 text-muted">
        창고에서 입고한 원팩은 직접 들고 보관합니다. 냉장 보관 재료는 냉장고에, 실온 보관 재료는 창고 선반에 넣으세요.
        보관한 곳에서 원팩을 열고 날짜 라벨을 붙이면 사용할 수 있습니다.
      </p>
      <p className="mt-2 text-muted">
        완성한 배합은 날짜 라벨을 붙인 뒤 E로 용기를 집어 안내된 냉장고 또는 실온 선반에 보관해야 사용할 수 있습니다.
        투입한 원재료의 기한을 넘겨 보관할 수 없습니다.
      </p>
      <p className="mt-2 text-muted">
        콜드 브루는 별도 추출대에서 원두·물을 계량하고 {COLD_BREW_HOURS}시간 추출합니다. 다음 날로 넘어가도 추출이
        진행되며 회수·라벨·냉장 보관까지 마쳐야 사용할 수 있습니다.
      </p>
    </section>
  )
}
