import clsx from 'clsx'
import { DRINK_SIZES } from '../../content/drink-sizes'
import { RECIPES, recipeFor } from '../../content/recipes'
import { STATIONS } from '../../content/stations'
import type { GameState } from '../../simulation/state'
import { cupService, cupSize } from '../inventory/cups'
import { operationNotes } from '../production/presentation'
import type { WorkStep } from '../production/workflow'
import { currentTicket } from '../service/orders'

export function RecipeGuide({ state }: { state: GameState }) {
  const ticket = currentTicket(state)
  const recipe = state.cup?.recipe ?? ticket?.recipe
  const size = state.cup ? cupSize(state.cup.craft.kind) : ticket?.size
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
    </section>
  )
}
