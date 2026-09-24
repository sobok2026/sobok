import { INGREDIENTS, ingredientIds, RECIPES, STATIONS, type StationId } from '../game/catalog'
import { isContinuous, isMetered, operationFor, readyToConfirm, TOOL_NAMES } from '../game/crafting'
import { CUSTOMER_STATUS } from '../game/customer'
import type { GameState } from '../game/state'
import { available } from '../game/store'
import { TextButton } from './Button'
import { WorkButton, WorkHud, WorkMeter, WorkTitle } from './WorkControls'

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
  const sourceStep = RECIPES[cup.recipe].steps[cup.step]
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
  const counter = op && ['pump', 'sprinkle', 'ice', 'lid', 'shake'].includes(op.kind)
  const missing =
    op && !ready
      ? ingredientIds.find(
          (id) =>
            available(state, id) + 0.0001 <
            (op.kind === 'shake'
              ? (sourceStep.costs[id] ?? 0)
              : (op.costs[id] ?? 0) * Math.max(0, 1 - op.tolerance - c.progress / op.target)),
        )
      : undefined
  const supplyNotice =
    (op?.kind === 'steam' || op?.tool === 'pitcher') && !c.pitcherReserved && !state.tools.clean
      ? '깨끗한 피처가 필요해요. 세척 후 선반에 정리해주세요.'
      : missing
        ? `${INGREDIENTS[missing].name} 보충이 필요해요. ${INGREDIENTS[missing].prepared ? '컵을 두고 준비대에서 준비해주세요.' : '창고에서 보충해주세요.'}`
        : null
  const toolIsNext = supplyNotice ? !!c.tool : !rightTool || ready
  const useLabel = op
    ? isContinuous(op)
      ? `누르고 ${op.kind === 'stir' ? '젓기' : op.kind === 'drizzle' ? '두르기' : '붓기'}`
      : {
          machine: '샷 추출하기',
          pump: '한 번 펌핑',
          sprinkle: '한 톡 뿌리기',
          ice: '한 스쿱 담기',
          lid: '리드 덮기',
          shake: '한 번 흔들기',
        }[op.kind as 'machine' | 'pump' | 'sprinkle' | 'ice' | 'lid' | 'shake']
    : ''
  return (
    <WorkHud data-fault={!!c.fault} aria-label="직접 제조 조작">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted compact:mb-1.5">
        <span>{STATIONS[place].name}</span>
        <span>
          {!op ? '제조 완료' : needsMove ? '다음 작업대' : `${cup.step + 1} / ${RECIPES[cup.recipe].steps.length} 단계`}
        </span>
      </div>
      {c.fault ? (
        <>
          <WorkTitle>계량을 초과했어요</WorkTitle>
          <p className="my-2.5 text-sm leading-[1.65] text-muted group-data-[fault=true]/work:text-danger">{c.fault}</p>
          <WorkButton shortcut="F" primary onUse={onDiscard}>
            컵 폐기하고 다시 만들기
          </WorkButton>
        </>
      ) : needsMove ? (
        <>
          <WorkTitle>{STATIONS[nextStation].name}에 컵을 옮기세요</WorkTitle>
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
            hint="장비 작동 중"
          />
          <p className="my-2.5 text-sm leading-[1.65] text-muted group-data-[fault=true]/work:text-danger">
            컵은 두고 다른 일을 할 수 있어요.
          </p>
        </>
      ) : op ? (
        <>
          <WorkTitle>{op.label}</WorkTitle>
          {supplyNotice ? (
            <p className="my-2.5 border-l-3 border-[#bb8a57] pl-3 text-sm leading-[1.65] text-danger group-data-[fault=true]/work:text-danger">
              {supplyNotice}
            </p>
          ) : null}
          <WorkMeter
            label={op.label}
            ratio={progress}
            value={counter ? `${Math.round(c.progress)} / ${op.target} ${op.unit}` : `${Math.round(progress * 100)}%`}
            hint={
              ready
                ? c.tool
                  ? '도구를 놓고 확인하세요'
                  : '계량을 확인하세요'
                : isMetered(op) && !counter
                  ? '초록 구간에서 멈추세요'
                  : counter
                    ? '횟수를 맞추세요'
                    : '목표까지 진행하세요'
            }
            tolerance={isMetered(op) && !counter ? op.tolerance : undefined}
          />
          <div className="flex flex-wrap gap-2">
            {op.tool || c.tool ? (
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
            {op.kind !== 'machine' && ready && !c.tool ? (
              <WorkButton shortcut="F" primary onUse={() => onConfirm(place)}>
                {op.kind === 'steam' ? '스팀 시작' : '계량 확인'}
              </WorkButton>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 compact:mt-1.5">
            {!c.tool ? (
              <TextButton onClick={() => onMoveCup(place)}>
                <kbd className="mr-1 font-sans">E</kbd> 컵 집기
              </TextButton>
            ) : null}
            <details className="text-xs text-muted open:basis-full">
              <summary className="cursor-pointer py-1.5">레시피 · 조작 안내</summary>
              <p className="my-2.5 text-sm leading-[1.65] whitespace-pre-line text-muted">{op.cue}</p>
              {sourceStep?.instruction ? (
                <p className="my-2.5 text-sm leading-[1.65] whitespace-pre-line text-muted">{sourceStep.instruction}</p>
              ) : null}
              {sourceStep?.note ? (
                <p className="my-2.5 text-sm leading-[1.65] whitespace-pre-line text-muted">{sourceStep.note}</p>
              ) : null}
              {place === 'mix' && state.dirtyBar > 0 ? (
                <p className="my-2.5 text-sm leading-[1.65] whitespace-pre-line text-muted">
                  컵을 다른 작업대에 옮기면 이 작업대를 닦을 수 있어요.
                </p>
              ) : null}
            </details>
          </div>
        </>
      ) : (
        <>
          <WorkTitle>
            {state.customer?.stage === 'pickup' ? '손님에게 전달할 준비가 됐어요' : '음료가 완성됐어요'}
          </WorkTitle>
          {state.customer?.stage !== 'pickup' ? (
            <p className="my-2.5 text-sm leading-relaxed text-muted">
              {state.customer
                ? `손님 ${CUSTOMER_STATUS[state.customer.stage]}. 픽업대에 도착하면 전달하세요.`
                : '응대할 손님이 없어요.'}
            </p>
          ) : null}
          <WorkButton shortcut="F" primary disabled={state.customer?.stage !== 'pickup'} onUse={() => onConfirm(place)}>
            음료 전달하기
          </WorkButton>
          <TextButton onClick={() => onMoveCup(place)}>
            <kbd className="font-sans">E</kbd> 컵 다시 집기
          </TextButton>
        </>
      )}
    </WorkHud>
  )
}
