import { BASE_ITEMS, GEM_ITEMS, INNER_ITEMS, PERSONA_ITEMS, REFINEMENT_ITEMS } from '@deep-type/questionnaire'

import type { DeepTypeContent } from '../_lib/types'

type DeepTypeTranslations = Omit<DeepTypeContent, 'questions'> & {
  questionText: {
    gem: readonly string[]
    inner: readonly string[]
    persona: readonly string[]
    refinement: readonly string[]
  }
}

export function createDeepTypeContent(translations: DeepTypeTranslations): DeepTypeContent {
  const { questionText, ...content } = translations
  const questions = Object.fromEntries([
    ...zip(PERSONA_ITEMS, questionText.persona),
    ...zip(INNER_ITEMS, questionText.inner),
    ...zip(GEM_ITEMS, questionText.gem),
    ...zip(REFINEMENT_ITEMS, questionText.refinement),
  ])

  if (Object.keys(questions).length !== BASE_ITEMS.length + REFINEMENT_ITEMS.length) {
    throw new Error('DeepType question catalog is incomplete')
  }

  assertNoBlankStrings({ ...content, questions })
  return { ...content, questions }
}

function zip(items: readonly { id: string }[], text: readonly string[]): [string, string][] {
  if (items.length !== text.length) {
    throw new Error(`DeepType question count mismatch: expected ${items.length}, received ${text.length}`)
  }
  return items.map((item, index) => [item.id, text[index] ?? ''])
}

function assertNoBlankStrings(value: unknown): void {
  if (typeof value === 'string') {
    if (value.trim().length === 0) {
      throw new Error('DeepType content contains a blank string')
    }
    return
  }
  if (Array.isArray(value)) {
    value.forEach(assertNoBlankStrings)
    return
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach(assertNoBlankStrings)
  }
}
