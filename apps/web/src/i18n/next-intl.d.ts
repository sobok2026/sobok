import type { PublicLocale } from '@sobok/domain/locale'

declare module 'next-intl' {
  interface AppConfig {
    Locale: PublicLocale
  }
}
