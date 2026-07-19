import { describe, expect, test } from 'bun:test'

import { buildDeepGemQuestions, GEM_QUICK_QUESTIONS } from './gem'

describe('GEM_QUICK_QUESTIONS', () => {
  test('has exactly one question per gem axis', () => {
    expect(GEM_QUICK_QUESTIONS).toHaveLength(4)
  })
})

describe('buildDeepGemQuestions', () => {
  test('interleaves 1 group-specific question with 2 shared ones, four times over (12 total)', () => {
    const questions = buildDeepGemQuestions('NF')

    expect(questions).toHaveLength(12)
    expect(questions.map((q) => q.id)).toEqual([
      'gem-deep-group-NF-0',
      'gem-deep-extra-0',
      'gem-deep-extra-1',
      'gem-deep-group-NF-1',
      'gem-deep-extra-2',
      'gem-deep-extra-3',
      'gem-deep-group-NF-2',
      'gem-deep-extra-4',
      'gem-deep-extra-5',
      'gem-deep-group-NF-3',
      'gem-deep-extra-6',
      'gem-deep-extra-7',
    ])
  })

  test('swaps in the right group-specific bank for every group', () => {
    for (const group of ['NF', 'NT', 'SJ', 'SP'] as const) {
      const questions = buildDeepGemQuestions(group)
      const groupQuestionIds = questions.map((q) => q.id).filter((id) => id.startsWith('gem-deep-group-'))

      expect(groupQuestionIds).toEqual([
        `gem-deep-group-${group}-0`,
        `gem-deep-group-${group}-1`,
        `gem-deep-group-${group}-2`,
        `gem-deep-group-${group}-3`,
      ])
    }
  })
})
