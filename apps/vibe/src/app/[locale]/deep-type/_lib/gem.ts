import { scoreAxes } from './scoring'
import type { AxesResult, AxisResponse, GemAxisId, Item } from './types'
import { GEM_AXES } from './types'

// Gem = "the jewel underneath" — four depth axes independent of the MBTI dichotomies:
//   RM 자존감의 뿌리 (R 뿌리형: 내 기준이 안에 / M 공명형: 남의 반응이 울림)
//   OA 관계의 거리 (O 연결형: 가까울수록 안심 / A 자율형: 내 공간이 있어야 안심)
//   VH 감정의 처리 (V 표출형: 꺼내야 풀림 / H 침잠형: 혼자 삭임)
//   UO 마음의 동기 (U 갈망형: 더 나은 것이 움직인다 / O 수호형: 지키고 싶은 것이 움직인다)
//
// The prototype tailored these per Inner-group; that tailoring is dropped — the gem axes are universal,
// and a fixed, non-leading bank measures them more cleanly (and localizes without a group combinatorial).
// Values are signed toward each axis's first pole (R/O/V/U). 5 balanced items per axis.

const GEM_BANK: Record<GemAxisId, readonly Item[]> = {
  RM: [
    // 남들 반응 얼마나 신경 써요 (slider, hi = 꽤 쓴다 = 공명 M → reverse)
    { id: 'gem-RM-0', axis: 'RM', kind: 'scale', reverse: true },
    // 정성 들인 결과물에 반응이 미지근하면 (strong R first)
    { id: 'gem-RM-1', axis: 'RM', kind: 'choice', options: [2, 1, -1, -2] },
    // 단체 사진에서 먼저 보는 것 (strong M first)
    { id: 'gem-RM-2', axis: 'RM', kind: 'choice', options: [-2, -1, 1, 2] },
    // 중요한 결정을 내릴 때 (strong R first)
    { id: 'gem-RM-3', axis: 'RM', kind: 'choice', options: [2, 1, -1, -2] },
    // 인정받고 싶은 마음, 솔직히 (strong M first)
    { id: 'gem-RM-4', axis: 'RM', kind: 'choice', options: [-2, -1, 1, 2] },
  ],
  OA: [
    // 평생 딱 하나의 방 (strong O first)
    { id: 'gem-OA-0', axis: 'OA', kind: 'choice', options: [2, 1, -1, -2] },
    // 가까운 관계에서 나는 (slider, hi = 자주 닿아야 안심 = 연결 O)
    { id: 'gem-OA-1', axis: 'OA', kind: 'scale', reverse: false },
    // 연인이 혼자 있고 싶어 하면 (strong A first)
    { id: 'gem-OA-2', axis: 'OA', kind: 'choice', options: [-2, -1, 1, 2] },
    // 깊게 연결되고 싶은 마음, 실제로는 (strong A first)
    { id: 'gem-OA-3', axis: 'OA', kind: 'choice', options: [-2, -1, 1, 2] },
    // 완전히 자유로운 혼자의 삶이 이어지면 (strong O first)
    { id: 'gem-OA-4', axis: 'OA', kind: 'choice', options: [2, 1, -1, -2] },
  ],
  VH: [
    // 감정 100 중 겉으로 보이는 건 (slider, hi = 거의 전부 = 표출 V)
    { id: 'gem-VH-0', axis: 'VH', kind: 'scale', reverse: false },
    // 그 풍부한 감정, 밖으로는 (strong V first)
    { id: 'gem-VH-1', axis: 'VH', kind: 'choice', options: [2, 1, -1, -2] },
    // 서운한 게 쌓이면 (strong H first)
    { id: 'gem-VH-2', axis: 'VH', kind: 'choice', options: [-2, -1, 1, 2] },
    // 제일 최근에 운 게 (0 = either-way "잘 안 운다")
    { id: 'gem-VH-3', axis: 'VH', kind: 'choice', options: [-2, 0, 1, 2] },
    // 힘든 일이 있을 때 (strong V first)
    { id: 'gem-VH-4', axis: 'VH', kind: 'choice', options: [2, 1, -1, -2] },
  ],
  UO: [
    // 나에게 안정은 (strong U first)
    { id: 'gem-UO-0', axis: 'UO', kind: 'choice', options: [2, 1, -1, -2] },
    // 로또에 당첨되면 (strong U last)
    { id: 'gem-UO-1', axis: 'UO', kind: 'choice', options: [-2, -1, 1, 2] },
    // 더 무서운 건 (strong U last)
    { id: 'gem-UO-2', axis: 'UO', kind: 'choice', options: [-2, -1, 1, 2] },
    // 10년 뒤의 나 (strong U first)
    { id: 'gem-UO-3', axis: 'UO', kind: 'choice', options: [2, 1, -1, -2] },
    // 나를 움직이는 건 (slider, hi = 더 나은 것 = 갈망 U)
    { id: 'gem-UO-4', axis: 'UO', kind: 'scale', reverse: false },
  ],
}

function interleave(bank: Record<GemAxisId, readonly Item[]>, perAxis: number): readonly Item[] {
  const items: Item[] = []

  for (let depth = 0; depth < perAxis; depth++) {
    for (const axis of GEM_AXES) {
      const item = bank[axis.id][depth]

      if (item) {
        items.push(item)
      }
    }
  }

  return items
}

export const GEM_ITEMS = interleave(GEM_BANK, 5)

export function scoreGem(responses: readonly AxisResponse[]): AxesResult<GemAxisId> {
  return scoreAxes(responses, GEM_AXES)
}
