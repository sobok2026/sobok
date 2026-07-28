import { describe, expect, test } from 'bun:test'

import {
  CONTEXT_DEPENDENT_SECTION_KEYS,
  CURRENT_REPORT_SCHEMA_VERSION,
  ENGINE_SECTION_KEYS,
  FREE_SAFE_SECTION_KEYS,
  isReportSchemaVersion,
  NARRATED_SECTION_KEYS,
  PAID_SECTION_KEYS,
  REPORT_SECTION_CONTRACT,
  REPORT_SECTION_KEYS_V1,
  REPORT_SECTION_KEYS_V2,
  sectionKeysFor,
} from './section-keys'

describe('report section vocabulary', () => {
  test('both vocabularies are twelve distinct keys', () => {
    expect(REPORT_SECTION_KEYS_V1).toHaveLength(12)
    expect(REPORT_SECTION_KEYS_V2).toHaveLength(12)
    expect(new Set(REPORT_SECTION_KEYS_V1).size).toBe(12)
    expect(new Set(REPORT_SECTION_KEYS_V2).size).toBe(12)
  })

  // The pre-pivot inner-life sections are gone from the current vocabulary and must not creep back through a
  // merge: they name constructs the career instrument does not measure.
  test('the retired inner-life keys are absent from v2', () => {
    const retired = ['summary', 'selfWorth', 'relationships', 'emotionRegulation', 'motivation', 'workStyle']
    for (const key of retired) {
      expect(REPORT_SECTION_KEYS_V2 as readonly string[]).not.toContain(key)
    }
  })

  test('the two vocabularies overlap on exactly the two keys that survived the pivot', () => {
    const v2 = new Set<string>(REPORT_SECTION_KEYS_V2)
    expect(REPORT_SECTION_KEYS_V1.filter((key) => v2.has(key))).toEqual(['contextShift', 'reflectionQuestions'])
  })

  test('every v2 key carries a contract and nothing else does', () => {
    expect(Object.keys(REPORT_SECTION_CONTRACT).sort()).toEqual([...REPORT_SECTION_KEYS_V2].sort())
  })

  // MIGRATION §4.1, column by column. Restated here so a silent edit to the table has to disagree with the
  // plan out loud.
  test('contract matches the section table', () => {
    expect(REPORT_SECTION_CONTRACT).toEqual({
      worldJob: { generator: 'ENGINE', inputSource: 'free-only', onFailure: 'unreachable' },
      strengthCards: { generator: 'ENGINE', inputSource: 'free-only', onFailure: 'unreachable' },
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
    expect([...ENGINE_SECTION_KEYS, ...NARRATED_SECTION_KEYS].sort()).toEqual([...REPORT_SECTION_KEYS_V2].sort())
    expect(ENGINE_SECTION_KEYS).toHaveLength(7)
    expect(NARRATED_SECTION_KEYS).toHaveLength(5)
  })

  // The free engine ships to the browser, so this split is the input to the bundle rule: nothing derived from
  // the paid answer set may be reachable from a free module.
  test('paid and free-safe keys partition the vocabulary', () => {
    expect([...PAID_SECTION_KEYS, ...FREE_SAFE_SECTION_KEYS].sort()).toEqual([...REPORT_SECTION_KEYS_V2].sort())
    const freeSafe: readonly string[] = [...FREE_SAFE_SECTION_KEYS].sort()
    expect(freeSafe).toEqual(
      ['contextShift', 'drainSignature', 'openingRead', 'reflectionQuestions', 'strengthCards', 'worldJob'].sort(),
    )
  })

  test('every LLM-only section drops rather than degrades', () => {
    for (const key of REPORT_SECTION_KEYS_V2) {
      if (REPORT_SECTION_CONTRACT[key].generator === 'LLM') {
        expect(REPORT_SECTION_CONTRACT[key].onFailure).toBe('drop-section')
      }
    }
  })

  test('the three careerContext-dependent sections are named', () => {
    expect(CONTEXT_DEPENDENT_SECTION_KEYS).toEqual(['roleFamilies', 'threePaths', 'fitAndFriction'])
  })
})

describe('schema version dispatch', () => {
  test('new rows are written against v2', () => {
    expect(CURRENT_REPORT_SCHEMA_VERSION).toBe('2')
  })

  test('stored rows resolve to the vocabulary they were written with', () => {
    expect(sectionKeysFor('1')).toBe(REPORT_SECTION_KEYS_V1)
    expect(sectionKeysFor('2')).toBe(REPORT_SECTION_KEYS_V2)
  })

  // The column defaults to '1' and pre-Phase-2 rows have no value at all, so anything unrecognised has to read
  // as v1 rather than as the newest vocabulary.
  test('an unrecognised version reads as v1', () => {
    expect(sectionKeysFor('')).toBe(REPORT_SECTION_KEYS_V1)
    expect(sectionKeysFor('99')).toBe(REPORT_SECTION_KEYS_V1)
    expect(isReportSchemaVersion('99')).toBe(false)
    expect(isReportSchemaVersion('2')).toBe(true)
  })
})
