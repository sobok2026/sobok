import type { StationId } from '../content/stations'
import { uid } from '../shared/id'
import type { GameState, Job } from './state'

export function say(state: GameState, text: string, tone: 'info' | 'success' | 'error' = 'info') {
  state.messages = [...state.messages.slice(-5), { id: uid(), text, tone }]
}

export function startJob(
  state: GameState,
  kind: Job['kind'],
  station: StationId,
  label: string,
  seconds: number,
  extra: Partial<Job> = {},
) {
  state.jobs.push({ id: uid(), kind, station, label, startedAt: state.time, endsAt: state.time + seconds, ...extra })
  say(state, `${label} 시작. 기다리는 동안 다른 업무를 할 수 있어요.`)
}
