import type { Locale } from '@sobok/domain/locale'
import type { Messages } from '@sobok/site-i18n/messages'
import { en } from './en'
import { ja } from './ja'
import { ko } from './ko'
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
