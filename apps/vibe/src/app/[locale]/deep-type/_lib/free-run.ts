import { FREE_LIKERT_PRESENTATION, FREE_WORK_PRESENTATION } from '@deep-type/presentation'

import type { FreeSegment } from './test-progress-analytics'

/**
 * One free sitting as the screen walks it: twenty-four Likert items and then three forced-choice items, in one
 * uninterrupted run. `kind` is what the caller needs to know, because the two shapes answer into different
 * types — an agreement level against an option index — and mixing them up is a silent miscount rather than an
 * error.
 */
export type FreeStep =
  | { id: string; kind: 'likert'; segment: Extract<FreeSegment, 'core' | 'type'> }
  | { id: string; kind: 'work'; segment: Extract<FreeSegment, 'drain'> }

export const FREE_RUN: readonly FreeStep[] = [
  ...FREE_LIKERT_PRESENTATION.map(
    (item): FreeStep => ({ id: item.id, kind: 'likert', segment: item.layer === 'inner' ? 'type' : 'core' }),
  ),
  ...FREE_WORK_PRESENTATION.map((item): FreeStep => ({ id: item.id, kind: 'work', segment: 'drain' })),
]

/**
 * The three stretches of the run, measured off the run itself. The progress bar draws one segment per entry
 * and the copy layer supplies the label, so adding an item anywhere moves the boundaries without anyone
 * restating a count.
 */
export const FREE_SEGMENTS: readonly { count: number; segment: FreeSegment }[] = (['type', 'core', 'drain'] as const)
  .map((segment) => ({ count: FREE_RUN.filter((step) => step.segment === segment).length, segment }))
  .filter((entry) => entry.count > 0)

/**
 * The indexes where the answering instruction is worth showing, which is not all of them.
 *
 * '딱 맞는 답이 없으면 가장 가까운 쪽을 골라요' is a rule about how to answer, and a rule lands once. Printed
 * under all twenty-seven cards it stops being read by item three and spends a line of vertical space on every
 * screen for the rest of the run.
 *
 * Twice, then: on the first item, and again where the answer shape changes. The Likert block asks how strongly a
 * statement fits and the forced-choice block asks which of four situations is nearest, so 'the closest one'
 * means something different there and the reader meets the instruction as if for the first time.
 *
 * Derived from the run rather than written down, so reordering the blocks moves it without anyone remembering to.
 */
export const FREE_HINT_INDEXES: ReadonlySet<number> = new Set(
  FREE_RUN.flatMap((step, index) => (index === 0 || step.kind !== FREE_RUN[index - 1]?.kind ? [index] : [])),
)

/**
 * The single reveal point: the answer that completes the type block. It is the only index in the run where a
 * four-letter code is decided and nothing further can move it, which is what makes a reveal there true rather
 * than a teaser.
 */
export const TYPE_BLOCK_END = FREE_RUN.filter((step) => step.segment === 'type').length
