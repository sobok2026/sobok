import { describe, expect, test } from 'bun:test'

import { AXES, WORK_DIMENSIONS, WORK_FACETS, type WorkDimension, type WorkFacetId } from './model'
import {
  FREE_ITEM_COUNT,
  FREE_LIKERT_ITEMS,
  FREE_WORK_ITEMS,
  GEM_ITEMS,
  INNER_ITEMS,
  PAID_ITEM_COUNT,
  PAID_LIKERT_ITEMS,
  PAID_WORK_ITEMS,
  PERSONA_ITEMS,
  REFINEMENT_ITEMS,
  WORK_ITEMS,
  type WorkItem,
} from './questionnaire'

const SELECTED_LIKERT = [...FREE_LIKERT_ITEMS, ...PAID_LIKERT_ITEMS]

// Swapping the reverse flag between a forward and a reverse item on the same axis keeps every keying-balance
// count intact, so nothing above notices — and the option text still reads the old direction, which is exactly
// the inversion that shipped live in refine-gem-oa-3. Option-polarity pins only cover items whose text is
// final; this table covers all forty now, because re-anchoring rewrites wording and never touches the flag.
const REVERSE_BY_ID: Record<string, boolean> = {
  'gem-oa-1': false,
  'gem-oa-2': true,
  'gem-oa-3': false,
  'gem-rm-1': false,
  'gem-rm-2': true,
  'gem-rm-3': false,
  'gem-uo-1': false,
  'gem-uo-2': true,
  'gem-uo-3': false,
  'gem-vh-1': false,
  'gem-vh-2': true,
  'gem-vh-3': false,
  'inner-ei-1': false,
  'inner-ei-2': true,
  'inner-ei-3': false,
  'inner-jp-1': false,
  'inner-jp-2': true,
  'inner-jp-3': false,
  'inner-sn-1': false,
  'inner-sn-2': true,
  'inner-sn-3': false,
  'inner-tf-1': false,
  'inner-tf-2': true,
  'inner-tf-3': false,
  'refine-gem-oa-1': false,
  'refine-gem-oa-2': true,
  'refine-gem-rm-1': false,
  'refine-gem-rm-2': true,
  'refine-gem-uo-2': true,
  'refine-gem-uo-3': false,
  'refine-gem-vh-1': false,
  'refine-gem-vh-2': true,
  'refine-inner-ei-1': true,
  'refine-inner-ei-2': false,
  'refine-inner-jp-2': true,
  'refine-inner-jp-3': false,
  'refine-inner-sn-1': true,
  'refine-inner-sn-2': false,
  'refine-inner-tf-1': false,
  'refine-inner-tf-2': true,
}

function facetExposure(items: readonly WorkItem[], dimension: WorkDimension): readonly number[] {
  const counts = new Map<WorkFacetId, number>(WORK_FACETS[dimension].map((facet) => [facet, 0]))
  for (const item of items) {
    if (item.dimension !== dimension) {
      continue
    }
    for (const facet of item.facets) {
      counts.set(facet, (counts.get(facet) ?? 0) + 1)
    }
  }
  return WORK_FACETS[dimension].map((facet) => counts.get(facet) ?? 0)
}

