import { FREE_LIKERT_ITEMS, PAID_LIKERT_ITEMS } from '@deep-type/questionnaire'

import type { DeepTypeContent, QuestionContent, QuestionOptionCatalog, QuestionPromptCatalog } from '../_lib/types'

type DeepTypeTranslations = Omit<DeepTypeContent, 'questions'> & {
  questionOptions: QuestionOptionCatalog
  questionPrompts: QuestionPromptCatalog
}

// The catalog is projected from the scored instrument rather than from whatever the locale files happen to
// hold. Reserve items keep their authored text so a selection change stays reversible, and they stay out of
// the bundle until something selects them — at which point a missing translation stops the build instead of
// shipping a placeholder.
const SCORED_ITEM_IDS: readonly string[] = [...FREE_LIKERT_ITEMS, ...PAID_LIKERT_ITEMS].map((item) => item.id)

export function createDeepTypeContent(translations: DeepTypeTranslations): DeepTypeContent {
  const { questionOptions, questionPrompts, ...content } = translations

  const questions: Record<string, QuestionContent> = {}
  for (const id of SCORED_ITEM_IDS) {
    if (questions[id]) {
      throw new Error(`DeepType selects question ${id} twice`)
    }
    questions[id] = buildQuestion(id, questionPrompts, questionOptions)
  }

  assertNoBlankStrings({ ...content, questions })
  return { ...content, questions }
}

function buildQuestion(id: string, prompts: QuestionPromptCatalog, options: QuestionOptionCatalog): QuestionContent {
  const prompt = prompts[id]
  const itemOptions = options[id]
  if (!prompt) {
    throw new Error(`DeepType question ${id} has no prompt`)
  }
  if (!itemOptions || itemOptions.length !== 4) {
    throw new Error(`DeepType question ${id} must have exactly four options`)
  }
  if (new Set(itemOptions.map((option) => option.trim())).size !== itemOptions.length) {
    throw new Error(`DeepType question ${id} must have four distinct options`)
  }
  return { options: itemOptions, prompt }
}

// Unauthored copy never reached production as an empty string: the placeholders read `TODO <id> · …`, which is
// non-empty and passed the blank check untouched.
const PLACEHOLDER = /\bTODO\b/

function assertNoBlankStrings(value: unknown): void {
  if (typeof value === 'string') {
    if (value.trim().length === 0) {
      throw new Error('DeepType content contains a blank string')
    }
    if (PLACEHOLDER.test(value)) {
      throw new Error(`DeepType content contains a placeholder: ${value}`)
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
