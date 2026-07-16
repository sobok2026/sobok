import { Locale } from '@sobok/domain/locale'

import { en } from './en'
import { ja } from './ja'
import { ko } from './ko'
import type { Messages } from './types'
import { zh } from './zh'

export const messages = {
  [Locale.KO]: ko,
  [Locale.EN]: en,
  [Locale.ZH]: zh,
  [Locale.JA]: ja,
} satisfies Record<Locale, Messages>

export function getMessages(locale: Locale) {
  return messages[locale]
}
