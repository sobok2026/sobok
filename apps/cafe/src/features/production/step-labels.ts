import type { RecipeCatalog } from '../../content/recipe-catalog'
import type { PlannedStep, ResolvedOperation } from '../../content/recipe-plan'

type Action = ResolvedOperation['action']
type OperationOf<A extends Action> = Extract<ResolvedOperation, { action: A }>
type NameOf = (id: string) => string

export const itemName = (catalog: RecipeCatalog, id: string) =>
  catalog.materials.get(id)?.name ?? catalog.equipment.get(id)?.name ?? catalog.vessels.get(id)?.name ?? '작업 재료'

export const portionNames = { liquid: '액체만', foam: '거품만', all: '전체' } as const

// Named the way the recipe data names a step that has a single operation: the material, or the work itself.
const operationLabels: { [A in Action]: (operation: OperationOf<A>, name: NameOf) => string } = {
  add: (operation, name) => name(operation.materialId),
  transfer: (operation, name) => `${name(operation.from)} → ${name(operation.into)}`,
  strain: (operation, name) => `${name(operation.from)} → ${name(operation.into)} 거르기`,
  steam: () => '스팀',
  aerate: () => '공기 주입',
  espresso: () => '샷 추출',
  grind: (operation, name) => `${name(operation.materialId)} 분쇄`,
  mix: () => '혼합',
  shake: () => '쉐이킹',
  swirl: () => '스월링',
  muddle: () => '머들링',
  squeeze: (operation, name) => `${name(operation.materialId)} 즙 내기`,
  'run-machine': (operation, name) => `${name(operation.equipmentId)} 작동`,
  etch: (operation) => `${operation.pattern ?? '무늬'} 그리기`,
  charge: () => '가스 주입',
  steep: () => '우리기',
  remove: (operation, name) => `${name(operation.itemId)} 제거`,
  peel: (operation, name) => `${name(operation.materialId)} 껍질 벗기기`,
  cut: (operation, name) => `${name(operation.materialId)} 자르기`,
  arrange: (operation, name) => `${name(operation.materialId)} 모양 내기`,
  place: (operation, name) => `${name(operation.itemId)} 놓기`,
  attach: (operation, name) => `${name(operation.itemId)} 끼우기`,
  cover: () => '뚜껑 덮기',
  wash: () => '세척',
  sanitize: () => '소독',
  dry: () => '건조',
  label: () => '라벨 부착',
  store: () => '보관',
  wait: () => '대기',
  serve: () => '제공',
}

function operationLabel(catalog: RecipeCatalog, operation: ResolvedOperation) {
  const label = operationLabels[operation.action] as (operation: ResolvedOperation, name: NameOf) => string

  return label(operation, (id) => itemName(catalog, id))
}

/** What separates two operations of the same kind in one recipe step, such as where they pour. */
function operationDetail(catalog: RecipeCatalog, operation: ResolvedOperation) {
  if ('placement' in operation && operation.placement) {
    return operation.placement
  }
  if ('portion' in operation && operation.portion) {
    return portionNames[operation.portion]
  }
  if ('into' in operation) {
    return itemName(catalog, operation.into)
  }
  return 'vessel' in operation ? itemName(catalog, operation.vessel) : null
}

/**
 * Work step labels for a plan. A recipe step that covers several operations names each operation by what it does,
 * and when that name repeats elsewhere in the plan it adds the detail that differs, such as where it pours.
 */
export function workStepLabels(catalog: RecipeCatalog, plan: PlannedStep[]): string[] {
  const labels = plan.map((step) => (step.sharedLabel ? operationLabel(catalog, step.operation) : step.label))

  return labels.map((label, index) => {
    const step = plan[index]
    const twins = plan.filter((_, otherIndex) => labels[otherIndex] === label)
    if (!step.sharedLabel || twins.length < 2) {
      return label
    }
    const details = twins.map((twin) => operationDetail(catalog, twin.operation))
    const detail = operationDetail(catalog, step.operation)

    return detail && new Set(details).size > 1 ? `${label} · ${detail}` : label
  })
}
