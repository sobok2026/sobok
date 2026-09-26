import { type Costs, INGREDIENTS, type IngredientId, ingredientIds } from '../../content/ingredients'
import { recipeFor } from '../../content/recipes'
import type { GameState } from '../../simulation/state'
import { PREPARATIONS, preparationForMaterial } from '../preparation/rules'
import type { ProductionState, WorkStep } from '../production/workflow'
import { currentTicket } from '../service/orders'
import { cupService, cupSize } from './cups'
import { available } from './inventory'

export function inventorySummary(state: GameState) {
  const items = ingredientIds.map((id) => {
    const batches = state.batches.filter((batch) => batch.ingredient === id && batch.amount > 0)
    const expired = batches.filter((batch) => batch.expiresAt !== null && batch.expiresAt <= state.time)
    const sealed = batches.filter((batch) => batch.openedAt === null && !expired.includes(batch))
    const pending = batches.filter(
      (batch) => !expired.includes(batch) && !sealed.includes(batch) && (!batch.labelled || batch.location !== 'bar'),
    )
    const sum = (values: typeof batches) => values.reduce((amount, batch) => amount + batch.amount, 0)

    return {
      id,
      definition: INGREDIENTS[id],
      batches,
      sealed,
      amount: available(state, id),
      pending: sum(pending),
      expired: sum(expired),
      unopened: sum(sealed),
    }
  })
  const required: Costs = {}

  const add = (id: IngredientId, amount: number) => {
    required[id] = (required[id] ?? 0) + Math.max(0, amount)
  }

  const addPlan = (steps: WorkStep[], session: ProductionState | null, batches = 1) => {
    for (let index = session?.cursor ?? 0; index < steps.length; index++) {
      const step = steps[index]
      if (session && step.conditions.some((condition) => session.decisions[condition.id] === false)) {
        continue
      }
      const progress = session && index === session.cursor ? (session.resumeProgress ?? session.progress) : 0
      const remaining = Math.max(0, 1 - progress / step.target)
      for (const [id, amount] of Object.entries(step.costs)) add(id, amount * remaining * batches)
    }
  }

  const ticket = currentTicket(state)
  const requested = state.customer?.items[0]
  const recipe =
    state.cup?.recipe ?? ticket?.recipe ?? (state.customer?.stage === 'ordering' ? requested?.recipe : null)
  const size = state.cup ? cupSize(state.cup.craft.kind) : (ticket?.size ?? requested?.size)
  const service = state.cup ? cupService(state.cup.craft.kind) : (ticket?.service ?? requested?.service)
  const customizations = state.cup?.craft.customizations ?? ticket?.customizations ?? requested?.customizations
  if (recipe && size && service) {
    addPlan(
      recipeFor(recipe, size, service, customizations).steps,
      state.cup && !state.cup.craft.fault ? state.cup.craft : null,
    )
  }
  const prep = state.preparation && !state.preparation.fault ? state.preparation : null
  const activeOutput = prep && prep.stage !== 'ready' ? PREPARATIONS[prep.recipe].output : null
  if (activeOutput && prep) {
    addPlan(PREPARATIONS[prep.recipe].steps, prep)
  }
  const plannedBatches: Record<string, number> = {}
  const queue = Object.keys(required)

  for (let index = 0; index < queue.length; index++) {
    const id = queue[index]
    const definition = preparationForMaterial(id)
    if (!definition) {
      continue
    }
    const stock = items.find((item) => item.id === id)!
    const preparing = activeOutput?.materialId === id ? activeOutput.amount : 0
    const shortage = Math.max(0, required[id] - stock.amount - stock.pending - preparing)
    const batches = Math.ceil(shortage / definition.output.amount)
    const extra = batches - (plannedBatches[id] ?? 0)
    if (extra <= 0) {
      continue
    }
    plannedBatches[id] = batches
    addPlan(definition.steps, null, extra)
    queue.push(...new Set(definition.steps.flatMap((step) => Object.keys(step.costs))))
  }

  return items
    .map((item) => {
      const needed = required[item.id] ?? 0
      const shortage = Math.max(0, needed - item.amount)

      return {
        ...item,
        needed,
        shortage,
        priority: stockPriority(shortage, item),
      }
    })
    .sort((a, b) => a.priority - b.priority)
}

function stockPriority(shortage: number, item: { expired: number; pending: number }) {
  if (shortage > 0.0001) {
    return 0
  }
  if (item.expired > 0) {
    return 1
  }
  return item.pending > 0 ? 2 : 3
}
