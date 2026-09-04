import { SOBOK_SERVICES } from '@sobok/brand/services'
import type { Locale } from '@sobok/domain/locale'

export const ORIGIN = 'https://stella.sobok.cc'
export const THEME_COLOR = '#0a0618' // keep in sync with --color-background in src/app/globals.css
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''
export const TURNSTILE_LANGUAGE_TAGS = {
  ko: 'ko',
  en: 'en',
  ja: 'ja',
  zh: 'zh-cn',
} as const satisfies Record<Locale, string>

// Read from the shared catalogue rather than written again here: the same four strings are what every
// sibling site's footer links to this one by.
export const SITE_NAME = SOBOK_SERVICES.stella.name
