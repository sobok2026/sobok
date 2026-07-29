import { describe, expect, test } from 'bun:test'
import type { AgreementValue, ItemAnswer, WorkAnswer } from '@deep-type/model'
import { FREE_ITEM_COUNT, PAID_ITEM_COUNT } from '@deep-type/questionnaire'
import { readTypeLetters, scoreBaseAssessment } from '@deep-type/scoring'

import { FREE_HINT_INDEXES, FREE_RUN, FREE_SEGMENTS, TYPE_BLOCK_END } from './free-run'
import { PAID_RUN, PAID_SEGMENTS } from './paid-run'
import { FREE_PROGRESS_CHECKPOINTS } from './test-progress-analytics'

describe('free run', () => {
  test('walks every free item once, in three labelled stretches', () => {
    expect(FREE_RUN.length).toBe(FREE_ITEM_COUNT)
    expect(new Set(FREE_RUN.map((step) => step.id)).size).toBe(FREE_ITEM_COUNT)
    expect(FREE_SEGMENTS).toEqual([
      { count: 12, segment: 'type' },
      { count: 12, segment: 'core' },
      { count: 3, segment: 'drain' },
    ])
    expect(FREE_SEGMENTS.reduce((sum, segment) => sum + segment.count, 0)).toBe(FREE_RUN.length)
  })

  test('puts the forced-choice block last, so the input shape changes exactly once', () => {
    const kinds = FREE_RUN.map((step) => step.kind)
    expect(kinds.indexOf('work')).toBe(kinds.lastIndexOf('likert') + 1)
  })

  /**
   * The claim the reveal makes. If the letters it prints could differ from the ones the report prints, the
   * screen contradicts itself twelve items later, which is worse than showing nothing at that mark.
   */
  test('the letters revealed at the halfway mark are the letters the report will carry', () => {
    for (const pattern of [
      [1, 2, 3, 4],
      [4, 3, 2, 1],
      [1, 1, 4, 4],
      [3, 3, 3, 3],
    ] satisfies AgreementValue[][]) {
      const likert: ItemAnswer[] = FREE_RUN.flatMap((step, index) =>
        step.kind === 'likert' ? [{ itemId: step.id, value: pattern[index % pattern.length] as AgreementValue }] : [],
      )
      const work: WorkAnswer[] = FREE_RUN.flatMap((step, index) =>
        step.kind === 'work' ? [{ itemId: step.id, optionIndex: (index % 4) as 0 | 1 | 2 | 3 }] : [],
      )

      const revealed = readTypeLetters(likert.slice(0, TYPE_BLOCK_END))
      expect(revealed).toBe(scoreBaseAssessment(likert, work, null).inner.code)
    }
  })

  // Four to six checkpoints (MIGRATION Phase 5). The first is its own, and the rest are quarters of the run, so
  // adding items moves the marks instead of leaving them pinned to a count nobody updated.
  test('reports progress at five checkpoints derived from the item count', () => {
    expect(FREE_PROGRESS_CHECKPOINTS).toEqual([1, 7, 14, 20, 27])
    expect(FREE_PROGRESS_CHECKPOINTS.at(-1)).toBe(FREE_ITEM_COUNT)
    expect(new Set(FREE_PROGRESS_CHECKPOINTS).size).toBe(FREE_PROGRESS_CHECKPOINTS.length)
  })
})

describe('paid run', () => {
  test('walks every paid item once, Likert first and then work by dimension', () => {
    expect(PAID_RUN.length).toBe(PAID_ITEM_COUNT)
    expect(new Set(PAID_RUN.map((step) => step.id)).size).toBe(PAID_ITEM_COUNT)
    expect(PAID_SEGMENTS).toEqual([
      { count: 16, kind: 'likert' },
      { count: 6, dimension: 'interest' },
      { count: 6, dimension: 'need' },
      { count: 3, dimension: 'drain' },
      { count: 3, dimension: 'purpose' },
      { count: 3, dimension: 'environment' },
    ])
  })

  // A dimension appearing twice would mean the block was interleaved, and the heading would then describe only
  // part of what is under it.
  test('never returns to a dimension it has left', () => {
    const dimensions = PAID_SEGMENTS.flatMap((segment) => ('dimension' in segment ? [segment.dimension] : []))
    expect(new Set(dimensions).size).toBe(dimensions.length)
  })
})

const CORE_BLOCK_LENGTH = FREE_RUN.filter((step) => step.segment === 'core').length

describe('answering instruction', () => {
  test('shows on the first item and where the answer shape changes, nowhere else', () => {
    expect([...FREE_HINT_INDEXES].sort((a, b) => a - b)).toEqual([0, TYPE_BLOCK_END + CORE_BLOCK_LENGTH])
  })

  // Two of twenty-seven. The number is the whole point: a rule printed on every card is a rule nobody reads.
  test('leaves the rest of the run clean', () => {
    expect(FREE_HINT_INDEXES.size).toBe(2)
    expect(FREE_RUN.length).toBe(27)
  })

  // The second index is the first forced-choice item, not merely 'somewhere later'. If the blocks are ever
  // reordered this catches a hint that stayed behind on a Likert card.
  test('puts the second one on the first forced-choice item', () => {
    for (const index of FREE_HINT_INDEXES) {
      const previous = FREE_RUN[index - 1]
      expect(`${index}: ${previous ? previous.kind !== FREE_RUN[index]?.kind : true}`).toBe(`${index}: true`)
    }
  })
})
