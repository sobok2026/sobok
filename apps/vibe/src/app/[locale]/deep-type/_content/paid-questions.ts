import { Locale } from '@sobok/domain/locale'

import type { QuestionContent } from '../_lib/types'
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
const paidLoaders = {
  [Locale.EN]: async () => {
    const [{ enPaidQuestionPrompts }, { enPaidQuestionOptions }] = await Promise.all([
      import('./question-prompts/en.paid'),
      import('./question-options/en.paid'),
    ])
    return createPaidQuestions(enPaidQuestionPrompts, enPaidQuestionOptions)
  },
  [Locale.JA]: async () => {
    const [{ jaPaidQuestionPrompts }, { jaPaidQuestionOptions }] = await Promise.all([
      import('./question-prompts/ja.paid'),
      import('./question-options/ja.paid'),
    ])
    return createPaidQuestions(jaPaidQuestionPrompts, jaPaidQuestionOptions)
  },
  [Locale.KO]: async () => {
    const [{ koPaidQuestionPrompts }, { koPaidQuestionOptions }] = await Promise.all([
      import('./question-prompts/ko.paid'),
      import('./question-options/ko.paid'),
    ])
    return createPaidQuestions(koPaidQuestionPrompts, koPaidQuestionOptions)
  },
  [Locale.ZH]: async () => {
    const [{ zhPaidQuestionPrompts }, { zhPaidQuestionOptions }] = await Promise.all([
      import('./question-prompts/zh.paid'),
      import('./question-options/zh.paid'),
    ])
    return createPaidQuestions(zhPaidQuestionPrompts, zhPaidQuestionOptions)
  },
} as const satisfies Record<Locale, () => Promise<Record<string, QuestionContent>>>

export function loadPaidQuestions(locale: Locale): Promise<Record<string, QuestionContent>> {
  return paidLoaders[locale]()
}
