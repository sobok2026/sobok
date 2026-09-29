import { CLEANING_SECONDS } from '../features/cleaning/rules'
import { applyColdBrew } from '../features/cold-brew/actions'
import { applyCraft } from '../features/crafting/actions'
import { operationFor } from '../features/crafting/rules'
import { applyDrip } from '../features/drip-coffee/actions'
import { applyPreparation } from '../features/preparation/actions'
import { preparationStep } from '../features/preparation/rules'
import { WASH_STEPS } from '../features/washing/rules'
import type { WorkContext } from './work-context'

/** Integrate flow over the hold so short taps do not depend on animation-frame boundaries. */
function pouredSeconds(held: number) {
  const gentle = Math.min(held, 0.25) * 0.25
  const ramp = Math.min(0.25, Math.max(0, held - 0.25))
  return gentle + ramp * 0.25 + (0.75 * ramp * ramp) / 0.5 + Math.max(0, held - 0.5)
}

export function advanceWork(work: WorkContext, dt: number, heldSeconds: number) {
  const seconds = Math.min(dt, 0.15)
  const pouring = pouredSeconds(heldSeconds + seconds) - pouredSeconds(heldSeconds)
  const s = work.state
  if (work.input?.kind === 'drip') {
    applyDrip(work, pouring)
  } else if (work.input?.kind === 'clean') {
    const cleaning = s.cleaning
    if (!cleaning || cleaning.id !== work.input.cleaningId || cleaning.stage === 'collect') {
      work.input = null
    } else {
      const duration = CLEANING_SECONDS[cleaning.stage]
      cleaning.progress = Math.min(duration, cleaning.progress + seconds)
      if (cleaning.progress >= duration) {
        work.input = null
      }
    }
  } else if (work.input?.kind === 'wash') {
    const washing = s.washing
    if (!washing || washing.id !== work.input.washingId || washing.stage !== work.input.stage) {
      work.input = null
    } else {
      const duration = WASH_STEPS[work.input.stage].seconds
      washing.progress = Math.min(duration, washing.progress + seconds)
      if (washing.progress >= duration) {
        work.input = null
      }
    }
  } else if (work.input?.kind === 'prep') {
    const prep = s.preparation
    if (
      !prep ||
      prep.id !== work.input.preparationId ||
      prep.cursor !== work.input.step ||
      prep.stage !== 'measuring'
    ) {
      work.input = null
    } else {
      const step = preparationStep(prep)
      if (step) {
        applyPreparation(work, step, (step.kind === 'pour' ? pouring : seconds) * step.rate)
      } else {
        work.input = null
      }
    }
  } else if (work.input?.kind === 'cold') {
    if (s.coldBrew?.id !== work.input.preparationId || s.coldBrew.step !== work.input.step) {
      work.input = null
    } else {
      applyColdBrew(work, pouring)
    }
  } else if (work.input?.kind === 'drink') {
    const c = s.cup
    const op = c ? operationFor(c.recipe, c.craft) : null
    if (
      !c ||
      c.id !== work.input.cupId ||
      c.craft.cursor !== work.input.step ||
      op?.station !== work.input.station ||
      op?.id !== work.input.operation
    ) {
      work.input = null
    } else {
      applyCraft(work, op, (op.kind === 'pour' ? pouring : seconds) * op.rate)
    }
  }
}
