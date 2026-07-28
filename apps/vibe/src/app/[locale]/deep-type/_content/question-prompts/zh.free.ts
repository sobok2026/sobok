import type { QuestionPromptCatalog } from '../../_lib/types'

// Untranslated on purpose. ko is the canonical locale and a human writes these before this locale ships;
// nothing in the build or the tests asserts they are filled, so a blank string renders as a blank string.
export const zhFreeQuestionPrompts = {
  'inner-ei-1': '',
  'inner-ei-3': '',
  'inner-ei-2': '',
  'inner-sn-1': '',
  'inner-sn-3': '',
  'inner-sn-2': '',
  'inner-tf-1': '',
  'inner-tf-3': '',
  'inner-tf-2': '',
  'inner-jp-1': '',
  'inner-jp-3': '',
  'inner-jp-2': '',
  'gem-rm-1': '',
  'gem-rm-3': '',
  'gem-rm-2': '',
  'gem-oa-1': '',
  'gem-oa-3': '',
  'gem-oa-2': '',
  'gem-vh-1': '',
  'gem-vh-3': '',
  'gem-vh-2': '',
  'gem-uo-1': '',
  'gem-uo-3': '',
  'gem-uo-2': '',
  B11: '',
  B12: '',
  B13: '',
} as const satisfies QuestionPromptCatalog
