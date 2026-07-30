import type { Locale } from '@sobok/domain/locale'

import { en } from './en'
import { ja } from './ja'
import { ko } from './ko'
import type { Messages } from './types'
import { zh } from './zh'

export const messages = {
  ko: ko,
  en: en,
  zh: zh,
  ja: ja,
} satisfies Record<Locale, Messages>

export function getMessages(locale: Locale) {
  return messages[locale]
}
