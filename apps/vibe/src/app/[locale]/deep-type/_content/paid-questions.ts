import type { Locale } from '@sobok/domain/locale'

import type { QuestionContent, QuestionOptionCatalog, QuestionPromptCatalog } from '../_lib/types'
import { createPaidQuestions } from './create-content'

// The paid question text, and the only door to it. Deliberately NOT `server-only` and deliberately not reachable
// from `_lib/content.ts`: everything the server loads becomes a prop, and a prop is serialised into the exported
// HTML and its RSC payload — which is how thirty-seven paid prompts ended up readable in `out/ko/deep-type/*.html`
// without anyone paying (MIGRATION L6).
//
// Loading them through `import()` from the browser puts them in their own JS chunk instead. That is not an
// entitlement check and is not sold as one; the entitlement is `POST /refinement`, which refuses answers without
// a paid access token. This only stops the text from riding along in the free static assets, which is exactly the
// scan the CI gate runs (`out/**/*.{html,txt}`).
//
// Every locale module exports the same two names, so a loader is one line. They used to be prefixed per locale
// (`koPaidQuestionPrompts`, `enPaidQuestionPrompts`, …), which forced four eight-line blocks that differed only
// in the identifier being destructured.
async function paidQuestions(
  prompts: Promise<{ paidQuestionPrompts: QuestionPromptCatalog }>,
  options: Promise<{ paidQuestionOptions: QuestionOptionCatalog }>,
): Promise<Record<string, QuestionContent>> {
  const [prompt, option] = await Promise.all([prompts, options])
  return createPaidQuestions(prompt.paidQuestionPrompts, option.paidQuestionOptions)
}

// The specifiers stay literal because a bundler has to see them to emit a chunk per locale.
const paidLoaders = {
  en: () => paidQuestions(import('./question-prompts/en.paid'), import('./question-options/en.paid')),
  ja: () => paidQuestions(import('./question-prompts/ja.paid'), import('./question-options/ja.paid')),
  ko: () => paidQuestions(import('./question-prompts/ko.paid'), import('./question-options/ko.paid')),
  zh: () => paidQuestions(import('./question-prompts/zh.paid'), import('./question-options/zh.paid')),
} as const satisfies Record<Locale, () => Promise<Record<string, QuestionContent>>>

export function loadPaidQuestions(locale: Locale): Promise<Record<string, QuestionContent>> {
  return paidLoaders[locale]()
}
