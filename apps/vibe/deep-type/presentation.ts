import { GEM_ITEMS, INNER_ITEMS, PERSONA_ITEMS, REFINEMENT_ITEMS } from './questionnaire'

// Presentation order is deliberately decoupled from the canonical item banks in `questionnaire.ts`.
// Scoring keys answers by item id, so the display order never touches the result — it only shapes
// the respondent's experience. Keep these orders fixed (not per-session random): a personality test
// has no answer to game, and a stable order preserves reproducibility, cross-user comparability, and
// straightforward debugging. The response options themselves stay in their authored, pole-to-pole
// order because they form an ordinal scale, not an unordered choice set.

/**
 * De-clusters same-axis items by round-robining across axes, so consecutive questions rarely measure
 * the same axis. Grouping identical-construct items back to back invites a "consistency motif" that
 * artificially inflates internal consistency; spreading them yields a more conservative, honest read.
 *
 * `axisShift` rotates the axis-visiting order. Persona and Inner mirror each other item-for-item
 * (same constructs, only the context differs), so giving Inner a different shift breaks positional
 * copy-through: the Nth Inner question is no longer the mirror of the Nth Persona question, which
 * keeps the two context readings independent instead of inviting the respondent to echo prior answers.
 */
function interleaveByAxis<T extends { axis: string }>(items: readonly T[], axisShift: number): readonly T[] {
  const buckets = new Map<string, T[]>()
  const axisOrder: string[] = []

  for (const item of items) {
    let bucket = buckets.get(item.axis)
    if (!bucket) {
      bucket = []
      buckets.set(item.axis, bucket)
      axisOrder.push(item.axis)
    }
    bucket.push(item)
  }

  const shift = ((axisShift % axisOrder.length) + axisOrder.length) % axisOrder.length
  const visitOrder = axisOrder.map((_, index) => axisOrder[(index + shift) % axisOrder.length])
  const maxDepth = Math.max(...Array.from(buckets.values(), (bucket) => bucket.length))
  const ordered: T[] = []

  for (let depth = 0; depth < maxDepth; depth++) {
    for (const axis of visitOrder) {
      const item = buckets.get(axis)?.[depth]
      if (item) {
        ordered.push(item)
      }
    }
  }

  return ordered
}

export const PERSONA_PRESENTATION = interleaveByAxis(PERSONA_ITEMS, 0)
export const INNER_PRESENTATION = interleaveByAxis(INNER_ITEMS, 2)
export const GEM_PRESENTATION = interleaveByAxis(GEM_ITEMS, 0)
export const REFINEMENT_PRESENTATION = interleaveByAxis(REFINEMENT_ITEMS, 0)
