import type {
  AxesResult,
  AxisDefinition,
  AxisId,
  AxisResponse,
  AxisScore,
  ClaimedAxisScore,
  DichoAxisId,
  Item,
  ItemAnswer,
  PersonaCode,
  PersonaResult,
} from './types'
import { BORDERLINE_LEAN, DICHO_AXES, isScaleItem } from './types'

// --- scoring engine ---------------------------------------------------------------------------------
//
// Replaces the prototype's ad-hoc "sum signed signals, then break ties with the last-answered value"
// engine. Two deliberate departures:
//
//   1. Every item is unidimensional (one axis, value in [-2, +2]), so an axis's score is literally the
//      mean of its own items — nothing bleeds across axes.
//   2. Confidence is the honest |mean| with NO floor. A near-split axis reports a low number and gets a
//      `borderline` flag instead of the old "always 55–95%" inflation. There is no noise tie-break: a
//      dead-even axis resolves to poles[0] but is surfaced as split, not as a confident call.

// A self-claimed Persona letter is worth one virtual "+2" item (a weak prior): two clearly contradicting
// verification items can still overturn it, but a single soft one can't.
const CLAIM_PRIOR_WEIGHT = 2
const CLAIM_PRIOR_ITEMS = 1

export function resolveResponse(item: Item, answer: ItemAnswer): AxisResponse {
  if (isScaleItem(item)) {
    if (answer.kind !== 'scale') {
      throw new Error(`item ${item.id} is a scale item but got a ${answer.kind} answer`)
    }

    const magnitude = (answer.value - 50) / 25

    return { axis: item.axis, value: item.reverse ? -magnitude : magnitude }
  }

  if (answer.kind !== 'choice') {
    throw new Error(`item ${item.id} is a choice item but got a ${answer.kind} answer`)
  }

  return { axis: item.axis, value: item.options[answer.optionIndex] ?? 0 }
}

function summarize(values: readonly number[], priorValue: number, priorCount: number): Omit<AxisScore, never> {
  const answered = values.length
  const raw = values.reduce((sum, value) => sum + value, 0) + priorValue
  const denominator = 2 * (answered + priorCount)
  const lean = denominator > 0 ? raw / denominator : 0
  const leanSign = lean >= 0 ? 1 : -1
  const agree = values.filter((value) => value * leanSign > 0).length

  return {
    answered,
    borderline: Math.abs(lean) < BORDERLINE_LEAN,
    confidence: Math.round(Math.abs(lean) * 100),
    consistency: answered > 0 ? Math.round((agree / answered) * 100) : 0,
    lean,
    pole: '',
  }
}

export function scoreAxes<TId extends AxisId>(
  responses: readonly AxisResponse[],
  axes: readonly AxisDefinition<TId, string, string>[],
): AxesResult<TId> {
  const axisResults = {} as Record<TId, AxisScore>
  let code = ''

  for (const axis of axes) {
    const values = responses.filter((response) => response.axis === axis.id).map((response) => response.value)
    const summary = summarize(values, 0, 0)
    const pole = summary.lean >= 0 ? axis.poles[0] : axis.poles[1]

    axisResults[axis.id] = { ...summary, pole }
    code += pole
  }

  return { axes: axisResults, code }
}

// Persona: the visitor's self-claimed 4 letters seed a weak prior per axis; the verification items then
// confirm or overturn each one. `mismatch` marks the axes the measurement flipped — the report turns
// those into the "you said X, but you answer more like Y" insight.
export function scorePersonaWithClaim(claim: PersonaCode, responses: readonly AxisResponse[]): PersonaResult {
  const axisResults = {} as Record<DichoAxisId, ClaimedAxisScore>
  const mismatches: DichoAxisId[] = []
  let code = ''

  DICHO_AXES.forEach((axis, index) => {
    const claimed = claim[index]
    const priorValue = claimed === axis.poles[0] ? CLAIM_PRIOR_WEIGHT : -CLAIM_PRIOR_WEIGHT
    const values = responses.filter((response) => response.axis === axis.id).map((response) => response.value)
    const summary = summarize(values, priorValue, CLAIM_PRIOR_ITEMS)
    const pole = summary.lean >= 0 ? axis.poles[0] : axis.poles[1]
    const mismatch = pole !== claimed

    axisResults[axis.id] = { ...summary, claimed, mismatch, pole }
    if (mismatch) {
      mismatches.push(axis.id)
    }
    code += pole
  })

  return { axes: axisResults, code: code as PersonaCode, mismatches }
}
