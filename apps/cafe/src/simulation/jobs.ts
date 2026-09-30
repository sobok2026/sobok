import { finishDripJob, settleDrip } from '../features/drip-coffee/actions'
import { finishPreparation } from '../features/preparation/actions'
import { rackCount } from '../features/washing/rules'
import { say } from './feedback'
import type { WorkContext } from './work-context'

export function completeJobs(work: WorkContext) {
  const s = work.state
  const finished = s.jobs.filter((job) => job.endsAt <= s.time)
  s.jobs = s.jobs.filter((job) => job.endsAt > s.time)

  for (const job of finished) {
    if (job.kind === 'dishwasher') {
      s.dishwasher.clean = true
      s.totals.washed += rackCount(s.dishwasher.rack)
      say(s, '식기 세척이 끝났어요. 후드를 올리고 랙을 건조대에 꺼내주세요.', 'success')
    } else if (job.kind === 'drip-coffee') {
      finishDripJob(s, job)
    } else if (job.kind === 'cold-brew') {
      const brew = s.coldBrew
      if (brew && brew.id === job.preparationId && brew.stage === 'extracting') {
        brew.stage = 'finished'
        brew.completedAt = job.endsAt
        s.totals.prepared++
        say(s, '콜드 브루 추출이 끝났어요. 회수·라벨 쓰기·냉장 보관을 진행해주세요.', 'success')
      }
    } else if (job.preparationId && s.preparation?.id === job.preparationId && s.preparation.stage === 'processing') {
      s.preparation.stage = 'measuring'
      say(s, `${job.label} 완료.`, 'success')
      finishPreparation(work, job.endsAt)
    } else if (job.cupId && s.cup?.id === job.cupId) {
      say(s, `${job.label} 완료.`, 'success')
    }
  }
  settleDrip(s)
}