describe('likert selection', () => {
  test('holds the free and paid block sizes the copy quotes', () => {
    expect(FREE_LIKERT_ITEMS.length).toBe(24)
    expect(PAID_LIKERT_ITEMS.length).toBe(16)
    expect(FREE_WORK_ITEMS.length).toBe(3)
    expect(PAID_WORK_ITEMS.length).toBe(21)
    expect(FREE_ITEM_COUNT).toBe(27)
    expect(PAID_ITEM_COUNT).toBe(37)
  })

  test('keys every axis two forward one reverse free, one and one paid, three and two cumulative', () => {
    for (const axis of AXES) {
      const free = FREE_LIKERT_ITEMS.filter((item) => item.axis === axis)
      const paid = PAID_LIKERT_ITEMS.filter((item) => item.axis === axis)

      expect([free.filter((item) => !item.reverse).length, free.filter((item) => item.reverse).length]).toEqual([2, 1])
      expect([paid.filter((item) => !item.reverse).length, paid.filter((item) => item.reverse).length]).toEqual([1, 1])

      const cumulative = [...free, ...paid]
      expect([
        cumulative.filter((item) => !item.reverse).length,
        cumulative.filter((item) => item.reverse).length,
      ]).toEqual([3, 2])
      expect(cumulative.length % 2).toBe(1)
    }
  })

  test('pins the reverse flag of every scored item', () => {
    const actual = Object.fromEntries(SELECTED_LIKERT.map((item) => [item.id, item.reverse]))
    expect(actual).toEqual(REVERSE_BY_ID)
  })

  test('keeps the free and paid banks disjoint with no duplicate id', () => {
    const freeIds = new Set(FREE_LIKERT_ITEMS.map((item) => item.id))
    const paidIds = new Set(PAID_LIKERT_ITEMS.map((item) => item.id))

    expect(freeIds.size).toBe(FREE_LIKERT_ITEMS.length)
    expect(paidIds.size).toBe(PAID_LIKERT_ITEMS.length)
    expect([...freeIds].filter((id) => paidIds.has(id))).toEqual([])
  })

  // The three non-ko locales carry a placeholder string for every `-4` item. Selecting none of them is what
  // clears that debt without a translation pass, so the gate lives here rather than in a locale test.
  test('draws no placeholder item', () => {
    expect(SELECTED_LIKERT.filter((item) => item.id.endsWith('-4'))).toEqual([])
  })

  test('draws each axis from a single source layer on each pass', () => {
    for (const axis of AXES) {
      const free = FREE_LIKERT_ITEMS.filter((item) => item.axis === axis)
      const paid = PAID_LIKERT_ITEMS.filter((item) => item.axis === axis)

      expect(new Set(free.map((item) => item.layer)).size).toBe(1)
      expect(new Set(paid.map((item) => item.layer)).size).toBe(1)
      expect(free.every((item) => !item.id.startsWith('refine-'))).toBe(true)
      expect(paid.every((item) => item.id.startsWith('refine-'))).toBe(true)
    }
  })

  test('leaves the unselected banks exported so the split stays reversible', () => {
    expect(PERSONA_ITEMS.length).toBe(20)
    expect(INNER_ITEMS.length).toBe(20)
    expect(GEM_ITEMS.length).toBe(16)
    expect(REFINEMENT_ITEMS.length).toBe(32)

    const selected = new Set(SELECTED_LIKERT.map((item) => item.id))
    expect(PERSONA_ITEMS.filter((item) => selected.has(item.id))).toEqual([])
    expect([...PERSONA_ITEMS, ...INNER_ITEMS].filter((item) => item.axis === 'NE').length).toBe(8)
    expect(SELECTED_LIKERT.filter((item) => item.axis === 'NE')).toEqual([])
  })
})

