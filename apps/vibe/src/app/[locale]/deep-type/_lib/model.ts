import type {
  AnsweredSignal,
  AxisDefinition,
  AxisId,
  AxisJudgment,
  GemCode,
  InnerCode,
  InnerGroup,
  PersonaCode,
} from './types'

// --- core scoring engine ---------------------------------------------------------------------------
//
// Every answered question contributes a signed `signal` per axis it touches (e.g. `{ EI: 2 }`). A axis's
// final pole is decided by the *sum* of every signal it received across a phase; if that sum nets to
// exactly zero (a real possibility once cross-axis "bonus" signals are mixed in), we fall back first to
// the axis's own anchor question (the one canonical question written specifically for that axis), then to
// whichever question last touched the axis at all, then — if the axis was never touched — an arbitrary
// positive tie-break so every axis always resolves to a letter.

type SignalTotals = {
  anchor: Partial<Record<AxisId, number>>
  last: Partial<Record<AxisId, number>>
  total: Partial<Record<AxisId, number>>
}

function sumSignals(answers: readonly AnsweredSignal[]): SignalTotals {
  const total: Partial<Record<AxisId, number>> = {}
  const anchor: Partial<Record<AxisId, number>> = {}
  const last: Partial<Record<AxisId, number>> = {}

  for (const answer of answers) {
    for (const [axisId, value] of Object.entries(answer.signal) as [AxisId, number][]) {
      total[axisId] = (total[axisId] ?? 0) + value

      if (value !== 0) {
        last[axisId] = value

        if (answer.anchor === axisId) {
          anchor[axisId] = value
        }
      }
    }
  }

  return { anchor, last, total }
}

export function judgeAxes<TId extends AxisId>(
  answers: readonly AnsweredSignal[],
  axes: readonly AxisDefinition<TId, string, string>[],
  maxByAxis: Record<TId, number>,
): AxisJudgment<TId> {
  const totals = sumSignals(answers)
  let code = ''
  const axisResults = {} as Record<TId, { pole: string; strength: number }>

  for (const axis of axes) {
    const sum = totals.total[axis.id] ?? 0
    const effective = sum !== 0 ? sum : (totals.anchor[axis.id] ?? totals.last[axis.id] ?? 1)
    const pole = effective > 0 ? axis.poles[0] : axis.poles[1]
    const strength = 55 + Math.round(Math.min(1, Math.abs(sum) / maxByAxis[axis.id]) * 40)

    code += pole
    axisResults[axis.id] = { pole, strength }
  }

  return { axes: axisResults, code }
}

// --- Inner-code → group, and the two "compatible inner" transforms ---------------------------------
//
// A person's Inner group (NF/NT/SJ/SP) drives which PART2/gem-deep question bank they see. Ported
// verbatim from groupOf() in the source: keyed off the S/N and J/P letters (indices 1 and 3).
export function groupOf(inner: InnerCode): InnerGroup {
  const isIntuitive = inner[1] === 'N'
  const isJudging = inner[3] === 'J'

  if (isIntuitive) {
    return inner[2] === 'F' ? 'NF' : 'NT'
  }

  return isJudging ? 'SJ' : 'SP'
}

// The gem whose only difference is opposite V/H (emotional processing) — "complementary": one expresses,
// the other holds, and they fill each other's gap.
export function bestMatchInner(gem: GemCode): GemCode {
  return flipGemPole(gem, 2) as GemCode
}

// The gem whose O/A (relationship distance) *and* V/H (emotional processing) are both flipped — the
// combination most likely to misread each other's signals.
export function clashInner(gem: GemCode): GemCode {
  return flipGemPole(flipGemPole(gem, 1) as GemCode, 2) as GemCode
}

function flipGemPole(gem: GemCode, index: number): string {
  const letters = gem.split('')
  const letter = letters[index]

  if (index === 1) {
    letters[index] = letter === 'O' ? 'A' : 'O'
  } else if (index === 2) {
    letters[index] = letter === 'V' ? 'H' : 'V'
  }

  return letters.join('')
}

export function syncRate(a: string, b: string): number {
  let matches = 0

  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) {
      matches++
    }
  }

  return Math.round((matches / a.length) * 100)
}

// --- result-code serialization for the anonymous, server-stored entitlement record -----------------
//
// The server only ever sees this opaque string (never raw answers) — mirrors couple-gyeol's
// serializeGyeolResult/parseGyeolResultParam pattern, extended to DeepType's 3-code shape plus the free
// tier's "quick" gem code (kept for the "정밀 분석에서 달라졌나요" teaser comparison).
export type DeepTypeResult = {
  gem: GemCode
  inner: InnerCode
  outer: PersonaCode
  quickGem?: GemCode
}

export function serializeDeepResult(result: DeepTypeResult): string {
  return [result.outer, result.inner, result.gem, result.quickGem ?? ''].join('_')
}

export function parseDeepResultCode(value: string | null | undefined): DeepTypeResult | null {
  if (!value) {
    return null
  }

  const [outer, inner, gem, quickGem] = value.split('_')

  if (!isDichoCode(outer) || !isDichoCode(inner) || !isGemCode(gem)) {
    return null
  }

  if (quickGem && !isGemCode(quickGem)) {
    return null
  }

  return {
    gem: gem as GemCode,
    inner: inner as InnerCode,
    outer: outer as PersonaCode,
    quickGem: quickGem ? (quickGem as GemCode) : undefined,
  }
}

function isDichoCode(value: string | undefined): boolean {
  return value !== undefined && /^[EI][SN][TF][JP]$/.test(value)
}

function isGemCode(value: string | undefined): boolean {
  return value !== undefined && /^[RM][OA][VH][UO]$/.test(value)
}
