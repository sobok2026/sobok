import { recipeCatalog } from '../../content/catalog'
import { batchDate } from '../../shared/format'
import type { GameState } from '../../simulation/state'
import { COLD_BREW_HOURS } from '../cold-brew/rules'
import { BAR_BATCH_CAPACITY } from '../inventory/batches'
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
        백룸 창고에서 입고한 원팩은 직접 들고 보관합니다. 냉장 재료는 백룸 냉장고에, 실온 재료는 창고 선반에 넣으세요.
        그곳에서 개봉하고 라벨을 쓰면 백룸 준비에 사용할 수 있습니다. 주문 제조용 재료는 용기째 집어 바까지 운반하세요.
      </p>
      <p className="mt-2 text-muted">
        바 냉장고와 실온 선반에는 재료 품목별로 용기 {BAR_BATCH_CAPACITY}개까지 둘 수 있습니다. 가득 찼으면 바의 용기를
        백룸으로 옮겨 자리를 만드세요. 이동해도 잔량·라벨·기한은 유지됩니다.
      </p>
      <p className="mt-2 text-muted">
        라벨의 기한은 직접 계산해 적습니다. 일·개월 기한은 시작한 날을 첫날로 세어 날짜만, 시간 기한은 시작 시각부터
        세어 분까지 적습니다. 기한이 하루라도 이르거나 늦으면 붙지 않습니다. 품목별 기한은 라벨 쓰기 아래 기한표에
        있습니다.
      </p>
      <p className="mt-2 text-muted">
        완성한 배합은 라벨을 쓴 뒤 E로 용기를 집어 바 냉장고 또는 실온 선반에 보충합니다. 예비 배치는 백룸에 보관합니다.
        배합의 기한은 넣은 원재료 중 가장 이른 기한을 넘길 수 없습니다.
      </p>
      <p className="mt-2 text-muted">
        콜드 브루는 별도 추출대에서 원두·물을 계량하고 {COLD_BREW_HOURS}시간 추출합니다. 다음 날로 넘어가도 추출이
        진행되며 회수·라벨 쓰기·냉장 보관까지 마쳐야 사용할 수 있습니다.
      </p>
    </section>
  )
}
