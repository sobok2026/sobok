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
        say(s, '콜드 브루 추출이 끝났어요. 회수·라벨·냉장 보관을 진행해주세요.', 'success')
      }
    } else if (job.preparationId && s.preparation?.id === job.preparationId && s.preparation.cursor === job.stepIndex) {
      s.preparation.stage = 'measuring'
      say(s, `${job.label} 완료. 상태를 확인하고 다음 단계로 진행해주세요.`, 'success')
    } else if (job.cupId && s.cup?.id === job.cupId && s.cup.craft.cursor === job.stepIndex) {
      say(s, `${job.label} 완료. 상태를 확인하고 다음 단계로 진행해주세요.`, 'success')
    }
  }
}
