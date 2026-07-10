import type { PublicLocale } from '@sobok/domain/locale'

import { messages as constellationMessages } from '@/app/[locale]/messages'

export type LocalizedMessages = Record<PublicLocale, Messages>
export type Messages = { [key: string]: MessageValue }
export type MessageValue = string | undefined | { [key: string]: MessageValue }

export function getMessages(locale: PublicLocale): Messages {
  return constellationMessages[locale]
}
