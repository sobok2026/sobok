import { scoreAxes } from './scoring'
import type { AxesResult, AxisResponse, DichoAxisId, Item } from './types'
import { DICHO_AXES } from './types'

// Inner = "how you are alone". Same four dichotomies as Persona, but every item is framed in a private,
// unobserved context ("아무도 없는 밤", "혼자일 때"). Deliberately NOT prefixed with the visitor's known
// type — a leading "you're usually extroverted, but…" invites agreement bias. The contrast that makes the
// product ("겉과 속이 다르다") comes out in the report by comparing this cold measurement against Persona,
// not by priming the question. 5 balanced items per axis.

const INNER_BANK: Record<DichoAxisId, readonly Item[]> = {
  EI: [
    // 다들 잠든 새벽, 지금 나는 (strong E first)
    { id: 'inner-EI-0', axis: 'EI', kind: 'choice', options: [2, 1, -1, -2] },
    // 혼밥 이틀째 (strong I first)
    { id: 'inner-EI-1', axis: 'EI', kind: 'choice', options: [-2, -1, 1, 2] },
    // 혼자 근무가 길어지면 (strong E first)
    { id: 'inner-EI-2', axis: 'EI', kind: 'choice', options: [2, 1, -1, -2] },
    // 혼자 시간이 훨씬 많아진다면 (slider, hi = 힘들다 = 외향 = E)
    { id: 'inner-EI-3', axis: 'EI', kind: 'scale', reverse: false },
    // 금요일 밤, 다들 나간 SNS를 보다가 (strong I first)
    { id: 'inner-EI-4', axis: 'EI', kind: 'choice', options: [-2, -1, 1, 2] },
  ],
  SN: [
    // 아무도 없는 밤 머릿속에 떠오르는 건 (strong S first)
    { id: 'inner-SN-0', axis: 'SN', kind: 'choice', options: [2, 1, -1, -2] },
    // 잠들기 직전 (strong N first)
    { id: 'inner-SN-1', axis: 'SN', kind: 'choice', options: [-2, -1, 1, 2] },
    // 혼자 쉴 때 보는 영상 (strong S first)
    { id: 'inner-SN-2', axis: 'SN', kind: 'choice', options: [2, 1, -1, -2] },
    // 나를 위한 선물 하나 (strong N first)
    { id: 'inner-SN-3', axis: 'SN', kind: 'choice', options: [-2, -1, 1, 2] },
    // 혼자 생각에 잠기면 (slider, hi = 먼 상상 = N → reverse)
    { id: 'inner-SN-4', axis: 'SN', kind: 'scale', reverse: true },
  ],
  TF: [
    // 혼자 남은 퇴근길, 마음에 도는 건 (strong T first)
    { id: 'inner-TF-0', axis: 'TF', kind: 'choice', options: [2, 1, -1, -2] },
    // 슬픈 장면, 아무도 없으면 (strong F first)
    { id: 'inner-TF-1', axis: 'TF', kind: 'choice', options: [-2, -1, 1, 2] },
    // 관계를 혼자 정리할 때 (strong T first)
    { id: 'inner-TF-2', axis: 'TF', kind: 'choice', options: [2, 1, -1, -2] },
    // 혼자 결정할 때 마지막 기준 (slider, hi = 마음이 그렇다 = F → reverse)
    { id: 'inner-TF-3', axis: 'TF', kind: 'scale', reverse: true },
    // 악당의 슬픈 사연, 혼자 볼 때 (strong F first)
    { id: 'inner-TF-4', axis: 'TF', kind: 'choice', options: [-2, -1, 1, 2] },
  ],
  JP: [
    // 계획에 없던 새벽의 빈 시간 (strong J first)
    { id: 'inner-JP-0', axis: 'JP', kind: 'choice', options: [2, 1, -1, -2] },
    // 아무도 안 볼 때 내 방은 (strong P first)
    { id: 'inner-JP-1', axis: 'JP', kind: 'choice', options: [-2, -1, 1, 2] },
    // 혼자만의 마감, 실제로 (strong J first)
    { id: 'inner-JP-2', axis: 'JP', kind: 'choice', options: [2, 1, -1, -2] },
    // 다음 휴가를 혼자 그려보면 (strong P first)
    { id: 'inner-JP-3', axis: 'JP', kind: 'choice', options: [-2, -1, 1, 2] },
    // 아무 일정 없는 하루 (slider, hi = 나름의 계획 = J)
    { id: 'inner-JP-4', axis: 'JP', kind: 'scale', reverse: false },
  ],
}

function interleave(bank: Record<DichoAxisId, readonly Item[]>, perAxis: number): readonly Item[] {
  const items: Item[] = []

  for (let depth = 0; depth < perAxis; depth++) {
    for (const axis of DICHO_AXES) {
      const item = bank[axis.id][depth]

      if (item) {
        items.push(item)
      }
    }
  }

  return items
}

export const INNER_ITEMS = interleave(INNER_BANK, 5)

export function scoreInner(responses: readonly AxisResponse[]): AxesResult<DichoAxisId> {
  return scoreAxes(responses, DICHO_AXES)
}
