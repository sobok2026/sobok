import { DEFAULT_LOCALE, LOCALES } from '@sobok/domain/locale'
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: false,
  localeCookie: false,
})
