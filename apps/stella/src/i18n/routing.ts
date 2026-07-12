import { DEFAULT_LOCALE, Locale } from '@sobok/domain/locale'
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: Object.values(Locale),
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: false,
  localeCookie: false,
})
