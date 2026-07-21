import { resolveResponse } from './scoring'
import {
  AXIS_POLES,
  type AxisId,
  type AxisResponse,
  DICHO_ORDER,
  type DichoAxisId,
  GEM_ORDER,
  type GemAxisId,
  type ItemAnswer,
  type PrecisionItem,
} from './types'

// PRECISION_BANK — the paid 심연(abyss) items. Unidimensional, signed toward poles[0], balanced keying
// (the strong option alternates first/last across an axis so acquiescence can't drift the score). `tier`
// splits the always-shown common set from adaptive items unlocked by the free-tier resolved poles; the
// Worker only RE-SCORES submitted answers, so selection (which to show) is a Phase-6 frontend concern.
//
// This is the v1 seed (8 common + 24 adaptive). The `// intent:` comments are the ko question briefs the
// content pass authors into _content; the STRUCTURE (axis + option signs) is authoritative here and must
// stay in sync with the frontend mirror. Poles: EI[E,I] SN[S,N] TF[T,F] JP[J,P] RM[R,M] OA[O,A] VH[V,H] UO[U,O].
export const PRECISION_BANK: readonly PrecisionItem[] = [
  // ── common (1 per axis) ─────────────────────────────────────────────────────────────────────────
  // intent: 늦은 밤 갑자기 잡힌 약속 — 반가움(E) vs 이미 마음의 문 닫음(I)
  { id: 'pr-EI-c0', axis: 'EI', kind: 'choice', options: [2, 1, -1, -2], tier: 'common' },
  // intent(scale): 설명을 들을 때 예시가 먼저 붙어야 이해되는 정도. hi=원리부터(N) → reverse
  { id: 'pr-SN-c0', axis: 'SN', kind: 'scale', reverse: true, tier: 'common' },
  // intent: 아끼는 사람이 명백히 틀렸을 때 — 사실을 짚음(T) vs 마음이 상할까 삼킴(F)
  { id: 'pr-TF-c0', axis: 'TF', kind: 'choice', options: [2, 1, -1, -2], tier: 'common' },
  // intent: 여행 전날 밤 — 동선을 정리해둠(J) vs 가서 정하지(P)
  { id: 'pr-JP-c0', axis: 'JP', kind: 'choice', options: [2, 1, -1, -2], tier: 'common' },
  // intent(scale): "잘했다"는 한마디를 며칠씩 곱씹는 정도. hi=오래 곱씹음(M) → reverse
  { id: 'pr-RM-c0', axis: 'RM', kind: 'scale', reverse: true, tier: 'common' },
  // intent: 연인이 며칠 혼자 있고 싶어할 때 — 존중되고 편함(A) vs 이유가 궁금하고 서운(O)
  { id: 'pr-OA-c0', axis: 'OA', kind: 'choice', options: [-2, -1, 1, 2], tier: 'common' },
  // intent(scale): 이번 달, 서운했지만 말 안 하고 삼킨 날의 빈도. hi=자주(H) → reverse
  { id: 'pr-VH-c0', axis: 'VH', kind: 'scale', reverse: true, tier: 'common' },
  // intent: 하나만 — 평생 오해받지만 비범한 삶(U) vs 평생 이해받는 평범한 삶(O)
  { id: 'pr-UO-c0', axis: 'UO', kind: 'choice', options: [2, 1, -1, -2], tier: 'common' },

  // ── adaptive (3 per axis; unlocked by the free-tier resolved pole on that axis) ──────────────────
  // EI
  {
    id: 'pr-EI-aE0',
    axis: 'EI',
    kind: 'choice',
    options: [2, 1, -1, -2],
    tier: 'adaptive',
    unlock: { axis: 'EI', pole: 'E' },
  },
  {
    id: 'pr-EI-aI0',
    axis: 'EI',
    kind: 'choice',
    options: [-2, -1, 1, 2],
    tier: 'adaptive',
    unlock: { axis: 'EI', pole: 'I' },
  },
  { id: 'pr-EI-aE1', axis: 'EI', kind: 'scale', reverse: false, tier: 'adaptive', unlock: { axis: 'EI', pole: 'E' } },
  // SN
  {
    id: 'pr-SN-aS0',
    axis: 'SN',
    kind: 'choice',
    options: [2, 1, -1, -2],
    tier: 'adaptive',
    unlock: { axis: 'SN', pole: 'S' },
  },
  {
    id: 'pr-SN-aN0',
    axis: 'SN',
    kind: 'choice',
    options: [-2, -1, 1, 2],
    tier: 'adaptive',
    unlock: { axis: 'SN', pole: 'N' },
  },
  { id: 'pr-SN-aN1', axis: 'SN', kind: 'scale', reverse: true, tier: 'adaptive', unlock: { axis: 'SN', pole: 'N' } },
  // TF
  {
    id: 'pr-TF-aT0',
    axis: 'TF',
    kind: 'choice',
    options: [2, 1, -1, -2],
    tier: 'adaptive',
    unlock: { axis: 'TF', pole: 'T' },
  },
  {
    id: 'pr-TF-aF0',
    axis: 'TF',
    kind: 'choice',
    options: [-2, -1, 1, 2],
    tier: 'adaptive',
    unlock: { axis: 'TF', pole: 'F' },
  },
  { id: 'pr-TF-aF1', axis: 'TF', kind: 'scale', reverse: true, tier: 'adaptive', unlock: { axis: 'TF', pole: 'F' } },
  // JP
  {
    id: 'pr-JP-aJ0',
    axis: 'JP',
    kind: 'choice',
    options: [2, 1, -1, -2],
    tier: 'adaptive',
    unlock: { axis: 'JP', pole: 'J' },
  },
  {
    id: 'pr-JP-aP0',
    axis: 'JP',
    kind: 'choice',
    options: [-2, -1, 1, 2],
    tier: 'adaptive',
    unlock: { axis: 'JP', pole: 'P' },
  },
  { id: 'pr-JP-aP1', axis: 'JP', kind: 'scale', reverse: true, tier: 'adaptive', unlock: { axis: 'JP', pole: 'P' } },
  // RM — deficit focus: 공명(M)에 심화 문항을 더 붙인다
  {
    id: 'pr-RM-aM0',
    axis: 'RM',
    kind: 'choice',
    options: [-2, -1, 1, 2],
    tier: 'adaptive',
    unlock: { axis: 'RM', pole: 'M' },
  },
  {
    id: 'pr-RM-aM1',
    axis: 'RM',
    kind: 'choice',
    options: [2, 1, -1, -2],
    tier: 'adaptive',
    unlock: { axis: 'RM', pole: 'M' },
  },
  {
    id: 'pr-RM-aR0',
    axis: 'RM',
    kind: 'choice',
    options: [2, 1, -1, -2],
    tier: 'adaptive',
    unlock: { axis: 'RM', pole: 'R' },
  },
  // OA — deficit focus: 자율(A)
  {
    id: 'pr-OA-aA0',
    axis: 'OA',
    kind: 'choice',
    options: [-2, -1, 1, 2],
    tier: 'adaptive',
    unlock: { axis: 'OA', pole: 'A' },
  },
  { id: 'pr-OA-aA1', axis: 'OA', kind: 'scale', reverse: true, tier: 'adaptive', unlock: { axis: 'OA', pole: 'A' } },
  {
    id: 'pr-OA-aO0',
    axis: 'OA',
    kind: 'choice',
    options: [2, 1, -1, -2],
    tier: 'adaptive',
    unlock: { axis: 'OA', pole: 'O' },
  },
  // VH — deficit focus: 침잠(H)
  {
    id: 'pr-VH-aH0',
    axis: 'VH',
    kind: 'choice',
    options: [-2, -1, 1, 2],
    tier: 'adaptive',
    unlock: { axis: 'VH', pole: 'H' },
  },
  {
    id: 'pr-VH-aH1',
    axis: 'VH',
    kind: 'choice',
    options: [-2, 0, 1, 2],
    tier: 'adaptive',
    unlock: { axis: 'VH', pole: 'H' },
  },
  {
    id: 'pr-VH-aV0',
    axis: 'VH',
    kind: 'choice',
    options: [2, 1, -1, -2],
    tier: 'adaptive',
    unlock: { axis: 'VH', pole: 'V' },
  },
  // UO — deficit focus: 갈망(U)
  {
    id: 'pr-UO-aU0',
    axis: 'UO',
    kind: 'choice',
    options: [2, 1, -1, -2],
    tier: 'adaptive',
    unlock: { axis: 'UO', pole: 'U' },
  },
  { id: 'pr-UO-aU1', axis: 'UO', kind: 'scale', reverse: false, tier: 'adaptive', unlock: { axis: 'UO', pole: 'U' } },
  {
    id: 'pr-UO-aO0',
    axis: 'UO',
    kind: 'choice',
    options: [-2, -1, 1, 2],
    tier: 'adaptive',
    unlock: { axis: 'UO', pole: 'O' },
  },
]

