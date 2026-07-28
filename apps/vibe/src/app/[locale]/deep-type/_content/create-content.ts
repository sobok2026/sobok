import { FREE_LIKERT_ITEMS, FREE_WORK_ITEMS, PAID_LIKERT_ITEMS, PAID_WORK_ITEMS } from '@deep-type/questionnaire'

import type { DeepTypeContent, QuestionContent, QuestionOptionCatalog, QuestionPromptCatalog } from '../_lib/types'

type DeepTypeTranslations = Omit<DeepTypeContent, 'questions'> & {
  questionOptions: QuestionOptionCatalog
  questionPrompts: QuestionPromptCatalog
}

// The catalogs are projected from the scored instrument rather than from whatever the locale files happen to
// hold, so an item that leaves the instrument leaves the bundle in the same commit.
//
// The two projections stay separate because the two tiers ship in separate modules. Free text is a server prop
// and lands in the exported HTML; paid text is fetched as its own chunk after payment. One merged catalog puts
// every refinement prompt back into `out/**/*.html` (MIGRATION L6) no matter how carefully the views import.
const FREE_ITEM_IDS: readonly string[] = [...FREE_LIKERT_ITEMS, ...FREE_WORK_ITEMS].map((item) => item.id)
const PAID_ITEM_IDS: readonly string[] = [...PAID_LIKERT_ITEMS, ...PAID_WORK_ITEMS].map((item) => item.id)

export function createDeepTypeContent(translations: DeepTypeTranslations): DeepTypeContent {
  const { questionOptions, questionPrompts, ...content } = translations

  return { ...content, questions: project(FREE_ITEM_IDS, questionPrompts, questionOptions) }
}

export function createPaidQuestions(
  questionPrompts: QuestionPromptCatalog,
  questionOptions: QuestionOptionCatalog,
): Record<string, QuestionContent> {
  return project(PAID_ITEM_IDS, questionPrompts, questionOptions)
}

function project(
  ids: readonly string[],
  prompts: QuestionPromptCatalog,
  options: QuestionOptionCatalog,
): Record<string, QuestionContent> {
  const questions: Record<string, QuestionContent> = {}
  for (const id of ids) {
    if (questions[id]) {
      throw new Error(`DeepType selects question ${id} twice`)
    }
    questions[id] = buildQuestion(id, prompts, options)
  }
  return questions
}

// Shape only. ko is the canonical locale and the other three ship blank until a human translates them, so a
// missing id is a defect while an empty string is a known state — checking emptiness here would block every
// build until all four locales are written.
function buildQuestion(id: string, prompts: QuestionPromptCatalog, options: QuestionOptionCatalog): QuestionContent {
  const prompt = prompts[id]
  const itemOptions = options[id]
  if (prompt === undefined) {
    throw new Error(`DeepType question ${id} has no prompt`)
  }
  if (itemOptions?.length !== 4) {
    throw new Error(`DeepType question ${id} must have exactly four options`)
  }
  return { options: itemOptions, prompt }
}
