import { describe, expect, test } from 'bun:test'

import { judgePersona, PERSONA_QUESTION_COUNT, PERSONA_QUESTIONS, resolveAnswerSignal } from './persona'
import { isSliderQuestion } from './types'

describe('PERSONA_QUESTIONS', () => {
  test('has exactly the documented question count, uniquely and positionally ided', () => {
    expect(PERSONA_QUESTIONS.length).toBe(PERSONA_QUESTION_COUNT)
    expect(PERSONA_QUESTIONS.map((q) => q.id)).toEqual(PERSONA_QUESTIONS.map((_, i) => `persona-${i}`))
  })

  test('every pick question offers exactly its declared option count', () => {
    for (const question of PERSONA_QUESTIONS) {
      if (!isSliderQuestion(question)) {
        expect(question.options.length).toBe(question.optionCount)
      }
    }
  })
})

describe('judgePersona', () => {
  test('an all-J-leaning answer set resolves the JP axis to J', () => {
    const answers = PERSONA_QUESTIONS.map((question) =>
      resolveAnswerSignal(
        question,
        isSliderQuestion(question)
          ? { kind: 'slider', questionId: question.id, value: 50 }
          : { kind: 'pick', optionIndex: 0, questionId: question.id },
      ),
    )

    const judgment = judgePersona(answers)

    expect(judgment.axes.JP.pole).toBe('J')
  })
})
