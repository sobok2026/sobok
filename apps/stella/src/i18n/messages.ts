import type { PublicLocale } from '@sobok/domain/locale'

import { type Messages, messages } from '@/app/[locale]/messages'

export function getMessages(locale: PublicLocale): Messages {
  return messages[locale]
}
