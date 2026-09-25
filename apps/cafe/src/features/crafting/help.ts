import type { IngredientId } from '../../content/ingredients'
import { STATIONS } from '../../content/stations'
import type { WorkTip as Tip } from '../../shared/work-tip'
import type { GameState } from '../../simulation/state'
import { materialTip } from '../inventory/help'
import { available } from '../inventory/inventory'
import { isContinuous, nextStep, operationFor, readyToConfirm, TOOL_NAMES } from './rules'
export function craftTip(state: GameState, cup: NonNullable<GameState['cup']>): Tip {
  const craft = cup.craft
  const source = nextStep(state)
  const op = operationFor(cup.recipe, cup.step, craft)
  if (!op || !source)
    return {
      title: '완성한 음료를 전달하세요',
      action:
        craft.location !== 'pickup'
          ? craft.location === 'hand'
            ? '픽업대에서 E로 컵을 내려놓으세요.'
            : 'E로 컵을 집어 픽업대로 옮기세요.'
          : state.customer?.stage === 'pickup'
            ? '손님 요청을 확인하고 F로 전달하세요.'
            : '손님이 픽업대에 도착하면 F로 전달하세요.',
      reason: '전달이 완료되면 매출과 완료 주문에 반영돼요.',
    }
  const job = state.jobs.find((item) => item.cupId === cup.id)
  if (job)
    return {
      title: `${job.label} 중이에요`,
      action: '장비가 끝나면 컵을 집어 다음 작업대로 옮기세요.',
      reason: '작동 중에는 컵이 고정돼요. 현재 진행은 화면 아래에서 확인해요.',
    }
  if (craft.location === 'hand')
    return {
      title: `${STATIONS[source.station].name} 쪽으로 이동하세요`,
      action: '작업대를 보고 E로 컵을 내려놓으세요.',
      reason: '컵은 정해진 자리에 자동으로 놓여요. 제조는 카운터 안쪽에서 진행해요.',
    }
  if (craft.location !== source.station)
    return {
      title: '다음 작업대로 컵을 옮기세요',
      action: `${STATIONS[craft.location].name}에서 E로 집고 ${STATIONS[source.station].name}에 E로 놓으세요.`,
      reason: `다음 단계는 ${op.label}예요.`,
    }
  if ((source.usesPitcher || op.tool === 'pitcher') && !craft.pitcherReserved && !state.tools.clean)
    return {
      title: '깨끗한 피처가 필요해요',
      action: state.tools.washed
        ? '세척대에서 씻은 피처를 집어 도구 선반에 놓으세요.'
        : '컵은 여기에 두고 세척대에서 피처를 하나 씻으세요.',
      reason: '씻은 뒤 선반에 정리해야 제조에 사용할 수 있어요.',
    }
  for (const [id, amount] of Object.entries(op.stockPrerequisite ?? op.costs))
    if (
      available(state, id as IngredientId) + 0.0001 <
      amount * (op.stockPrerequisite ? 1 : Math.max(0, 1 - op.tolerance - craft.progress / op.target))
    )
      return materialTip(state, id as IngredientId)
  const ready = readyToConfirm(op, craft.progress)
  return {
    title: op.label,
    action:
      craft.tool && (ready || craft.tool !== op.tool)
        ? 'G로 들고 있는 도구를 내려놓으세요.'
        : ready
          ? op.kind === 'steam' || op.kind === 'machine'
            ? 'F로 장비 작동 완료를 확인하세요.'
            : op.kind === 'lid'
              ? 'F로 리드 부착을 확인하세요.'
              : 'F로 계량을 확인하고 다음 단계로 넘어가세요.'
          : op.tool && craft.tool !== op.tool
            ? `G로 도구를 집으세요 · ${TOOL_NAMES[op.tool]}`
            : op.kind === 'machine' || op.kind === 'steam'
              ? 'Space로 장비를 작동하고 F로 완료를 확인하세요.'
              : op.kind === 'dispense'
                ? 'Space로 주문 사이즈의 온수 버튼을 한 번 누른 뒤 F로 확인하세요.'
                : isContinuous(op)
                  ? 'Space나 작업 버튼을 누르다가 목표 기준선까지 계량하세요.'
                  : `Space를 한 번씩 눌러 ${op.target}${op.unit}를 맞추세요.`,
    reason:
      op.kind === 'dispense'
        ? '주문 사이즈에 맞는 온수가 자동으로 채워져요.'
        : isContinuous(op)
          ? '손을 떼면 즉시 멈춰요. 도구를 놓고 F로 확인하기 전까지는 같은 단계예요.'
          : '한 번 누를 때 한 회만 들어가요. 목표 횟수를 넘기지 않도록 확인하세요.',
  }
}
