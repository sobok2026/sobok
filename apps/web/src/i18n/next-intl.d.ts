import type { Locale as AppLocale } from '@sobok/domain/locale'

declare module 'next-intl' {
  interface AppConfig {
    Locale: AppLocale
  }
}
