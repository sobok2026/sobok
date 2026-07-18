import { describe, expect, test } from 'bun:test'

import {
  axisOrder,
  calculateGyeolResult,
  parseGyeolResultParam,
  rarityOptionIdsByQuestion,
  serializeGyeolResult,
} from './model'
import type { CompleteGyeolAnswers, GyeolResult } from './types'

const highAlignmentAnswers = {
  apology: 'apology-action',
  balance: 'balance-complementary',
  changeResponse: 'change-role-split',
  decision: 'decision-together',
  duration: 'duration-long',
  expression: 'expression-mixed',
  frequency: 'frequency-daily',
  memory: 'memory-exact',
  planning: 'plans-flexible',
  privateSignals: 'signals-many',
  reassurance: 'reassurance-clear',
  repair: 'repair-comeback',
  replyRhythm: 'reply-asymmetric',
  space: 'space-respecting',
  stress: 'stress-share',
  support: 'support-listen',
} as const satisfies CompleteGyeolAnswers

const exploratoryAnswers = {
  apology: 'apology-miss',
  balance: 'balance-volatile',
  changeResponse: 'change-cautious',
  decision: 'decision-one-sided',
  duration: 'duration-new',
  expression: 'expression-direct',
  frequency: 'frequency-event',
  memory: 'memory-now',
  planning: 'plans-drifting',
  privateSignals: 'signals-few',
  reassurance: 'reassurance-awkward',
  repair: 'repair-cooldown',
  replyRhythm: 'reply-slow',
  space: 'space-uneven',
  stress: 'stress-quiet',
  support: 'support-light',
} as const satisfies CompleteGyeolAnswers

describe('couple weave index model', () => {
  test('complete answers return a 0-100 index, a grade, and four axis scores', () => {
    const result = calculateGyeolResult(highAlignmentAnswers)

    expect(result.weaveIndex).toBeGreaterThanOrEqual(0)
    expect(result.weaveIndex).toBeLessThanOrEqual(100)
    expect(result.grade).toBeGreaterThanOrEqual(1)
    expect(result.grade).toBeLessThanOrEqual(7)
    expect(Object.keys(result.axisScores).sort()).toEqual([...axisOrder].sort())

    for (const axisScore of Object.values(result.axisScores)) {
      expect(axisScore).toBeGreaterThanOrEqual(0)
      expect(axisScore).toBeLessThanOrEqual(100)
    }
  })

  test('same answers return the same deterministic result', () => {
    expect(calculateGyeolResult(highAlignmentAnswers)).toEqual(calculateGyeolResult(highAlignmentAnswers))
  })

  test('high-alignment answers reach the top grade', () => {
    const result = calculateGyeolResult(highAlignmentAnswers)

    expect(result).toMatchObject({
      axisScores: {
        affection: 100,
        balance: 100,
        recovery: 98,
        tempo: 94,
      },
      code: 'rare',
      grade: 1,
      score: 98,
      weaveIndex: 98,
    })
  })

  test('exploratory answers can reach grade 7', () => {
    const result = calculateGyeolResult(exploratoryAnswers)

    expect(result).toMatchObject({
      axisScores: {
        affection: 53,
        balance: 42,
        recovery: 53,
        tempo: 54,
      },
      code: 'spark',
      grade: 7,
      score: 51,
      weaveIndex: 51,
    })
  })

  test('share serialization contains result data but not individual answers', () => {
    const serialized = serializeGyeolResult(calculateGyeolResult(highAlignmentAnswers))

    expect(serialized).toBe('rare_1_98_98_100_94_100_98')

    for (const optionId of Object.values(rarityOptionIdsByQuestion).flat()) {
      expect(serialized).not.toContain(optionId)
    }
  })

  test('share parsing rejects invalid query payloads', () => {
    expect(parseGyeolResultParam(null)).toBeNull()
    expect(parseGyeolResultParam('duration-long')).toBeNull()
    expect(parseGyeolResultParam('rare_7_51_51_53_54_42_53')).toBeNull()
    expect(parseGyeolResultParam('rare_1_98_98_100_94_100')).toBeNull()
    expect(parseGyeolResultParam('rare_1_98_98_100_94_100_98')).toEqual({
      axisScores: {
        affection: 100,
        balance: 100,
        recovery: 98,
        tempo: 94,
      },
      code: 'rare',
      grade: 1,
      score: 98,
      weaveIndex: 98,
    } satisfies GyeolResult)
  })
})
