export type Washing = {
  id: string
  stage: 'scrub' | 'rinse' | 'ready' | 'carrying'
  progress: number
  spongeHeld: boolean
}

// Prototype interaction times; these are not real sanitation procedures.
export const WASH_STEPS = {
  scrub: { label: '피처 문지르기', seconds: 2.5, cue: 'G로 스펀지를 집고 누르는 동안 문질러요.' },
  rinse: { label: '피처 헹구기', seconds: 1.5, cue: '누르는 동안 물로 헹궈요. 끝나면 F로 확인하세요.' },
} as const
export const WASH_SPOT: [number, number, number] = [-5, 1.13, -5.05]
export function washingHandsBusy(washing: Washing | null) {
  return !!washing && (washing.spongeHeld || washing.stage === 'carrying')
}
