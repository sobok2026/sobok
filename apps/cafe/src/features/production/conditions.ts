import type { ProductionState, WorkStep } from './workflow'

export function observationStep(step: WorkStep, session: ProductionState): WorkStep {
  const condition = step.conditions.find((item) => session.decisions[item.id] === undefined)
  if (!condition) return step
  return {
    ...step,
    id: `${step.id}:observe:${condition.id}`,
    label: `${condition.property} 확인`,
    kind: 'condition',
    condition,
    tool: null,
    target: 1,
    maximum: 1,
    increment: 1,
    unit: '상태 확인',
    rate: 0,
    seconds: null,
    costs: {},
    mixesMaterialId: null,
    requiresMixedMaterialId: null,
    inputRequirements: null,
    requiresReusableTool: false,
  }
}

export function skipObservedSteps(steps: WorkStep[], session: ProductionState) {
  while (steps[session.cursor]?.conditions.some((condition) => session.decisions[condition.id] === false)) {
    session.cursor++
    session.progress = 0
    session.stepStart = null
  }
}

export function decideObservation(steps: WorkStep[], session: ProductionState, id: string, value: boolean): boolean {
  const step = steps[session.cursor]
  if (!step || session.tool || session.fault) return false
  const pending = step.conditions.find((condition) => session.decisions[condition.id] === undefined)
  if (!pending || pending.id !== id) return false
  session.decisions[id] = value
  skipObservedSteps(steps, session)
  return true
}
