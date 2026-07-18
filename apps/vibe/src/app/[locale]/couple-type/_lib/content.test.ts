import { describe, expect, test } from 'bun:test'
import { existsSync } from 'node:fs'

import { coupleTypeContent as en } from '../_content/en'
import { coupleTypeContent as ja } from '../_content/ja'
import { coupleTypeContent as ko } from '../_content/ko'
import { coupleTypeContent as zh } from '../_content/zh'
import { axisOrder, calculateCoupleTypeCode } from './model'
import type { AxisValue, CoupleTypeContent } from './types'

const contents = { en, ja, ko, zh } as const satisfies Record<string, CoupleTypeContent>
const resultImageDirectory = new URL('../../../../../public/image/', import.meta.url)

describe('couple type localized content', () => {
  for (const [locale, content] of Object.entries(contents)) {
    test(`${locale} content is complete and internally consistent`, () => {
      expect(content.questions).toHaveLength(12)
      expect(new Set(content.questions.map((question) => question.id)).size).toBe(content.questions.length)

      for (const axis of axisOrder) {
        expect(content.axisDefinitions[axis].values).toHaveLength(2)
      }

      const expectedCodes = getExpectedResultCodes(content)
      expect(Object.keys(content.results).sort()).toEqual(expectedCodes.sort())

      for (const question of content.questions) {
        const allowedValues = new Set<AxisValue>(content.axisDefinitions[question.axis].values)

        for (const option of question.options) {
          expect(allowedValues.has(option.value)).toBe(true)
          expect(option.label.length).toBeGreaterThan(0)
        }
      }

      for (const [code, result] of Object.entries(content.results)) {
        expect(result.code).toBe(code)
        expect(result.strengths.length).toBeGreaterThan(0)
        expect(result.title.length).toBeGreaterThan(0)
        expect(existsSync(new URL(`${code}.png`, resultImageDirectory))).toBe(true)
      }

      const firstOptionAnswers = Object.fromEntries(
        content.questions.map((question) => [question.id, question.options[0].value]),
      )

      expect(
        calculateCoupleTypeCode({
          answers: firstOptionAnswers,
          axisDefinitions: content.axisDefinitions,
          questions: content.questions,
        }),
      ).toBe('SOQP')
    })
  }
})

function getExpectedResultCodes(content: CoupleTypeContent) {
  return content.axisDefinitions.pace.values.flatMap((pace) =>
    content.axisDefinitions.expression.values.flatMap((expression) =>
      content.axisDefinitions.repair.values.flatMap((repair) =>
        content.axisDefinitions.bond.values.map((bond) => `${pace}${expression}${repair}${bond}`),
      ),
    ),
  )
}
