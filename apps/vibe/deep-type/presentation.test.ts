import { describe, expect, test } from 'bun:test'

import {
  FREE_LIKERT_PRESENTATION,
  FREE_WORK_PRESENTATION,
  PAID_LIKERT_PRESENTATION,
  PAID_WORK_PRESENTATION,
} from './presentation'
import { FREE_LIKERT_ITEMS, FREE_WORK_ITEMS, PAID_LIKERT_ITEMS, PAID_WORK_ITEMS } from './questionnaire'

function longestRun(keys: readonly boolean[]): number {
  let longest = 0
  let current = 0
  let previous: boolean | null = null

  for (const key of keys) {
    current = key === previous ? current + 1 : 1
    previous = key
    longest = Math.max(longest, current)
  }

  return longest
}

function adjacentAxisRepeats(items: readonly { axis: string }[]): number {
  return items.filter((item, index) => index > 0 && items[index - 1]?.axis === item.axis).length
}

describe('likert presentation', () => {
  test('is a permutation of the scored banks', () => {
    expect(FREE_LIKERT_PRESENTATION.map((item) => item.id).sort()).toEqual(
      FREE_LIKERT_ITEMS.map((item) => item.id).sort(),
    )
    expect(PAID_LIKERT_PRESENTATION.map((item) => item.id).sort()).toEqual(
      PAID_LIKERT_ITEMS.map((item) => item.id).sort(),
    )
  })

  test('never puts two items of the same axis next to each other', () => {
    expect(adjacentAxisRepeats(FREE_LIKERT_PRESENTATION)).toBe(0)
    expect(adjacentAxisRepeats(PAID_LIKERT_PRESENTATION)).toBe(0)
  })

  // The constraints below leave many orders legal, so they let a refactor reshuffle the questions without a
  // single red test. Order is a released property — cohorts answered these in this sequence — so the sequence
  // itself is pinned and a deliberate change has to come with a deliberate snapshot update.
  test('pins the released order', () => {
    expect(FREE_LIKERT_PRESENTATION.map((item) => item.id)).toEqual([
      'inner-ei-1',
      'inner-sn-1',
      'inner-tf-2',
      'inner-jp-1',
      'gem-rm-1',
      'gem-oa-2',
      'gem-vh-1',
      'gem-uo-1',
      'inner-ei-2',
      'inner-tf-1',
      'gem-oa-1',
      'inner-sn-2',
      'inner-jp-3',
      'gem-rm-3',
      'gem-vh-2',
      'gem-uo-3',
      'inner-ei-3',
      'inner-jp-2',
      'inner-sn-3',
      'inner-tf-3',
      'gem-rm-2',
      'gem-oa-3',
      'gem-vh-3',
      'gem-uo-2',
    ])
    expect(PAID_LIKERT_PRESENTATION.map((item) => item.id)).toEqual([
      'refine-inner-ei-2',
      'refine-inner-sn-1',
      'refine-inner-tf-1',
      'refine-inner-jp-2',
      'refine-gem-rm-1',
      'refine-gem-oa-2',
      'refine-gem-vh-1',
      'refine-gem-uo-2',
      'refine-inner-sn-2',
      'refine-inner-ei-1',
      'refine-inner-jp-3',
      'refine-inner-tf-2',
      'refine-gem-oa-1',
      'refine-gem-rm-2',
      'refine-gem-uo-3',
      'refine-gem-vh-2',
    ])
  })

  // 16 forward against 8 reverse cannot alternate, so two is the floor for the free run length, not a target
  // someone relaxed. The paid block is 8 against 8 and does alternate.
  test('caps the free keying run at two', () => {
    expect(FREE_LIKERT_PRESENTATION.length).toBe(24)
    expect(longestRun(FREE_LIKERT_PRESENTATION.map((item) => item.reverse))).toBe(2)
  })

  test('alternates the paid keying without exception', () => {
    expect(PAID_LIKERT_PRESENTATION.length).toBe(16)
    expect(longestRun(PAID_LIKERT_PRESENTATION.map((item) => item.reverse))).toBe(1)
    expect(PAID_LIKERT_PRESENTATION.map((item) => item.reverse)).toEqual(
      Array.from({ length: 16 }, (_, index) => index % 2 === 1),
    )
  })
})

describe('work presentation', () => {
  test('keeps the forced-choice blocks whole and in one continuous run', () => {
    expect(FREE_WORK_PRESENTATION.map((item) => item.id)).toEqual(FREE_WORK_ITEMS.map((item) => item.id))
    expect(PAID_WORK_PRESENTATION.map((item) => item.id)).toEqual(PAID_WORK_ITEMS.map((item) => item.id))
  })

  test('groups the paid block by dimension so the framing question stays stable', () => {
    expect(PAID_WORK_PRESENTATION.map((item) => item.dimension)).toEqual([
      ...Array.from({ length: 6 }, () => 'interest' as const),
      ...Array.from({ length: 6 }, () => 'need' as const),
      ...Array.from({ length: 3 }, () => 'drain' as const),
      ...Array.from({ length: 3 }, () => 'purpose' as const),
      ...Array.from({ length: 3 }, () => 'environment' as const),
    ])
  })
})
