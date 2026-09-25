import { recipeCatalog } from '../../content/catalog'
import { type RecipeId, recipeFor } from '../../content/recipes'
import type { StationId } from '../../content/stations'
import type { CraftState, GameState } from '../../simulation/state'
import { type CupKind, cupService, cupSize } from '../inventory/cups'
import { currentWorkStep } from '../production/runtime'
import { createProductionState, type WorkStep } from '../production/workflow'

export const craftStations: StationId[] = [
  'espresso',
  'steam',
  'brew',
  'water',
  'ice',
  'sauce',
  'mix',
  'topping',
  'prep',
  'pickup',
]
export function operationFor(recipe: RecipeId, craft: CraftState): WorkStep | null {
  const plan = recipeFor(recipe, cupSize(craft.kind), cupService(craft.kind)).steps
  return currentWorkStep(plan, craft) ?? null
}
export function createCraft(kind: CupKind): CraftState {
  return { ...createProductionState(), kind, location: 'hand', lidded: false }
}
export function nextStep(state: GameState): WorkStep | undefined {
  return state.cup ? (operationFor(state.cup.recipe, state.cup.craft) ?? undefined) : undefined
}
export function toolName(id: string): string {
  const separator = id.indexOf(':')
  const kind = id.slice(0, separator)
  const resource = id.slice(separator + 1)
  if (kind === 'material') return recipeCatalog.materials.get(resource)?.name ?? '재료 용기'
  if (kind === 'vessel') return recipeCatalog.vessels.get(resource)?.name ?? '제조 용기'
  if (kind === 'equipment') return recipeCatalog.equipment.get(resource)?.name ?? '제조 도구'
  if (kind === 'equipment-set')
    return resource
      .split('|')
      .map((tool) => recipeCatalog.equipment.get(tool)?.name ?? '도구')
      .join(' · ')
  return '리드'
}
