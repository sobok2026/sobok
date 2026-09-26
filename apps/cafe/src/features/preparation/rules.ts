import { recipeCatalog } from '../../content/catalog'
import { INGREDIENTS } from '../../content/ingredients'
import { preparationPlan } from '../../content/production-plans'
import type { Preparation } from '../../simulation/state'
import { currentWorkStep } from '../production/runtime'
import { compileWorkflow, createProductionState, type WorkStep } from '../production/workflow'

export type PreparationId = string

export type PreparationDefinition = {
  id: PreparationId
  recipeId: string
  variantId: string
  name: string
  steps: WorkStep[]
  output: ReturnType<typeof preparationPlan>['output']
  storageNote: string
  color?: string
}

export type UnavailablePreparation = { id: PreparationId; name: string; reason: string }

function buildPreparations() {
  const available: Record<PreparationId, PreparationDefinition> = {}
  const unavailable: UnavailablePreparation[] = []

  for (const recipe of recipeCatalog.recipes.values()) {
    if (recipe.kind !== 'preparation') continue
    for (const variant of recipe.variants) {
      if (variant.output?.materialId === 'coldBrew') continue
      const id = `${recipe.id}:${variant.id}`
      const name = recipe.variants.length > 1 ? `${recipe.name} · ${variant.name}` : recipe.name

      try {
        const prepared = preparationPlan(recipeCatalog, recipe.id, variant.id)
        available[id] = {
          id,
          recipeId: recipe.id,
          variantId: variant.id,
          name,
          steps: compileWorkflow(recipeCatalog, prepared.plan, prepared.costs, prepared.stockContext, 'prep'),
          output: prepared.output,
          storageNote: prepared.storageNote,
          color: INGREDIENTS[prepared.output.materialId].color,
        }
      } catch (error) {
        unavailable.push({ id, name, reason: error instanceof Error ? error.message : String(error) })
      }
    }
  }

  return { available, unavailable }
}

const preparations = buildPreparations()
export const PREPARATIONS = preparations.available
export const unavailablePreparations = preparations.unavailable
export const preparationIds: PreparationId[] = Object.keys(PREPARATIONS)

export function preparationForMaterial(materialId: string): PreparationDefinition | undefined {
  const producer = recipeCatalog.materials.get(materialId)?.preparationId
  const routes = Object.values(PREPARATIONS).filter((definition) => definition.output.materialId === materialId)
  return routes.find((definition) => definition.recipeId === producer) ?? routes[0]
}

export function createPreparation(recipe: PreparationId): Preparation {
  if (!PREPARATIONS[recipe]) throw new Error('준비할 수 없는 제조법입니다.')
  return { ...createProductionState(), id: crypto.randomUUID(), recipe, stage: 'measuring', batchId: null }
}

export function preparationStep(prep: Preparation): WorkStep | undefined {
  return currentWorkStep(PREPARATIONS[prep.recipe].steps, prep)
}
