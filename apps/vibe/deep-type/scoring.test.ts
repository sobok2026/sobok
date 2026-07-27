import { describe, expect, test } from 'bun:test'

import {
  type AgreementValue,
  AXES,
  type AxisId,
  type AxisScore,
  type BandShift,
  type ClarityBand,
  type DrainFacet,
  GEM_AXES,
  type GemAxisId,
  type GemLayerProfile,
  type InnerLayerProfile,
  type ItemAnswer,
  type OptionIndex,
  type RefinedAxisScore,
  type TentativeBand,
  TYPE_AXES,
  type TypeAxisId,
  WORK_FACETS,
  type WorkAnswer,
} from './model'
import { FREE_LIKERT_ITEMS, FREE_WORK_ITEMS, PAID_LIKERT_ITEMS, WORK_ITEMS, type WorkItem } from './questionnaire'
import {
  agreementToSigned,
  isFreeProfile,
  isRefinedProfile,
  resolveDrainBand,
  scoreBaseAssessment,
  scoreRefinedAssessment,
  scoreWorkProfile,
} from './scoring'

const AGREEMENT_VALUES = [1, 2, 3, 4] as const satisfies readonly AgreementValue[]

function answersFor(items: readonly { id: string }[], value: (index: number) => AgreementValue): ItemAnswer[] {
  return items.map((item, index) => ({ itemId: item.id, value: value(index) }))
}

function workAnswersFor(items: readonly WorkItem[], optionIndex: (index: number) => OptionIndex): WorkAnswer[] {
  return items.map((item, index) => ({ itemId: item.id, optionIndex: optionIndex(index) }))
}

