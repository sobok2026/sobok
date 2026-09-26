import { formatDecimal } from '@sobok/std/format/number'
import { useState } from 'react'
import { INGREDIENTS } from '../../content/ingredients'
import { recipeFor } from '../../content/recipes'
import { Button } from '../../shared/ui/Button'
import {
  PanelEmpty,
  PanelNow,
  PanelRow,
  PanelSearch,
  PanelSection,
  PanelStatus,
  RowButton,
} from '../../shared/ui/PanelControls'
import type { Action } from '../../simulation/actions'
import type { Objective } from '../../simulation/guidance'
import { cupHandsBusy } from '../../simulation/hands'
import type { GameState, OrderLine } from '../../simulation/state'
import { available } from '../inventory/inventory'
import { currentTicket } from '../service/orders'
import { PREPARATIONS, type PreparationDefinition, preparationForMaterial, preparationIds } from './rules'

const choices = preparationIds.map((id) => PREPARATIONS[id]).sort((a, b) => a.name.localeCompare(b.name, 'ko'))

function orderPreparationMaterials(ticket: OrderLine | null) {
  const needed = new Set<string>()
  if (!ticket) {
    return needed
  }
  const visited = new Set<string>()

  const visit = (materialId: string) => {
    if (visited.has(materialId)) {
      return
    }
    visited.add(materialId)
    const definition = preparationForMaterial(materialId)
    if (!definition) {
      return
    }
    needed.add(materialId)
    for (const step of definition.steps) for (const input of Object.keys(step.costs)) visit(input)
  }

  for (const step of recipeFor(ticket.recipe, ticket.size, ticket.service, ticket.customizations).steps)
    for (const materialId of Object.keys(step.costs)) visit(materialId)

  return needed
}

export default function PreparationPanel({
  state,
  act,
  goal,
}: {
  state: GameState
  act: (action: Action) => void
  goal: Objective
}) {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLocaleLowerCase('ko')
  const needed = orderPreparationMaterials(currentTicket(state))
  const reason = unavailableReason(state)
  const subject = goal.station === 'prep' ? goal.blocker?.subject : undefined
  const focus =
    subject && 'ingredient' in subject
      ? choices.find((item) => item.output.materialId === subject.ingredient)
      : undefined
  const listed = needle
    ? choices.filter((item) =>
        `${item.name} ${INGREDIENTS[item.output.materialId].name}`.toLocaleLowerCase('ko').includes(needle),
      )
    : choices.filter((item) => needed.has(item.output.materialId) && item !== focus)
  const start = (item: PreparationDefinition) => act({ type: 'start-preparation', recipe: item.id })

  return (
    <>
      {focus && (
        <PanelNow
          blocked
          title={`${INGREDIENTS[focus.output.materialId].name} 만들기`}
          detail={reason ?? `${goal.blocker!.reason} · ${focus.steps.length}단계`}
        >
          {!reason && <Button onClick={() => start(focus)}>{focus.name} 시작</Button>}
        </PanelNow>
      )}
      {!focus && reason && <PanelStatus>{reason}</PanelStatus>}
      {(needle || listed.length > 0) && (
        <PanelSection title={needle ? `검색 결과 ${listed.length}개` : '이 주문에 필요한 배합'}>
          {listed.length ? (
            listed.map((item) => (
              <PanelRow
                key={item.id}
                title={item.name}
                note={`보유 ${formatDecimal(available(state, item.output.materialId))}${INGREDIENTS[item.output.materialId].unit} · ${item.steps.length}단계`}
              >
                {!reason && <RowButton onClick={() => start(item)}>만들기</RowButton>}
              </PanelRow>
            ))
          ) : (
            <PanelEmpty>찾는 배합이 없어요.</PanelEmpty>
          )}
        </PanelSection>
      )}
      <PanelSearch label={`다른 배합 찾기 · ${choices.length}종`} value={query} onChange={setQuery} />
    </>
  )
}

function unavailableReason(state: GameState) {
  if (state.preparation || state.cup?.craft.location === 'prep' || state.jobs.some((job) => job.station === 'prep')) {
    return '준비대에서 다른 작업이 진행 중이에요.'
  }
  return cupHandsBusy(state.cup) ? '음료 컵과 도구를 먼저 내려놓으세요.' : null
}
