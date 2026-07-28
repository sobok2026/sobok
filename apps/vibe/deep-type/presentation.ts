import { AXES, type AxisId } from './model'
import { FREE_LIKERT_ITEMS, FREE_WORK_ITEMS, PAID_LIKERT_ITEMS, PAID_WORK_ITEMS, type WorkItem } from './questionnaire'

// Presentation order is decoupled from the item banks. Scoring keys answers by item id, so display order never
// touches the result — it only shapes the sitting. The orders are fixed rather than shuffled per session: a
// personality test has no answer to game, and a stable order preserves reproducibility and comparability.
// Response options keep their authored pole-to-pole order because they are an ordinal scale.
//
// Two constraints shape the sequences below. Same-axis items are never adjacent, because clustering items that
// measure one construct invites a consistency motif that inflates internal consistency. And forward/reverse
// runs stay short, because a long run of same-keyed items is what makes straight-line responding cheap.
//
// The free sequence cannot alternate keying: 16 forward against 8 reverse admits no alternation, so the target
// is a maximum run of two. The paid sequence is 8 against 8 and alternates perfectly.
//
// The free order runs the four type axes to completion before the four core axes, rather than interleaving all
// eight. That is a screen requirement reaching back into the sequence: the free run is one uninterrupted 27-item
// stretch whose progress bar is labelled in three segments, and the one reveal it shows at item twelve names the
// four type letters. Interleaved, no prefix of the sequence decides any code, so there is nothing true to say at
// item twelve and the segments would be arbitrary marks on a bar. Both constraints survive the split — axes stay
// non-adjacent across the block boundary and the keying run stays at two — because they are local properties.
type KeySlot = 'F' | 'R'
type Slot = readonly [number, KeySlot]

const FREE_ORDER = [
  [0, 'F'],
  [1, 'F'],
  [2, 'R'],
  [3, 'F'],
  [0, 'F'],
  [1, 'R'],
  [2, 'F'],
  [3, 'F'],
  [0, 'R'],
  [1, 'F'],
  [2, 'F'],
  [3, 'R'],
  [4, 'F'],
  [5, 'F'],
  [6, 'R'],
  [7, 'F'],
  [4, 'F'],
  [5, 'R'],
  [6, 'F'],
  [7, 'F'],
  [4, 'R'],
  [5, 'F'],
  [6, 'F'],
  [7, 'R'],
] as const satisfies readonly Slot[]

const PAID_ORDER = [
  [0, 'F'],
  [1, 'R'],
  [2, 'F'],
  [3, 'R'],
  [4, 'F'],
  [5, 'R'],
  [6, 'F'],
  [7, 'R'],
  [1, 'F'],
  [0, 'R'],
  [3, 'F'],
  [2, 'R'],
  [5, 'F'],
  [4, 'R'],
  [7, 'F'],
  [6, 'R'],
] as const satisfies readonly Slot[]

// Draws from per-axis queues in the plan's order. Throwing on a miss is deliberate: a plan that no longer
// matches the selection is a defect in the selection table, and shipping a silently shorter quiz would hide it.
function arrange<Item extends { axis: AxisId; reverse: boolean }>(
  items: readonly Item[],
  plan: readonly Slot[],
): readonly Item[] {
  const queues = new Map<string, Item[]>()
  for (const item of items) {
    const key = `${item.axis}${item.reverse ? 'R' : 'F'}`
    const queue = queues.get(key)
    if (queue) {
      queue.push(item)
    } else {
      queues.set(key, [item])
    }
  }

  return plan.map(([axisIndex, keySlot]) => {
    const axis = AXES[axisIndex]
    const item = axis && queues.get(`${axis}${keySlot}`)?.shift()
    if (!item) {
      throw new Error(`DeepType presentation plan asks for an item that was not selected: ${axis} ${keySlot}`)
    }
    return item
  })
}

export const FREE_LIKERT_PRESENTATION = arrange(FREE_LIKERT_ITEMS, FREE_ORDER)
export const PAID_LIKERT_PRESENTATION = arrange(PAID_LIKERT_ITEMS, PAID_ORDER)

// Forced-choice blocks keep their authored order. It already satisfies the one ordering rule they carry — no
// facet sits in the same option position two items in a row — and a Latin square is unreachable at three items
// over six facets, so there is nothing further to optimise for.
export const FREE_WORK_PRESENTATION: readonly WorkItem[] = FREE_WORK_ITEMS
export const PAID_WORK_PRESENTATION: readonly WorkItem[] = PAID_WORK_ITEMS
