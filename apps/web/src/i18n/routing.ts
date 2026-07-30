import { DEFAULT_LOCALE, LOCALES } from '@sobok/domain/locale'
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed',
  localeDetection: false,
  localeCookie: false,
})
