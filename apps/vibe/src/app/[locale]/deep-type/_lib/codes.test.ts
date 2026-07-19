import { describe, expect, test } from 'bun:test'

import { bestMatchInner, clashInner, groupOf, parseDeepResultCode, serializeDeepResult, syncRate } from './codes'
import { GEM_AXES } from './types'

describe('groupOf', () => {
  test('maps intuitive+feeling to NF', () => expect(groupOf('ENFP')).toBe('NF'))
  test('maps intuitive+thinking to NT', () => expect(groupOf('INTJ')).toBe('NT'))
  test('maps sensing+judging to SJ', () => expect(groupOf('ISTJ')).toBe('SJ'))
  test('maps sensing+perceiving to SP', () => expect(groupOf('ESTP')).toBe('SP'))
})

describe('bestMatchInner / clashInner', () => {
  test('bestMatchInner flips only V/H', () => expect(bestMatchInner('ROVU')).toBe('ROHU'))
  test('clashInner flips both O/A and V/H', () => expect(clashInner('ROVU')).toBe('RAHU'))

  test('every transformed gem code is a real pole combination', () => {
    for (const gem of ['ROVU', 'MAHO', 'RAVO', 'MOHU'] as const) {
      for (const flipped of [bestMatchInner(gem), clashInner(gem)]) {
        GEM_AXES.forEach((axis, index) => {
          expect(axis.poles as readonly string[]).toContain(flipped[index])
        })
      }
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
    const result = { gem: 'ROVU', inner: 'INFP', outer: 'ENTJ' } as const

    expect(parseDeepResultCode(serializeDeepResult(result))).toEqual(result)
  })

  test('rejects malformed or tampered payloads', () => {
    expect(parseDeepResultCode(null)).toBeNull()
    expect(parseDeepResultCode('')).toBeNull()
    expect(parseDeepResultCode('XXXX_INFP_ROVU')).toBeNull()
    expect(parseDeepResultCode('ENTJ_INFP_ZZZZ')).toBeNull()
  })
})
