import type { Locale as AppLocale } from '@sobok/domain/locale'

import type { messages } from '@/app/[locale]/messages'

declare module 'next-intl' {
  interface AppConfig {
    Locale: AppLocale
    // Korean is the default locale, so its shape defines the valid namespace + key paths for `t()`.
    Messages: (typeof messages)['ko']
  }
}
