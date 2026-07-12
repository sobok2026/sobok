import type { PublicLocale } from '@sobok/domain/locale'

import { messages } from '@/app/[locale]/messages'

export function getMessages(locale: PublicLocale) {
  return messages[locale]
}
