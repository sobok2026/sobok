import { scoreAxes, scorePersonaWithClaim } from './scoring'
import type { AxisResponse, DichoAxisId, Item, PersonaCode, PersonaResult } from './types'
import { DICHO_AXES } from './types'

// Persona = "how you are around people". Every item is framed in a social/observed context and measures
// ONE dichotomy. Option values are signed toward the axis's first pole (E/S/T/J); keying is deliberately
// mixed per axis (some items put the strong E/S/T/J answer first, some last) so "always pick option 1"
// can't drift the result. `interleave` below turns the per-axis banks into a topic-varied display order.
//
// The default flow shows the visitor their self-claimed type, then only the first 2 items per axis
// (PERSONA_VERIFY_ITEMS) — the most face-valid ones — scored against that claim as a prior. The
// "잘 모르겠어요" path shows all 5 per axis (PERSONA_MEASURE_ITEMS) with no prior.

const PERSONA_BANK: Record<DichoAxisId, readonly Item[]> = {
  EI: [
    // verify · 처음 보는 자리 (strong E first)
    { id: 'persona-EI-0', axis: 'EI', kind: 'choice', options: [2, 1, -1, -2] },
    // verify · 사람들과 종일 보낸 뒤 (strong I first — reverse keyed)
    { id: 'persona-EI-1', axis: 'EI', kind: 'choice', options: [-2, -1, 1, 2] },
    // 모임에서의 기본값 (slider, hi = 말하는 쪽 = E)
    { id: 'persona-EI-2', axis: 'EI', kind: 'scale', reverse: false },
    // 단톡방에서 (strong E first)
    { id: 'persona-EI-3', axis: 'EI', kind: 'choice', options: [2, 1, -1, -2] },
    // 연락 없는 주말 (strong I first)
    { id: 'persona-EI-4', axis: 'EI', kind: 'choice', options: [-2, -1, 1, 2] },
  ],
  SN: [
    // verify · 남들이 나를 소개할 때 (strong S first)
    { id: 'persona-SN-0', axis: 'SN', kind: 'choice', options: [2, 1, -1, -2] },
    // verify · 내가 자주 하는 말 (strong N first)
    { id: 'persona-SN-1', axis: 'SN', kind: 'choice', options: [-2, -1, 1, 2] },
    // 일 얘기를 들으면 먼저 (strong S first)
    { id: 'persona-SN-2', axis: 'SN', kind: 'choice', options: [2, 1, -1, -2] },
    // 새 물건을 고를 때 (strong N first)
    { id: 'persona-SN-3', axis: 'SN', kind: 'choice', options: [-2, -1, 1, 2] },
    // 설명할 때 (slider, hi = 의미·비유 = N → reverse)
    { id: 'persona-SN-4', axis: 'SN', kind: 'scale', reverse: true },
  ],
  TF: [
    // verify · 논쟁이 붙으면 (strong T first)
    { id: 'persona-TF-0', axis: 'TF', kind: 'choice', options: [2, 1, -1, -2] },
    // verify · 힘든 친구에게 첫마디 (strong F first)
    { id: 'persona-TF-1', axis: 'TF', kind: 'choice', options: [-2, -1, 1, 2] },
    // 결정의 기준 (strong T first)
    { id: 'persona-TF-2', axis: 'TF', kind: 'choice', options: [2, 1, -1, -2] },
    // 사람들이 보는 나 (slider, hi = 냉정 = T)
    { id: 'persona-TF-3', axis: 'TF', kind: 'scale', reverse: false },
    // 피드백을 줄 때 (strong F first)
    { id: 'persona-TF-4', axis: 'TF', kind: 'choice', options: [-2, -1, 1, 2] },
  ],
  JP: [
    // verify · 여행 전날 가방 (strong J first)
    { id: 'persona-JP-0', axis: 'JP', kind: 'choice', options: [2, 1, -1, -2] },
    // verify · 아무 일정 없는 하루 (strong P first)
    { id: 'persona-JP-1', axis: 'JP', kind: 'choice', options: [-2, -1, 1, 2] },
    // 약속 시간에 나는 (strong J first)
    { id: 'persona-JP-2', axis: 'JP', kind: 'choice', options: [2, 1, -1, -2] },
    // 일하는 리듬 (slider, hi = 미리 나눠서 = J)
    { id: 'persona-JP-3', axis: 'JP', kind: 'scale', reverse: false },
    // 계획이 틀어지면 (strong P first)
    { id: 'persona-JP-4', axis: 'JP', kind: 'choice', options: [-2, -1, 1, 2] },
  ],
}

// Round-robin one item per axis at a time, up to `perAxis` deep — keeps the felt topic varied instead of
// showing all 5 EI items in a row.
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

export const PERSONA_VERIFY_ITEMS = interleave(PERSONA_BANK, 2)
export const PERSONA_MEASURE_ITEMS = interleave(PERSONA_BANK, 5)

// Default path: score the verification items against the self-claimed type.
export function scorePersonaVerify(claim: PersonaCode, responses: readonly AxisResponse[]): PersonaResult {
  return scorePersonaWithClaim(claim, responses)
}

// "잘 모르겠어요" path: measure the full bank cold, no prior, then wrap as a PersonaResult so the report
// takes one shape either way. There is no claim on this path, so nothing can mismatch.
export function scorePersonaMeasure(responses: readonly AxisResponse[]): PersonaResult {
  const measured = scoreAxes(responses, DICHO_AXES)
  const axes = {} as PersonaResult['axes']

  for (const axis of DICHO_AXES) {
    const score = measured.axes[axis.id]
    axes[axis.id] = { ...score, claimed: score.pole, mismatch: false }
  }

  return { axes, code: measured.code as PersonaCode, mismatches: [] }
}
