import { INGREDIENTS, ingredientIds } from '../../content/ingredients'
import { recipeFor } from '../../content/recipes'
import { STATIONS, type StationId } from '../../content/stations'
import { TextButton } from '../../shared/ui/Button'
import { WorkButton, WorkHud, WorkMeter, WorkTitle } from '../../shared/ui/WorkControls'
import type { GameState } from '../../simulation/state'
import { cupService, cupSize, isReusableCup } from '../inventory/cups'
import { available } from '../inventory/inventory'
import { CUSTOMER_STATUS } from '../service/customer'
import { isContinuous, isMetered, operationFor, readyToConfirm, TOOL_NAMES } from './rules'

type Props = {
  state: GameState
  target: StationId | null
  onUse: (station: StationId) => void
  onStop: () => void
  onTool: (station: StationId) => void
  onConfirm: (station: StationId) => void
  onMoveCup: (station: StationId) => void
  onDiscard: () => void
}
export default function CraftingHud({ state, target, onUse, onStop, onTool, onConfirm, onMoveCup, onDiscard }: Props) {
  const cup = state.cup
  if (!cup || cup.craft.location === 'hand' || cup.craft.location !== target) return null
  const c = cup.craft
  const place = target!
  const op = operationFor(cup.recipe, cup.step, c)
  const sourceStep = recipeFor(cup.recipe, cupSize(cup.craft.kind), cupService(cup.craft.kind)).steps[cup.step]
  const nextStation = sourceStep?.station ?? 'pickup'
  const job = state.jobs.find((item) => item.cupId === cup.id)
  const needsMove = nextStation !== place && !job
  const ready = !!op && readyToConfirm(op, c.progress)
  const rightTool = op?.tool === c.tool
  const progress = job
    ? Math.min(1, (state.time - job.startedAt) / (job.endsAt - job.startedAt))
    : op
      ? c.progress / op.target
      : 1
  const counter = op && ['machine', 'steam', 'dispense', 'pump', 'sprinkle', 'lid', 'shake'].includes(op.kind)
  const missing =
    op && (!ready || op.stockPrerequisite)
      ? ingredientIds.find(
          (id) =>
            available(state, id) + 0.0001 <
            (op.stockPrerequisite
              ? (op.stockPrerequisite[id] ?? 0)
              : (op.costs[id] ?? 0) * Math.max(0, 1 - op.tolerance - c.progress / op.target)),
        )
      : undefined
  const supplyNotice =
    (op?.fillsPitcher || op?.tool === 'pitcher') && !c.pitcherReserved && !state.tools.clean
      ? '피처 부족 · 세척 후 도구 선반에 정리'
      : missing
        ? `${INGREDIENTS[missing].name} 부족 · ${missing === 'coldBrew' ? '추출대' : INGREDIENTS[missing].prepared ? '준비대' : '창고'}에서 준비`
        : null
  const toolIsNext = supplyNotice ? !!c.tool : !rightTool || ready
  const useLabel = op
    ? isContinuous(op)
      ? `누르고 ${op.kind === 'stir' ? '젓기' : op.kind === 'drizzle' ? '두르기' : op.kind === 'ice' ? '얼음 담기' : '붓기'}`
      : {
          machine: '샷 추출하기',
          steam: '스팀하기',
          dispense: '온수 버튼 누르기',
          pump: '펌핑',
          sprinkle: '한 톡',
          ice: '한 스쿱',
          lid: '리드 덮기',
          shake: '흔들기',
        }[op.kind as 'machine' | 'steam' | 'dispense' | 'pump' | 'sprinkle' | 'ice' | 'lid' | 'shake']
    : ''
  return (
    <WorkHud data-fault={!!c.fault} aria-label="직접 제조 조작">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted compact:mb-1.5">
        <span>{STATIONS[place].name}</span>
        <span>
          {!op
            ? '제조 완료'
            : needsMove
              ? '다음 작업대'
              : `${cup.step + 1} / ${recipeFor(cup.recipe, cupSize(cup.craft.kind), cupService(cup.craft.kind)).steps.length - (isReusableCup(c.kind) ? 1 : 0)}`}
        </span>
      </div>
      {c.fault ? (
        <>
          <WorkTitle>제조 실패</WorkTitle>
          <p className="my-2.5 text-sm leading-[1.65] text-muted group-data-[fault=true]/work:text-danger">{c.fault}</p>
          <WorkButton shortcut="F" primary onUse={onDiscard}>
            {isReusableCup(c.kind) ? '내용물 비우고 세척 대기로' : '컵 폐기'}
          </WorkButton>
        </>
      ) : needsMove ? (
        <>
          <WorkTitle>{STATIONS[nextStation].name}로 이동</WorkTitle>
          <WorkButton shortcut="E" primary onUse={() => onMoveCup(place)}>
            컵 집기
          </WorkButton>
        </>
      ) : job ? (
        <>
          <WorkTitle>{job.label}</WorkTitle>
          <WorkMeter
            label={job.label}
            ratio={progress}
            value={`${Math.max(0, Math.ceil(job.endsAt - state.time))}초 남음`}
          />
        </>
      ) : op ? (
        <>
          <WorkTitle>{op.label}</WorkTitle>
          {sourceStep.measurement ? <p className="mt-2 text-xs text-muted">{sourceStep.measurement}</p> : null}
          {supplyNotice ? (
            <p className="my-2.5 border-l-3 border-[#bb8a57] pl-3 text-sm leading-[1.65] text-danger group-data-[fault=true]/work:text-danger">
              {supplyNotice}
            </p>
          ) : null}
          <WorkMeter
            label={op.label}
            ratio={progress}
            value={counter ? `${Math.round(c.progress)} / ${op.target} ${op.unit}` : `${Math.round(progress * 100)}%`}
            tolerance={isMetered(op) && !counter ? op.tolerance : undefined}
          />
          <div className="flex flex-wrap gap-2">
            {c.tool || (op.tool && !ready) ? (
              <WorkButton shortcut="G" primary={toolIsNext} onUse={() => onTool(place)}>
                {c.tool ? `${TOOL_NAMES[c.tool]} 놓기` : `${TOOL_NAMES[op.tool!]} 집기`}
              </WorkButton>
            ) : null}
            {rightTool ? (
              isContinuous(op) ? (
                <WorkButton
                  shortcut="Space"
                  primary={!ready && !supplyNotice}
                  hold
                  onUse={() => onUse(place)}
                  onStop={onStop}
                >
                  {useLabel}
                </WorkButton>
              ) : (
                <WorkButton shortcut="Space" primary={!ready && !supplyNotice} onUse={() => onUse(place)}>
                  {useLabel}
                </WorkButton>
              )
            ) : null}
            {ready && !c.tool ? (
              <WorkButton shortcut="F" primary onUse={() => onConfirm(place)}>
                {op.kind === 'steam' || op.kind === 'machine'
                  ? '장비 완료 확인'
                  : op.kind === 'lid'
                    ? '리드 확인'
                    : '계량 확인'}
              </WorkButton>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 compact:mt-1.5">
            {!c.tool ? (
              <TextButton onClick={() => onMoveCup(place)}>
                <kbd className="mr-1 font-sans">E</kbd> 컵 집기
              </TextButton>
            ) : null}
          </div>
        </>
      ) : (
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
            <kbd className="font-sans">E</kbd> 컵 집기
          </TextButton>
        </>
      )}
    </WorkHud>
  )
}
