import { finishCraftStep } from '../features/crafting/actions'
import { operationFor } from '../features/crafting/rules'

import { finishPreparation } from '../features/preparation/actions'
import { say } from './feedback'
import type { WorkContext } from './work-context'

export function completeJobs(work: WorkContext) {
  const s = work.state
  const finished = s.jobs.filter((job) => job.endsAt <= s.time)
  s.jobs = s.jobs.filter((job) => job.endsAt > s.time)
  for (const job of finished) {
    if (job.kind === 'cold-brew') {
      const brew = s.coldBrew
      if (brew && brew.id === job.preparationId && brew.stage === 'extracting') {
        brew.stage = 'finished'
        brew.completedAt = job.endsAt
        s.totals.prepared++
        say(s, '콜드 브루 추출이 끝났어요. 추출대에서 용기에 회수한 뒤 라벨을 붙이고 냉장 보관해주세요.', 'success')
      }
      continue
    }
    if (job.preparationId) {
      if (s.preparation?.id === job.preparationId && s.preparation.stage === 'processing')
        finishPreparation(work, job.endsAt)
      continue
    }
    if (job.kind === 'craft-machine' && s.cup?.id === job.cupId && s.cup && s.cup.step === job.stepIndex) {
      const c = s.cup.craft
      const op = operationFor(s.cup.recipe, s.cup.step, c)
      if (op) finishCraftStep(s, op)
    }
  }
}
