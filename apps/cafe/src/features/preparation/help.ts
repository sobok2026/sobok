import { INGREDIENTS, type IngredientId } from '../../content/ingredients'
import type { WorkTip as Tip } from '../../shared/work-tip'
import { cupHandsBusy } from '../../simulation/hands'
import type { GameState, Preparation } from '../../simulation/state'
import { materialTip } from '../inventory/help'
import { available } from '../inventory/inventory'
import { operationDetails, workUseLabel } from '../production/presentation'
import { continuousWork, readyWork } from '../production/runtime'
import { PRODUCTION_EPSILON, type WorkStep } from '../production/workflow'
import { PREPARATIONS, preparationStep } from './rules'

export function preparationMissingIngredient(
  state: GameState,
  prep: Preparation,
  step: WorkStep,
): IngredientId | undefined {
  const remaining =
    step.inputRequirements ??
    Object.fromEntries(
      Object.entries(step.costs).map(([id, amount]) => [
        id,
        (amount ?? 0) * Math.max(0, 1 - prep.progress / step.target),
      ]),
    )

  return Object.entries(remaining).find(
    ([id, amount]) => available(state, id) + PRODUCTION_EPSILON < (amount ?? 0),
  )?.[0]
}

export function preparationTip(state: GameState, prep: Preparation): Tip {
  const definition = PREPARATIONS[prep.recipe]
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
    return materialTip(state, definition.output.materialId)
  }

  const step = preparationStep(prep)
  if (!step)
    return {
      title: '준비 상태를 확인해야 해요',
      action: '준비대에서 배합을 정리하고 다시 시작하세요.',
      reason: '다음 제조 단계를 찾을 수 없어요.',
      fault: true,
    }
  if (prep.stage === 'processing' || state.jobs.some((job) => job.preparationId === prep.id))
    return {
      title: `${step.label} 진행 중이에요`,
      action: prep.tool
        ? 'G로 도구를 내려놓을 수 있어요. 작동 후 F로 현재 단계를 확인하세요.'
        : '작동이 끝나면 준비대로 돌아와 F로 현재 단계를 확인하세요.',
      reason: '기다리는 동안 다른 일을 할 수 있어요. 장비 작동만으로 다음 단계가 완료되지는 않아요.',
    }
  if (cupHandsBusy(state.cup))
    return {
      title: '손을 먼저 비워주세요',
      action: '음료 컵과 도구를 내려놓은 뒤 준비대로 돌아오세요.',
      reason: '음료 컵과 준비 도구를 함께 들 수 없어요.',
    }
  const missing = preparationMissingIngredient(state, prep, step)
  if (missing) return materialTip(state, missing)
  if (step.requiresReusableTool && !prep.reservedTool && !state.tools.clean)
    return {
      title: '깨끗한 제조 용기가 필요해요',
      action: '세척대에서 용기를 씻고 도구 선반에 보관하세요.',
      reason: `${step.label}에 사용할 용기가 없어요.`,
    }
  const ready = readyWork(step, prep.progress)

  return {
    title: `${definition.name} · ${step.label}`,
    action: stepAction(prep, step, ready),
    reason: [step.measurement, ...operationDetails(step), step.instruction, step.note].filter(Boolean).join(' · '),
  }
}

function stepAction(prep: Preparation, step: WorkStep, ready: boolean) {
  if (prep.tool && (ready || prep.tool !== step.tool?.id)) return 'G로 도구를 내려놓으세요.'
  if (ready) return 'F로 현재 단계를 확인하세요.'
  if (step.tool && prep.tool !== step.tool.id) return `G로 ${step.tool.name}를 집으세요.`
  if (continuousWork(step)) return 'Space를 누르고 진행한 뒤 목표에 도달하면 손을 떼세요.'
  return `Space로 ${workUseLabel(step)} 후 F로 확인하세요.`
}

export function preparationSupplyNotice(state: GameState, prep: Preparation, step: WorkStep): string | null {
  const missing = preparationMissingIngredient(state, prep, step)
  if (missing) return `${INGREDIENTS[missing].name} 보충이 필요해요. 도구를 내려놓고 재료를 준비해주세요.`
  if (step.requiresReusableTool && !prep.reservedTool && !state.tools.clean)
    return '깨끗한 제조 용기가 없어요. 세척하고 도구 선반에 보관해주세요.'
  return null
}