describe('work selection', () => {
  test('exposes every drain facet twice on the free block alone', () => {
    expect(facetExposure(FREE_WORK_ITEMS, 'drain')).toEqual([2, 2, 2, 2, 2, 2])
  })

  test('exposes every drain facet twice on the paid block alone', () => {
    const paidDrain = PAID_WORK_ITEMS.filter((item) => item.dimension === 'drain')
    expect(paidDrain.length).toBe(3)
    expect(facetExposure(paidDrain, 'drain')).toEqual([2, 2, 2, 2, 2, 2])
  })

  // Only four of the twenty possible 3+3 splits give both halves equal exposure. A failure here means the split
  // moved off that set, not that a number needs nudging.
  test('unions the two drain blocks to four exposures per facet', () => {
    expect(facetExposure(WORK_ITEMS, 'drain')).toEqual([4, 4, 4, 4, 4, 4])
  })

  test('keeps free and paid work disjoint and their union complete', () => {
    const freeIds = new Set(FREE_WORK_ITEMS.map((item) => item.id))
    const paidIds = new Set(PAID_WORK_ITEMS.map((item) => item.id))

    expect([...freeIds].filter((id) => paidIds.has(id))).toEqual([])
    expect(WORK_ITEMS.length).toBe(FREE_WORK_ITEMS.length + PAID_WORK_ITEMS.length)
    expect(new Set(WORK_ITEMS.map((item) => item.id)).size).toBe(WORK_ITEMS.length)
    expect(WORK_ITEMS.map((item) => item.id).sort()).toEqual([...freeIds, ...paidIds].sort())
  })

  test('levels exposure inside every dimension', () => {
    const expected = { interest: 4, need: 4, drain: 4, purpose: 2, environment: 2 } as const
    for (const dimension of WORK_DIMENSIONS) {
      const exposure = facetExposure(WORK_ITEMS, dimension)
      expect(exposure).toEqual(Array.from({ length: 6 }, () => expected[dimension]))
    }
  })

  test('drops the items that equal exposure cannot keep', () => {
    const ids = new Set(WORK_ITEMS.map((item) => item.id))
    for (const dropped of ['B19', 'B23', 'B24']) {
      expect(ids.has(dropped)).toBe(false)
    }
    for (const added of ['B25', 'B26', 'B27']) {
      expect(ids.has(added)).toBe(true)
    }
  })

  // Equal exposure fixes what B26/B27 contain but not how the eight deficit slots split into two items, and the
  // three admissible splits are not equivalent. STABLE·NOVEL is pinned at four because both new items must carry
  // both; every other need pair has to stay at three, which rules out the {AUT,MASTER}+{IMPACT,BELONG} split
  // that would push those two pairs to four of six items and decide the tally by pairing rather than preference.
  test('keeps every optional need pair off the forced maximum', () => {
    const counts = new Map<string, number>()
    for (const item of WORK_ITEMS) {
      if (item.dimension !== 'need') {
        continue
      }
      const facets = [...item.facets].sort()
      for (let left = 0; left < facets.length; left++) {
        for (let right = left + 1; right < facets.length; right++) {
          const key = `${facets[left]}·${facets[right]}`
          counts.set(key, (counts.get(key) ?? 0) + 1)
        }
      }
    }

    expect(counts.get('NOVEL·STABLE')).toBe(4)
    const optional = [...counts.entries()].filter(([key]) => key !== 'NOVEL·STABLE')
    expect(optional.length).toBe(14)
    expect(optional.filter(([, count]) => count > 3)).toEqual([])
  })

  test('gives every item four distinct facets drawn from its own dimension', () => {
    for (const item of WORK_ITEMS) {
      expect(item.facets.length).toBe(4)
      expect(new Set<WorkFacetId>(item.facets).size).toBe(4)
      for (const facet of item.facets) {
        expect(WORK_FACETS[item.dimension]).toContain(facet)
      }
    }
  })

  test('never repeats a facet in the same option slot on consecutive items of a block', () => {
    const blocks = [
      FREE_WORK_ITEMS,
      PAID_WORK_ITEMS.filter((item) => item.dimension === 'drain'),
      PAID_WORK_ITEMS.filter((item) => item.dimension === 'need'),
    ]
    for (const block of blocks) {
      for (let index = 1; index < block.length; index++) {
        for (let slot = 0; slot < 4; slot++) {
          expect(block[index]?.facets[slot]).not.toBe(block[index - 1]?.facets[slot])
        }
      }
    }
  })

  test('marks drain framing and leaves it off every other dimension', () => {
    for (const item of WORK_ITEMS) {
      if (item.dimension === 'drain') {
        expect(['demand', 'resource']).toContain(item.framing)
      } else {
        expect(item.framing).toBeNull()
      }
    }
  })
})
