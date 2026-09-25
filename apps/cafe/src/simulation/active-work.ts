import { CLEANING_SECONDS } from '../features/cleaning/rules'
import { applyColdBrew } from '../features/cold-brew/actions'
import { applyCraft } from '../features/crafting/actions'
import { operationFor } from '../features/crafting/rules'
import { applyPreparation } from '../features/preparation/actions'
import { preparationStep } from '../features/preparation/rules'
import { WASH_STEPS } from '../features/washing/rules'
import type { WorkContext } from './work-context'

export function advanceWork(work: WorkContext, dt: number) {
  const s = work.state
  if (work.input?.kind === 'clean') {
    const cleaning = s.cleaning
    if (!cleaning || cleaning.id !== work.input.cleaningId || cleaning.stage === 'collect') work.input = null
    else {
      const duration = CLEANING_SECONDS[cleaning.stage]
      cleaning.progress = Math.min(duration, cleaning.progress + Math.min(dt, 0.15))
      if (cleaning.progress >= duration) work.input = null
    }
  } else if (work.input?.kind === 'wash') {
    const washing = s.washing
    if (!washing || washing.id !== work.input.washingId || washing.stage !== work.input.stage) work.input = null
    else {
      const seconds = WASH_STEPS[work.input.stage].seconds
      washing.progress = Math.min(seconds, washing.progress + Math.min(dt, 0.15))
      if (washing.progress >= seconds) work.input = null
    }
  } else if (work.input?.kind === 'prep') {
    const prep = s.preparation
    if (!prep || prep.id !== work.input.preparationId || prep.cursor !== work.input.step || prep.stage !== 'measuring')
      work.input = null
    else {
      const step = preparationStep(prep)
      if (step) applyPreparation(work, step, Math.min(dt, 0.15) * step.rate)
      else work.input = null
    }
  } else if (work.input?.kind === 'cold') {
    if (s.coldBrew?.id !== work.input.preparationId || s.coldBrew.step !== work.input.step) work.input = null
    else applyColdBrew(work, Math.min(dt, 0.15))
  } else if (work.input?.kind === 'drink') {
    const c = s.cup
    const op = c ? operationFor(c.recipe, c.craft) : null
    if (
      !c ||
      c.id !== work.input.cupId ||
      c.craft.cursor !== work.input.step ||
      c.craft.location !== work.input.station ||
      op?.id !== work.input.operation
    )
      work.input = null
    else applyCraft(work, op, Math.min(dt, 0.15) * op.rate)
  }
}
