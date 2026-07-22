import { BASE_ITEMS, GEM_ITEMS, INNER_ITEMS, PERSONA_ITEMS, REFINEMENT_ITEMS } from '@deep-type/questionnaire'

import type { DeepTypeContent, QuestionContent, QuestionOptionCatalog } from '../_lib/types'

type DeepTypeTranslations = Omit<DeepTypeContent, 'questions'> & {
  questionOptions: QuestionOptionCatalog
  questionPrompts: {
    gem: readonly string[]
    inner: readonly string[]
    persona: readonly string[]
    refinement: readonly string[]
  }
}

export function createDeepTypeContent(translations: DeepTypeTranslations): DeepTypeContent {
  const { questionOptions, questionPrompts, ...content } = translations

  const questions = Object.fromEntries([
    ...zip(PERSONA_ITEMS, questionPrompts.persona, questionOptions.persona),
    ...zip(INNER_ITEMS, questionPrompts.inner, questionOptions.inner),
    ...zip(GEM_ITEMS, questionPrompts.gem, questionOptions.gem),
    ...zip(REFINEMENT_ITEMS, questionPrompts.refinement, questionOptions.refinement),
  ])

  if (Object.keys(questions).length !== BASE_ITEMS.length + REFINEMENT_ITEMS.length) {
    throw new Error('DeepType question catalog is incomplete')
  }

  assertNoBlankStrings({ ...content, questions })
  return { ...content, questions }
}

function zip(
  items: readonly { id: string }[],
  prompts: readonly string[],
  options: readonly QuestionContent['options'][],
): [string, QuestionContent][] {
  if (items.length !== prompts.length || items.length !== options.length) {
    throw new Error(
      `DeepType question count mismatch: expected ${items.length}, received ${prompts.length} prompts and ${options.length} option sets`,
    )
  }

  return items.map((item, index) => {
    const prompt = prompts[index]
    const itemOptions = options[index]
    if (!prompt || !itemOptions || itemOptions.length !== 4) {
      throw new Error(`DeepType question ${item.id} must have exactly four options`)
    }
    if (new Set(itemOptions.map((option) => option.trim())).size !== itemOptions.length) {
      throw new Error(`DeepType question ${item.id} must have four distinct options`)
    }
    return [item.id, { options: itemOptions, prompt }]
  })
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
