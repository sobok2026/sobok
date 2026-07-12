import type { Locale } from '@sobok/domain/locale'

import { messages } from '@/app/[locale]/messages'

export function getMessages(locale: Locale) {
  return messages[locale]
}
