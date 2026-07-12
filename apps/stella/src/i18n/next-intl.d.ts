import type { Locale as AppLocale } from '@sobok/domain/locale'

import { messages } from '@/app/[locale]/messages'

declare module 'next-intl' {
  interface AppConfig {
    Locale: AppLocale
    // Korean is the reference locale every other translation is authored against,
    // so its shape defines the valid namespace + key paths for `t()`.
    Messages: (typeof messages)['ko']
  }
}
