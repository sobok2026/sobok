import type { WorkTip as Tip } from '../../shared/work-tip'
import { cupHandsBusy } from '../../simulation/hands'
import type { GameState, Preparation } from '../../simulation/state'
import { materialTip } from '../inventory/help'
import { operationDetails, workUseLabel } from '../production/presentation'
import { continuousWork, missingInput, readyWork, requiredInput } from '../production/runtime'
import type { WorkStep } from '../production/workflow'
import { PREPARATIONS, preparationStep } from './rules'

export function preparationTip(state: GameState, prep: Preparation): Tip {
  const definition = PREPARATIONS[prep.recipe]
  if (prep.fault) {
    return {
      title: '배합을 다시 준비해야 해요',
      action: '준비대에서 폐기 버튼을 길게 눌러 배합을 폐기하고 다시 시작하세요.',
      reason: prep.fault,
      fault: true,
    }
  }

  if (prep.stage === 'ready') {
    const batch = state.batches.find((item) => item.id === prep.batchId)
    if (batch?.expiresAt != null && batch.expiresAt <= state.time) {
      return {
        title: '기한이 지난 배합이에요',
        action: '준비대에서 폐기 버튼을 길게 눌러 폐기한 뒤 다시 준비하세요.',
        reason: '라벨을 쓰거나 보관해도 만료 시각은 늘어나지 않아요.',
        fault: true,
      }
    }
    return materialTip(state, definition.output.materialId)
  }

  const step = preparationStep(prep)
  if (!step) {
    return {
      title: '준비 상태를 확인해야 해요',
      action: '준비대에서 배합을 정리하고 다시 시작하세요.',
      reason: '다음 제조 단계를 찾을 수 없어요.',
      fault: true,
    }
  }
  if (prep.stage === 'processing' || state.jobs.some((job) => job.preparationId === prep.id)) {
    return {
      title: `${step.label} 진행 중이에요`,
      action: prep.tool
        ? '도구를 내려놓을 수 있어요. 작동 후 확인 버튼으로 현재 단계를 확인하세요.'
        : '작동이 끝나면 준비대로 돌아와 확인 버튼으로 현재 단계를 확인하세요.',
      reason: '기다리는 동안 다른 일을 할 수 있어요. 장비 작동만으로 다음 단계가 완료되지는 않아요.',
    }
  }
  if (cupHandsBusy(state.cup)) {
    return {
      title: '손을 먼저 비워주세요',
      action: '음료 컵과 도구를 내려놓은 뒤 준비대로 돌아오세요.',
      reason: '음료 컵과 준비 도구를 함께 들 수 없어요.',
    }
  }
  const missing = missingInput(state, step, prep.progress)
  if (missing) {
    return materialTip(state, missing, step.stockArea, requiredInput(step, missing, prep.progress))
  }
  if (step.requiresReusableTool && !prep.reservedTool && !state.tools.clean) {
    return {
      title: '깨끗한 제조 용기가 필요해요',
      action: '세척대에서 용기를 씻고 도구 선반에 보관하세요.',
      reason: `${step.label}에 사용할 용기가 없어요.`,
    }
  }
  if (step.station === 'grinder') {
    return {
      title: '에스프레소 칩 분쇄',
      action: 'BUNN G3를 열고 ESPRESSO를 선택한 뒤 원두 스쿱으로 2~3회 분쇄하세요.',
      reason: '원두는 바 실온 선반에서 사용해요. 분쇄를 마치면 스쿱을 놓고 확인·라벨·보관을 이어가세요.',
    }
  }

  const ready = readyWork(step, prep.progress)

  return {
    title: `${definition.name} · ${step.label}`,
    action: stepAction(prep, step, ready),
    reason: [step.measurement, ...operationDetails(step), step.instruction, step.note].filter(Boolean).join(' · '),
  }
}

function stepAction(prep: Preparation, step: WorkStep, ready: boolean) {
  if (prep.tool && (ready || prep.tool !== step.tool?.id)) {
    return '도구를 내려놓으세요.'
  }
  if (ready) {
    return '확인 버튼으로 현재 단계를 확인하세요.'
  }
  if (step.tool && prep.tool !== step.tool.id) {
    return `${step.tool.name}를 집으세요.`
  }
  if (continuousWork(step)) {
    return '작업 버튼을 누르고 진행한 뒤 목표에 도달하면 손을 떼세요.'
  }
  return `작업 버튼으로 ${workUseLabel(step)} 후 확인 버튼을 누르세요.`
}
