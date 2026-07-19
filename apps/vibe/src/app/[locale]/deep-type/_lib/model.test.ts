import { describe, expect, test } from 'bun:test'

import {
  bestMatchInner,
  clashInner,
  groupOf,
  judgeAxes,
  parseDeepResultCode,
  serializeDeepResult,
  syncRate,
} from './model'
import type { AnsweredSignal, DichoAxisId } from './types'
import { DICHO_AXES, GEM_AXES } from './types'

const MAX: Record<DichoAxisId, number> = { EI: 6, JP: 6, SN: 6, TF: 6 }

describe('judgeAxes', () => {
  test('resolves each axis to the pole with the higher signed total', () => {
    const answers: AnsweredSignal[] = [{ signal: { EI: 2, TF: 2 } }, { signal: { SN: -2 } }, { signal: { JP: -2 } }]

    const judgment = judgeAxes(answers, DICHO_AXES, MAX)

    // EI:+2→E, SN:-2→N (poles[1]), TF:+2→T (poles[0]), JP:-2→P (poles[1])
    expect(judgment.code).toBe('ENTP')
  })

  test('falls back to the anchor question when the raw total nets to zero', () => {
    // Two SN signals of equal and opposite magnitude cancel to 0 — the axis must not fall back to an
    // arbitrary default when an anchor question broke the tie.
    const answers: AnsweredSignal[] = [
      { anchor: 'SN', signal: { SN: -2 } },
      { anchor: 'SN', signal: { SN: 2 } },
    ]

    const judgment = judgeAxes(answers, DICHO_AXES, MAX)

    // The later anchor answer overwrites the earlier one — mirrors the source's sumSigs(), which keeps
    // overwriting `anchor[ax]` for every matching question rather than only the first.
    expect(judgment.axes.SN.pole).toBe('S')
  })

  test('falls back to an arbitrary positive pole when an axis was never touched', () => {
    const judgment = judgeAxes([], DICHO_AXES, MAX)

    expect(judgment.code).toBe('ESTJ')
  })

  test('strength is derived from the raw total, not the tie-broken effective value', () => {
    const answers: AnsweredSignal[] = [
      { anchor: 'SN', signal: { SN: -2 } },
      { anchor: 'SN', signal: { SN: 2 } },
    ]

    const judgment = judgeAxes(answers, DICHO_AXES, MAX)

    // total is 0 here, so strength sits at the floor even though a pole was still resolved.
    expect(judgment.axes.SN.strength).toBe(55)
  })
})

describe('groupOf', () => {
  test('maps intuitive+feeling to NF', () => expect(groupOf('ENFP')).toBe('NF'))
  test('maps intuitive+thinking to NT', () => expect(groupOf('INTJ')).toBe('NT'))
  test('maps sensing+judging to SJ', () => expect(groupOf('ISTJ')).toBe('SJ'))
  test('maps sensing+perceiving to SP', () => expect(groupOf('ESTP')).toBe('SP'))
})

describe('bestMatchInner / clashInner', () => {
  test('bestMatchInner flips only V/H', () => {
    expect(bestMatchInner('ROVU')).toBe('ROHU')
  })

  test('clashInner flips both O/A and V/H', () => {
    expect(clashInner('ROVU')).toBe('RAHU')
  })

  test('every gem axis is a real pole from GEM_AXES', () => {
    const flipped = bestMatchInner('ROVU')

    for (const [index, axis] of GEM_AXES.entries()) {
      expect(axis.poles as readonly string[]).toContain(flipped[index])
    }
  })
})

describe('syncRate', () => {
  test('100% for identical codes', () => expect(syncRate('ENTJ', 'ENTJ')).toBe(100))
  test('0% for fully opposite codes', () => expect(syncRate('ENTJ', 'ISFP')).toBe(0))
  test('50% for a 2-letter match', () => expect(syncRate('ENTJ', 'ENFP')).toBe(50))
})

describe('serializeDeepResult / parseDeepResultCode', () => {
  test('round-trips through serialize/parse', () => {
    const result = { gem: 'ROVU', inner: 'INFP', outer: 'ENTJ', quickGem: 'MAHO' } as const

    expect(parseDeepResultCode(serializeDeepResult(result))).toEqual(result)
  })

  test('omits quickGem cleanly when absent', () => {
    const result = { gem: 'ROVU', inner: 'INFP', outer: 'ENTJ' } as const
    const serialized = serializeDeepResult(result)

    expect(parseDeepResultCode(serialized)).toEqual({ ...result, quickGem: undefined })
  })

  test('rejects malformed or tampered payloads', () => {
    expect(parseDeepResultCode(null)).toBeNull()
    expect(parseDeepResultCode('')).toBeNull()
    expect(parseDeepResultCode('XXXX_INFP_ROVU_')).toBeNull()
    expect(parseDeepResultCode('ENTJ_INFP_ROVU_ZZZZ')).toBeNull()
  })
})
