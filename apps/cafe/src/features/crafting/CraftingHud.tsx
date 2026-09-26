import { INGREDIENTS } from '../../content/ingredients'
import { recipeFor } from '../../content/recipes'
import { STATIONS, type StationId } from '../../content/stations'
import { TextButton } from '../../shared/ui/Button'
import { WorkButton, WorkHud, WorkTitle } from '../../shared/ui/WorkControls'
import type { CraftState, GameState, Job } from '../../simulation/state'
import { cupService, cupSize, isReusableCup } from '../inventory/cups'
import { available } from '../inventory/inventory'
import { ProductionControls } from '../production/ProductionControls'
import { readyWork } from '../production/runtime'
import { PRODUCTION_EPSILON, type WorkStep } from '../production/workflow'
import { CUSTOMER_STATUS } from '../service/customer'
import { operationFor } from './rules'

type Props = {
  state: GameState
  target: StationId | null
  onUse: (station: StationId) => void
  onStop: () => void
  onTool: (station: StationId) => void
  onConfirm: (station: StationId, observation?: { id: string; value: boolean }) => void
  onMoveCup: (station: StationId) => void
  onDiscard: () => void
}

export default function CraftingHud({ state, target, ...handlers }: Props) {
  const cup = state.cup
  if (!cup || cup.craft.location === 'hand' || cup.craft.location !== target) return null

  const craft = cup.craft
  const place = cup.craft.location
  const step = operationFor(cup.recipe, craft)
  const definition = recipeFor(cup.recipe, cupSize(craft.kind), cupService(craft.kind), craft.customizations)
  const nextStation = step?.station ?? 'pickup'
  const job = state.jobs.find((item) => item.cupId === cup.id)
  const needsMove = nextStation !== place && !job

  return (
    <WorkHud data-fault={!!craft.fault} aria-label="직접 제조 조작">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted compact:mb-1.5">
        <span>{STATIONS[place].name}</span>
        <span>{progressLabel(step, needsMove, `${craft.cursor + 1} / ${definition.steps.length}`)}</span>
      </div>
      <CraftingWork
        state={state}
        craft={craft}
        place={place}
        step={step}
        job={job}
        nextStation={nextStation}
        needsMove={needsMove}
        {...handlers}
      />
    </WorkHud>
  )
}

function progressLabel(step: WorkStep | null, needsMove: boolean, position: string) {
  if (!step) return '제조 완료'
  return needsMove ? '다음 작업대' : position
}

function CraftingWork({
  state,
  craft,
  place,
  step,
  job,
  nextStation,
  needsMove,
  onUse,
  onStop,
  onTool,
  onConfirm,
  onMoveCup,
  onDiscard,
}: Omit<Props, 'target'> & {
  craft: CraftState
  place: StationId
  step: WorkStep | null
  job: Job | undefined
  nextStation: StationId
  needsMove: boolean
}) {
  if (craft.fault) {
    return (
      <>
        <WorkTitle>제조 실패</WorkTitle>
        <p className="my-2.5 text-sm leading-relaxed text-danger">{craft.fault}</p>
        <WorkButton shortcut="F" primary onUse={onDiscard}>
          {isReusableCup(craft.kind) ? '내용물 비우고 세척 대기로' : '컵 폐기'}
        </WorkButton>
      </>
    )
  }

  if (needsMove) {
    return (
      <>
        <WorkTitle>{STATIONS[nextStation].name}로 이동</WorkTitle>
        <WorkButton shortcut="E" primary onUse={() => onMoveCup(place)}>
          컵 집기
        </WorkButton>
      </>
    )
  }

  if (step) {
    return (
      <>
        <ProductionControls
          session={craft}
          step={step}
          job={job}
          time={state.time}
          supplyNotice={supplyNotice(state, craft, step)}
          onTool={() => onTool(place)}
          onUse={() => onUse(place)}
          onStop={onStop}
          onConfirm={() => onConfirm(place)}
          onObserve={(id, value) => onConfirm(place, { id, value })}
        />
        {!craft.tool && !job ? (
          <div className="mt-3 compact:mt-1.5">
            <TextButton onClick={() => onMoveCup(place)}>
              <kbd className="mr-1">E</kbd> 컵 집기
            </TextButton>
          </div>
        ) : null}
      </>
    )
  }

  return (
    <>
      <WorkTitle>{state.customer?.stage === 'pickup' ? '전달 준비' : '제조 완료'}</WorkTitle>
      {state.customer?.stage !== 'pickup' ? (
        <p className="my-2.5 text-sm leading-relaxed text-muted">
          {state.customer
            ? `손님 ${CUSTOMER_STATUS[state.customer.stage]}. 픽업대에 도착하면 전달하세요.`
            : '응대할 손님이 없어요.'}
        </p>
      ) : null}
      <WorkButton shortcut="F" primary disabled={state.customer?.stage !== 'pickup'} onUse={() => onConfirm(place)}>
        음료 전달
      </WorkButton>
      <TextButton onClick={() => onMoveCup(place)}>
        <kbd>E</kbd> 컵 집기
      </TextButton>
    </>
  )
}

function supplyNotice(state: GameState, craft: CraftState, step: WorkStep) {
  if (step.requiresReusableTool && !craft.reservedTool && !state.tools.clean) {
    return '깨끗한 작업 용기 부족 · 세척 후 도구 선반에 정리하세요.'
  }
  if (readyWork(step, craft.progress)) return null

  const remaining = step.inputRequirements ? 1 : Math.max(0, 1 - craft.progress / step.target)
  const missing = Object.entries(step.inputRequirements ?? step.costs).find(
    ([id, amount]) => available(state, id) + PRODUCTION_EPSILON < (amount ?? 0) * remaining,
  )?.[0]
  return missing ? `${INGREDIENTS[missing].name} 부족 · 사용 준비가 된 재료를 보충하세요.` : null
}