/** Deterministic so a failing seed is reproducible; a flaky freeze test would be worse than no freeze test. */
function lcg(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function axisScore<Score extends AxisScore>(
  profile: { gem: GemLayerProfile<Score>; inner: InnerLayerProfile<Score> },
  axis: AxisId,
): Score {
  return (TYPE_AXES as readonly string[]).includes(axis)
    ? profile.inner.axes[axis as TypeAxisId]
    : profile.gem.axes[axis as GemAxisId]
}

const FLAT_WORK = workAnswersFor(WORK_ITEMS, () => 0)
const FLAT_FREE_WORK = workAnswersFor(FREE_WORK_ITEMS, () => 0)

describe('pole freeze', () => {
  // The single top invariant: paying re-derives the ruler, never a letter. If this ever fails, no band, shift or
  // narrative downstream is trustworthy, because the report would be describing a code the buyer did not get.
  test('returns codes and poles byte-identical to the free pass over 1,000 random sittings', () => {
    const random = lcg(20260727)
    const draw = () => (Math.floor(random() * 4) + 1) as AgreementValue
    const drawOption = () => Math.floor(random() * 4) as OptionIndex

    for (let round = 0; round < 1000; round++) {
      const base = answersFor(FREE_LIKERT_ITEMS, draw)
      const refinement = answersFor(PAID_LIKERT_ITEMS, draw)
      const freeWork = workAnswersFor(FREE_WORK_ITEMS, drawOption)
      const allWork = workAnswersFor(WORK_ITEMS, drawOption)

      const free = scoreBaseAssessment(base, freeWork, null)
      const refined = scoreRefinedAssessment(base, refinement, allWork, null)

      expect(refined.inner.code).toBe(free.inner.code)
      expect(refined.gem.code).toBe(free.gem.code)
      for (const axis of AXES) {
        expect(axisScore(refined, axis).pole).toBe(axisScore(free, axis).pole)
      }
    }
  })

  test('reports the split instead of moving the letter when the paid items lean the other way', () => {
    const base = answersFor(FREE_LIKERT_ITEMS, () => 4)
    // Every paid item answered against its keying, which is the strongest possible contrary evidence.
    const refinement = PAID_LIKERT_ITEMS.map((item) => ({
      itemId: item.id,
      value: (item.reverse ? 4 : 1) as AgreementValue,
    }))

    const free = scoreBaseAssessment(base, FLAT_FREE_WORK, null)
    const refined = scoreRefinedAssessment(base, refinement, FLAT_WORK, null)

    expect(refined.inner.code).toBe(free.inner.code)
    for (const axis of AXES) {
      const score = axisScore(refined, axis)
      expect(score.score).toBeLessThan(0)
      expect(score.pole).toBe(axisScore(free, axis).pole)
    }
    expect(refined.inner.axes.EI.evidenceSplit).toBe(true)
    expect(refined.inner.axes.EI.shift).toBe('down')
  })
})

// `shift: evidenceSplit ? 'down' : compareBands(band3, band5)`. The guard is the only thing stopping an axis
// whose added items lean against the frozen pole from being reported as unchanged or, worse, sharper — the
// magnitude comparison cannot see a sign flip. Deleting the ternary used to leave the suite green.
describe('evidence split guard', () => {
  // Local copy of BAND_RANK/compareBands, which scoring keeps private. It reads `band3`/`band5` off the result
  // rather than re-deriving them, so the cuts stay owned by scoring and only the comparison is duplicated.
  const BAND_RANK: Record<TentativeBand | ClarityBand, number> = {
    distinct3: 2,
    moderate3: 1,
    faint3: 0,
    distinct: 2,
    moderate: 1,
    faint: 0,
    tie: -1,
  }

  function unguardedShift(band3: TentativeBand, band5: ClarityBand): BandShift {
    const before = BAND_RANK[band3]
    const after = BAND_RANK[band5]
    return after > before ? 'up' : after < before ? 'down' : 'same'
  }

  function enumerateEI() {
    const axisItems = [...FREE_LIKERT_ITEMS, ...PAID_LIKERT_ITEMS].filter((item) => item.axis === 'EI')
    const scores: RefinedAxisScore[] = []

    for (let pattern = 0; pattern < 4 ** axisItems.length; pattern++) {
      const values = new Map<string, AgreementValue>()
      let rest = pattern
      for (const item of axisItems) {
        values.set(item.id, AGREEMENT_VALUES[rest % 4] as AgreementValue)
        rest = Math.floor(rest / 4)
      }
      const value = (item: { id: string }) => values.get(item.id) ?? 1
      scores.push(
        scoreRefinedAssessment(
          FREE_LIKERT_ITEMS.map((item) => ({ itemId: item.id, value: value(item) })),
          PAID_LIKERT_ITEMS.map((item) => ({ itemId: item.id, value: value(item) })),
          FLAT_WORK,
          null,
        ).inner.axes.EI,
      )
    }

    return scores
  }

  const SCORES = enumerateEI()

  test('reports every split sitting as a downgrade', () => {
    expect(SCORES.length).toBe(1024)
    const split = SCORES.filter((score) => score.evidenceSplit)
    expect(split.length).toBe(216)
    for (const score of split) {
      expect(score.shift).toBe('down')
    }
  })

  // Without this half the assertion above would still pass if the guard were deleted, because most split cells
  // happen to compare as 'down' anyway. These 144 are the cells where the two disagree, so they are exactly the
  // cells that fail when `shift` drops back to a bare band comparison.
  test('covers cells the band comparison alone would call up or same', () => {
    const rewritten = SCORES.filter(
      (score) => score.evidenceSplit && unguardedShift(score.band3, score.band5) !== 'down',
    )
    expect(rewritten.length).toBe(144)

    const byUnguarded = new Map<BandShift, number>()
    for (const score of rewritten) {
      const shift = unguardedShift(score.band3, score.band5)
      byUnguarded.set(shift, (byUnguarded.get(shift) ?? 0) + 1)
    }
    expect([...byUnguarded.entries()].sort()).toEqual([
      ['same', 120],
      ['up', 24],
    ])
  })

  // The paired direction: an unsplit sitting must keep the plain band comparison, so a guard widened to fire
  // unconditionally — the other way to make the first test pass — fails here.
  test('leaves the band comparison alone when the evidence agrees', () => {
    for (const score of SCORES) {
      if (score.evidenceSplit) {
        continue
      }
      expect(score.shift).toBe(unguardedShift(score.band3, score.band5))
    }
  })
})

describe('odd item counts', () => {
  function exhaustAxis(axis: AxisId, tier: 'free' | 'refined') {
    const axisItems = [...FREE_LIKERT_ITEMS, ...(tier === 'refined' ? PAID_LIKERT_ITEMS : [])].filter(
      (item) => item.axis === axis,
    )
    const width = axisItems.length
    const total = 4 ** width
    const results: { band: string; lean: number; score: number }[] = []

    for (let pattern = 0; pattern < total; pattern++) {
      const values = new Map<string, AgreementValue>()
      let rest = pattern
      for (const item of axisItems) {
        values.set(item.id, AGREEMENT_VALUES[rest % 4] as AgreementValue)
        rest = Math.floor(rest / 4)
      }
      const value = (item: { id: string }) => values.get(item.id) ?? 1
      const base = FREE_LIKERT_ITEMS.map((item) => ({ itemId: item.id, value: value(item) }))

      if (tier === 'free') {
        const score = axisScore(scoreBaseAssessment(base, FLAT_FREE_WORK, null), axis)
        results.push({ band: score.band3, lean: score.lean, score: score.score })
        continue
      }

      const refinement = PAID_LIKERT_ITEMS.map((item) => ({ itemId: item.id, value: value(item) }))
      const score = axisScore(scoreRefinedAssessment(base, refinement, FLAT_WORK, null), axis)
      results.push({ band: score.band5 ?? '', lean: score.lean, score: score.score })
    }

    return { results, width }
  }

  test('never reaches an exact tie on any axis, free or cumulative', () => {
    for (const axis of AXES) {
      for (const tier of ['free', 'refined'] as const) {
        const { results, width } = exhaustAxis(axis, tier)
        expect(width % 2).toBe(1)
        for (const result of results) {
          expect(result.score).not.toBe(0)
          expect(result.lean).not.toBe(0)
          expect(Math.abs(result.score) % 2).toBe(1)
        }
      }
    }
  })

  // The plan writes this invariant as "lean * 3 * n is an integer". It is only true before rounding: `lean` is
  // round(score / 3n, 4), so 1/9 stores as 0.1111 and 0.1111 * 9 is 0.9999. The lattice claim survives as a
  // tolerance, and `score` carries the exact integer.
  test('keeps lean on the 1/(3n) lattice within the stored precision', () => {
    const base = answersFor(FREE_LIKERT_ITEMS, (index) => AGREEMENT_VALUES[index % 4] as AgreementValue)
    const free = scoreBaseAssessment(base, FLAT_FREE_WORK, null)

    for (const axis of AXES) {
      const score = axisScore(free, axis)
      expect(Number.isInteger(score.score)).toBe(true)
      expect(Math.abs(score.lean * 3 * score.answered - score.score)).toBeLessThan(1e-3)
    }
  })

  test('agrees with agreementToSigned on every option', () => {
    expect(AGREEMENT_VALUES.map(agreementToSigned)).toEqual([-1, -1 / 3, 1 / 3, 1])
  })
})

describe('band cuts', () => {
  function magnitudes(axis: AxisId, tier: 'free' | 'refined') {
    const bands = new Map<number, Set<string>>()
    const axisItems = [...FREE_LIKERT_ITEMS, ...(tier === 'refined' ? PAID_LIKERT_ITEMS : [])].filter(
      (item) => item.axis === axis,
    )

    for (let pattern = 0; pattern < 4 ** axisItems.length; pattern++) {
      const values = new Map<string, AgreementValue>()
      let rest = pattern
      for (const item of axisItems) {
        values.set(item.id, AGREEMENT_VALUES[rest % 4] as AgreementValue)
        rest = Math.floor(rest / 4)
      }
      const value = (item: { id: string }) => values.get(item.id) ?? 1
      const base = FREE_LIKERT_ITEMS.map((item) => ({ itemId: item.id, value: value(item) }))

      let magnitude: number
      let band: string
      if (tier === 'free') {
        const score = axisScore(scoreBaseAssessment(base, FLAT_FREE_WORK, null), axis)
        magnitude = Math.abs(score.score)
        band = score.band3
      } else {
        const score = axisScore(
          scoreRefinedAssessment(
            base,
            PAID_LIKERT_ITEMS.map((item) => ({ itemId: item.id, value: value(item) })),
            FLAT_WORK,
            null,
          ),
          axis,
        )
        magnitude = Math.abs(score.score)
        band = score.band5
      }

      const bucket = bands.get(magnitude)
      if (bucket) {
        bucket.add(band)
      } else {
        bands.set(magnitude, new Set([band]))
      }
    }

    return bands
  }

  test('covers every reachable |S3| with exactly one free band', () => {
    const bands = magnitudes('EI', 'free')
    expect([...bands.keys()].sort((a, b) => a - b)).toEqual([1, 3, 5, 7, 9])
    const sorted = [...bands.entries()].sort(([left], [right]) => left - right)
    expect(sorted.map(([magnitude, set]) => [magnitude, [...set]])).toEqual([
      [1, ['faint3']],
      [3, ['moderate3']],
      [5, ['distinct3']],
      [7, ['distinct3']],
      [9, ['distinct3']],
    ])
  })

  test('covers every reachable |S5| with exactly one paid band and never reaches tie', () => {
    const bands = magnitudes('RM', 'refined')
    expect([...bands.keys()].sort((a, b) => a - b)).toEqual([1, 3, 5, 7, 9, 11, 13, 15])
    for (const [magnitude, set] of bands) {
      const expected = magnitude >= 7 ? 'distinct' : magnitude === 5 ? 'moderate' : 'faint'
      expect([...set]).toEqual([expected])
    }
    expect([...bands.values()].some((set) => set.has('tie'))).toBe(false)
  })

  // The rounded mean cannot carry the cut. round(3 / 9, 4) and round(5 / 15, 4) are both 0.3333, which sits
  // below 1/3, so a `>= 1/3` comparison deletes the whole moderate band on both passes.
  test('records what a rational cut would misfile', () => {
    const lattice = (width: number) => {
      const sums: number[] = []
      const walk = (depth: number, sum: number) => {
        if (depth === width) {
          sums.push(sum)
          return
        }
        for (const value of AGREEMENT_VALUES) {
          walk(depth + 1, sum + agreementToSigned(value) * 3)
        }
      }
      walk(0, 0)
      return sums
    }

    const round4 = (value: number) => Math.round((value + Number.EPSILON) * 1e4) / 1e4

    const free = lattice(3)
    const paid = lattice(5)
    const freeMisfiled = free.filter((sum) => Math.abs(sum) === 3 && !(Math.abs(round4(sum / 9)) >= 1 / 3))
    const paidMisfiled = paid.filter((sum) => Math.abs(sum) === 5 && !(Math.abs(round4(sum / 15)) >= 1 / 3))

    expect(free.length).toBe(64)
    expect(paid.length).toBe(1024)
    expect(freeMisfiled.length).toBe(20)
    expect(paidMisfiled.length).toBe(202)
    expect(round4(freeMisfiled.length / free.length) * 100).toBe(31.25)
    expect(round4((paidMisfiled.length / paid.length) * 100)).toBe(19.7266)
  })
})

describe('keying balance', () => {
  // Balanced keying no longer cancels straight-line responding — the odd count is the point, and this records
  // the price. Two degenerate codes come out, both with a real band attached, which is the detection signal.
  test('gives straight-line sittings a nonzero lean and exactly two codes', () => {
    const codes = new Set<string>()

    for (const value of AGREEMENT_VALUES) {
      const free = scoreBaseAssessment(
        answersFor(FREE_LIKERT_ITEMS, () => value),
        FLAT_FREE_WORK,
        null,
      )
      codes.add(`${free.inner.code}${free.gem.code}`)

      // Two forward items and one reverse item at the same option leave exactly one item's worth of signal.
      const expectedScore = agreementToSigned(value) * 3
      for (const axis of AXES) {
        const score = axisScore(free, axis)
        expect(score.lean).not.toBe(0)
        expect(score.score).toBe(expectedScore)
      }
    }

    expect([...codes].sort()).toEqual(['ESTJROVU', 'INFPMAHO'])
  })

  test('snapshots the straight-line lean and band on both passes', () => {
    const allOnes = scoreBaseAssessment(
      answersFor(FREE_LIKERT_ITEMS, () => 1),
      FLAT_FREE_WORK,
      null,
    )
    expect(allOnes.inner.axes.EI.score).toBe(-3)
    expect(allOnes.inner.axes.EI.lean).toBe(-0.3333)
    expect(allOnes.inner.axes.EI.band3).toBe('moderate3')

    const refined = scoreRefinedAssessment(
      answersFor(FREE_LIKERT_ITEMS, () => 1),
      answersFor(PAID_LIKERT_ITEMS, () => 1),
      FLAT_WORK,
      null,
    )
    expect(refined.inner.axes.EI.score).toBe(-3)
    expect(refined.inner.axes.EI.lean).toBe(-0.2)
    expect(refined.inner.axes.EI.band5).toBe('faint')
    expect(refined.inner.axes.EI.evidenceSplit).toBe(false)
    expect(refined.inner.axes.EI.shift).toBe('down')
  })
})

describe('work profile', () => {
  test('returns a drain-only profile from the free block', () => {
    const profile = scoreWorkProfile(FLAT_FREE_WORK)
    expect(profile.scope).toBe('free')
    expect(profile.drain.exposure).toBe(2)
    expect(Object.values(profile.drain.counts).reduce((total, count) => total + count, 0)).toBe(3)
  })

  test('returns all five dimensions from the full block', () => {
    const profile = scoreWorkProfile(FLAT_WORK)
    if (profile.scope !== 'refined') {
      throw new Error('expected a refined work profile')
    }
    expect(profile.drain.exposure).toBe(4)
    expect(profile.interest.exposure).toBe(4)
    expect(profile.need.exposure).toBe(4)
    expect(profile.purpose.exposure).toBe(2)
    expect(profile.environment.exposure).toBe(2)
  })

  // Three items over six facets cap every facet at two picks, so the count vector is (2,1) or (1,1,1) and a
  // leader cannot separate. A `single` here would mean the free screen promises a narrowing it cannot deliver.
  test('never narrows to one branch at exposure two', () => {
    const facets = WORK_FACETS.drain
    const seen = new Set<string>()

    for (let pattern = 0; pattern < 4 ** FREE_WORK_ITEMS.length; pattern++) {
      let rest = pattern
      const answers = FREE_WORK_ITEMS.map((item) => {
        const optionIndex = (rest % 4) as OptionIndex
        rest = Math.floor(rest / 4)
        return { itemId: item.id, optionIndex }
      })

      const counts = Object.fromEntries(facets.map((facet) => [facet, 0])) as Record<DrainFacet, number>
      for (const answer of answers) {
        const item = FREE_WORK_ITEMS.find((candidate) => candidate.id === answer.itemId)
        const facet = item?.facets[answer.optionIndex] as DrainFacet
        counts[facet] += 1
      }

      const spread = resolveDrainBand(counts, 2)
      expect(spread).not.toBe('single')
      seen.add(spread)
      expect(Math.max(...facets.map((facet) => counts[facet]))).toBeLessThanOrEqual(2)
    }

    expect([...seen].sort()).toEqual(['double', 'triple'])
  })

  test('separates a leader at exposure four', () => {
    const counts = { BREAK: 3, VAGUE: 1, EMPTY: 1, TENSION: 1, OVERLOAD: 0, STUCK: 0 } as const
    expect(resolveDrainBand(counts, 4)).toBe('single')
    expect(resolveDrainBand({ BREAK: 2, VAGUE: 1, EMPTY: 1, TENSION: 1, OVERLOAD: 1, STUCK: 0 }, 4)).toBe('double')
    expect(resolveDrainBand({ BREAK: 1, VAGUE: 1, EMPTY: 1, TENSION: 1, OVERLOAD: 1, STUCK: 1 }, 4)).toBe('triple')
  })
})

describe('option weights', () => {
  // A no-op today: every Likert option and every forced-choice option carries a symmetric weight. It is a guard
  // against a later asymmetry, which would bias every axis without changing a single item.
  test('averages the Likert option signs to zero', () => {
    const signs = AGREEMENT_VALUES.map(agreementToSigned)
    expect(signs.reduce((total, sign) => total + sign, 0)).toBe(0)
  })

  test('gives every forced-choice option the same weight', () => {
    for (const item of WORK_ITEMS) {
      expect(item.facets.length).toBe(4)
    }
  })
})

describe('profile guards', () => {
  const free = scoreBaseAssessment(
    answersFor(FREE_LIKERT_ITEMS, () => 2),
    FLAT_FREE_WORK,
    null,
  )
  const refined = scoreRefinedAssessment(
    answersFor(FREE_LIKERT_ITEMS, () => 2),
    answersFor(PAID_LIKERT_ITEMS, () => 3),
    FLAT_WORK,
    null,
  )

  test('accepts an undeclared persona on both tiers', () => {
    expect(free.personaSource).toBe('unknown')
    expect(refined.personaSource).toBe('unknown')
    expect(isFreeProfile(free)).toBe(true)
    expect(isRefinedProfile(refined)).toBe(true)
  })

  test('accepts a declared persona', () => {
    const declared = scoreBaseAssessment(
      answersFor(FREE_LIKERT_ITEMS, () => 2),
      FLAT_FREE_WORK,
      'INFJ',
    )
    expect(declared.personaSource).toBe('declared')
    expect(isFreeProfile(declared)).toBe(true)
  })

  test('does not confuse the two tiers', () => {
    expect(isRefinedProfile(free)).toBe(false)
    expect(isFreeProfile(refined)).toBe(false)
  })

  test('rejects a stored profile from an older instrument or a wrong shape', () => {
    expect(isFreeProfile({ ...free, instrumentVersion: '3.0.0' })).toBe(false)
    expect(isFreeProfile({ ...free, personaSource: undefined })).toBe(false)
    expect(isFreeProfile({ ...free, gem: null })).toBe(false)
    expect(isFreeProfile(null)).toBe(false)
    expect(isRefinedProfile('refined')).toBe(false)
  })

  test('tolerates a null pole inside an axis, which the guard must not silently repair', () => {
    const tied = {
      ...free,
      gem: { ...free.gem, axes: { ...free.gem.axes, RM: { ...free.gem.axes.RM, pole: null } } },
    }
    expect(isFreeProfile(tied)).toBe(true)
    expect(GEM_AXES.every((axis) => axis in tied.gem.axes)).toBe(true)
  })
})
