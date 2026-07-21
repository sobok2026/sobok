import type { AxisResponse, ItemAnswer, PrecisionItem } from './types'

// Resolve one raw answer to its signed axis contribution. Returns null (rather than throwing) when the
// answer's kind or index doesn't match the item — the server treats a malformed answer as "not answered"
// rather than letting a spoofed payload crash the re-score.
export function resolveResponse(item: PrecisionItem, answer: ItemAnswer): AxisResponse | null {
  if (item.kind === 'scale') {
    if (answer.kind !== 'scale') {
      return null
    }
    const magnitude = (answer.value - 50) / 25
    return { axis: item.axis, value: item.reverse ? -magnitude : magnitude }
  }

  if (answer.kind !== 'choice') {
    return null
  }
  const value = item.options[answer.optionIndex]
  if (value === undefined) {
    return null
  }
  return { axis: item.axis, value }
}
