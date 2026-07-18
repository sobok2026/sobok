import { describe, expect, test } from 'bun:test'

import { rarityContent as en } from '../_content/en'
import { rarityContent as ja } from '../_content/ja'
import { rarityContent as ko } from '../_content/ko'
import { rarityContent as zh } from '../_content/zh'
import { axisOrder, rarityOptionIdsByQuestion, rarityQuestionIds } from './model'
import type { GyeolContent, GyeolGrade, GyeolResultCode } from './types'

const contents = { en, ja, ko, zh } as const satisfies Record<string, GyeolContent>
const resultCodes = [
  'archive',
  'harbor',
  'orbit',
  'rare',
  'reconnect',
  'signal',
  'spark',
] as const satisfies readonly GyeolResultCode[]
const gradeOrder = [1, 2, 3, 4, 5, 6, 7] as const satisfies readonly GyeolGrade[]

describe('couple gyeol localized content', () => {
  for (const [locale, content] of Object.entries(contents) as Array<[string, GyeolContent]>) {
    test(`${locale} content is complete and internally consistent`, () => {
      expect(content.questions.map((question) => question.id)).toEqual([...rarityQuestionIds])
      expect(Object.keys(content.results).sort()).toEqual([...resultCodes].sort())
      expect(Object.keys(content.grades).map(Number).sort()).toEqual([...gradeOrder])

      for (const question of content.questions) {
        expect(question.question.length).toBeGreaterThan(0)
        expect(question.options.map((option) => option.id)).toEqual([...rarityOptionIdsByQuestion[question.id]])

        for (const option of question.options) {
          expect(option.label.length).toBeGreaterThan(0)
        }
      }

      for (const result of Object.values(content.results)) {
        expect(result.nickname.length).toBeGreaterThan(0)
        expect(result.summary.length).toBeGreaterThan(0)
        expect(result.reasons).toHaveLength(3)
        expect(result.mission.length).toBeGreaterThan(0)
      }

      for (const grade of gradeOrder) {
        expect(content.grades[grade].label.length).toBeGreaterThan(0)
        expect(content.grades[grade].description.length).toBeGreaterThan(0)
        expect(content.grades[grade].mountainLabel.length).toBeGreaterThan(0)
      }

      for (const text of Object.values(content.ui)) {
        expect(text.length).toBeGreaterThan(0)
      }

      if (content.axes) {
        expect(Object.keys(content.axes).sort()).toEqual([...axisOrder].sort())

        for (const axis of Object.values(content.axes)) {
          expect(axis.label.length).toBeGreaterThan(0)
          expect(axis.description.length).toBeGreaterThan(0)
        }
      }
    })
  }

  test('ko content has moved away from conversation-rarity wording', () => {
    const bannedWords = /대화|카톡|답장|말투|원문|희소도/

    for (const text of collectStrings(ko)) {
      expect(text).not.toMatch(bannedWords)
    }
  })

  test('localized content avoids old conversation-rarity positioning', () => {
    const bannedByLocale = {
      en: /conversation rarity|rarity index/i,
      ja: /会話希少度|希少度/,
      zh: /聊天稀有度|稀有度/,
    } as const

    for (const [locale, content] of Object.entries({ en, ja, zh }) as Array<
      [keyof typeof bannedByLocale, GyeolContent]
    >) {
      for (const text of collectStrings(content)) {
        expect(text).not.toMatch(bannedByLocale[locale])
      }
    }
  })
})

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectStrings)
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings)
  }

  return []
}
