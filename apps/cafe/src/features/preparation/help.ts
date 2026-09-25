import type { WorkTip as Tip } from '../../shared/work-tip'
import type { GameState, Preparation } from '../../simulation/state'
import { materialTip } from '../inventory/help'
import { available } from '../inventory/inventory'
import { PREP_TOOL_NAMES, PREPARATIONS, preparationStep } from './rules'
export function preparationTip(state: GameState, prep: Preparation): Tip {
  if (prep.fault)
    return {
      title: '배합을 다시 준비해야 해요',
      action: '준비대에서 F로 배합을 폐기하고 다시 시작하세요.',
      reason: prep.fault,
      fault: true,
    }
  if (prep.stage === 'ready') {
    const batch = state.batches.find((item) => item.id === prep.batchId)
    if (batch?.expiresAt != null && batch.expiresAt <= state.time)
      return {
        title: '기한이 지난 배합이에요',
        action: '준비대에서 이 배치를 폐기한 뒤 다시 준비하세요.',
        reason: '라벨을 붙이거나 보관해도 만료 시각은 늘어나지 않아요.',
        fault: true,
      }
    return materialTip(state, prep.recipe)
  }
  if (prep.stage === 'processing')
    return {
      title: '블렌딩 중이에요',
      action: '작업이 끝나면 준비대로 돌아와 라벨을 붙이세요.',
      reason: '기다리는 동안 다른 일을 할 수 있어요. 진행 시간은 매장 현황에서 확인해요.',
    }
  const step = preparationStep(prep)
  if (
    step.ingredient &&
    available(state, step.ingredient) + 0.0001 <
      Math.max(0, step.target * (1 - step.tolerance) - prep.progress) * (step.perUnit ?? 1)
  )
    return materialTip(state, step.ingredient)
  const ready = step.kind !== 'machine' && prep.progress >= step.target * (1 - step.tolerance)
  return {
    title: `${PREPARATIONS[prep.recipe].name} · ${step.label}`,
    action:
      prep.tool && (ready || prep.tool !== step.tool)
        ? 'G로 도구를 내려놓으세요.'
        : ready
          ? 'F로 계량을 확인하세요.'
          : step.tool && prep.tool !== step.tool
            ? `G로 도구를 집으세요 · ${PREP_TOOL_NAMES[step.tool]}`
            : step.kind === 'machine'
              ? 'Space를 한 번 눌러 블렌딩을 시작하세요.'
              : ['pump', 'pack', 'scoop', 'shake'].includes(step.kind)
                ? `Space를 한 번씩 눌러 ${step.target}${step.unit}를 맞추세요.`
                : 'Space나 작업 버튼을 누르다가 목표 구간에서 손을 떼세요.',
    reason: '다음 재료를 넣기 전에 도구를 놓고 계량을 확인해요. 완성 후에는 라벨·보관이 필요해요.',
  }
}
