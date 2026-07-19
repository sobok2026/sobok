import { describe, expect, test } from 'bun:test'

import {
  buildDeepInnerPart1Questions,
  buildDeepInnerPart2Questions,
  buildQuickInnerQuestions,
  INNER_QUICK_FALLBACK_QUESTIONS,
  INNER_QUICK_NEUTRAL_QUESTIONS,
} from './inner'
import type { PersonaCode } from './types'

describe('buildQuickInnerQuestions', () => {
  test('picks one letter-question per Persona letter, in Persona order, then the neutral bank', () => {
    const questions = buildQuickInnerQuestions('ENTJ')

    expect(questions.map((q) => q.id)).toEqual([
      'inner-quick-letter-E',
      'inner-quick-letter-N',
      'inner-quick-letter-T',
      'inner-quick-letter-J',
      ...INNER_QUICK_NEUTRAL_QUESTIONS.map((q) => q.id),
    ])
  })

  test('falls back to the fixed bank when Persona is unknown', () => {
    expect(buildQuickInnerQuestions(undefined)).toBe(INNER_QUICK_FALLBACK_QUESTIONS)
  })

  test('every letter of every 16-type Persona resolves to a real question', () => {
    const letters = 'ISTJ ISFJ INFJ INTJ ISTP ISFP INFP INTP ESTP ESFP ENFP ENTP ESTJ ESFJ ENFJ ENTJ'.split(
      ' ',
    ) as PersonaCode[]

    for (const code of letters) {
      const questions = buildQuickInnerQuestions(code)
      expect(questions).toHaveLength(4 + INNER_QUICK_NEUTRAL_QUESTIONS.length)
    }
  })
})

describe('buildDeepInnerPart1Questions', () => {
  test('interleaves round-robin across the 4 letters (one from each, six times) rather than grouping by letter', () => {
    const questions = buildDeepInnerPart1Questions('ENTJ')

    expect(questions).toHaveLength(24)
    expect(questions.map((q) => q.id).slice(0, 4)).toEqual([
      'inner-deep-E-0',
      'inner-deep-N-0',
      'inner-deep-T-0',
      'inner-deep-J-0',
    ])
    expect(questions.map((q) => q.id).slice(4, 8)).toEqual([
      'inner-deep-E-1',
      'inner-deep-N-1',
      'inner-deep-T-1',
      'inner-deep-J-1',
    ])
  })
})

describe('buildDeepInnerPart2Questions', () => {
  test('returns 4 questions for every Inner group', () => {
    for (const group of ['NF', 'NT', 'SJ', 'SP'] as const) {
      expect(buildDeepInnerPart2Questions(group)).toHaveLength(4)
    }
  })
})