const BY_ID: ReadonlyMap<string, PrecisionItem> = new Map(PRECISION_BANK.map((item) => [item.id, item]))

// Re-resolve the client's submitted answers against the known bank. Unknown ids and kind mismatches are
// dropped — a spoofed payload can only ever UNDER-count, never inject a fabricated axis signal.
export function resolvePrecisionResponses(answers: readonly ItemAnswer[]): AxisResponse[] {
  const responses: AxisResponse[] = []
  for (const answer of answers) {
    const item = BY_ID.get(answer.itemId)
    if (!item) {
      continue
    }
    const resolved = resolveResponse(item, answer)
    if (resolved) {
      responses.push(resolved)
    }
  }
  return responses
}

// |lean| (0..1) → a 1..7 strength band. Six thresholds refine the free tier's coarse pole call into the
// paid "얼마나 선명한가" reading the report leans on.
const BAND_THRESHOLDS = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85] as const
function strengthBand(absLean: number): number {
  let band = 1
  for (const threshold of BAND_THRESHOLDS) {
    if (absLean >= threshold) {
      band++
    }
  }
  return band
}

function revealedPole(axis: AxisId, innerCode: string | null, gemCode: string | null): string | null {
  const dichoIndex = DICHO_ORDER.indexOf(axis as DichoAxisId)
  if (dichoIndex >= 0) {
    return innerCode?.[dichoIndex] ?? null
  }
  const gemIndex = GEM_ORDER.indexOf(axis as GemAxisId)
  if (gemIndex >= 0) {
    return gemCode?.[gemIndex] ?? null
  }
  return null
}

