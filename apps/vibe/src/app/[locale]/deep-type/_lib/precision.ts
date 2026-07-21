// Frontend precision spec — a LIGHTWEIGHT mirror of worker/scoring/precision.ts. It carries only what the
// UI needs (id, axis, kind, tier, unlock); the scoring SIGNS live only in the Worker, which re-scores
// authoritatively. Keep ids / kinds / tiers / unlocks in sync with the Worker bank (a shared test can
// guard this later). QuizView renders from content.precisionQuestions[id], so no option data is needed here.

export type PrecisionAxis = 'EI' | 'SN' | 'TF' | 'JP' | 'RM' | 'OA' | 'VH' | 'UO'

export type PrecisionSpec = {
  id: string
  axis: PrecisionAxis
  kind: 'choice' | 'scale'
  tier: 'common' | 'adaptive'
  unlock?: { axis: PrecisionAxis; pole: string }
}

const DICHO_ORDER: readonly PrecisionAxis[] = ['EI', 'SN', 'TF', 'JP']
const GEM_ORDER: readonly PrecisionAxis[] = ['RM', 'OA', 'VH', 'UO']

export const PRECISION_BANK: readonly PrecisionSpec[] = [
  // common (always shown)
  { id: 'pr-EI-c0', axis: 'EI', kind: 'choice', tier: 'common' },
  { id: 'pr-SN-c0', axis: 'SN', kind: 'scale', tier: 'common' },
  { id: 'pr-TF-c0', axis: 'TF', kind: 'choice', tier: 'common' },
  { id: 'pr-JP-c0', axis: 'JP', kind: 'choice', tier: 'common' },
  { id: 'pr-RM-c0', axis: 'RM', kind: 'scale', tier: 'common' },
  { id: 'pr-OA-c0', axis: 'OA', kind: 'choice', tier: 'common' },
  { id: 'pr-VH-c0', axis: 'VH', kind: 'scale', tier: 'common' },
  { id: 'pr-UO-c0', axis: 'UO', kind: 'choice', tier: 'common' },
  // adaptive (unlocked by the free-tier resolved pole on the unlock axis)
  { id: 'pr-EI-aE0', axis: 'EI', kind: 'choice', tier: 'adaptive', unlock: { axis: 'EI', pole: 'E' } },
  { id: 'pr-EI-aI0', axis: 'EI', kind: 'choice', tier: 'adaptive', unlock: { axis: 'EI', pole: 'I' } },
  { id: 'pr-EI-aE1', axis: 'EI', kind: 'scale', tier: 'adaptive', unlock: { axis: 'EI', pole: 'E' } },
  { id: 'pr-SN-aS0', axis: 'SN', kind: 'choice', tier: 'adaptive', unlock: { axis: 'SN', pole: 'S' } },
  { id: 'pr-SN-aN0', axis: 'SN', kind: 'choice', tier: 'adaptive', unlock: { axis: 'SN', pole: 'N' } },
  { id: 'pr-SN-aN1', axis: 'SN', kind: 'scale', tier: 'adaptive', unlock: { axis: 'SN', pole: 'N' } },
  { id: 'pr-TF-aT0', axis: 'TF', kind: 'choice', tier: 'adaptive', unlock: { axis: 'TF', pole: 'T' } },
  { id: 'pr-TF-aF0', axis: 'TF', kind: 'choice', tier: 'adaptive', unlock: { axis: 'TF', pole: 'F' } },
  { id: 'pr-TF-aF1', axis: 'TF', kind: 'scale', tier: 'adaptive', unlock: { axis: 'TF', pole: 'F' } },
  { id: 'pr-JP-aJ0', axis: 'JP', kind: 'choice', tier: 'adaptive', unlock: { axis: 'JP', pole: 'J' } },
  { id: 'pr-JP-aP0', axis: 'JP', kind: 'choice', tier: 'adaptive', unlock: { axis: 'JP', pole: 'P' } },
  { id: 'pr-JP-aP1', axis: 'JP', kind: 'scale', tier: 'adaptive', unlock: { axis: 'JP', pole: 'P' } },
  { id: 'pr-RM-aM0', axis: 'RM', kind: 'choice', tier: 'adaptive', unlock: { axis: 'RM', pole: 'M' } },
  { id: 'pr-RM-aM1', axis: 'RM', kind: 'choice', tier: 'adaptive', unlock: { axis: 'RM', pole: 'M' } },
  { id: 'pr-RM-aR0', axis: 'RM', kind: 'choice', tier: 'adaptive', unlock: { axis: 'RM', pole: 'R' } },
  { id: 'pr-OA-aA0', axis: 'OA', kind: 'choice', tier: 'adaptive', unlock: { axis: 'OA', pole: 'A' } },
  { id: 'pr-OA-aA1', axis: 'OA', kind: 'scale', tier: 'adaptive', unlock: { axis: 'OA', pole: 'A' } },
  { id: 'pr-OA-aO0', axis: 'OA', kind: 'choice', tier: 'adaptive', unlock: { axis: 'OA', pole: 'O' } },
  { id: 'pr-VH-aH0', axis: 'VH', kind: 'choice', tier: 'adaptive', unlock: { axis: 'VH', pole: 'H' } },
  { id: 'pr-VH-aH1', axis: 'VH', kind: 'choice', tier: 'adaptive', unlock: { axis: 'VH', pole: 'H' } },
  { id: 'pr-VH-aV0', axis: 'VH', kind: 'choice', tier: 'adaptive', unlock: { axis: 'VH', pole: 'V' } },
  { id: 'pr-UO-aU0', axis: 'UO', kind: 'choice', tier: 'adaptive', unlock: { axis: 'UO', pole: 'U' } },
  { id: 'pr-UO-aU1', axis: 'UO', kind: 'scale', tier: 'adaptive', unlock: { axis: 'UO', pole: 'U' } },
  { id: 'pr-UO-aO0', axis: 'UO', kind: 'choice', tier: 'adaptive', unlock: { axis: 'UO', pole: 'O' } },
]

function poleOf(axis: PrecisionAxis, innerCode: string, gemCode: string): string | undefined {
  const dichoIndex = DICHO_ORDER.indexOf(axis)
  if (dichoIndex >= 0) {
    return innerCode[dichoIndex]
  }
  const gemIndex = GEM_ORDER.indexOf(axis)
  if (gemIndex >= 0) {
    return gemCode[gemIndex]
  }
  return undefined
}

// The 24 items to show: all common, then the adaptive items whose unlock pole matches the free-tier read,
// capped at 3 per axis so no single axis dominates. Deterministic (bank order) — no randomness.
export function selectPrecision(innerCode: string, gemCode: string, target = 24): PrecisionSpec[] {
  const selected: PrecisionSpec[] = []
  const perAxis = new Map<PrecisionAxis, number>()

  const take = (spec: PrecisionSpec) => {
    if (selected.length >= target) {
      return
    }
    const count = perAxis.get(spec.axis) ?? 0
    if (count >= 3) {
      return
    }
    perAxis.set(spec.axis, count + 1)
    selected.push(spec)
  }

  for (const spec of PRECISION_BANK) {
    if (spec.tier === 'common') {
      take(spec)
    }
  }
  for (const spec of PRECISION_BANK) {
    if (spec.tier === 'adaptive' && spec.unlock && poleOf(spec.unlock.axis, innerCode, gemCode) === spec.unlock.pole) {
      take(spec)
    }
  }
  return selected
}
