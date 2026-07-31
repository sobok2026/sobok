import { DEFAULT_LOCALE, LOCALES } from '@sobok/domain/locale'
import { defineRouting } from 'next-intl/routing'

/**
 * The routing every sobok site uses, and the reason several other decisions look the way they do.
 *
 * `localePrefix: 'always'` means there is no unprefixed page — not even `/`. That is why each site ships a
 * `public/_redirects` sending `/` to the default locale, and why an `x-default` hreflang has to point at
 * `/{DEFAULT_LOCALE}{path}` rather than at a bare path, which would be a URL the static export never emits.
 *
 * Detection and the locale cookie are both off: the language is chosen explicitly through the in-page
 * switcher, so a crawler and a visitor always see the same document at the same URL.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: false,
  localeCookie: false,
})