export interface RefinedAxes {
  // Signed 1..7 band per answered axis, canonical toward poles[0] (+ = poles[0], − = poles[1]).
  strengths: Record<string, number>
  // Axes where the deep measurement leaned opposite to the free-tier revealed letter. Letters are NOT
  // reverted (the code stays as revealed); the report frames these as "a deeper layer pulling the other way".
  contested: AxisId[]
}

export function refineAxes(
  responses: readonly AxisResponse[],
  innerCode: string | null,
  gemCode: string | null,
): RefinedAxes {
  const byAxis = new Map<AxisId, number[]>()
  for (const response of responses) {
    const values = byAxis.get(response.axis) ?? []
    values.push(response.value)
    byAxis.set(response.axis, values)
  }

  const strengths: Record<string, number> = {}
  const contested: AxisId[] = []
  for (const [axis, values] of byAxis) {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length
    const lean = mean / 2 // [-1, 1]
    const band = strengthBand(Math.abs(lean))
    strengths[axis] = lean >= 0 ? band : -band

    const revealed = revealedPole(axis, innerCode, gemCode)
    const measuredPole = lean >= 0 ? AXIS_POLES[axis][0] : AXIS_POLES[axis][1]
    if (revealed && measuredPole !== revealed) {
      contested.push(axis)
    }
  }
  return { strengths, contested }
}
