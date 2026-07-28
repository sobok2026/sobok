import { describe, expect, test } from 'bun:test'

import {
  CONTEXT_DEPENDENT_SECTION_KEYS,
  ENGINE_SECTION_KEYS,
  FREE_SAFE_SECTION_KEYS,
  NARRATED_SECTION_KEYS,
  PAID_SECTION_KEYS,
  REPORT_SECTION_CONTRACT,
  REPORT_SECTION_KEYS,
} from './section-keys'

describe('report section vocabulary', () => {
  test('the vocabulary is twelve distinct keys', () => {
    expect(REPORT_SECTION_KEYS).toHaveLength(12)
    expect(new Set(REPORT_SECTION_KEYS).size).toBe(12)
  })

  // The pre-pivot inner-life sections must not creep back through a merge: they name constructs the career
  // instrument does not measure, and no row was ever written with them.
  test('the retired inner-life keys are absent', () => {
    const retired = ['summary', 'selfWorth', 'relationships', 'emotionRegulation', 'motivation', 'workStyle']
    for (const key of retired) {
      expect(REPORT_SECTION_KEYS as readonly string[]).not.toContain(key)
    }
  })

  test('every key carries a contract and nothing else does', () => {
    expect(Object.keys(REPORT_SECTION_CONTRACT).sort()).toEqual([...REPORT_SECTION_KEYS].sort())
  })

  // MIGRATION §4.1, column by column. Restated here so a silent edit to the table has to disagree with the
  // plan out loud.
  test('contract matches the section table', () => {
    expect(REPORT_SECTION_CONTRACT).toEqual({
      worldJob: { generator: 'ENGINE', inputSource: 'free-only', onFailure: 'unreachable' },
      strengthCards: { generator: 'ENGINE', inputSource: 'mixed', onFailure: 'unreachable' },
      drainSignature: { generator: 'ENGINE', inputSource: 'mixed', onFailure: 'unreachable' },
      happinessConditions: { generator: 'ENGINE', inputSource: 'paid', onFailure: 'unreachable' },
      interestProfile: { generator: 'ENGINE', inputSource: 'paid', onFailure: 'unreachable' },
      roleFamilies: { generator: 'ENGINE', inputSource: 'paid', onFailure: 'omit-section' },
      weekQuest: { generator: 'ENGINE', inputSource: 'paid', onFailure: 'unreachable' },
      contextShift: { generator: 'HYBRID', inputSource: 'mixed', onFailure: 'omit-section' },
      threePaths: { generator: 'HYBRID', inputSource: 'paid', onFailure: 'keep-engine-body' },
      fitAndFriction: { generator: 'HYBRID', inputSource: 'paid', onFailure: 'keep-engine-body' },
      openingRead: { generator: 'LLM', inputSource: 'mixed', onFailure: 'drop-section' },
      reflectionQuestions: { generator: 'LLM', inputSource: 'mixed', onFailure: 'drop-section' },
    })
  })

  test('engine and narrated keys partition the vocabulary', () => {
    expect([...ENGINE_SECTION_KEYS, ...NARRATED_SECTION_KEYS].sort()).toEqual([...REPORT_SECTION_KEYS].sort())
    expect(ENGINE_SECTION_KEYS).toHaveLength(7)
    expect(NARRATED_SECTION_KEYS).toHaveLength(5)
  })

  // The free engine ships to the browser, so this split is the input to the bundle rule: nothing derived from
  // the paid answer set may be reachable from a free module.
  test('paid and free-safe keys partition the vocabulary', () => {
    expect([...PAID_SECTION_KEYS, ...FREE_SAFE_SECTION_KEYS].sort()).toEqual([...REPORT_SECTION_KEYS].sort())
    const freeSafe: readonly string[] = [...FREE_SAFE_SECTION_KEYS].sort()
    expect(freeSafe).toEqual(
      ['contextShift', 'drainSignature', 'openingRead', 'reflectionQuestions', 'strengthCards', 'worldJob'].sort(),
    )
  })

  test('every LLM-only section drops rather than degrades', () => {
    for (const key of REPORT_SECTION_KEYS) {
      if (REPORT_SECTION_CONTRACT[key].generator === 'LLM') {
        expect(REPORT_SECTION_CONTRACT[key].onFailure).toBe('drop-section')
      }
    }
  })

  test('the three careerContext-dependent sections are named', () => {
    expect(CONTEXT_DEPENDENT_SECTION_KEYS).toEqual(['roleFamilies', 'threePaths', 'fitAndFriction'])
  })
})
