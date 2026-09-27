import { recipeCatalog } from '../../content/catalog'
import { type Customizations, noCustomizations } from '../../content/customizations'
import type { DrinkSize } from '../../content/drink-sizes'
import { type RecipeId, recipeFor } from '../../content/recipes'
import type { StationId } from '../../content/stations'
import type { CraftState, GameState } from '../../simulation/state'
import { type CupKind, cupService } from '../inventory/cups'
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

type Cup = NonNullable<GameState['cup']>
export type VesselPlace = StationId | 'hand'

export const cupRecipe = (cup: Cup) =>
  recipeFor(cup.recipe, cup.craft.size, cupService(cup.craft.kind), cup.craft.customizations)

export function operationFor(recipe: RecipeId, craft: CraftState): WorkStep | null {
  const plan = recipeFor(recipe, craft.size, cupService(craft.kind), craft.customizations).steps
  return currentWorkStep(plan, craft) ?? null
}

export function createCraft(
  kind: CupKind,
  size: DrinkSize,
  customizations: Customizations = noCustomizations(),
): CraftState {
  return {
    ...createProductionState(),
    customizations: structuredClone(customizations),
    kind,
    size,
    location: 'hand',
    places: {},
    lidded: false,
    sticker: false,
  }
}

export function nextStep(state: GameState): WorkStep | undefined {
  return state.cup ? (operationFor(state.cup.recipe, state.cup.craft) ?? undefined) : undefined
}

/** Every vessel a step pours from, into or works on. Serving counts as work on the cup itself. */
export function stepVessels(step: WorkStep, servingId: string): string[] {
  const operation = step.operation as Record<string, unknown>
  const ids = ['from', 'into', 'vessel'].flatMap((key) =>
    typeof operation[key] === 'string' ? [operation[key] as string] : [],
  )
  if (step.operation.action === 'serve') {
    ids.push(servingId)
  }
  return [...new Set(ids)]
}

/**
 * Where a vessel of this drink sits. The cup is where the player put it. A helper vessel such as the steam pitcher
 * stays where it was last used; before its first use it waits at the station of the step that needs it.
 */
export function vesselPlace(cup: Cup, id: string, step?: WorkStep | null): VesselPlace | null {
  if (id === cupRecipe(cup).vesselId) {
    return cup.craft.location
  }
  return cup.craft.places[id] ?? (step && stepVessels(step, cupRecipe(cup).vesselId).includes(id) ? step.station : null)
}

export const heldVessel = (cup: GameState['cup']) =>
  Object.entries(cup?.craft.places ?? {}).find(([, place]) => place === 'hand')?.[0] ?? null

export const vesselBusy = (state: GameState, cup: Cup, id: string) =>
  state.jobs.some((job) => job.cupId === cup.id && job.vessel === id)

/** The vessels the current step needs that are somewhere else, with where each one is. */
export function misplacedVessels(cup: Cup, step: WorkStep) {
  return stepVessels(step, cupRecipe(cup).vesselId).flatMap((id) => {
    const place = vesselPlace(cup, id, step)
    return place === step.station ? [] : [{ id, place }]
  })
}

/** The next station that needs the cup, from the current step on. */
export function nextCupStation(cup: Cup): StationId {
  const { steps, vesselId } = cupRecipe(cup)
  return (
    steps.slice(cup.craft.cursor).find((step) => stepVessels(step, vesselId).includes(vesselId))?.station ?? 'pickup'
  )
}

/** The next station that needs a helper vessel, from the current step on. */
export function nextVesselStation(cup: Cup, id: string): StationId | null {
  const { steps, vesselId } = cupRecipe(cup)
  return steps.slice(cup.craft.cursor).find((step) => stepVessels(step, vesselId).includes(id))?.station ?? null
}

export function vesselName(cup: Cup, id: string) {
  if (id === cupRecipe(cup).vesselId) {
    return '컵'
  }
  return recipeCatalog.vessels.get(id)?.name ?? '용기'
}

/** Which of this drink's vessels E picks up at a station: first one the next step needs elsewhere, then the cup. */
export function vesselToPick(state: GameState, station: StationId): string | null {
  const cup = state.cup
  if (!cup) {
    return null
  }
  const step = nextStep(state)
  const here = [cupRecipe(cup).vesselId, ...Object.keys(cup.craft.places)].filter(
    (id) => vesselPlace(cup, id, step) === station && !vesselBusy(state, cup, id),
  )
  const needed = step
    ? here.find((id) => step.station !== station && stepVessels(step, cupRecipe(cup).vesselId).includes(id))
    : undefined
  return needed ?? here.find((id) => id === cupRecipe(cup).vesselId) ?? here[0] ?? null
}

/** The station where the drink's next step happens, while the player's hands are free to work. */
export function craftWorkStation(state: GameState): StationId | null {
  const cup = state.cup
  if (!cup || cup.craft.location === 'hand' || heldVessel(cup)) {
    return null
  }
  return nextStep(state)?.station ?? null
}

/** Whether the drink has anything to show at this station: its next step, a running machine or a vessel. */
export function craftingAt(state: GameState, station: StationId | null) {
  const cup = state.cup
  if (!cup || !station || cup.craft.location === 'hand' || heldVessel(cup)) {
    return false
  }
  return (
    craftWorkStation(state) === station ||
    state.jobs.some((job) => job.cupId === cup.id && job.station === station) ||
    vesselToPick(state, station) !== null
  )
}

export function toolName(id: string): string {
  const separator = id.indexOf(':')
  const kind = id.slice(0, separator)
  const resource = id.slice(separator + 1)
  if (kind === 'material') {
    return recipeCatalog.materials.get(resource)?.name ?? '재료 용기'
  }
  if (kind === 'vessel') {
    return recipeCatalog.vessels.get(resource)?.name ?? '제조 용기'
  }
  if (kind === 'equipment') {
    return recipeCatalog.equipment.get(resource)?.name ?? '제조 도구'
  }
  if (kind === 'equipment-set') {
    return resource
      .split('|')
      .map((tool) => recipeCatalog.equipment.get(tool)?.name ?? '도구')
      .join(' · ')
  }
  return '리드'
}
