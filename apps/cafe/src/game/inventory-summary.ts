import { type Costs, INGREDIENTS, type IngredientId, ingredientIds, RECIPES } from './catalog'
import { operationFor } from './crafting'
import { available } from './inventory'
import { PREPARATIONS, preparationIds } from './preparation'
import type { GameState } from './state'

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
  const recipe =
    state.cup?.recipe ??
    state.ticket?.recipe ??
    (state.phase === 'open' && state.customer && !state.customer.visit && state.customer.stage !== 'leaving'
      ? state.request
      : null)
  if (recipe) {
    const cup = state.cup?.craft.fault ? null : state.cup
    const stepIndex = cup?.step ?? 0
    for (let index = stepIndex; index < RECIPES[recipe].steps.length; index++) {
      if (cup && index === stepIndex && state.jobs.some((job) => job.cupId === cup.id)) continue
      const operation = cup && index === stepIndex ? operationFor(cup.recipe, cup.step, cup.craft) : null
      const remaining =
        operation && operation.kind !== 'shake' ? Math.max(0, 1 - cup!.craft.progress / operation.target) : 1
      for (const [id, amount] of Object.entries(RECIPES[recipe].steps[index].costs))
        add(id as IngredientId, amount * remaining)
    }
  }
  for (const id of preparationIds) {
    const stock = items.find((item) => item.id === id)!
    const prep = state.preparation?.recipe === id ? state.preparation : null
    const needsBatch = (required[id] ?? 0) > stock.amount + stock.pending + 0.0001
    if (prep?.stage === 'ready' || (prep && !prep.fault && prep.stage === 'processing')) continue
    if (!prep && !needsBatch) continue
    const steps = PREPARATIONS[id].steps
    for (let index = prep && !prep.fault ? prep.step : 0; index < steps.length; index++) {
      const step = steps[index]
      if (!step.ingredient) continue
      const remaining = step.target - (prep && !prep.fault && index === prep.step ? prep.progress : 0)
      add(step.ingredient, remaining * (step.perUnit ?? 1))
    }
  }
  const inventory = items
    .map((item) => {
      const needed = required[item.id] ?? 0
      const shortage = Math.max(0, needed - item.amount)
      return { ...item, needed, shortage, priority: shortage > 0.0001 ? 0 : item.expired ? 1 : item.pending ? 2 : 3 }
    })
    .sort((a, b) => a.priority - b.priority)
  return inventory
}
