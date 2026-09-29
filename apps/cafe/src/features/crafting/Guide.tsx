import clsx from 'clsx'
import { DRINK_SIZES } from '../../content/drink-sizes'
import { RECIPES, recipeFor } from '../../content/recipes'
import { STATIONS } from '../../content/stations'
import type { GameState } from '../../simulation/state'
import { cupService } from '../inventory/cups'
import { operationNotes } from '../production/presentation'
import type { WorkStep } from '../production/workflow'
import { currentTicket } from '../service/orders'

export function RecipeGuide({ state }: { state: GameState }) {
  const ticket = currentTicket(state)
  const recipe = state.cup?.recipe ?? ticket?.recipe
  const size = state.cup ? state.cup.craft.size : ticket?.size
  const service = state.cup ? cupService(state.cup.craft.kind) : ticket?.service
  if (!recipe || !size || !service) {
    return <p className="text-body text-muted">제조 중인 음료가 없어요.</p>
  }
  const steps = recipeFor(recipe, size, service, state.cup?.craft.customizations ?? ticket?.customizations).steps
  const cursor = state.cup?.craft.cursor ?? -1
  // One original step can hold several operations; its instruction is shown once above them.
  const groups = steps.reduce<{ id: string; instruction: string; steps: { step: WorkStep; index: number }[] }[]>(
    (list, step, index) => {
      const last = list.at(-1)
      if (last?.id === step.sourceStepId) {
        last.steps.push({ step, index })
      } else {
        list.push({ id: step.sourceStepId, instruction: step.instruction, steps: [{ step, index }] })
      }
      return list
    },
    [],
  )

  return (
    <section aria-label="이 음료 제조법">
      <h3 className="font-semibold">
        {RECIPES[recipe].shortName} · {RECIPES[recipe].variant} · {DRINK_SIZES[size].name} ·{' '}
        {service === 'dine-in' ? '매장' : '포장'}
      </h3>
      <ol className="mt-4 space-y-4">
        {groups.map((group, groupIndex) => (
          <li key={group.id} className="flex gap-3">
            <span className="text-sm text-muted tabular-nums">{String(groupIndex + 1).padStart(2, '0')}</span>
            <div className="min-w-0 grow">
              <p className="text-body">{group.instruction}</p>
              <ul className="mt-2 space-y-1">
                {group.steps.map(({ step, index }) => (
                  <li
                    key={step.id}
                    className={clsx(
                      'rounded-lg px-2.5 py-1.5 text-sm text-muted',
                      'aria-[current=step]:bg-brand/8 aria-[current=step]:text-ink',
                    )}
                    aria-current={index === cursor ? 'step' : undefined}
                  >
                    <strong className="font-semibold text-ink">{step.label}</strong>
                    {[step.measurement, STATIONS[step.station].name, ...operationNotes(step)]
                      .filter(Boolean)
                      .map((text) => ` · ${text}`)}
                  </li>
                ))}
              </ul>
              {group.steps[0].step.note && <p className="mt-1 text-sm text-muted">{group.steps[0].step.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function CraftingGuide() {
  return (
    <section className="border-t border-line py-4 first:border-0 first:pt-0">
      <h3 className="font-semibold">주문과 제조</h3>
      <p className="mt-3 text-muted">
        POS에서 결제하면 음료마다 주문 스티커가 나와요. 컵 보관대에서 컵을 고르고 스티커 프린터에서 E로 스티커를 붙인 뒤
        만들어요.
      </p>
      <p className="mt-2 text-muted">
        단계마다 그 단계가 쓰는 용기를 해당 작업대에 둬요. 우유 계량과 스팀은 스팀 완드의 피처로 하고 컵은 필요한
        작업대에만 가져가요. 피처·블렌더 피처처럼 옮겨야 하는 용기는 E로 집고 놓아요.
      </p>
      <p className="mt-2 text-muted">
        작업 카드는 양을 알려주지 않아요. 레시피는 이 음료 탭에서 확인하세요. 펌프·샷은 누른 횟수를, 선까지 붓는 계량은
        게이지 눈금을 보고 멈춘 뒤 도구를 놓고 F로 확인해요. 길게 누르면 빠르게 붓고, 짧게 누르면 조금씩 보충해요. 컵
        상단 확대 눈금은 테두리 아래 거리(mm), 점선은 이 단계의 시작 수위예요. 모자라면 이어서 하고 넘치면 다시
        만들어요.
      </p>
      <p className="mt-2 text-muted">
        스팀 온도·원두·블렌더 버튼·리드는 직접 골라요. 스팀처럼 시간이 걸리는 장비는 시작하면 스스로 멈추고 그동안 다른
        단계를 이어갈 수 있어요. 다회용 컵은 세척 후 재사용해요.
      </p>
    </section>
  )
}
